import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
const db = vi.hoisted(() => ({ from: vi.fn(), insert: vi.fn(), update: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn(), maybeSingle: vi.fn() }));
vi.mock('../../src/lib/supabase', () => ({ supabase: { from: db.from } }));
import { AgentUpdateConflict, createAgent, updateAgent, type AgentDraft, type AgentRecord, type Workspace } from '../../src/features/agents/agent-service';

it('inserts only a draft configuration; does not connect or activate channels', async () => {
  db.from.mockReturnValue(db); db.insert.mockReturnValue(db); db.select.mockReturnValue(db);
  db.single.mockResolvedValue({ data: { id: 'synthetic-agent', status: 'draft' }, error: null });
  const draft = { name: 'Synthetic', business_name: 'Synthetic', business_description: 'Synthetic description for a mock business.',
    goal: 'customer_service', tone: 'clear_and_warm', requested_channels: ['instagram'] } as AgentDraft;
  const result = await createAgent('synthetic-org', 'synthetic-user', draft);
  expect(db.from.mock.calls).toEqual([['agents']]);
  expect(db.insert).toHaveBeenCalledWith({ ...draft, organization_id: 'synthetic-org', created_by: 'synthetic-user' });
  expect(db.insert.mock.calls[0][0]).not.toHaveProperty('status');
  expect(result.status).toBe('draft');
  // Compatibility evidence from committed schema, not a claim about production.
  const sql = readFileSync('supabase/migrations/20260911185532_create_agent_platform.sql', 'utf8');
  expect(sql).toContain('cardinality(requested_channels) > 0');
  expect(sql).toContain("status text not null default 'draft'");
});

it('scopes updates and only writes permitted profile fields, preserving channels', async () => {
  vi.clearAllMocks(); db.from.mockReturnValue(db); db.update.mockReturnValue(db); db.eq.mockReturnValue(db); db.select.mockReturnValue(db);
  const workspace = { organizationId: 'org-a', role: 'editor' } as Workspace;
  const agent = { id:'agent-a', organization_id:'org-a', updated_at:'2026-01-01', requested_channels:['instagram'] } as AgentRecord;
  const draft = { name:'Synthetic', business_name:'Synthetic', business_description:'Synthetic description for a mock business.', website_url:'https://example.test', requested_channels:['whatsapp'], organization_id:'org-b', status:'active' } as unknown as AgentDraft;
  db.maybeSingle.mockResolvedValue({ data: {...agent, name:'Synthetic'}, error:null });
  await updateAgent(workspace, agent, draft);
  expect(db.eq.mock.calls).toEqual([['organization_id','org-a'],['id','agent-a'],['updated_at','2026-01-01']]);
  expect(db.update.mock.calls[0][0]).not.toHaveProperty('organization_id');
  expect(db.update.mock.calls[0][0]).not.toHaveProperty('status');
  expect(db.update.mock.calls[0][0].requested_channels).toEqual(['instagram']);
  db.maybeSingle.mockResolvedValue({data:null,error:null});
  await expect(updateAgent(workspace,agent,draft)).rejects.toBeInstanceOf(AgentUpdateConflict);
  vi.clearAllMocks();
  await expect(updateAgent({...workspace,role:'viewer'},agent,draft)).rejects.toThrow();
  await expect(updateAgent({...workspace,organizationId:'org-b'},agent,draft)).rejects.toThrow();
  expect(db.from).not.toHaveBeenCalled();
});
