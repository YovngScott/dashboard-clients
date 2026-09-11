import { createClient } from 'npm:@supabase/supabase-js@2';

type PlanId = 'launch' | 'pulse' | 'infinity';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://app-stage-labs.ai.studio',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
  'Vary': 'Origin',
};

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

function priceFor(planId: PlanId): string | null {
  const prices: Record<PlanId, string | undefined> = {
    launch: environmentValue('PADDLE_LAUNCH_MONTHLY_PRICE_ID'),
    pulse: environmentValue('PADDLE_PULSE_MONTHLY_PRICE_ID'),
    infinity: environmentValue('PADDLE_INFINITY_MONTHLY_PRICE_ID'),
  };
  return prices[planId] && /^pri_[a-z0-9]+$/i.test(prices[planId]!) ? prices[planId]! : null;
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Authentication required' }, 401);

  let planId: PlanId;
  try {
    const body = await request.json();
    planId = body.planId;
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }
  if (!['launch', 'pulse', 'infinity'].includes(planId)) return json({ error: 'Invalid plan' }, 400);

  const supabaseUrl = environmentValue('SUPABASE_URL');
  if (!supabaseUrl) return json({ error: 'Server configuration is incomplete' }, 500);
  const supabase = createClient(supabaseUrl, publishableKey(), { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth.user?.id) return json({ error: 'Invalid session' }, 401);

  const priceId = priceFor(planId);
  const apiKey = environmentValue('PADDLE_API_KEY');
  if (!priceId || !apiKey) return json({ error: 'Checkout is not configured' }, 503);

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
      },
    }),
  });

  if (!paddleResponse.ok) {
    console.error('Paddle transaction creation failed', paddleResponse.status);
    return json({ error: 'Could not create checkout transaction' }, 502);
  }
  const paddle = await paddleResponse.json();
  const transactionId = paddle?.data?.id;
  if (typeof transactionId !== 'string' || !transactionId.startsWith('txn_')) {
    return json({ error: 'Paddle returned an invalid transaction' }, 502);
  }

  return json({ transactionId });
});
