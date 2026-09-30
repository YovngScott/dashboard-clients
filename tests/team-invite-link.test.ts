import test from 'node:test';
import assert from 'node:assert/strict';
import { clearPendingTeamInvite, pendingTeamInvite } from '../src/lib/team-invite-link.ts';

test('preserves a team invitation before the auth callback consumes the URL', () => {
  const token = 'a'.repeat(64);
  const stored = new Map<string, string>();
  let location = `https://app.stagelaboratories.com/?invite=${token}&code=auth-code`;
  const oldWindow = globalThis.window;
  const oldSessionStorage = globalThis.sessionStorage;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    location: { get href() { return location; } },
    history: { state: null, replaceState: (_state: unknown, _title: string, path: string) => { location = `https://app.stagelaboratories.com${path}`; } },
  } });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => { stored.set(key, value); },
    removeItem: (key: string) => { stored.delete(key); },
  } });
  try {
    assert.equal(pendingTeamInvite(), token);
    assert.equal(location, 'https://app.stagelaboratories.com/?code=auth-code');
    assert.equal(pendingTeamInvite(), token);
    clearPendingTeamInvite();
    assert.equal(pendingTeamInvite(), null);
  } finally {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: oldWindow });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: oldSessionStorage });
  }
});
