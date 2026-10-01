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
  if (!supabaseUrl || !publishableKey()) return respond({ error: 'server_configuration_incomplete' }, 503);

  const contentLength = Number(request.headers.get('Content-Length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 2048) return respond({ error: 'request_too_large' }, 413);

  let body: { organizationId?: string; role?: string };
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 2048) return respond({ error: 'request_too_large' }, 413);
    body = JSON.parse(raw);
  } catch { return respond({ error: 'invalid_request' }, 400); }

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const allowedRoles = new Set(['admin', 'editor', 'viewer']);
  if (!body.organizationId || !uuidPattern.test(body.organizationId) || !body.role || !allowedRoles.has(body.role)) {
    return respond({ error: 'invalid_request' }, 400);
  }

  const caller = createClient(supabaseUrl, publishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userResult, error: userError } = await caller.auth.getUser(token);
  if (userError || !userResult.user) return respond({ error: 'invalid_session' }, 401);
  const { data: invitation, error: invitationError } = await caller.rpc('create_team_invitation', {
    target_organization_id: body.organizationId,
    invite_email: null,
    invite_role: body.role,
  });
  if (invitationError) {
    const knownErrors = new Set([
      'authentication_required', 'invalid_email', 'invalid_role',
      'organization_not_found', 'insufficient_role', 'already_a_member',
      'invitation_already_pending', 'seat_limit_unavailable', 'seat_limit_reached'
    ]);
    const safeError = knownErrors.has(invitationError.message) ? invitationError.message : 'invitation_creation_failed';
    return respond({ error: safeError }, 400);
  }

  const link = new URL(appUrl);
  link.searchParams.set('invite', invitation.token);
  return respond({ id: invitation.id, link: link.toString(), expiresAt: invitation.expires_at });
});
