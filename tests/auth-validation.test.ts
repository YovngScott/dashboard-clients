import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeEmail,
  validateDisplayName,
  validatePassword,
} from '../src/lib/auth-validation.ts';

test('normalizes email before sending it to Supabase', () => {
  assert.equal(normalizeEmail('  Cliente@Stage.AI  '), 'cliente@stage.ai');
});

test('requires a usable business or display name', () => {
  assert.match(validateDisplayName('A') ?? '', /2 y 80/);
  assert.equal(validateDisplayName('  Estudio Norte  '), null);
});

test('requires a stronger password for a new account', () => {
  assert.match(validatePassword('abc12345') ?? '', /mayúscula/);
  assert.equal(validatePassword('Stage123'), null);
});
