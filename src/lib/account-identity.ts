import type { User } from '@supabase/supabase-js';

export type AccountIdentity = {
  userId: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  provider: string;
};

const pendingProviderKey = 'stage-pending-auth-provider';

export function rememberAuthProvider(provider: string) {
  try {
    sessionStorage.setItem(pendingProviderKey, JSON.stringify({ provider, createdAt: Date.now() }));
  } catch {
    // Authentication still works when browser storage is unavailable.
  }
}

export function clearRememberedAuthProvider() {
  try { sessionStorage.removeItem(pendingProviderKey); } catch { /* Storage may be blocked. */ }
}

export function consumeRememberedAuthProvider(): string | null {
  try {
    const value = sessionStorage.getItem(pendingProviderKey);
    sessionStorage.removeItem(pendingProviderKey);
    if (!value) return null;
    const parsed = JSON.parse(value) as { provider?: unknown; createdAt?: unknown };
    if (typeof parsed.provider !== 'string' || typeof parsed.createdAt !== 'number') return null;
    return Date.now() - parsed.createdAt < 15 * 60 * 1000 ? parsed.provider : null;
  } catch {
    return null;
  }
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function safeAvatar(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function resolveAccountIdentity(user: User, preferredProvider?: string | null): AccountIdentity {
  const identities = user.identities ?? [];
  const identity = identities.find((item) => item.provider === preferredProvider)
    ?? [...identities].sort((a, b) => {
      const lastB = Date.parse(b.last_sign_in_at ?? '') || 0;
      const lastA = Date.parse(a.last_sign_in_at ?? '') || 0;
      return lastB - lastA;
    })[0];
  const provider = identity?.provider ?? preferredProvider ?? 'email';
  const data = identity?.identity_data ?? {};
  const providerName = provider === 'email'
    ? null
    : firstText(data.full_name, data.name, [data.given_name, data.family_name].filter(Boolean).join(' '));
  const email = firstText(user.email, data.email);
  const fallbackName = email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || 'Mi perfil';

  return {
    userId: user.id,
    name: providerName ?? fallbackName,
    email,
    avatarUrl: provider === 'email' ? null : safeAvatar(data.avatar_url ?? data.picture),
    provider,
  };
}

export function providerLabel(provider: string): string {
  const labels: Record<string, string> = {
    google: 'Google',
    facebook: 'Facebook',
    apple: 'Apple',
    email: 'Correo electrónico',
  };
  return labels[provider] ?? provider;
}
