import test from 'node:test';
import assert from 'node:assert/strict';
import { clearPendingTeamInvite, pendingTeamInvite } from '../src/lib/team-invite-link.ts';

test('preserves a team invitation before the auth callback consumes the URL', () => {
  const token = 'a'.repeat(64);
  const stored = new Map<string, string>();
  let location = `https://app.stagelaboratories.com/?invite=${token}&code=auth-code`;
  const oldWindow = globalThis.window;
  const oldLocalStorage = globalThis.localStorage;
  const oldSessionStorage = globalThis.sessionStorage;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    location: { get href() { return location; } },
    history: { state: null, replaceState: (_state: unknown, _title: string, path: string) => { location = `https://app.stagelaboratories.com${path}`; } },
    localStorage: {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => { stored.set(key, value); },
      removeItem: (key: string) => { stored.delete(key); },
    },
    sessionStorage: {
      getItem: (key: string) => stored.get(`session:${key}`) ?? null,
      setItem: (key: string, value: string) => { stored.set(`session:${key}`, value); },
      removeItem: (key: string) => { stored.delete(`session:${key}`); },
    },
  } });
  try {
    assert.equal(pendingTeamInvite(), token);
    assert.equal(location, 'https://app.stagelaboratories.com/?code=auth-code');

    // A separate tab has its own sessionStorage but shares localStorage.
    const firstTab = globalThis.window;
    Object.defineProperty(globalThis, 'window', { configurable: true, value: {
      location: { get href() { return 'https://app.stagelaboratories.com/'; } },
      history: { state: null, replaceState: () => undefined },
      localStorage: firstTab.localStorage,
      sessionStorage: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined },
    } });
    assert.equal(pendingTeamInvite(), token);
    clearPendingTeamInvite();
    assert.equal(pendingTeamInvite(), null);
  } finally {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: oldWindow });
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: oldLocalStorage });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: oldSessionStorage });
  }
});
