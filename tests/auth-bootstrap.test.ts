import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('initial HTML paints the auth skeleton without waiting for React', () => {
  const root = html.slice(html.indexOf('<div id="root">'), html.indexOf('<script type="module"'));
  assert.match(root, /class="auth-loading-shell" role="status" aria-busy="true"/);
  assert.equal((root.match(/class="auth-loading-field"/g) || []).length, 3);
  assert.match(html, /<style>[\s\S]*\.auth-loading-shell[\s\S]*<\/style>/);
  assert.match(html, /<script defer src="\/theme-init.js"><\/script>/);
});

test('boot palette matches current auth and supports reduced motion', () => {
  assert.match(html, /name="theme-color" content="#090d16"/);
  assert.doesNotMatch(html, /#172c43|#205066|#root:empty/);
  assert.match(html, /prefers-reduced-motion:reduce/);
});
