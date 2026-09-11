import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const configuredAppUrl = import.meta.env.VITE_APP_URL?.trim();
const canonicalDashboardUrl = 'https://stage-dash.ai.studio';

/**
 * Keeps OAuth and confirmation links on the canonical Stage dashboard instead
 * of a temporary preview URL or a stale Supabase Site URL.
 */
export function getAuthRedirectUrl() {
  // El dominio que entrega Google AI Studio es el destino público del
  // dashboard. Priorizarlo evita que un VITE_APP_URL heredado apunte a una
  // preview retirada y Supabase vuelva a usar su Site URL de otro producto.
  if (typeof window !== 'undefined' && window.location.hostname === 'stage-dash.ai.studio') {
    return canonicalDashboardUrl;
  }

  if (configuredAppUrl) {
    try {
      const candidate = new URL(configuredAppUrl).origin;
      return candidate === 'https://app-stage-labs.ai.studio'
        ? canonicalDashboardUrl
        : candidate;
    } catch {
      // A bad deploy-time value must not break access; use the current app.
    }
  }

  return window.location.origin;
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl),
);

/** Fail closed: production must never invent users, sessions, or customer data. */
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl! : 'https://configuration-required.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey! : 'configuration-required',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  },
);
