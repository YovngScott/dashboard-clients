import test from 'node:test';
import assert from 'node:assert/strict';
import { localKey, localTarget, restrictedFetch } from './integration/local-target.ts';

test('isolation runner refuses remote, credential-bearing and ambiguous destinations', () => {
  for (const url of [undefined, 'https://auvbmpfiplwawxqibmmq.supabase.co',
    'http://localhost:54321', 'http://127.0.0.1.example.com:54321',
    'http://127.0.0.1:54321/rest', 'http://user@127.0.0.1:54321',
    'http://127.0.0.1:54321/?remote=true', 'https://127.0.0.1:54321']) {
    assert.throws(() => localTarget(url));
  }
  assert.equal(localTarget('http://127.0.0.1:54321').origin, 'http://127.0.0.1:54321');
  assert.equal(localTarget('http://[::1]:54321').origin, 'http://[::1]:54321');
});

test('isolation runner refuses remote project keys and redirects cannot leave the origin', () => {
  const jwt = (claims: object) => `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
  assert.throws(() => localKey(undefined, 'anon'));
  assert.throws(() => localKey('not-a-jwt', 'anon'));
  assert.throws(() => localKey(jwt({ role: 'anon', iss: 'supabase', ref: 'auvbmpfiplwawxqibmmq' }), 'anon'));
  assert.throws(() => localKey(jwt({ role: 'service_role', iss: 'supabase-demo' }), 'anon'));
  assert.ok(localKey(jwt({ role: 'anon', iss: 'supabase-demo' }), 'anon'));
  assert.throws(() => restrictedFetch('http://127.0.0.1:54321')('https://example.com'));
});
