const storageKey = 'stage-pending-team-invite';

export function pendingTeamInvite(): string | null {
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get('invite');
  if (fromUrl && /^[0-9a-f]{64}$/.test(fromUrl)) {
    try {
      // OAuth can return in a different tab than the one opened from the email.
      // localStorage is shared by same-origin tabs, so the invite survives that handoff.
      window.localStorage.setItem(storageKey, fromUrl);
      window.sessionStorage.removeItem(storageKey);
      url.searchParams.delete('invite');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch { /* Keep the URL token when browser storage is unavailable. */ }
    return fromUrl;
  }
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) return stored;
    // Migrate a token saved by an older build before it is cleared on acceptance.
    const legacy = window.sessionStorage.getItem(storageKey);
    if (legacy && /^[0-9a-f]{64}$/.test(legacy)) {
      window.localStorage.setItem(storageKey, legacy);
      window.sessionStorage.removeItem(storageKey);
      return legacy;
    }
    return null;
  }
  catch { return null; }
}

export function clearPendingTeamInvite() {
  try {
    window.localStorage.removeItem(storageKey);
    window.sessionStorage.removeItem(storageKey);
  } catch { /* Storage may be unavailable. */ }
  const url = new URL(window.location.href);
  if (url.searchParams.has('invite')) {
    url.searchParams.delete('invite');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }
}
