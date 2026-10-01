import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeEmail,
  validateEmail,
  authErrorMessage,
  validateDisplayName,
  validatePassword,
} from '../src/lib/auth-validation.ts';

test('normalizes email before sending it to Supabase', () => {
  assert.equal(normalizeEmail('  Cliente@Stage.AI  '), 'cliente@stage.ai');
});

test('validates email syntax properly before sending network requests', () => {
  assert.match(validateEmail('') ?? '', /Escribe tu correo/);
  assert.match(validateEmail('not-an-email') ?? '', /correo electrónico válido/);
  assert.match(validateEmail('user@') ?? '', /correo electrónico válido/);
  assert.match(validateEmail('@domain.com') ?? '', /correo electrónico válido/);
  assert.match(validateEmail('user@domain') ?? '', /correo electrónico válido/);
  assert.match(validateEmail('<script>@domain.com') ?? '', /correo electrónico válido/);
  assert.equal(validateEmail('valido@stagelaboratories.com'), null);
  assert.equal(validateEmail('  usuario+tag@empresa.co  '), null);
});

test('requires a usable business or display name', () => {
  assert.match(validateDisplayName('A') ?? '', /2 y 80/);
  assert.equal(validateDisplayName('  Estudio Norte  '), null);
});

test('requires a stronger password for a new account', () => {
  assert.match(validatePassword('abcdefgh1234') ?? '', /mayúscula/);
  assert.equal(validatePassword('Stage123ABC4'), null);
});

test('explains how to recover from an expired or invalid CAPTCHA', () => {
  assert.match(authErrorMessage('captcha verification failed'), /Complétala otra vez/);
});
