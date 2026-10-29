// Synthetic fixture only. Loaded solely by vite.fixture.config.ts.
import type { AgentDraft, AgentRecord } from '../../src/features/agents/agent-service';
export { validateContextPdf } from '../../src/features/agents/context-pdf';
export class AgentUpdateConflict extends Error {}
export function editableAgentFields(draft: AgentDraft): AgentDraft {
  const { name, business_name, business_description, catalog_summary, important_facts, operating_instructions, website_url, phone, goal, tone, handoff_instructions, requested_channels } = draft;
  return { name, business_name, business_description, catalog_summary, important_facts, operating_instructions, website_url: website_url?.trim() || null, phone, goal, tone, handoff_instructions, requested_channels: [...requested_channels] };
}
export const mock = { fail: true, ambiguous: false, pending: false, release: null as null | (() => void), creates: 0, uploads: 0, rows: [] as AgentRecord[] };
export async function createAgent(org: string, user: string, draft: AgentDraft) {
  mock.creates++;
  if (mock.pending) await new Promise<void>(resolve => { mock.release = resolve; });
  const row: AgentRecord = { ...draft, id: 'synthetic-agent-' + mock.creates, organization_id: org, created_by: user, status: 'draft', status_detail: null, updated_at: '2026-10-29T00:00:00Z' };
  mock.rows.push(row);
  if (mock.ambiguous) throw new TypeError('Synthetic lost response');
  return row;
}
export async function uploadContextPdf() { mock.uploads++; if (mock.fail) throw new Error('Synthetic upload failure'); }
export async function updateAgent(workspace: {organizationId:string}, agent: AgentRecord, draft: AgentDraft) {
  const index=mock.rows.findIndex(row=>row.id===agent.id && row.organization_id===workspace.organizationId && row.updated_at===agent.updated_at);
  if(index<0) throw new AgentUpdateConflict('Synthetic conflict');
  const next={...mock.rows[index],...draft,updated_at:new Date().toISOString()}; mock.rows[index]=next; return next;
}
export async function listAgents() {
  return mock.rows.flatMap(row => [row, { ...row, id:'foreign-author', name:'FOREIGN AUTHOR MUST NOT APPEAR', created_by:'other-user' }, { ...row, id:'foreign-org', name:'FOREIGN ORG MUST NOT APPEAR', organization_id:'other-org' }]);
}
