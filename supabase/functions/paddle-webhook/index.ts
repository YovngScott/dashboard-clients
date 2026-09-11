import { createClient } from 'npm:@supabase/supabase-js@2';

type PaddleSubscription = {
  id?: string;
  customer_id?: string;
  status?: string;
  items?: Array<{ price?: { id?: string } }>;
  custom_data?: { stage_user_id?: string };
  current_billing_period?: { starts_at?: string; ends_at?: string };
  scheduled_change?: { action?: string | null } | null;
};

type PaddleEvent = {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  data?: PaddleSubscription;
};

const corsHeaders = { 'Content-Type': 'application/json' };
const allowedEvents = new Set(['subscription.created', 'subscription.updated', 'subscription.canceled']);
const userIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function environmentValue(name: string): string | undefined {
  return Deno.env.get(name)?.trim() || undefined;
}

function supabaseSecretKey(): string {
  const modernKeys = environmentValue('SUPABASE_SECRET_KEYS');
  if (modernKeys) return JSON.parse(modernKeys).default;
  const legacyKey = environmentValue('SUPABASE_SERVICE_ROLE_KEY');
  if (!legacyKey) throw new Error('Falta la clave administrativa de Supabase en el entorno de la función.');
  return legacyKey;
}

function planFromPrice(priceId: string | undefined): 'launch' | 'pulse' | 'infinity' | null {
  const pricePlans: Record<string, 'launch' | 'pulse' | 'infinity'> = {
    [environmentValue('PADDLE_LAUNCH_MONTHLY_PRICE_ID') ?? '']: 'launch',
    [environmentValue('PADDLE_PULSE_MONTHLY_PRICE_ID') ?? '']: 'pulse',
    [environmentValue('PADDLE_INFINITY_MONTHLY_PRICE_ID') ?? '']: 'infinity',
  };
  return priceId ? pricePlans[priceId] ?? null : null;
}

function limitsFor(plan: 'launch' | 'pulse' | 'infinity') {
  if (plan === 'launch') return { contacts_limit: 5000, emails_limit: 25000, seats_limit: 3 };
  if (plan === 'pulse') return { contacts_limit: 15000, emails_limit: 75000, seats_limit: 6 };
  return { contacts_limit: null, emails_limit: 250000, seats_limit: 15 };
}

function parseSignature(header: string): { timestamp: string; signatures: string[] } | null {
  const entries = header.split(';').map((part) => part.trim().split('='));
  const timestamp = entries.find(([key]) => key === 'ts')?.[1];
  const signatures = entries.filter(([key]) => key === 'h1').map(([, value]) => value).filter(Boolean);
  return timestamp && signatures.length ? { timestamp, signatures } : null;
}

function constantTimeEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function verifySignature(rawBody: string, header: string | null): Promise<boolean> {
  const secret = environmentValue('PADDLE_WEBHOOK_SECRET');
  if (!secret || !header) return false;

  const parsed = parseSignature(header);
  if (!parsed) return false;
  const timestamp = Number(parsed.timestamp);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 5) return false;

  const expected = await hmacSha256Hex(secret, `${parsed.timestamp}:${rawBody}`);
  return parsed.signatures.some((signature) => constantTimeEquals(expected, signature));
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });

  const rawBody = await request.text();
  if (!(await verifySignature(rawBody, request.headers.get('Paddle-Signature')))) {
    return new Response(JSON.stringify({ error: 'Invalid Paddle signature' }), { status: 401, headers: corsHeaders });
  }

  let event: PaddleEvent;
  try {
    event = JSON.parse(rawBody) as PaddleEvent;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: corsHeaders });
  }

  if (!event.event_id || !event.event_type) {
    return new Response(JSON.stringify({ error: 'Missing Paddle event metadata' }), { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(environmentValue('SUPABASE_URL')!, supabaseSecretKey());
  const received = await supabase.from('billing_webhook_events').insert({
    paddle_event_id: event.event_id,
    event_type: event.event_type,
    occurred_at: event.occurred_at ?? null,
    payload: event,
  });

  if (received.error?.code === '23505') {
    return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200, headers: corsHeaders });
  }
  if (received.error) {
    console.error('Could not persist Paddle event', received.error.code);
    return new Response(JSON.stringify({ error: 'Event persistence failed' }), { status: 500, headers: corsHeaders });
  }

  if (!allowedEvents.has(event.event_type)) {
    await supabase.from('billing_webhook_events').update({ processed_at: new Date().toISOString() }).eq('paddle_event_id', event.event_id);
    return new Response(JSON.stringify({ received: true, ignored: true }), { status: 200, headers: corsHeaders });
  }

  const subscription = event.data;
  const subscriptionId = subscription?.id;
  const priceId = subscription?.items?.[0]?.price?.id;
  const plan = planFromPrice(priceId);
  let userId = subscription?.custom_data?.stage_user_id;

  if (!subscriptionId || !plan || !priceId) {
    return new Response(JSON.stringify({ error: 'Unrecognized Stage subscription payload' }), { status: 422, headers: corsHeaders });
  }

  if (!userId || !userIdPattern.test(userId)) {
    const existing = await supabase.from('billing_subscriptions').select('user_id').eq('paddle_subscription_id', subscriptionId).maybeSingle();
    userId = existing.data?.user_id;
  }
  if (!userId || !userIdPattern.test(userId)) {
    return new Response(JSON.stringify({ error: 'Subscription is missing a valid Stage user reference' }), { status: 422, headers: corsHeaders });
  }

  const limits = limitsFor(plan);
  const { error } = await supabase.from('billing_subscriptions').upsert({
    user_id: userId,
    paddle_customer_id: subscription.customer_id ?? null,
    paddle_subscription_id: subscriptionId,
    plan_key: plan,
    price_id: priceId,
    status: subscription.status ?? 'unknown',
    billing_interval: 'month',
    current_period_starts_at: subscription.current_billing_period?.starts_at ?? null,
    current_period_ends_at: subscription.current_billing_period?.ends_at ?? null,
    cancel_at_period_end: subscription.scheduled_change?.action === 'cancel',
    raw_data: subscription,
    updated_at: new Date().toISOString(),
    ...limits,
  }, { onConflict: 'paddle_subscription_id' });

  if (error) {
    console.error('Could not upsert subscription', error.code);
    return new Response(JSON.stringify({ error: 'Subscription synchronization failed' }), { status: 500, headers: corsHeaders });
  }

  await supabase.from('billing_webhook_events').update({ processed_at: new Date().toISOString() }).eq('paddle_event_id', event.event_id);
  return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
});
