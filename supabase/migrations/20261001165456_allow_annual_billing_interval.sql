-- A Paddle subscription may use either monthly or annual recurring prices.
ALTER TABLE public.billing_subscriptions
  DROP CONSTRAINT IF EXISTS billing_subscriptions_billing_interval_check;

ALTER TABLE public.billing_subscriptions
  ADD CONSTRAINT billing_subscriptions_billing_interval_check
  CHECK (billing_interval IN ('month', 'year'));
