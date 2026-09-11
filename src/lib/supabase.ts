import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

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
