-- Paddle is the billing authority. This table is an owner-scoped, read-only projection
-- of signed Paddle webhook events; only the Edge Function writes it with a secret key.

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_customer_id text,
  paddle_subscription_id text NOT NULL UNIQUE,
  paddle_transaction_id text UNIQUE,
  plan_key text NOT NULL CHECK (plan_key IN ('launch', 'pulse', 'infinity')),
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'unknown',
  billing_interval text NOT NULL DEFAULT 'month' CHECK (billing_interval = 'month'),
  contacts_limit integer CHECK (contacts_limit IS NULL OR contacts_limit >= 0),
  emails_limit integer CHECK (emails_limit IS NULL OR emails_limit >= 0),
  seats_limit integer CHECK (seats_limit IS NULL OR seats_limit >= 0),
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_subscriptions_user_status_idx
  ON public.billing_subscriptions (user_id, status);

CREATE TABLE IF NOT EXISTS public.billing_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paddle_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  occurred_at timestamptz,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own billing subscriptions" ON public.billing_subscriptions;
CREATE POLICY "Users can view their own billing subscriptions"
  ON public.billing_subscriptions FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- Billing webhook events intentionally have no client policy: they contain provider payloads.
