import { createClient } from 'npm:@supabase/supabase-js@2';

type PlanId = 'launch' | 'pulse' | 'infinity';
type BillingCycle = 'monthly' | 'annual';

const allowedOrigins = new Set(['https://app.stagelaboratories.com']);

function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
  if (origin && allowedOrigins.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function environmentValue(name: string): string | undefined {
  return Deno.env.get(name)?.trim() || undefined;
}

function publishableKey(): string {
  const modernKeys = environmentValue('SUPABASE_PUBLISHABLE_KEYS');
  if (modernKeys) return JSON.parse(modernKeys).default;
  const legacyKey = environmentValue('SUPABASE_ANON_KEY');
  if (!legacyKey) throw new Error('Falta la clave pública de Supabase en el entorno de la función.');
  return legacyKey;
}

function priceFor(planId: PlanId, billingCycle: BillingCycle): string | null {
  const prices: Record<PlanId, string | undefined> = {
    launch: environmentValue(`PADDLE_LAUNCH_${billingCycle.toUpperCase()}_PRICE_ID`),
    pulse: environmentValue(`PADDLE_PULSE_${billingCycle.toUpperCase()}_PRICE_ID`),
    infinity: environmentValue(`PADDLE_INFINITY_${billingCycle.toUpperCase()}_PRICE_ID`),
  };
  return prices[planId] && /^pri_[a-z0-9]+$/i.test(prices[planId]!) ? prices[planId]! : null;
}

function json(body: Record<string, unknown>, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), { status, headers: headers ?? corsHeaders(null) });
}

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin');
  if (origin && !allowedOrigins.has(origin)) return json({ error: 'Origin not allowed' }, 403);
  const headers = corsHeaders(origin);
  const respond = (body: Record<string, unknown>, status = 200) => json(body, status, headers);
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);

  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return respond({ error: 'Authentication required' }, 401);

  const contentLength = Number(request.headers.get('Content-Length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 2_048) return respond({ error: 'Request is too large' }, 413);

  let planId: PlanId;
  let billingCycle: BillingCycle;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 2_048) return respond({ error: 'Request is too large' }, 413);
    const body = JSON.parse(rawBody);
    planId = body.planId;
    billingCycle = body.billingCycle;
  } catch {
    return respond({ error: 'Invalid request body' }, 400);
  }
  if (!['launch', 'pulse', 'infinity'].includes(planId)) return respond({ error: 'Invalid plan' }, 400);
  if (!['monthly', 'annual'].includes(billingCycle)) return respond({ error: 'Invalid billing cycle' }, 400);

  const supabaseUrl = environmentValue('SUPABASE_URL');
  if (!supabaseUrl) return respond({ error: 'Server configuration is incomplete' }, 500);
  const supabase = createClient(supabaseUrl, publishableKey(), { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth.user?.id) return respond({ error: 'Invalid session' }, 401);

  const priceId = priceFor(planId, billingCycle);
  const apiKey = environmentValue('PADDLE_API_KEY');
  if (!priceId || !apiKey) return respond({ error: 'Checkout is not configured' }, 503);

  const paddleApiBase = environmentValue('PADDLE_ENVIRONMENT') === 'sandbox'
    ? 'https://sandbox-api.paddle.com'
    : 'https://api.paddle.com';
  const paddleResponse = await fetch(`${paddleApiBase}/transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Paddle-Version': '1',
    },
    body: JSON.stringify({
      items: [{ price_id: priceId, quantity: 1 }],
      collection_mode: 'automatic',
      custom_data: {
        stage_user_id: auth.user.id,
        stage_checkout_source: 'dashboard',
        stage_billing_cycle: billingCycle,
      },
    }),
  });

  if (!paddleResponse.ok) {
    let paddleError: unknown = null;
    try {
      paddleError = await paddleResponse.json();
    } catch {
      // Paddle can return an empty non-JSON body during an upstream incident.
    }
    const payload = paddleError && typeof paddleError === 'object' ? paddleError as Record<string, unknown> : null;
    const errorList = Array.isArray(payload?.errors)
      ? payload.errors
      : Array.isArray((payload?.error as { errors?: unknown } | undefined)?.errors)
        ? (payload?.error as { errors: unknown[] }).errors
        : [];
    const errors = errorList.map((entry) => {
      const error = entry && typeof entry === 'object' ? entry as Record<string, unknown> : {};
      const code = error.code;
      const field = error.field;
      const detail = error.detail;
      return {
        code: typeof code === 'string' ? code : undefined,
        field: typeof field === 'string' ? field : undefined,
        detail: typeof detail === 'string' ? detail.slice(0, 500) : undefined,
      };
    });
    console.error('Paddle transaction creation failed', {
      status: paddleResponse.status,
      payloadKeys: payload ? Object.keys(payload) : [],
      errorCode: typeof (payload?.error as { code?: unknown } | undefined)?.code === 'string'
        ? (payload?.error as { code: string }).code
        : undefined,
      errorDetail: typeof (payload?.error as { detail?: unknown } | undefined)?.detail === 'string'
        ? (payload?.error as { detail: string }).detail.slice(0, 500)
        : undefined,
      errors,
    });
    return respond({ error: 'Could not create checkout transaction' }, 502);
  }
  const paddle = await paddleResponse.json();
  const transactionId = paddle?.data?.id;
  if (typeof transactionId !== 'string' || !transactionId.startsWith('txn_')) {
    return respond({ error: 'Paddle returned an invalid transaction' }, 502);
  }

  return respond({ transactionId });
});
