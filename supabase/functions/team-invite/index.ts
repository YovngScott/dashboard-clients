import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigins = new Set(['https://app.stagelaboratories.com']);
const appUrl = 'https://app.stagelaboratories.com/';

function headers(origin: string | null): HeadersInit {
  const value: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  if (origin && allowedOrigins.has(origin)) value['Access-Control-Allow-Origin'] = origin;
  return value;
}

function env(name: string) { return Deno.env.get(name)?.trim() || undefined; }
function publishableKey(): string {
  const keys = env('SUPABASE_PUBLISHABLE_KEYS');
  if (keys) return JSON.parse(keys).default;
  return env('SUPABASE_ANON_KEY') ?? '';
}
function secretKey(): string {
  const keys = env('SUPABASE_SECRET_KEYS');
  if (keys) return JSON.parse(keys).default;
  return env('SUPABASE_SERVICE_ROLE_KEY') ?? '';
}

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin');
  const responseHeaders = headers(origin);
  const respond = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: responseHeaders });
  if (origin && !allowedOrigins.has(origin)) return respond({ error: 'origin_not_allowed' }, 403);
  if (request.method === 'OPTIONS') return new Response('ok', { headers: responseHeaders });
  if (request.method !== 'POST') return respond({ error: 'method_not_allowed' }, 405);
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return respond({ error: 'authentication_required' }, 401);
  const supabaseUrl = env('SUPABASE_URL');
  if (!supabaseUrl || !publishableKey() || !secretKey()) return respond({ error: 'server_configuration_incomplete' }, 503);

  let body: { organizationId?: string; email?: string; role?: string };
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 2048) return respond({ error: 'request_too_large' }, 413);
    body = JSON.parse(raw);
  } catch { return respond({ error: 'invalid_request' }, 400); }
  if (!body.organizationId || !body.email || !body.role) return respond({ error: 'invalid_request' }, 400);

  const caller = createClient(supabaseUrl, publishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userResult, error: userError } = await caller.auth.getUser(token);
  if (userError || !userResult.user) return respond({ error: 'invalid_session' }, 401);
  const { data: invitation, error: invitationError } = await caller.rpc('create_team_invitation', {
    target_organization_id: body.organizationId,
    invite_email: body.email,
    invite_role: body.role,
  });
  if (invitationError) return respond({ error: invitationError.message }, 400);

  const link = new URL(appUrl);
  link.searchParams.set('invite', invitation.token);
  const admin = createClient(supabaseUrl, secretKey(), { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: emailError } = await admin.auth.admin.inviteUserByEmail(body.email.trim().toLowerCase(), {
    redirectTo: link.toString(),
  });
  if (emailError) {
    // Existing users already have a sign-in method. A verified existing address
    // receives a magic link; otherwise the inviter can share the same invite URL.
    const { error: otpError } = await admin.auth.signInWithOtp({
      email: body.email.trim().toLowerCase(),
      options: { emailRedirectTo: link.toString(), shouldCreateUser: false },
    });
    if (otpError) return respond({ id: invitation.id, sent: false, link: link.toString() });
  }
  return respond({ id: invitation.id, sent: true, link: link.toString() });
});
