const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** Client-side guardrails only. Supabase remains the authority for credentials. */
export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string) {
  const normalized = normalizeEmail(value);
  if (!normalized) {
    return 'Escribe tu correo electrónico.';
  }
  if (normalized.length > 320 || !emailPattern.test(normalized)) {
    return 'Escribe un correo electrónico válido.';
  }
  return null;
}

export function validatePassword(value: string) {
  if (value.length < 12) return 'Usa una contraseña de al menos 12 caracteres.';
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
  if (normalized.includes('captcha')) {
    return 'La verificación de seguridad venció o no pudo validarse. Complétala otra vez e inténtalo de nuevo.';
  }
  return 'No pudimos completar el acceso. Revisa tu conexión e inténtalo de nuevo.';
}
