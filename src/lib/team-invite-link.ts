const storageKey = 'stage-pending-team-invite';
const storageTimeKey = 'stage-pending-team-invite-at';
const INVITE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function isValidInviteToken(token: unknown): token is string {
  return typeof token === 'string' && /^[0-9a-f]{64}$/.test(token);
}

function isAuthCallbackUrl(url: URL): boolean {
  return (
    url.searchParams.has('code') ||
    url.searchParams.has('token_hash') ||
    url.searchParams.has('error') ||
    url.searchParams.has('error_description') ||
    url.hash.includes('access_token') ||
    url.hash.includes('error')
  );
}

export function pendingTeamInvite(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get('invite');

    if (fromUrl !== null) {
      if (isValidInviteToken(fromUrl)) {
        try {
          window.sessionStorage.setItem(storageKey, fromUrl);
          window.localStorage.setItem(storageKey, fromUrl);
          window.localStorage.setItem(storageTimeKey, Date.now().toString());
          if (isAuthCallbackUrl(url)) {
            url.searchParams.delete('invite');
            window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
          }
        } catch { /* Keep the URL token when browser storage is unavailable. */ }
        return fromUrl;
      }
      clearPendingTeamInvite();
      return null;
    }

    const sessionToken = window.sessionStorage.getItem(storageKey);
    if (isValidInviteToken(sessionToken)) {
      return sessionToken;
    }

    if (isAuthCallbackUrl(url)) {
      const stored = window.localStorage.getItem(storageKey);
      const storedAt = window.localStorage.getItem(storageTimeKey);
      const age = storedAt ? Date.now() - Number(storedAt) : Infinity;
      if (isValidInviteToken(stored) && age < INVITE_MAX_AGE_MS) {
        try {
          window.sessionStorage.setItem(storageKey, stored);
        } catch { /* ignore */ }
        return stored;
      }
    }

    try {
      window.localStorage.removeItem(storageKey);
      window.localStorage.removeItem(storageTimeKey);
      window.sessionStorage.removeItem(storageKey);
    } catch { /* ignore */ }

    return null;
  } catch {
    return null;
  }
}

export function clearPendingTeamInvite() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(storageTimeKey);
    window.sessionStorage.removeItem(storageKey);
  } catch { /* Storage may be unavailable. */ }
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('invite')) {
      url.searchParams.delete('invite');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }
  } catch { /* History may be unavailable */ }
}
