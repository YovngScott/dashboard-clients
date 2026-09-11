/** Client-side guardrails only. Supabase remains the authority for credentials. */
export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validatePassword(value: string) {
  if (value.length < 8) return 'Usa una contraseña de al menos 8 caracteres.';
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return 'Incluye una mayúscula, una minúscula y un número en tu contraseña.';
  }
  return null;
}

export function validateDisplayName(value: string) {
  const name = value.trim();
  if (name.length < 2 || name.length > 80) {
    return 'Escribe un nombre o marca de entre 2 y 80 caracteres.';
  }
  return null;
}

export function authErrorMessage(message?: string) {
  const normalized = message?.toLowerCase() ?? '';
  if (normalized.includes('invalid login credentials')) {
    return 'El correo o la contraseña no son correctos.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Confirma tu correo antes de iniciar sesión.';
  }
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Hiciste demasiados intentos. Espera unos minutos y vuelve a intentarlo.';
  }
  return 'No pudimos completar el acceso. Revisa tu conexión e inténtalo de nuevo.';
}
