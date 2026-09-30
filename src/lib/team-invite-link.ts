const storageKey = 'stage-pending-team-invite';

export function pendingTeamInvite(): string | null {
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get('invite');
  if (fromUrl && /^[0-9a-f]{64}$/.test(fromUrl)) {
    try {
      sessionStorage.setItem(storageKey, fromUrl);
      url.searchParams.delete('invite');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch { /* Keep the URL token when browser storage is unavailable. */ }
    return fromUrl;
  }
  try { return sessionStorage.getItem(storageKey); }
  catch { return null; }
}

export function clearPendingTeamInvite() {
  try { sessionStorage.removeItem(storageKey); } catch { /* Storage may be unavailable. */ }
  const url = new URL(window.location.href);
  if (url.searchParams.has('invite')) {
    url.searchParams.delete('invite');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }
}
