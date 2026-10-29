import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
const db = vi.hoisted(() => ({ from: vi.fn(), insert: vi.fn(), select: vi.fn(), single: vi.fn() }));
vi.mock('../../src/lib/supabase', () => ({ supabase: { from: db.from } }));
import { createAgent, type AgentDraft } from '../../src/features/agents/agent-service';

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
