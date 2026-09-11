# Paddle billing deployment

Stage creates Paddle transactions server-side, then opens Paddle Checkout with the
returned transaction ID. The browser never receives an API key or webhook secret.

## 1. Web application environment

Set these values in the dashboard hosting provider (not in Git):

```env
VITE_PADDLE_CLIENT_TOKEN=your_paddle_client_side_token
VITE_PADDLE_ENVIRONMENT=production
VITE_PADDLE_LAUNCH_MONTHLY_PRICE_ID=pri_01m270912rjjanemqatcq7bpak
VITE_PADDLE_PULSE_MONTHLY_PRICE_ID=pri_01m270nv7jp0y1rs34k4tt3azv
VITE_PADDLE_INFINITY_MONTHLY_PRICE_ID=pri_01m27106m6k3m67271705f8qzf
```

The client-side token is intentionally public. Never put a Paddle API key,
notification secret, or a Supabase secret/service-role key in a `VITE_` variable.

## 2. Supabase secrets

In **Supabase > Edge Functions > Secrets**, set:

```env
PADDLE_API_KEY=your_live_paddle_api_key
PADDLE_WEBHOOK_SECRET=your_paddle_notification_destination_secret
PADDLE_ENVIRONMENT=production
PADDLE_LAUNCH_MONTHLY_PRICE_ID=pri_01m270912rjjanemqatcq7bpak
PADDLE_PULSE_MONTHLY_PRICE_ID=pri_01m270nv7jp0y1rs34k4tt3azv
PADDLE_INFINITY_MONTHLY_PRICE_ID=pri_01m27106m6k3m67271705f8qzf
```

## 3. Database and functions

With the Supabase CLI linked to the Stage project, apply the migration and deploy
the two functions:

```bash
npx supabase db push
npx supabase functions deploy paddle-checkout
npx supabase functions deploy paddle-webhook
```

## 4. Paddle notification destination

Create a Paddle notification destination pointing to:

```text
https://auvbmpfiplwawxqibmmq.supabase.co/functions/v1/paddle-webhook
```

Subscribe it to `subscription.created`, `subscription.updated`, and
`subscription.canceled`. Copy that destination's secret to
`PADDLE_WEBHOOK_SECRET` in Supabase. The function verifies each `Paddle-Signature`
before any subscription row is written.

## 5. Final live test

Use a new test account, buy Launch, and confirm that `billing_subscriptions` receives
one row with the matching Paddle subscription ID. Then test an upgrade and a
cancellation. Paddle webhooks, not client callbacks, are the source of truth for
access and limits.
