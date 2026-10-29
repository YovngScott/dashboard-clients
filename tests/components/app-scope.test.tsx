import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import type { Workspace } from '../../src/features/agents/agent-service';
import { Profiler } from 'react';
const mock = vi.hoisted(() => ({
  event: null as null | ((event: string, session: Session | null) => void),
  profile: vi.fn(), workspace: vi.fn(), list: vi.fn(), create: vi.fn(), upload: vi.fn(), validate: vi.fn(),
}));
vi.mock('../../src/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: (callback: typeof mock.event) => { mock.event = callback; return { data: { subscription: { unsubscribe() {} } } }; },
      signOut: async () => { mock.event?.('SIGNED_OUT', null); },
    },
    from: () => ({ select: () => ({ eq: (_column: string, id: string) => ({ maybeSingle: () => mock.profile(id) }) }) }),
  },
}));
vi.mock('../../src/lib/workspace', () => ({ canManageAgents: () => true, loadWorkspaceContext: (...args: unknown[]) => mock.workspace(...args) }));
vi.mock('../../src/features/agents/agent-service', () => ({
  listAgents: (...args: unknown[]) => mock.list(...args), createAgent: (...args: unknown[]) => mock.create(...args),
  uploadContextPdf: (...args: unknown[]) => mock.upload(...args), validateContextPdf: (...args: unknown[]) => mock.validate(...args),
}));
vi.mock('../../src/components/DashboardOverview', () => ({ DashboardOverview: ({ profile, onCreateAgent }: { profile: {id: string}; onCreateAgent: () => void }) => <button onClick={onCreateAgent}>Open {profile.id}</button> }));
vi.mock('../../src/components/DashboardSidebar', () => ({ DashboardSidebar: ({ onLogout }: {onLogout: () => void}) => <button onClick={onLogout}>Synthetic logout</button> }));
vi.mock('../../src/components/DashboardTopBar', () => ({ DashboardTopBar: () => null }));
vi.mock('../../src/components/SettingsScreen', () => ({ SettingsScreen: () => null }));
vi.mock('../../src/components/UpgradeModal', () => ({ UpgradeModal: () => null }));
vi.mock('../../src/components/ChannelsModal', () => ({ ChannelsModal: () => null }));
vi.mock('../../src/components/BottomNavBar', () => ({ BottomNavBar: () => null }));
vi.mock('../../src/components/AnimatedEmptyState', () => ({ AnimatedEmptyState: () => null }));
vi.mock('../../src/components/MobileAuthView', () => ({ MobileAuthView: () => <p>Synthetic login</p> }));
vi.mock('../../src/components/DesktopLanding', () => ({ DesktopLanding: () => null }));
vi.mock('../../src/components/AuthLoadingSkeleton', () => ({ AuthLoadingSkeleton: () => <p>Session loading</p> }));
import App from '../../src/App';

const ws = (org: string): Workspace => ({ organizationId: org, name: org, role: 'owner', logoPath: null, logoUrl: null, planCode: 'launch', maxConnectedChannels: 1, allowedChannels: ['instagram'] });
const profile = (id: string) => ({ id, onboarding_complete: true, display_name: id, theme_preference: 'dark', goals: [] });
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }
async function login(id: string) {
  await act(async () => { mock.event?.('SIGNED_IN', { user: { id, email: id + '@example.test' } } as Session); });
}
beforeEach(() => {
  vi.clearAllMocks(); mock.event = null;
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network forbidden'); }));
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  mock.profile.mockImplementation(async (id: string) => ({ data: profile(id), error: null }));
  mock.workspace.mockImplementation(async (id: string) => ws('org-' + id));
  mock.list.mockResolvedValue([]); mock.create.mockResolvedValue({ id: 'synthetic-agent', status: 'draft' }); mock.upload.mockResolvedValue('doc'); mock.validate.mockResolvedValue(undefined);
});
async function openA(observe?: () => void) {
  render(<Profiler id="app" onRender={() => observe?.()}><App /></Profiler>); await screen.findByText('Synthetic login'); await login('A');
  fireEvent.click(await screen.findByRole('button', { name: 'Open A' }));
  fireEvent.change(screen.getByLabelText(/Nombre del agente/), { target: { value: 'PRIVATE A DRAFT' } });
}
function review(withPdf = false) {
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  fireEvent.change(screen.getByLabelText(/¿Qué hace tu empresa/), { target: { value: 'Synthetic business description of account A.' } });
  if (withPdf) fireEvent.change(screen.getByLabelText(/Documento de apoyo/), { target: { files: [new File(['%PDF-'], 'synthetic.pdf', { type: 'application/pdf' })] } });
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' })); fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
}
it('APP immediately unmounts A while B hydration is delayed; late A profile cannot repopulate', async () => {
  const commits: string[][] = [];
  await openA(() => commits.push(Array.from(document.querySelectorAll('input,textarea')).map(node => (node as HTMLInputElement).value)));
  const b = deferred<{data: ReturnType<typeof profile>; error: null}>();
  mock.profile.mockImplementation((id: string) => id === 'B' ? b.promise : Promise.resolve({ data: profile(id), error: null }));
  const old = screen.getByLabelText(/Nombre del agente/);
  commits.length = 0;
  await login('B');
  expect(commits.length).toBeGreaterThan(0);
  expect(commits.flat()).not.toContain('PRIVATE A DRAFT');
  expect(old.isConnected).toBe(false);
  expect(document.body.textContent).not.toContain('PRIVATE A DRAFT');
  expect(screen.queryByRole('button', {name:'Open A'})).toBeNull();
  await act(async () => b.resolve({ data: profile('B'), error: null }));
  expect(await screen.findByRole('button', { name: 'Open B' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Open B' }));
  expect((screen.getByLabelText(/Nombre del agente/) as HTMLInputElement).value).not.toContain('PRIVATE A');
});
it('APP discards late workspace and profile loads after another account or logout', async () => {
  render(<App />); await screen.findByText('Synthetic login');
  const a = deferred<Workspace>(); mock.workspace.mockImplementation((id: string) => id === 'A' ? a.promise : Promise.resolve(ws('org-B')));
  await login('A'); await login('B');
  await screen.findByRole('button', {name:'Open B'});
  await act(async () => a.resolve(ws('PRIVATE A ORG')));
  expect(document.body.textContent).not.toContain('PRIVATE A ORG');
  const c = deferred<{ data: ReturnType<typeof profile>; error: null }>(); mock.profile.mockReturnValue(c.promise);
  await login('C'); await act(async () => mock.event?.('SIGNED_OUT', null));
  await act(async () => c.resolve({data:profile('C'), error:null}));
  expect(screen.queryByRole('button',{name:'Open C'})).toBeNull();
  expect(screen.getByText('Synthetic login')).toBeTruthy();
});
it('APP logout while upload is in flight clears the old builder and ignores completion', async () => {
  const upload = deferred<string>(); mock.upload.mockReturnValue(upload.promise);
  await openA(); review(true); fireEvent.click(screen.getByRole('button', {name:'Guardar asistente'}));
  await waitFor(() => expect(mock.upload).toHaveBeenCalledTimes(1));
  await act(async () => mock.event?.('SIGNED_OUT', null));
  expect(screen.queryByRole('dialog')).toBeNull();
  await act(async () => upload.resolve('doc'));
  expect(screen.getByText('Synthetic login')).toBeTruthy();
  expect(mock.list).toHaveBeenCalledTimes(1);
});
it('APP organization reload replaces the builder scope, and late refresh cannot repopulate it', async () => {
  await openA(); review();
  const refresh = deferred<unknown[]>(); mock.list.mockReturnValueOnce(refresh.promise);
  fireEvent.click(screen.getByRole('button', {name:'Guardar asistente'}));
  await waitFor(() => expect(mock.list).toHaveBeenCalledTimes(2));
  // A refreshed profile starts workspace loading; the changed organization is returned by the real Dashboard effect.
  mock.workspace.mockResolvedValue(ws('org-new'));
  mock.profile.mockResolvedValue({ data: {...profile('A'), display_name:'Updated profile'}, error:null });
  await login('A');
  await waitFor(() => expect(mock.workspace).toHaveBeenCalledTimes(2));
  await act(async () => refresh.resolve([{ id: 'old', name: 'PRIVATE OLD AGENT' }]));
  expect(document.body.textContent).not.toContain('PRIVATE OLD AGENT');
});
