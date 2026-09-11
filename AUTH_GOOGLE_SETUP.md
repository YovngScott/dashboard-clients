# Google sign-in: Stage AI Labs branding and callback

The browser dashboard sends all Google and email-confirmation flows to
`VITE_APP_URL`. This value is public, but it must be the exact production
dashboard URL and must match the Supabase redirect allow list.

## 1. Supabase Auth URL configuration

In **Supabase Dashboard > Authentication > URL Configuration** for the Stage
project:

- Set **Site URL** to `https://stage-dash.ai.studio`.
- Add `https://stage-dash.ai.studio` to **Redirect URLs**.
- Add `http://127.0.0.1:3000` only for local development.
- Remove `https://brujula-app-rd.vercel.app` unless Brújula intentionally uses
  this same Supabase project. Separate products should use separate Auth
  projects or separate, tightly scoped redirect allow lists.

Deploy the dashboard with:

```env
VITE_APP_URL=https://stage-dash.ai.studio
```

## 2. Google branding: show “Stage AI Labs”

The text below Google’s account chooser is owned by the Google OAuth client,
not by React or Supabase JavaScript. Create a **Web application** OAuth client
in a Google Cloud project owned by Stage AI Labs, then configure its branding:

- App name: `Stage AI Labs`
- User support email: a Stage AI Labs address
- Authorized JavaScript origin: `https://stage-dash.ai.studio`
- Authorized redirect URI:
  `https://auvbmpfiplwawxqibmmq.supabase.co/auth/v1/callback`
- Scopes: `openid`, email, and profile only

In **Supabase Dashboard > Authentication > Providers > Google**, enable Google
and paste that OAuth client’s ID and secret. Keep the secret only in Supabase
and Google Cloud; never expose it in a `VITE_` value or commit it to Git.

Finally, configure the app name, support email, logo, privacy-policy URL, and
terms URL in **Google Auth Platform > Branding**. Google may take time to
review and display verified branding. A custom Supabase Auth domain is the
additional step that replaces the `*.supabase.co` host shown during the flow.

## 3. Verification

Open a private browser window, select Google sign-in, and confirm:

1. The chooser names **Stage AI Labs** after Google branding is active.
2. The final address is `https://stage-dash.ai.studio`.
3. A new email-registration confirmation also returns to the Stage dashboard.

If the user is still sent to Brújula, check the exact deployed value of
`VITE_APP_URL` and the Supabase redirect allow list before changing application
code again.
