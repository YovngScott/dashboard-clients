import assert from 'node:assert/strict';

type Result = { data: unknown; error: unknown };
type Failure = { code?: string; message?: string; status?: number; statusCode?: number | string };

export function databaseDenied(result: Result) {
  if (result.error) {
    assert.equal((result.error as Failure).code, '42501', 'Expected SQL authorization denial, not infrastructure/schema failure');
  } else {
    assert.deepEqual(result.data, [], 'Expected zero visible/affected rows');
  }
}

export function storageDenied(result: Result, maskedRead = false) {
  assert.ok(result.error, 'Expected Storage authorization rejection');
  const e = result.error as Failure;
  const status = Number(e.statusCode ?? e.status);
  const message = e.message ?? '';
  const forbidden = status === 403 && (['AccessDenied', 'Unauthorized', 'unauthorized'].includes(e.code ?? '')
    || /^(access denied|unauthorized|new row violates row-level security policy)/i.test(message));
  // Storage can intentionally mask forbidden reads as absent. Callers must prove
  // the object exists with positive reads before and after this assertion.
  const masked = maskedRead && ((status === 404 && ['NoSuchKey', 'not_found'].includes(e.code ?? ''))
    || ([400, 404].includes(status) && /^object not found\.?$/i.test(message)));
  assert.ok(forbidden || masked, `Unexpected Storage rejection: ${status}/${e.code ?? 'no-code'}`);
}

export function storageDeleteDenied(result: Result) {
  if (result.error) storageDenied(result);
  else assert.deepEqual(result.data, [], 'A denied delete must not report removed objects');
}

export function storageMissing(result: Result) {
  storageDenied(result, true);
  const e = result.error as Failure;
  assert.ok([400, 404].includes(Number(e.statusCode ?? e.status)), 'Expected absence, not an authorization error for the admin control');
}

export function signedUrlExpired(status: number, body: { message?: string; error?: string }) {
  assert.ok([400, 401, 403].includes(status), 'Expected token rejection, not infrastructure failure');
  assert.match(body.message ?? body.error ?? '', /(?:jwt|token).*(?:expired|expiration)|expired.*(?:jwt|token)/i);
}
