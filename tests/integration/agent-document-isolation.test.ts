import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { localKey, localTarget, restrictedFetch } from './local-target.ts';

const url = localTarget(process.env.STAGE_ISOLATION_URL);
if (process.env.STAGE_ISOLATION_DISPOSABLE !== 'YES') {
  throw new Error('Set STAGE_ISOLATION_DISPOSABLE=YES only for a disposable local instance.');
}
const anonKey = localKey(process.env.STAGE_ISOLATION_ANON_KEY, 'anon');
const serviceKey = localKey(process.env.STAGE_ISOLATION_SERVICE_KEY, 'service_role');
const localFetch = restrictedFetch(url.origin);
const client = (key: string) => createClient(url.origin, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: localFetch },
});
const admin = client(serviceKey);
const anon = client(anonKey);
const pdf = new TextEncoder().encode('%PDF-1.4\n% Synthetic isolation fixture\n%%EOF');
const bucket = (c: SupabaseClient) => c.storage.from('agent-context');
type Actor = { id: string; api: SupabaseClient };
type Role = 'owner' | 'admin' | 'editor' | 'viewer';
type Group = { id: string; actors: Record<Role, Actor>; agent: string; document: string; path: string };

function success<T extends { data: unknown; error: unknown }>(result: T): NonNullable<T['data']> {
  assert.equal(result.error, null);
  // Non-returning mutations legitimately have null data; consumers of a row,
  // list or blob below also assert its contents (a null result fails the test).
  return result.data as NonNullable<T['data']>;
}
function denied(result: { error: unknown; data: unknown }) {
  assert.ok(result.error || (Array.isArray(result.data) && result.data.length === 0), 'Expected denial or zero affected rows');
}
function agent(org: string, user: string) {
  return { organization_id: org, created_by: user, name: 'Synthetic agent',
    business_name: 'Synthetic company', business_description: 'Synthetic data for isolation tests only.',
    requested_channels: ['instagram'] };
}
function document(org: string, agentId: string, user: string) {
  const id = randomUUID();
  return { id, organization_id: org, agent_id: agentId, uploaded_by: user,
    file_name: 'synthetic.pdf', storage_path: `${org}/${agentId}/${id}/synthetic.pdf`,
    mime_type: 'application/pdf', size_bytes: pdf.length };
}

test('real local Auth, RLS, Storage and privileged document integrity', { timeout: 120_000 }, async (t) => {
  const users: string[] = [];
  const orgs: string[] = [];
  const paths: string[] = [];
  async function actor(): Promise<Actor> {
    const email = `isolation-${randomUUID()}@example.test`;
    const password = `LocalOnly-${randomUUID()}!`;
    const created = success(await admin.auth.admin.createUser({ email, password, email_confirm: true }));
    assert.ok(created.user);
    users.push(created.user.id);
    const api = client(anonKey);
    success(await api.auth.signInWithPassword({ email, password }));
    return { id: created.user.id, api };
  }
  async function group(): Promise<Group> {
    const actors = {} as Record<Role, Actor>;
    for (const role of ['owner', 'admin', 'editor', 'viewer'] as const) actors[role] = await actor();
    const id = randomUUID();
    success(await admin.from('organizations').insert({ id, owner_user_id: actors.owner.id,
      name: 'Synthetic isolation company', slug: `isolation-${id}` }));
    orgs.push(id);
    success(await admin.from('organization_members').insert(Object.entries(actors).map(([role, a]) => ({
      organization_id: id, user_id: a.id, role,
    }))));
    success(await admin.from('organization_entitlements').insert({ organization_id: id }));
    const row = success(await actors.owner.api.from('agents').insert(agent(id, actors.owner.id)).select('id').single());
    const doc = document(id, row.id, actors.owner.id);
    success(await actors.owner.api.from('knowledge_documents').insert(doc));
    paths.push(doc.storage_path);
    success(await bucket(actors.owner.api).upload(doc.storage_path, pdf, { contentType: 'application/pdf' }));
    return { id, actors, agent: row.id, document: doc.id, path: doc.storage_path };
  }
  // Cleanup is confined to IDs created by this run, even after failed setup/tests.
  t.after(async () => {
    const failures: string[] = [];
    if (paths.length && (await bucket(admin).remove(paths)).error) failures.push('Storage cleanup');
    for (const id of orgs) if ((await admin.from('organizations').delete().eq('id', id)).error) failures.push('Organization cleanup');
    for (const id of users) if ((await admin.auth.admin.deleteUser(id)).error) failures.push('Auth cleanup');
    assert.deepEqual(failures, [], 'Cleanup incomplete; dispose of the isolated instance.');
  });
  const a = await group();
  const b = await group();
  const outsider = await actor();
  const dual = await actor();
  success(await admin.from('organization_members').insert([a.id, b.id].map(id => ({ organization_id: id, user_id: dual.id, role: 'editor' }))));
  const baselineAgent = success(await admin.from('agents').select('*').eq('id', b.agent).single());
  const baselineDoc = success(await admin.from('knowledge_documents').select('*').eq('id', b.document).single());
  const baselineFile = await (success(await bucket(admin).download(b.path))).text();

  for (const [role, user] of Object.entries(a.actors)) await t.test(`own resources: ${role}`, async () => {
    assert.equal(success(await user.api.from('agents').select('id').eq('id', a.agent)).length, 1);
    assert.equal(success(await user.api.from('knowledge_documents').select('id').eq('id', a.document)).length, 1);
    const created = await user.api.from('agents').insert(agent(a.id, user.id)).select('id');
    const updated = await user.api.from('agents').update({ name: 'Updated synthetic agent' }).eq('id', a.agent).select('id');
    const doc = document(a.id, a.agent, user.id);
    const registered = await user.api.from('knowledge_documents').insert(doc);
    if (role === 'viewer') {
      assert.ok(created.error); denied(updated); assert.ok(registered.error);
      assert.ok((await bucket(user.api).download(a.path)).error);
      assert.ok((await bucket(user.api).createSignedUrl(a.path, 60)).error);
      assert.ok((await bucket(user.api).upload(doc.storage_path, pdf, { contentType: 'application/pdf' })).error);
    } else {
      assert.equal(success(created).length, 1); assert.equal(success(updated).length, 1); success(registered);
      paths.push(doc.storage_path);
      success(await bucket(user.api).upload(doc.storage_path, pdf, { contentType: 'application/pdf' }));
      assert.equal(await success(await bucket(user.api).download(a.path)).text(), new TextDecoder().decode(pdf));
      success(await bucket(user.api).createSignedUrl(a.path, 60));
    }
    denied(await user.api.from('agents').delete().eq('id', a.agent).select('id'));
    denied(await user.api.from('knowledge_documents').update({ file_name: 'changed.pdf' }).eq('id', a.document).select('id'));
    denied(await user.api.from('knowledge_documents').delete().eq('id', a.document).select('id'));
    assert.ok((await bucket(user.api).upload(a.path, pdf, { contentType: 'application/pdf', upsert: true })).error);
    await bucket(user.api).remove([a.path]);
    assert.equal(await success(await bucket(admin).download(a.path)).text(), new TextDecoder().decode(pdf));
  });

  for (const [label, api, userId] of [
    ...Object.entries(a.actors).map(([r, u]) => [r, u.api, u.id] as const),
    ['nonmember', outsider.api, outsider.id] as const, ['anonymous', anon, outsider.id] as const,
  ]) await t.test(`foreign resources denied: ${label}`, async () => {
    denied(await api.from('agents').select('*').eq('id', b.agent));
    denied(await api.from('knowledge_documents').select('*').eq('id', b.document));
    assert.ok((await api.from('agents').insert(agent(b.id, userId))).error);
    denied(await api.from('agents').update({ name: 'Intrusion' }).eq('id', b.agent).select('id'));
    denied(await api.from('agents').delete().eq('id', b.agent).select('id'));
    assert.ok((await api.from('knowledge_documents').insert(document(b.id, b.agent, userId))).error);
    denied(await api.from('knowledge_documents').update({ file_name: 'intrusion.pdf' }).eq('id', b.document).select('id'));
    denied(await api.from('knowledge_documents').delete().eq('id', b.document).select('id'));
    assert.ok((await bucket(api).download(b.path)).error);
    assert.ok((await bucket(api).createSignedUrl(b.path, 60)).error);
    assert.ok((await bucket(api).upload(`${b.id}/${b.agent}/${randomUUID()}/intrusion.pdf`, pdf, { contentType: 'application/pdf' })).error);
    assert.ok((await bucket(api).upload(b.path, pdf, { contentType: 'application/pdf', upsert: true })).error);
    // DELETE may report success with no visible rows. Check the real object below.
    await bucket(api).remove([b.path]);
    assert.deepEqual(success(await admin.from('agents').select('*').eq('id', b.agent).single()), baselineAgent);
    assert.deepEqual(success(await admin.from('knowledge_documents').select('*').eq('id', b.document).single()), baselineDoc);
    assert.equal(await success(await bucket(admin).download(b.path)).text(), baselineFile);
  });

  await t.test('identity tampering and dual membership do not authorize mismatched resources', async () => {
    const u = a.actors.editor;
    assert.ok((await u.api.from('agents').insert(agent(a.id, b.actors.owner.id))).error);
    assert.ok((await u.api.from('knowledge_documents').insert(document(a.id, a.agent, b.actors.owner.id))).error);
    assert.ok((await u.api.from('agents').update({ organization_id: b.id }).eq('id', a.agent)).error);
    assert.ok((await u.api.from('agents').update({ created_by: b.actors.owner.id }).eq('id', a.agent)).error);
    assert.ok((await dual.api.from('knowledge_documents').insert(document(a.id, b.agent, dual.id))).error);
    assert.ok((await dual.api.from('knowledge_documents').update({ organization_id: b.id, agent_id: b.agent }).eq('id', a.document)).error);
  });

  await t.test('bypass-RLS writers still obey the composite FK on insert and update', async () => {
    const mismatch = await admin.from('knowledge_documents').insert(document(a.id, b.agent, a.actors.owner.id));
    assert.equal(mismatch.error?.code, '23503', 'Before migration this insert succeeds: integrity regression');
    const valid = document(a.id, a.agent, a.actors.owner.id);
    success(await admin.from('knowledge_documents').insert(valid));
    assert.equal((await admin.from('knowledge_documents').update({ agent_id: b.agent }).eq('id', valid.id)).error?.code, '23503');
    assert.equal((await admin.from('knowledge_documents').update({ organization_id: b.id }).eq('id', valid.id)).error?.code, '23503');
    assert.equal(success(await admin.from('knowledge_documents').select('agent_id').eq('id', valid.id).single()).agent_id, a.agent);
  });

  await t.test('private delivery and signed URL expiry (bearer, not session-bound)', async () => {
    const publicUrl = bucket(anon).getPublicUrl(b.path).data.publicUrl;
    assert.equal((await localFetch(publicUrl)).ok, false);
    const signed = success(await bucket(b.actors.owner.api).createSignedUrl(b.path, 1)).signedUrl;
    assert.equal((await localFetch(signed)).ok, true, 'A signed URL works without a session until expiry');
    await new Promise(resolve => setTimeout(resolve, 2500));
    assert.equal((await localFetch(signed)).ok, false);
  });
});
