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

test('rejects untrusted external origins and falls back to canonical URL', () => {
  assert.equal(
    resolveAuthRedirectUrl('https://evil-phishing-site.example.com'),
    canonicalDashboardUrl,
  );
  assert.equal(
    resolveAuthRedirectUrl('https://evil.attacker.com/app'),
    canonicalDashboardUrl,
  );
  assert.equal(
    resolveAuthRedirectUrl('javascript:alert(1)'),
    canonicalDashboardUrl,
  );
  assert.equal(
    resolveAuthRedirectUrl('data:text/html,<script>alert(1)</script>'),
    canonicalDashboardUrl,
  );
});

test('trusts Cloudflare Pages preview domains', () => {
  assert.equal(
    resolveAuthRedirectUrl('https://stage-clients-app.pages.dev'),
    'https://stage-clients-app.pages.dev',
  );
  assert.equal(
    resolveAuthRedirectUrl('https://branch-preview-123.pages.dev'),
    'https://branch-preview-123.pages.dev',
  );
});
