/// <reference types="vite/client" />
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CatalogReview } from '../../src/features/knowledge/CatalogReview';
import '../../src/index.css';
export function CatalogFixture() {
  const [userId,setUser]=useState('synthetic-user-a');
  const [organizationId,setOrg]=useState('synthetic-org-a');
  const [agentId,setAgent]=useState('synthetic-agent-a');
  return <><aside className="border-b border-ink/25 bg-panel p-4 text-ink"><p className="mb-3 font-semibold">Prueba local sintética. Sin cuenta real, red, almacenamiento ni IA.</p><div className="flex flex-wrap gap-4">
    <label>Usuario de prueba <select value={userId} onChange={e=>setUser(e.target.value)} className="min-h-11 rounded-lg bg-canvas p-2"><option value="synthetic-user-a">Usuario A</option><option value="synthetic-user-b">Usuario B</option></select></label>
    <label>Espacio de prueba <select value={organizationId} onChange={e=>setOrg(e.target.value)} className="min-h-11 rounded-lg bg-canvas p-2"><option value="synthetic-org-a">Espacio A</option><option value="synthetic-org-b">Espacio B</option></select></label>
    <label>Agente de prueba <select value={agentId} onChange={e=>setAgent(e.target.value)} className="min-h-11 rounded-lg bg-canvas p-2"><option value="synthetic-agent-a">Agente A</option><option value="synthetic-agent-b">Agente B</option></select></label>
  </div></aside><CatalogReview scope={{userId,organizationId,agentId}} /></>;
}
const root=createRoot(document.getElementById('root')!);root.render(<CatalogFixture />);
if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
