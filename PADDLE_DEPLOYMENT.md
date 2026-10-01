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
VITE_PADDLE_LAUNCH_ANNUAL_PRICE_ID=your_annual_launch_price_id
VITE_PADDLE_PULSE_ANNUAL_PRICE_ID=your_annual_pulse_price_id
VITE_PADDLE_INFINITY_ANNUAL_PRICE_ID=your_annual_infinity_price_id
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
PADDLE_LAUNCH_ANNUAL_PRICE_ID=your_annual_launch_price_id
PADDLE_PULSE_ANNUAL_PRICE_ID=your_annual_pulse_price_id
PADDLE_INFINITY_ANNUAL_PRICE_ID=your_annual_infinity_price_id
```

Create a second recurring price on each existing Paddle product: Launch at
USD 290/year, Pulse at USD 790/year, and Infinity at USD 1,490/year. These
are ten monthly payments' worth for twelve months of access. The server uses
the six price IDs to select the exact recurring interval; the browser does not
choose a price ID directly.

## 3. Database and functions

With the Supabase CLI linked to the Stage project, apply the migration and deploy
the two functions:

```bash
npx supabase db push
npx supabase functions deploy paddle-checkout
npx supabase functions deploy paddle-webhook
```

The annual billing migration expands `billing_subscriptions.billing_interval`
to allow `year`. Apply it before deploying the updated webhook.

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

Use a new test account to verify both a monthly and an annual checkout. Confirm
that `billing_subscriptions` receives the matching Paddle subscription ID and
`billing_interval` is `month` or `year` respectively. Then test an upgrade and a
cancellation. Paddle webhooks, not client callbacks, are the source of truth for
access and limits. Live payments also require Paddle business verification;
do not treat a successful local checkout preview as approval to collect charges.
