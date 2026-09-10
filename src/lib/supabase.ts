import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  typeof supabaseUrl === 'string' &&
  supabaseUrl.trim() !== '' &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('example.com')
);

interface MockUser {
  id: string;
  email?: string;
  user_metadata?: { display_name?: string | null };
}

interface MockSession {
  user: MockUser;
  access_token: string;
  expires_at: number;
}

interface ProfileRecord {
  id: string;
  display_name?: string | null;
  channel?: string | null;
  account_type?: string | null;
  goals?: string[];
  discovery_source?: string | null;
  onboarding_complete?: boolean;
  theme_preference?: string;
  created_at?: string;
  updated_at?: string;
}

type AuthCallback = (event: string, session: MockSession | null) => void;

function createMockClient() {
  const authListeners: AuthCallback[] = [];

  const notifyAuth = (event: string, session: MockSession | null) => {
    authListeners.forEach((cb) => cb(event, session));
  };

  const getProfiles = (): Record<string, ProfileRecord> => {
    try {
      return JSON.parse(localStorage.getItem('flujo_onboarding_profiles') || '{}');
    } catch {
      return {};
    }
  };

  const saveProfiles = (data: Record<string, ProfileRecord>) => {
    try {
      localStorage.setItem('flujo_onboarding_profiles', JSON.stringify(data));
    } catch {
      // ignore
    }
  };

  return {
    auth: {
      async getSession() {
        const sessionStr = localStorage.getItem('flujo_mock_session');
        if (sessionStr) {
          try {
            const session: MockSession = JSON.parse(sessionStr);
            return { data: { session }, error: null };
          } catch {
            // ignore
          }
        }
        if (localStorage.getItem('flujo_logged_out') !== 'true') {
          const defaultUser: MockUser = {
            id: 'silverio_demo',
            email: 'joseph.silverio@manychat.com',
            user_metadata: { display_name: 'Silverio' },
          };
          const defaultSession: MockSession = {
            user: defaultUser,
            access_token: 'mock-token-silverio',
            expires_at: Date.now() + 86400000,
          };
          const profiles = getProfiles();
          if (!profiles['silverio_demo']) {
            profiles['silverio_demo'] = {
              id: 'silverio_demo',
              display_name: 'Silverio',
              channel: 'Instagram',
              account_type: 'personal',
              goals: ['digital', 'marcas'],
              discovery_source: 'social',
              onboarding_complete: true,
              theme_preference: 'system',
            };
            saveProfiles(profiles);
          }
          try {
            localStorage.setItem('flujo_mock_session', JSON.stringify(defaultSession));
          } catch {
            // ignore
          }
          return { data: { session: defaultSession }, error: null };
        }
        return { data: { session: null }, error: null };
      },
      async getUser() {
        const sessionStr = localStorage.getItem('flujo_mock_session');
        if (sessionStr) {
          try {
            const session: MockSession = JSON.parse(sessionStr);
            return { data: { user: session.user }, error: null };
          } catch {
            // ignore
          }
        }
        return { data: { user: null }, error: null };
      },
      async signUp({ email, options }: { email: string; password?: string; options?: { data?: { display_name?: string } } }) {
        let users: Record<string, MockUser> = {};
        try {
          users = JSON.parse(localStorage.getItem('flujo_mock_users') || '{}');
        } catch {
          // ignore
        }

        let user = Object.values(users).find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (!user) {
          const id = 'user_' + Math.random().toString(36).slice(2, 11);
          user = {
            id,
            email,
            user_metadata: { display_name: options?.data?.display_name || null },
          };
          users[id] = user;
          try {
            localStorage.setItem('flujo_mock_users', JSON.stringify(users));
          } catch {
            // ignore
          }
        }

        const session: MockSession = {
          user: {
            id: user.id,
            email: user.email,
            user_metadata: { display_name: user.user_metadata?.display_name ?? null },
          },
          access_token: 'mock-token-' + user.id,
          expires_at: Date.now() + 3600000,
        };
        try {
          localStorage.setItem('flujo_mock_session', JSON.stringify(session));
        } catch {
          // ignore
        }

        notifyAuth('SIGNED_IN', session);
        return { data: { session, user: session.user }, error: null };
      },
      async signInWithPassword({ email }: { email: string; password?: string }) {
        let users: Record<string, MockUser> = {};
        try {
          users = JSON.parse(localStorage.getItem('flujo_mock_users') || '{}');
        } catch {
          // ignore
        }

        let user = Object.values(users).find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (!user) {
          const id = 'user_' + Math.random().toString(36).slice(2, 11);
          user = {
            id,
            email,
            user_metadata: { display_name: email.split('@')[0] },
          };
          users[id] = user;
          try {
            localStorage.setItem('flujo_mock_users', JSON.stringify(users));
          } catch {
            // ignore
          }
        }

        const session: MockSession = {
          user: {
            id: user.id,
            email: user.email,
            user_metadata: { display_name: user.user_metadata?.display_name ?? null },
          },
          access_token: 'mock-token-' + user.id,
          expires_at: Date.now() + 3600000,
        };
        try {
          localStorage.setItem('flujo_mock_session', JSON.stringify(session));
        } catch {
          // ignore
        }

        notifyAuth('SIGNED_IN', session);
        return { data: { session, user: session.user }, error: null };
      },
      async signOut() {
        try {
          localStorage.removeItem('flujo_mock_session');
          localStorage.setItem('flujo_logged_out', 'true');
        } catch {
          // ignore
        }
        notifyAuth('SIGNED_OUT', null);
        return { error: null };
      },
      onAuthStateChange(callback: AuthCallback) {
        authListeners.push(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const idx = authListeners.indexOf(callback);
                if (idx !== -1) authListeners.splice(idx, 1);
              },
            },
          },
        };
      },
    },
    from(table: string) {
      return {
        select() {
          return {
            eq(column: string, value: string) {
              return {
                async maybeSingle() {
                  if (table === 'onboarding_profiles' && column === 'id') {
                    const profiles = getProfiles();
                    return { data: profiles[value] || null, error: null };
                  }
                  return { data: null, error: null };
                },
                async single() {
                  if (table === 'onboarding_profiles' && column === 'id') {
                    const profiles = getProfiles();
                    const profile = profiles[value];
                    if (profile) return { data: profile, error: null };
                    return { data: null, error: { message: 'Row not found' } };
                  }
                  return { data: null, error: { message: 'Row not found' } };
                },
              };
            },
          };
        },
        async upsert(payload: Partial<ProfileRecord> & { id: string }) {
          if (table === 'onboarding_profiles' && payload?.id) {
            const profiles = getProfiles();
            const existing = profiles[payload.id] || { id: payload.id };
            profiles[payload.id] = {
              ...existing,
              ...payload,
              updated_at: new Date().toISOString(),
            };
            saveProfiles(profiles);
          }
          return { data: payload, error: null };
        },
      };
    },
  };
}

export interface SupabaseClientLike {
  auth: {
    getSession(): Promise<{ data: { session: { user: { id: string } } | null }; error: null }>;
    getUser(): Promise<{ data: { user: { id: string } | null }; error: null }>;
    signUp(credentials: {
      email: string;
      password?: string;
      options?: { data?: { display_name?: string } };
    }): Promise<{
      data: { session: unknown; user: { id: string } | null };
      error: { message: string } | null;
    }>;
    signInWithPassword(credentials: {
      email: string;
      password?: string;
    }): Promise<{
      data: { session: unknown; user: { id: string } | null };
      error: { message: string } | null;
    }>;
    signOut(): Promise<{ error: null }>;
    onAuthStateChange(callback: (event: string, session: unknown) => void): {
      data: { subscription: { unsubscribe: () => void } };
    };
  };
  from(table: string): {
    select(fields?: string): {
      eq(column: string, value: unknown): {
        maybeSingle<T = { [key: string]: unknown; onboarding_complete?: boolean }>(): Promise<{ data: T | null; error: null }>;
        single<T = { [key: string]: unknown; onboarding_complete?: boolean }>(): Promise<{ data: T | null; error: { message: string } | null }>;
      };
    };
    upsert(payload: unknown): Promise<{ data: unknown; error: null }>;
  };
}

export const supabase: SupabaseClientLike = (
  isConfigured
    ? createClient(supabaseUrl as string, supabaseAnonKey as string)
    : createMockClient()
) as unknown as SupabaseClientLike;



