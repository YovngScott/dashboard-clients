import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canonicalDashboardUrl,
  resolveAuthRedirectUrl,
} from '../src/lib/auth-redirect.ts';

test('keeps the live Stage dashboard as the confirmation destination', () => {
  assert.equal(
    resolveAuthRedirectUrl('https://app-stage-labs.ai.studio'),
    canonicalDashboardUrl,
  );
});

test('replaces the retired dashboard callback with the live dashboard', () => {
  assert.equal(
    resolveAuthRedirectUrl(
      'https://preview.example.net',
      'https://stage-dash.ai.studio',
    ),
    canonicalDashboardUrl,
  );
});

test('preserves local and explicit preview origins', () => {
  assert.equal(
    resolveAuthRedirectUrl('http://localhost:3000'),
    'http://localhost:3000',
  );
  assert.equal(
    resolveAuthRedirectUrl(
      'https://preview.example.net',
      'https://preview.example.net/app',
    ),
    'https://preview.example.net',
  );
});

test('falls back to the current origin when the build value is malformed', () => {
  assert.equal(
    resolveAuthRedirectUrl('http://localhost:3000', 'not a url'),
    'http://localhost:3000',
  );
});
