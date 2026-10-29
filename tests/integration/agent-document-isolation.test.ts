import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { localKey, localTarget, restrictedFetch } from './local-target.ts';
import { databaseDenied as denied, storageDenied, storageDeleteDenied, storageMissing, signedUrlExpired } from './rejections.ts';

const url = localTarget(process.env.STAGE_ISOLATION_URL);
if (process.env.STAGE_ISOLATION_DISPOSABLE !== 'YES') {
  throw new Error('Set STAGE_ISOLATION_DISPOSABLE=YES only for a disposable local instance.');
}
const anonKey = localKey(process.env.STAGE_ISOLATION_ANON_KEY, 'anon');
const serviceKey = localKey(process.env.STAGE_ISOLATION_SERVICE_KEY, 'service_role');
const localFetch = restrictedFetch(url.origin);
const schemaMode = process.env.STAGE_ISOLATION_SCHEMA ?? 'migrated';
if (!['baseline', 'migrated'].includes(schemaMode)) throw new Error('Unknown STAGE_ISOLATION_SCHEMA mode.');
const client = (key: string) => createClient(url.origin, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: localFetch },
});
const admin = client(serviceKey);
const anon = client(anonKey);
const pdf = new TextEncoder().encode('%PDF-1.4\n% Synthetic isolation fixture\n%%EOF');
const replacement = new TextEncoder().encode('%PDF-1.4\n% DIFFERENT unauthorized replacement bytes\n%%EOF');
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

test('real local Auth, RLS, Storage and privileged document integrity', { timeout: 180_000 }, async (t) => {
  const users: string[] = [];
  const orgs: string[] = [];
  const paths: string[] = [];
  function trackedDocument(org: string, agentId: string, user: string) {
    const doc = document(org, agentId, user);
    paths.push(doc.storage_path); // Register BEFORE even attempting metadata/upload.
    return doc;
  }
  async function bytes(api: SupabaseClient, path: string) {
    return new Uint8Array(await success(await bucket(api).download(path)).arrayBuffer());
  }
  async function forbiddenUpload(api: SupabaseClient, org: string, agentId: string, user: string) {
    const doc = trackedDocument(org, agentId, user);
    // Real, internally consistent metadata with exactly the attempted author/path.
    success(await admin.from('knowledge_documents').insert(doc));
    assert.deepEqual(success(await admin.from('knowledge_documents').select('storage_path,uploaded_by').eq('id', doc.id).single()),
      { storage_path: doc.storage_path, uploaded_by: user });
    storageDenied(await bucket(api).upload(doc.storage_path, pdf, { contentType: 'application/pdf' }));
    // No object should exist. A successful admin write on the SAME path proves
    // the bucket, path, metadata and content are usable independently of role.
    storageMissing(await bucket(admin).download(doc.storage_path));
    success(await bucket(admin).upload(doc.storage_path, pdf, { contentType: 'application/pdf' }));
    assert.deepEqual(await bytes(admin, doc.storage_path), pdf);
    // Same valid author/path prerequisites also apply to this overwrite attack.
    storageDenied(await bucket(api).upload(doc.storage_path, replacement, { contentType: 'application/pdf', upsert: true }), true);
    assert.deepEqual(await bytes(admin, doc.storage_path), pdf);
  }
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
    const doc = trackedDocument(id, row.id, actors.owner.id);
    success(await actors.owner.api.from('knowledge_documents').insert(doc));
    success(await bucket(actors.owner.api).upload(doc.storage_path, pdf, { contentType: 'application/pdf' }));
    return { id, actors, agent: row.id, document: doc.id, path: doc.storage_path };
  }
  // Cleanup is confined to IDs created by this run, even after failed setup/tests.
  t.after(async () => {
    const failures: string[] = [];
    if (paths.length && (await bucket(admin).remove(paths)).error) failures.push('Storage cleanup');
    for (const path of paths) {
      const remaining = await bucket(admin).download(path);
      try { storageMissing(remaining); } catch { failures.push('Storage object remains or cleanup verification failed'); }
    }
    for (const id of orgs) if ((await admin.from('organizations').delete().eq('id', id)).error) failures.push('Organization cleanup');
    if (orgs.length) {
      assert.deepEqual(success(await admin.from('organizations').select('id').in('id', orgs)), []);
      assert.deepEqual(success(await admin.from('knowledge_documents').select('id').in('organization_id', orgs)), []);
      assert.deepEqual(success(await admin.from('agents').select('id').in('organization_id', orgs)), []);
    }
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
  const baselineFile = await bytes(admin, b.path);

  for (const [role, user] of Object.entries(a.actors)) await t.test(`own resources: ${role}`, async () => {
    assert.equal(success(await user.api.from('agents').select('id').eq('id', a.agent)).length, 1);
    assert.equal(success(await user.api.from('knowledge_documents').select('id').eq('id', a.document)).length, 1);
    const created = await user.api.from('agents').insert(agent(a.id, user.id)).select('id');
    const updated = await user.api.from('agents').update({ name: 'Updated synthetic agent' }).eq('id', a.agent).select('id');
    const doc = trackedDocument(a.id, a.agent, user.id);
    const registered = await user.api.from('knowledge_documents').insert(doc);
    if (role === 'viewer') {
      denied(created); denied(updated); denied(registered);
      storageDenied(await bucket(user.api).download(a.path), true);
      storageDenied(await bucket(user.api).createSignedUrl(a.path, 60), true);
      await forbiddenUpload(user.api, a.id, a.agent, user.id);
    } else {
      assert.equal(success(created).length, 1); assert.equal(success(updated).length, 1); success(registered);
      success(await bucket(user.api).upload(doc.storage_path, pdf, { contentType: 'application/pdf' }));
      assert.equal(await success(await bucket(user.api).download(a.path)).text(), new TextDecoder().decode(pdf));
      success(await bucket(user.api).createSignedUrl(a.path, 60));
    }
    denied(await user.api.from('agents').delete().eq('id', a.agent).select('id'));
    denied(await user.api.from('knowledge_documents').update({ file_name: 'changed.pdf' }).eq('id', a.document).select('id'));
    denied(await user.api.from('knowledge_documents').delete().eq('id', a.document).select('id'));
    storageDenied(await bucket(user.api).upload(a.path, replacement, { contentType: 'application/pdf', upsert: true }), role === 'viewer');
    storageDeleteDenied(await bucket(user.api).remove([a.path]));
    assert.deepEqual(await bytes(admin, a.path), pdf);
  });

  for (const [label, api, userId] of [
    ...Object.entries(a.actors).map(([r, u]) => [r, u.api, u.id] as const),
    ['nonmember', outsider.api, outsider.id] as const, ['anonymous', anon, outsider.id] as const,
  ]) await t.test(`foreign resources denied: ${label}`, async () => {
    denied(await api.from('agents').select('*').eq('id', b.agent));
    denied(await api.from('knowledge_documents').select('*').eq('id', b.document));
    denied(await api.from('agents').insert(agent(b.id, userId)));
    denied(await api.from('agents').update({ name: 'Intrusion' }).eq('id', b.agent).select('id'));
    denied(await api.from('agents').delete().eq('id', b.agent).select('id'));
    denied(await api.from('knowledge_documents').insert(trackedDocument(b.id, b.agent, userId)));
    denied(await api.from('knowledge_documents').update({ file_name: 'intrusion.pdf' }).eq('id', b.document).select('id'));
    denied(await api.from('knowledge_documents').delete().eq('id', b.document).select('id'));
    assert.deepEqual(await bytes(b.actors.owner.api, b.path), baselineFile);
    storageDenied(await bucket(api).download(b.path), true);
    storageDenied(await bucket(api).createSignedUrl(b.path, 60), true);
    await forbiddenUpload(api, b.id, b.agent, userId);
    storageDenied(await bucket(api).upload(b.path, replacement, { contentType: 'application/pdf', upsert: true }), true);
    // DELETE may report success with no visible rows. Check the real object below.
    storageDeleteDenied(await bucket(api).remove([b.path]));
    assert.deepEqual(success(await admin.from('agents').select('*').eq('id', b.agent).single()), baselineAgent);
    assert.deepEqual(success(await admin.from('knowledge_documents').select('*').eq('id', b.document).single()), baselineDoc);
    assert.deepEqual(await bytes(b.actors.owner.api, b.path), baselineFile);
  });

  await t.test('identity tampering and dual membership do not authorize mismatched resources', async () => {
    const u = a.actors.editor;
    const before = success(await admin.from('agents').select('*').eq('id', a.agent).single());
    denied(await u.api.from('agents').insert(agent(a.id, b.actors.owner.id)));
    denied(await u.api.from('knowledge_documents').insert(trackedDocument(a.id, a.agent, b.actors.owner.id)));
    denied(await u.api.from('agents').update({ organization_id: b.id }).eq('id', a.agent));
    denied(await u.api.from('agents').update({ created_by: b.actors.owner.id }).eq('id', a.agent));
    denied(await dual.api.from('knowledge_documents').insert(trackedDocument(a.id, b.agent, dual.id)));
    denied(await dual.api.from('knowledge_documents').update({ organization_id: b.id, agent_id: b.agent }).eq('id', a.document));
    assert.deepEqual(success(await admin.from('agents').select('*').eq('id', a.agent).single()), before);
  });

  await t.test(`privileged document integrity: ${schemaMode}`, async () => {
    const inconsistent = trackedDocument(a.id, b.agent, a.actors.owner.id);
    const mismatch = await admin.from('knowledge_documents').insert(inconsistent);
    if (schemaMode === 'baseline') {
      success(mismatch);
      assert.deepEqual(success(await admin.from('knowledge_documents').select('organization_id,agent_id').eq('id', inconsistent.id).single()),
        { organization_id: a.id, agent_id: b.agent });
      assert.equal(success(await admin.from('knowledge_documents').delete().eq('id', inconsistent.id).select('id')).length, 1);
      assert.deepEqual(success(await admin.from('knowledge_documents').select('id').eq('id', inconsistent.id)), []);
      return; // Proven persisted inconsistency, NOT an infrastructure error.
    }
    assert.equal(mismatch.error?.code, '23503');
    assert.match(mismatch.error?.message ?? '', /knowledge_documents_agent_organization_fkey/);
    assert.deepEqual(success(await admin.from('knowledge_documents').select('id').eq('id', inconsistent.id)), []);
    const valid = trackedDocument(a.id, a.agent, a.actors.owner.id);
    success(await admin.from('knowledge_documents').insert(valid));
    assert.equal((await admin.from('knowledge_documents').update({ agent_id: b.agent }).eq('id', valid.id)).error?.code, '23503');
    assert.equal((await admin.from('knowledge_documents').update({ organization_id: b.id }).eq('id', valid.id)).error?.code, '23503');
    assert.equal(success(await admin.from('knowledge_documents').select('agent_id').eq('id', valid.id).single()).agent_id, a.agent);
  });

  await t.test('agent deletion still cascades to its own document metadata', async () => {
    const disposable = success(await a.actors.owner.api.from('agents').insert(agent(a.id, a.actors.owner.id)).select('id').single());
    const doc = trackedDocument(a.id, disposable.id, a.actors.owner.id);
    success(await admin.from('knowledge_documents').insert(doc));
    assert.equal(success(await admin.from('knowledge_documents').select('id').eq('id', doc.id)).length, 1);
    assert.equal(success(await admin.from('agents').delete().eq('id', disposable.id).select('id')).length, 1);
    assert.deepEqual(success(await admin.from('knowledge_documents').select('id').eq('id', doc.id)), []);
    assert.deepEqual(success(await admin.from('knowledge_documents').select('*').eq('id', b.document).single()), baselineDoc);
  });

  await t.test('private delivery and signed URL expiry (bearer, not session-bound)', async () => {
    const publicUrl = bucket(anon).getPublicUrl(b.path).data.publicUrl;
    const privateResponse = await localFetch(publicUrl);
    assert.equal(privateResponse.status, 404, 'Private bucket must not serve public URLs');
    const ttl = 15;
    const issuedAt = Date.now();
    const signed = success(await bucket(b.actors.owner.api).createSignedUrl(b.path, ttl)).signedUrl;
    const response = await localFetch(signed);
    assert.equal(response.status, 200);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), baselineFile);
    const token = new URL(signed).searchParams.get('token');
    assert.ok(token);
    const expiry = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).exp * 1000;
    assert.ok(expiry >= issuedAt + 13_000 && expiry <= Date.now() + 16_000, 'Unexpected token TTL');
    await new Promise(resolve => setTimeout(resolve, Math.max(0, expiry + 1000 - Date.now())));
    // Bounded grace window, not a retry loop swallowing network/server failures.
    const deadline = expiry + 10_000;
    while (true) {
      const expired = await localFetch(signed);
      if (expired.status !== 200) {
        signedUrlExpired(expired.status, await expired.json());
        break;
      }
      assert.ok(Date.now() < deadline, 'Signed URL still valid after expiry grace window');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    // A fresh token and authenticated read must still work on the same object.
    assert.deepEqual(await bytes(b.actors.owner.api, b.path), baselineFile);
    const fresh = success(await bucket(b.actors.owner.api).createSignedUrl(b.path, ttl)).signedUrl;
    const freshResponse = await localFetch(fresh);
    assert.equal(freshResponse.status, 200);
    assert.deepEqual(new Uint8Array(await freshResponse.arrayBuffer()), baselineFile);
  });
});
