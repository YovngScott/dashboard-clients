import test from 'node:test';
import assert from 'node:assert/strict';
import { clearPendingTeamInvite, isValidInviteToken, pendingTeamInvite } from '../src/lib/team-invite-link.ts';

function setupMockWindow(initialUrl: string) {
  const stored = new Map<string, string>();
  let location = initialUrl;
  const oldWindow = globalThis.window;
  const oldLocalStorage = globalThis.localStorage;
  const oldSessionStorage = globalThis.sessionStorage;

  const mockWindow = {
    location: {
      get href() { return location; },
      set href(v: string) { location = v; }
    },
    history: {
      state: null,
      replaceState: (_state: unknown, _title: string, path: string) => {
        location = `https://app.stagelaboratories.com${path}`;
      }
    },
    localStorage: {
      getItem: (key: string) => stored.get(`local:${key}`) ?? null,
      setItem: (key: string, value: string) => { stored.set(`local:${key}`, value); },
      removeItem: (key: string) => { stored.delete(`local:${key}`); },
    },
    sessionStorage: {
      getItem: (key: string) => stored.get(`session:${key}`) ?? null,
      setItem: (key: string, value: string) => { stored.set(`session:${key}`, value); },
      removeItem: (key: string) => { stored.delete(`session:${key}`); },
    },
  };

  Object.defineProperty(globalThis, 'window', { configurable: true, value: mockWindow });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: mockWindow.localStorage });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: mockWindow.sessionStorage });

  return {
    setUrl: (url: string) => { location = url; },
    getUrl: () => location,
    restore: () => {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: oldWindow });
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: oldLocalStorage });
      Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: oldSessionStorage });
    }
  };
}

test('validates 64-char lowercase hex invite token format', () => {
  assert.equal(isValidInviteToken('a'.repeat(64)), true);
  assert.equal(isValidInviteToken('0123456789abcdef'.repeat(4)), true);
  assert.equal(isValidInviteToken('A'.repeat(64)), false); // uppercase not allowed
  assert.equal(isValidInviteToken('123'), false); // too short
  assert.equal(isValidInviteToken('z'.repeat(64)), false); // non-hex
  assert.equal(isValidInviteToken(null), false);
  assert.equal(isValidInviteToken(undefined), false);
});

test('preserves a team invitation when returning with auth callback code', () => {
  const token = 'a'.repeat(64);
  const mock = setupMockWindow(`https://app.stagelaboratories.com/?invite=${token}&code=auth-code`);
  try {
    assert.equal(pendingTeamInvite(), token);
    assert.equal(mock.getUrl(), 'https://app.stagelaboratories.com/?code=auth-code');
  } finally {
    mock.restore();
  }
});

test('allows cross-tab OAuth handoff when returning with auth code', () => {
  const token = 'b'.repeat(64);
  const mock = setupMockWindow(`https://app.stagelaboratories.com/?invite=${token}`);
  try {
    assert.equal(pendingTeamInvite(), token);

    // Switch to another tab that receives the OAuth callback code
    mock.setUrl('https://app.stagelaboratories.com/?code=auth-code');
    // Clear sessionStorage in this tab to simulate a separate tab
    globalThis.sessionStorage.removeItem('stage-pending-team-invite');

    assert.equal(pendingTeamInvite(), token);
    clearPendingTeamInvite();
    assert.equal(pendingTeamInvite(), null);
  } finally {
    mock.restore();
  }
});

test('does NOT return residual tokens on direct access to root without invite or callback', () => {
  const token = 'c'.repeat(64);
  const mock = setupMockWindow(`https://app.stagelaboratories.com/?invite=${token}`);
  try {
    assert.equal(pendingTeamInvite(), token);

    // Simulate user later visiting root directly in a new session/tab
    mock.setUrl('https://app.stagelaboratories.com/');
    globalThis.sessionStorage.removeItem('stage-pending-team-invite');

    // Must NOT assume residual token is an active invite
    assert.equal(pendingTeamInvite(), null);
    // Should have purged the stale residue
    assert.equal(globalThis.localStorage.getItem('stage-pending-team-invite'), null);
  } finally {
    mock.restore();
  }
});

test('rejects and purges malformed invite tokens in URL', () => {
  const mock = setupMockWindow('https://app.stagelaboratories.com/?invite=invalid-malformed-token');
  try {
    assert.equal(pendingTeamInvite(), null);
    assert.equal(mock.getUrl(), 'https://app.stagelaboratories.com/');
    assert.equal(globalThis.localStorage.getItem('stage-pending-team-invite'), null);
  } finally {
    mock.restore();
  }
});

