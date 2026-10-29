/** A partially saved agent may only be reused for the exact configuration saved. */
export function canRetrySavedAgent(savedSnapshot: string | null, currentDraft: unknown): boolean {
  return savedSnapshot !== null && savedSnapshot === JSON.stringify(currentDraft);
}

/** Only restore memory for the exact authenticated account and organization. */
export function scopedMemory<T extends { scope: string }>(value: T | null, scope: string): T | null {
  return value?.scope === scope ? value : null;
}

/** A lost response may have committed remotely. Do not create again blindly. */
export function createOutcomeUnknown(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) return true;
  const code = String(error.code);
  return !['42501', '23502', '23503', '23505', '23514', '22023'].includes(code);
}
