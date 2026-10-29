import test from 'node:test';
import assert from 'node:assert/strict';
import { canRetrySavedAgent, createOutcomeUnknown, scopedMemory } from '../src/features/agents/save-safety.ts';

test('a partial save may be retried only with the identical saved configuration', () => {
  const draft = { name: 'Demo', business_description: 'Synthetic data', requested_channels: ['instagram'] };
  const snapshot = JSON.stringify(draft);
  assert.equal(canRetrySavedAgent(snapshot, draft), true);
  assert.equal(canRetrySavedAgent(snapshot, { ...draft, name: 'Changed' }), false);
  assert.equal(canRetrySavedAgent(snapshot, { ...draft, requested_channels: ['whatsapp'] }), false);
  assert.equal(canRetrySavedAgent(null, draft), false);
});

test('lost or ambiguous create responses do not permit a blind duplicate retry', () => {
  assert.equal(createOutcomeUnknown(new TypeError('network unavailable')), true);
  assert.equal(createOutcomeUnknown({ code: 'PGRST000' }), true);
  assert.equal(createOutcomeUnknown({ code: '42501' }), false);
  assert.equal(createOutcomeUnknown({ code: '23514' }), false);
});

test('in-memory drafts never restore across account or organization scope', () => {
  const memory = { scope: 'user-a:org-a', content: 'synthetic' };
  assert.equal(scopedMemory(memory, 'user-a:org-a'), memory);
  assert.equal(scopedMemory(memory, 'user-b:org-a'), null);
  assert.equal(scopedMemory(memory, 'user-a:org-b'), null);
  assert.equal(scopedMemory(null, 'user-a:org-a'), null);
});
