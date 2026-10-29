import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseDenied, storageDenied, storageDeleteDenied, storageMissing, signedUrlExpired } from './integration/rejections.ts';

test('database denials exclude network, schema and constraint errors', () => {
  databaseDenied({ data: [], error: null });
  databaseDenied({ data: null, error: { code: '42501' } });
  for (const code of ['23503', 'PGRST204', '503', undefined]) {
    assert.throws(() => databaseDenied({ data: null, error: { code } }));
  }
  assert.throws(() => databaseDenied({ data: [{ id: 'foreign' }], error: null }));
});

test('Storage failures must indicate authorization or explicitly masked reads', () => {
  storageDenied({ data: null, error: { status: 403, code: 'AccessDenied' } });
  storageDenied({ data: null, error: { statusCode: '400', message: 'Object not found' } }, true);
  for (const error of [{ status: 500, code: 'DatabaseError' }, { status: 429, message: 'SlowDown' },
    { status: 403, message: 'Invalid signature' }, { status: 409, code: 'already_exists' },
    { status: 400, message: 'Object not found' }, new TypeError('fetch failed')]) {
    assert.throws(() => storageDenied({ data: null, error }));
  }
  storageDeleteDenied({ data: [], error: null });
  assert.throws(() => storageDeleteDenied({ data: [{ name: 'removed' }], error: null }));
  storageMissing({ data: null, error: { status: 404, code: 'NoSuchKey' } });
  assert.throws(() => storageMissing({ data: null, error: { status: 403, code: 'AccessDenied' } }));
});

test('signed URL expiry cannot be inferred from an arbitrary failed response', () => {
  signedUrlExpired(400, { message: 'jwt expired' });
  for (const [status, message] of [[503, 'jwt expired'], [404, 'Object not found'],
    [403, 'Invalid signature'], [500, 'Database unavailable']] as const) {
    assert.throws(() => signedUrlExpired(status, { message }));
  }
});
