import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// Low-volume, non-destructive checks. Never log keys, tokens or returned rows.
const env = { ...process.env };
try {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !env[match[1]]) env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
} catch { /* CI can provide the public variables directly. */ }
const base = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
assert(base === 'https://auvbmpfiplwawxqibmmq.supabase.co', 'Unexpected security test target');
assert(key, 'A public Supabase key is required');
const headers = { apikey: key, 'Content-Type': 'application/json' };
for (const table of ['agents', 'knowledge_documents', 'organization_members', 'onboarding_profiles']) {
  const column = table === 'organization_members' ? 'organization_id' : 'id';
  const response = await fetch(`${base}/rest/v1/${table}?select=${column}&limit=1`, { headers, signal: AbortSignal.timeout(15000) });
  const body = await response.json();
  assert([401, 403].includes(response.status) || (response.ok && Array.isArray(body) && body.length === 0), `Anonymous access unexpectedly allowed for ${table}`);
  console.log(`PASS anonymous ${table}: no rows disclosed`);
}
const login = await fetch(`${base}/auth/v1/token?grant_type=password`, {
  method: 'POST', headers, signal: AbortSignal.timeout(15000),
  body: JSON.stringify({ email: 'security-probe@example.invalid', password: 'Invalid-security-probe-2026' }),
});
const rejection = await login.json();
assert(!login.ok && rejection.error_code === 'captcha_failed', 'Login without CAPTCHA was not rejected by CAPTCHA validation');
console.log('PASS login without CAPTCHA rejected');
const page = await fetch('https://app.stagelaboratories.com', { signal: AbortSignal.timeout(15000) });
assert(page.ok, 'App is unavailable');
for (const header of ['content-security-policy', 'x-content-type-options', 'x-frame-options', 'strict-transport-security']) {
  assert(page.headers.has(header), `Missing header: ${header}`);
  console.log(`PASS ${header}`);
}
