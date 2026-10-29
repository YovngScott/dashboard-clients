/** No application environment or remote credentials are loaded by this runner. */
export function localTarget(raw: string | undefined): URL {
  if (!raw) throw new Error('STAGE_ISOLATION_URL is required (disposable local Supabase only).');
  const url = new URL(raw);
  if (url.protocol !== 'http:' || !['127.0.0.1', '[::1]'].includes(url.hostname)
      || !url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Isolation tests refuse non-loopback or ambiguous targets.');
  }
  return url;
}

export function localKey(key: string | undefined, role: 'anon' | 'service_role'): string {
  if (!key) throw new Error(`Missing local ${role} key.`);
  let claims;
  try { claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()); }
  catch { throw new Error('Use legacy JWT keys from the disposable local CLI instance.'); }
  // Shape is a safety guard, not token verification. Auth verifies actual tokens.
  if (claims.role !== role || (claims.ref && claims.ref !== 'local')
      || !['supabase-demo', 'supabase'].includes(claims.iss)) {
    throw new Error('Refusing a key that is not a local CLI legacy key.');
  }
  return key;
}

export function restrictedFetch(origin: string): typeof fetch {
  return (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.origin !== origin) throw new Error('Blocked outbound request outside local Supabase.');
    const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    return fetch(input, { ...init, redirect: 'error', signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000) });
  };
}
