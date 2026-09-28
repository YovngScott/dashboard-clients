import { createClient } from '@supabase/supabase-js';
import { resolveAuthRedirectUrl } from './auth-redirect';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const configuredAppUrl = import.meta.env.VITE_APP_URL?.trim();

/**
 * Keeps OAuth and confirmation links on the canonical Stage app instead of a
 * temporary preview URL or a stale Supabase Site URL.
 */
export function getAuthRedirectUrl() {
  return resolveAuthRedirectUrl(window.location.origin, configuredAppUrl);
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
