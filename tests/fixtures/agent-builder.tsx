/// <reference types="vite/client" />
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AgentBuilder, type AgentDraftMemory } from '../../src/features/agents/AgentWorkspace';
import { mock } from './agent-service-mock';
import '../../src/index.css';
export function Fixture() {
  const [memory, setMemory] = useState<AgentDraftMemory | null>(null);
  const [open, setOpen] = useState(false);
  const [finished, setFinished] = useState(false);
  const [user, setUser] = useState('synthetic-user');
  const [org, setOrg] = useState('synthetic-org');
  return <><h1>PRUEBA LOCAL SINTÉTICA, SERVICIOS SIMULADOS, SIN BASE DE DATOS</h1>
    <label><input type="checkbox" defaultChecked onChange={e => { mock.fail = e.target.checked; }} />Simular fallo PDF</label>
    <label><input type="checkbox" onChange={e => { mock.pending = e.target.checked; }} />Simular solicitud pendiente</label>
    <label><input type="checkbox" onChange={e => { mock.ambiguous = e.target.checked; }} />Simular creación ambigua</label>
    <label>Usuario sintético<select value={user} onChange={e => setUser(e.target.value)}><option value="synthetic-user">Usuario A</option><option value="synthetic-user-b">Usuario B</option></select></label>
    <label>Organización sintética<select value={org} onChange={e => setOrg(e.target.value)}><option value="synthetic-org">Espacio A</option><option value="synthetic-org-b">Espacio B</option></select></label>
    <button onClick={() => setOpen(true)}>Abrir formulario sintético</button>
    <button onClick={() => mock.release?.()}>Resolver solicitud</button>
    {finished && <p role="status">Guardado simulado completado</p>}
    {open && <AgentBuilder userId={user} workspace={{ organizationId: org, name: 'Empresa sintética', logoPath: null, logoUrl: null, role: 'owner', planCode: 'launch', maxConnectedChannels: 1, allowedChannels: ['instagram'] }} initialBusinessName="Empresa sintética" draftMemory={memory} setDraftMemory={setMemory} onClose={() => setOpen(false)} onCreated={async () => { setOpen(false); setMemory(null); setFinished(true); }} />}
  </>;
}
const root = createRoot(document.getElementById('root')!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
