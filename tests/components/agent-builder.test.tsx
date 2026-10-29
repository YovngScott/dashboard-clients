import { useLayoutEffect, useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentBuilder, type AgentDraftMemory } from '../../src/features/agents/AgentWorkspace';
import type { AgentRecord, Workspace } from '../../src/features/agents/agent-service';
import { File as NodeFile } from 'node:buffer';
import { validateContextPdf as realValidatePdf } from '../../src/features/agents/context-pdf';

const api = vi.hoisted(() => ({ createAgent: vi.fn(), uploadContextPdf: vi.fn(), validateContextPdf: vi.fn(), listAgents: vi.fn() }));
vi.mock('../../src/features/agents/agent-service', () => api);
vi.mock('../../src/lib/workspace', () => ({ canManageAgents: (role: string) => role !== 'viewer' }));

const workspace: Workspace = { organizationId: 'org-a', name: 'Synthetic Studio', logoPath: null, logoUrl: null, role: 'owner', planCode: 'launch', maxConnectedChannels: 1, allowedChannels: ['instagram'] };
const row = { id: 'agent-a', organization_id: 'org-a', status: 'draft' } as AgentRecord;
const completed = vi.fn();
const closed = vi.fn();
function Memory({ user = 'user-a', org = 'org-a', observe }: { user?: string; org?: string; observe?: () => void }) {
  const [memory, setMemory] = useState<AgentDraftMemory | null>(null);
  useLayoutEffect(() => { observe?.(); });
  return <AgentBuilder userId={user} workspace={{ ...workspace, organizationId: org }} initialBusinessName={workspace.name} draftMemory={memory} setDraftMemory={setMemory} onClose={closed} onCreated={completed} />;
}
const button = (name: string) => screen.getByRole('button', { name });
const next = () => fireEvent.click(button('Continuar'));
function fillKnowledge(withFile = false) {
  next();
  fireEvent.change(screen.getByLabelText(/¿Qué hace tu empresa/), { target: { value: 'Synthetic business description with enough detail.' } });
  if (withFile) fireEvent.change(screen.getByLabelText(/Documento de apoyo/), { target: { files: [new File(['%PDF-test'], 'synthetic.pdf', { type: 'application/pdf' })] } });
  next(); next();
}
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }

beforeEach(() => {
  vi.clearAllMocks();
  api.createAgent.mockResolvedValue(row);
  api.uploadContextPdf.mockResolvedValue('doc-a');
  api.validateContextPdf.mockResolvedValue(undefined);
  completed.mockResolvedValue(undefined);
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network forbidden in synthetic component tests'); }));
});

describe('real component, synthetic services only', () => {
  for (const [label, makeFile, expected] of [
    ['invalid MIME', () => new NodeFile(['%PDF-'], 'synthetic.txt', {type:'text/plain'}), 'Selecciona un archivo PDF'],
    ['invalid signature', () => new NodeFile(['NOT-PDF'], 'synthetic.pdf', {type:'application/pdf'}), 'firma PDF válida'],
    ['larger than 20 MB', () => new NodeFile([new Uint8Array(20 * 1024 * 1024 + 1)], 'synthetic.pdf', {type:'application/pdf'}), 'máximo de 20 MB'],
    ['read failure', () => {
      const file = new NodeFile(['%PDF-'], 'synthetic.pdf', {type:'application/pdf'});
      Object.defineProperty(file, 'slice', {value: () => ({arrayBuffer: async () => { throw new Error('PRIVATE OS PATH must not leak'); }})});
      return file;
    }, 'No pudimos leer el archivo'],
  ] as const) it('real PDF validation: ' + label + ' remains actionable without create/upload', async () => {
    api.validateContextPdf.mockImplementation(realValidatePdf);
    render(<Memory />); next();
    fireEvent.change(screen.getByLabelText(/¿Qué hace tu empresa/), {target:{value:'Synthetic description for real local validation.'}});
    fireEvent.change(screen.getByLabelText(/Documento de apoyo/), {target:{files:[makeFile()]}});
    next(); next(); fireEvent.click(button('Guardar asistente'));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(expected);
    expect(alert.textContent).not.toContain('conexión');
    expect(document.body.textContent).not.toContain('PRIVATE OS PATH');
    expect(api.createAgent).not.toHaveBeenCalled();
    expect(api.uploadContextPdf).not.toHaveBeenCalled();
  });

  it('real valid PDF passes local validation and proceeds to mocked create/upload', async () => {
    api.validateContextPdf.mockImplementation(realValidatePdf);
    render(<Memory />); next();
    fireEvent.change(screen.getByLabelText(/¿Qué hace tu empresa/), {target:{value:'Synthetic description for a valid PDF test.'}});
    fireEvent.change(screen.getByLabelText(/Documento de apoyo/), {target:{files:[new NodeFile(['%PDF-1.4\n%%EOF'], 'synthetic.pdf', {type:'application/pdf'})]}});
    next(); next(); fireEvent.click(button('Guardar asistente'));
    await waitFor(() => expect(completed).toHaveBeenCalledTimes(1));
    expect(api.createAgent).toHaveBeenCalledTimes(1);
    expect(api.uploadContextPdf).toHaveBeenCalledTimes(1);
  });
  it('gates required fields and has exactly four steps without choosing/connecting channels', async () => {
    render(<Memory />);
    expect(screen.getByText('Paso 1 de 4')).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Nombre del agente/), { target: { value: '' } });
    expect((button('Continuar') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Nombre del agente/), { target: { value: 'Synthetic Agent' } });
    next();
    expect((button('Continuar') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/¿Qué hace tu empresa/), { target: { value: 'short' } });
    expect((button('Continuar') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/¿Qué hace tu empresa/), { target: { value: 'Synthetic description of a business.' } });
    next(); next();
    expect(screen.getByText('Paso 4 de 4')).toBeTruthy();
    expect(screen.queryByText('Elige dónde atenderá')).toBeNull();
    fireEvent.click(button('Guardar asistente'));
    await waitFor(() => expect(completed).toHaveBeenCalledTimes(1));
    expect(api.createAgent).toHaveBeenCalledWith('org-a', 'user-a', expect.objectContaining({ requested_channels: ['instagram'] }));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('retains edits while navigating backwards, and rejects an invalid website without service calls', async () => {
    render(<Memory />); fillKnowledge();
    fireEvent.click(button('Atrás')); fireEvent.click(button('Atrás')); fireEvent.click(button('Atrás'));
    fireEvent.change(screen.getByLabelText('Sitio web'), { target: { value: 'javascript:alert(1)' } });
    next(); next(); next();
    fireEvent.click(button('Guardar asistente'));
    expect(screen.getByRole('alert').textContent).toContain('dirección web válida');
    expect(api.createAgent).not.toHaveBeenCalled();
  });

  it('retries failed upload on the same agent; changed partial configuration is never silently discarded', async () => {
    api.uploadContextPdf.mockRejectedValueOnce(new Error('Synthetic upload failure'));
    render(<Memory />); fillKnowledge(true);
    fireEvent.click(button('Guardar asistente'));
    await screen.findByRole('alert');
    expect(api.createAgent).toHaveBeenCalledTimes(1);
    fireEvent.click(button('Atrás')); fireEvent.click(button('Atrás')); fireEvent.click(button('Atrás'));
    fireEvent.change(screen.getByLabelText(/Nombre del agente/), { target: { value: 'Edited partial name' } });
    next(); next(); next();
    fireEvent.click(button('Guardar asistente'));
    expect(screen.getByRole('alert').textContent).toContain('tus cambios actuales aún no se han guardado');
    expect(api.uploadContextPdf).toHaveBeenCalledTimes(1);
    fireEvent.click(button('Restaurar configuración guardada'));
    fireEvent.click(button('Guardar asistente'));
    await waitFor(() => expect(completed).toHaveBeenCalledTimes(1));
    expect(api.createAgent).toHaveBeenCalledTimes(1);
    expect(api.uploadContextPdf).toHaveBeenCalledTimes(2);
    expect(api.uploadContextPdf.mock.calls[1].slice(0, 3)).toEqual(['org-a', 'agent-a', 'user-a']);
  });

  it('blocks duplicate submits and escape/close while a request is pending', async () => {
    const pending = deferred<AgentRecord>(); api.createAgent.mockReturnValue(pending.promise);
    render(<Memory />); fillKnowledge();
    fireEvent.click(button('Guardar asistente'));
    await waitFor(() => expect(api.createAgent).toHaveBeenCalledTimes(1));
    const saving = button('Guardando configuración');
    fireEvent.click(saving); fireEvent.click(button('Cerrar'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closed).not.toHaveBeenCalled();
    expect((saving as HTMLButtonElement).disabled).toBe(true);
    expect((button('Cerrar') as HTMLButtonElement).disabled).toBe(true);
    expect((button('Atrás') as HTMLButtonElement).disabled).toBe(true);
    await act(async () => pending.resolve(row));
    expect(completed).toHaveBeenCalledTimes(1);
  });

  it('does not blindly retry an ambiguous create response', async () => {
    api.createAgent.mockRejectedValue(new TypeError('Synthetic lost response'));
    render(<Memory />); fillKnowledge();
    fireEvent.click(button('Guardar asistente'));
    await screen.findByRole('alert');
    fireEvent.click(button('Guardar asistente'));
    expect(api.createAgent).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert').textContent).toContain('No pudimos confirmar');
  });

  it('allows retry after a definite SQL authorization rejection', async () => {
    api.createAgent.mockRejectedValueOnce({ code: '42501' });
    render(<Memory />); fillKnowledge();
    fireEvent.click(button('Guardar asistente')); await screen.findByRole('alert');
    fireEvent.click(button('Guardar asistente'));
    await waitFor(() => expect(completed).toHaveBeenCalledTimes(1));
    expect(api.createAgent).toHaveBeenCalledTimes(2);
  });

  it('reconciles an ambiguous creation using only the current author and organization, then retries PDF on the chosen agent', async () => {
    api.createAgent.mockRejectedValueOnce(new TypeError('Synthetic lost response'));
    render(<Memory />); fillKnowledge(true);
    fireEvent.click(button('Guardar asistente')); await screen.findByRole('alert');
    const draft = api.createAgent.mock.calls[0][2];
    api.listAgents.mockResolvedValue([
      { ...row, ...draft, created_by: 'user-b', name: 'OTHER AUTHOR' },
      { ...row, ...draft, organization_id: 'org-b', created_by: 'user-a', name: 'OTHER ORG' },
      { ...row, ...draft, created_by: 'user-a' },
    ]);
    fireEvent.click(button('Consultar mis agentes para recuperar'));
    await screen.findByRole('button', { name: 'Recuperar Synthetic Studio Atención' });
    expect(screen.queryByRole('button', {name:'Recuperar OTHER AUTHOR'})).toBeNull();
    expect(screen.queryByRole('button', {name:'Recuperar OTHER ORG'})).toBeNull();
    fireEvent.click(button('Recuperar Synthetic Studio Atención'));
    fireEvent.click(button('Guardar asistente'));
    await waitFor(() => expect(completed).toHaveBeenCalledTimes(1));
    expect(api.createAgent).toHaveBeenCalledTimes(1);
    expect(api.uploadContextPdf).toHaveBeenCalledWith('org-a','agent-a','user-a', expect.any(File));
  });

  it('does not automatically create after an empty or failed reconciliation; allows explicit discard only after a successful query', async () => {
    api.createAgent.mockRejectedValueOnce(new TypeError('lost response'));
    api.listAgents.mockRejectedValueOnce(new Error('database internals must not leak')).mockResolvedValueOnce([]);
    render(<Memory />); fillKnowledge(); fireEvent.click(button('Guardar asistente')); await screen.findByRole('alert');
    fireEvent.click(button('Consultar mis agentes para recuperar'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('El reintento de creación sigue bloqueado'));
    expect(document.body.textContent).not.toContain('database internals');
    expect(screen.queryByRole('button', {name:'Descartar borrador sin borrar agentes'})).toBeNull();
    fireEvent.click(button('Consultar mis agentes para recuperar'));
    await screen.findByText(/No encontramos agentes propios/);
    expect(api.createAgent).toHaveBeenCalledTimes(1);
    fireEvent.click(button('Descartar borrador sin borrar agentes'));
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('exposes schema maximum lengths on fields and safe authorization feedback', async () => {
    api.createAgent.mockRejectedValueOnce({ code:'42501', message:'private database internal details' });
    render(<Memory />);
    expect((screen.getByLabelText(/Nombre del agente/) as HTMLInputElement).maxLength).toBe(80);
    expect((screen.getByLabelText(/Nombre de la empresa/) as HTMLInputElement).maxLength).toBe(120);
    next();
    expect((screen.getByLabelText(/¿Qué hace tu empresa/) as HTMLTextAreaElement).maxLength).toBe(8000);
    fireEvent.change(screen.getByLabelText(/¿Qué hace tu empresa/), {target:{value:'Synthetic business description enough to continue.'}});
    next(); next(); fireEvent.click(button('Guardar asistente'));
    expect((await screen.findByRole('alert')).textContent).toContain('No tienes permiso');
    expect(document.body.textContent).not.toContain('private database');
  });

  for (const change of ['account', 'organization'] as const) it('removes old values synchronously on ' + change + ' change, before layout/paint', () => {
    const commits: string[][] = [];
    const observe = () => commits.push(Array.from(document.querySelectorAll('input,textarea')).map(node => (node as HTMLInputElement).value));
    const view = render(<Memory observe={observe} />);
    fireEvent.change(screen.getByLabelText(/Nombre del agente/), { target: { value: 'PRIVATE OLD VALUE' } });
    const oldInput = screen.getByLabelText(/Nombre del agente/);
    commits.length = 0;
    view.rerender(<Memory observe={observe} user={change === 'account' ? 'user-b' : 'user-a'} org={change === 'organization' ? 'org-b' : 'org-a'} />);
    expect(oldInput.isConnected).toBe(false);
    expect(commits.length).toBeGreaterThan(0);
    expect(commits.flat()).not.toContain('PRIVATE OLD VALUE');
    expect((screen.getByLabelText(/Nombre del agente/) as HTMLInputElement).value).not.toBe('PRIVATE OLD VALUE');
    expect(document.body.textContent).not.toContain('PRIVATE OLD VALUE');
  });

  it('logout/unmount and reload/new mount discard memory and do not write browser storage', () => {
    const local = vi.spyOn(Storage.prototype, 'setItem');
    const view = render(<Memory />);
    fireEvent.change(screen.getByLabelText(/Nombre del agente/), { target: { value: 'PRIVATE OLD VALUE' } });
    view.unmount(); expect(screen.queryByRole('dialog')).toBeNull();
    render(<Memory />);
    expect((screen.getByLabelText(/Nombre del agente/) as HTMLInputElement).value).not.toBe('PRIVATE OLD VALUE');
    expect(local).not.toHaveBeenCalled();
  });

  it('returns keyboard focus to the opener when the dialog unmounts', () => {
    const opener = document.createElement('button'); document.body.append(opener); opener.focus();
    const view = render(<Memory />); view.unmount();
    expect(document.activeElement).toBe(opener); opener.remove();
  });

  it('keeps the in-memory draft when closing and reopening within the same signed-in session', () => {
    function Session() {
      const [memory, setMemory] = useState<AgentDraftMemory | null>(null);
      const [open, setOpen] = useState(true);
      return open ? <AgentBuilder userId="user-a" workspace={workspace} initialBusinessName={workspace.name} draftMemory={memory} setDraftMemory={setMemory} onClose={() => setOpen(false)} onCreated={completed} /> : <button onClick={() => setOpen(true)}>Reopen</button>;
    }
    render(<Session />);
    fireEvent.change(screen.getByLabelText(/Nombre del agente/), { target: { value: 'Retained synthetic name' } });
    fireEvent.click(button('Cerrar')); fireEvent.click(button('Reopen'));
    expect((screen.getByLabelText(/Nombre del agente/) as HTMLInputElement).value).toBe('Retained synthetic name');
  });

  it('does not start create after unmount during PDF validation', async () => {
    const validation = deferred<void>(); api.validateContextPdf.mockReturnValue(validation.promise);
    const view = render(<Memory />); fillKnowledge(true);
    fireEvent.click(button('Guardar asistente'));
    view.unmount();
    await act(async () => validation.resolve());
    expect(api.createAgent).not.toHaveBeenCalled();
    expect(api.uploadContextPdf).not.toHaveBeenCalled();
  });

  it('does not upload or signal completion for an old scope after a late create response', async () => {
    const pending = deferred<AgentRecord>(); api.createAgent.mockReturnValue(pending.promise);
    const view = render(<Memory />); fillKnowledge(true); fireEvent.click(button('Guardar asistente'));
    await waitFor(() => expect(api.createAgent).toHaveBeenCalledTimes(1));
    view.rerender(<Memory org="org-b" />);
    await act(async () => pending.resolve(row));
    expect(api.uploadContextPdf).not.toHaveBeenCalled();
    expect(completed).not.toHaveBeenCalled();
    expect((screen.getByLabelText(/Nombre del agente/) as HTMLInputElement).value).toBe('Synthetic Studio Atención');
  });
});
