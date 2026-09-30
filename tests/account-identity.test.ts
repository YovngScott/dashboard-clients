import test from 'node:test';
import assert from 'node:assert/strict';
import type { User } from '@supabase/supabase-js';
import { resolveAccountIdentity } from '../src/lib/account-identity.ts';

function authUser(overrides: Partial<User>): User {
  return { id: 'user-1', email: 'owner@example.com', identities: [], ...overrides } as User;
}

test('uses the selected OAuth identity rather than the onboarding business name', () => {
  const user = authUser({
    user_metadata: { display_name: 'Negocio registrado' },
    identities: [
      { provider: 'google', identity_data: { full_name: 'Ana Rivera', avatar_url: 'https://images.example.com/ana.png' }, last_sign_in_at: '2026-09-29T12:00:00Z' },
      { provider: 'facebook', identity_data: { name: 'Otro nombre' }, last_sign_in_at: '2026-09-28T12:00:00Z' },
    ] as User['identities'],
  });

  assert.deepEqual(resolveAccountIdentity(user, 'google'), {
    userId: 'user-1',
    name: 'Ana Rivera',
    email: 'owner@example.com',
    avatarUrl: 'https://images.example.com/ana.png',
    provider: 'google',
  });
});

test('uses the most recently signed-in linked identity when there is no redirect hint', () => {
  const user = authUser({
    identities: [
      { provider: 'google', identity_data: { name: 'Nombre Google' }, last_sign_in_at: '2026-09-28T12:00:00Z' },
      { provider: 'facebook', identity_data: { name: 'Nombre Facebook' }, last_sign_in_at: '2026-09-29T12:00:00Z' },
    ] as User['identities'],
  });
  assert.equal(resolveAccountIdentity(user).name, 'Nombre Facebook');
});

test('email access never presents the business name as a personal identity', () => {
  const user = authUser({ user_metadata: { display_name: 'Mi tienda' } });
  const identity = resolveAccountIdentity(user, 'email');
  assert.equal(identity.name, 'owner');
  assert.equal(identity.avatarUrl, null);
});

test('rejects non-HTTPS avatar URLs', () => {
  const user = authUser({
    identities: [{ provider: 'google', identity_data: { name: 'Ana', avatar_url: 'http://example.com/photo.png' } }] as User['identities'],
  });
  assert.equal(resolveAccountIdentity(user).avatarUrl, null);
});
