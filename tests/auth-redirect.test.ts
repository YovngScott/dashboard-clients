import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canonicalDashboardUrl,
  resolveAuthRedirectUrl,
} from '../src/lib/auth-redirect.ts';

test('keeps the live Stage app as the confirmation destination', () => {
  assert.equal(
    resolveAuthRedirectUrl('https://app.stagelaboratories.com'),
    canonicalDashboardUrl,
  );
});

test('replaces legacy Google AI Studio callbacks with the live app', () => {
  assert.equal(
    resolveAuthRedirectUrl(
      'https://preview.example.net',
      'https://app-stage-labs.ai.studio',
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
