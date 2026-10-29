import test from 'node:test';
import assert from 'node:assert/strict';
import { agentLimits, draftValidationError, safeAgentError } from '../src/features/agents/draft-validation.ts';
import { ContextPdfError } from '../src/features/agents/context-pdf.ts';
const valid = { name:'Agent', business_name:'Synthetic', business_description:'Synthetic description of the business.' };
for (const field of Object.keys(agentLimits) as (keyof typeof agentLimits)[]) {
  test(field + ' accepts the schema maximum and rejects maximum + 1', () => {
    assert.equal(draftValidationError({...valid,[field]:'a'.repeat(agentLimits[field])}),null);
    assert.match(draftValidationError({...valid,[field]:'a'.repeat(agentLimits[field]+1)}) ?? '', /máximo/);
  });
}
test('minimum validation counts Unicode code points like PostgreSQL', () => {
  assert.match(draftValidationError({...valid,name:'😀'}) ?? '',/al menos 2/);
  assert.equal(draftValidationError({...valid,name:'😀😀'}),null);
});
test('untrusted Supabase messages never become UI messages', () => {
  assert.doesNotMatch(safeAgentError({code:'23514',message:'secret constraint internals'}),/secret|internals/);
  assert.doesNotMatch(safeAgentError(new Error('secret')),/secret/);
});
test('only typed local PDF errors get local messages, never remote lookalikes', () => {
  const local = new ContextPdfError('signature');
  local.message = 'PRIVATE arbitrary content';
  assert.match(safeAgentError(local), /firma PDF válida/);
  assert.doesNotMatch(safeAgentError(local), /PRIVATE/);
  assert.doesNotMatch(safeAgentError({name:'ContextPdfError',reason:'signature',message:'PRIVATE remote'}), /firma PDF|PRIVATE/);
});
