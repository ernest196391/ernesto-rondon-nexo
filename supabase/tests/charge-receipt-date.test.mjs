import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from '../../apps/business-pos/node_modules/typescript/lib/typescript.js';
import { receiptTimestamp } from '../functions/nexo-device-web-orders/charge-date.ts';
import { chargeRequest } from '../../apps/business-pos/src/web-order-charge-request.ts';

const charge = { orderId: 6324, chargeId: 'same-receipt', staffId: 'clerk', method: 'cash_usd',
  usdMinor: 5000, cupMinor: 0, reference: null, note: null, createdAt: '2026-11-08T04:50:00.123Z' };
test('a later retry preserves receipt identity, original date and amounts', () => {
  const before = structuredClone(charge);
  const first = chargeRequest(charge);
  const retry = chargeRequest(JSON.parse(JSON.stringify(charge)));
  assert.deepEqual(retry, first);
  assert.equal(retry.cashReceivedAt, '2026-11-08T04:50:00.123Z');
  assert.equal(retry.collectedUsd, 50);
  assert.equal(receiptTimestamp(retry.cashReceivedAt, Date.parse('2026-11-10T12:00:00Z')), charge.createdAt);
  assert.deepEqual(charge, before);
});
test('missing legacy dates remain missing, never today', () => {
  for (const x of [undefined, null, '']) assert.equal(receiptTimestamp(x), undefined);
});
test('invalid or future dates cannot be sent as successful charges', () => {
  for (const x of ['2026-02-30T12:00:00Z', '2026-11-08', '2026-11-08T25:00:00Z', 'bad', 123,
    '2019-01-01T00:00:00Z', '2026-11-09T00:00:00Z', '2026-11-08T13:00:00+00:00']) {
    assert.throws(() => receiptTimestamp(x, Date.parse('2026-11-08T23:59:59Z')));
  }
});
test('valid UTC seconds and milliseconds normalize without moving the receipt', () => {
  assert.equal(receiptTimestamp('2026-11-08T12:30:00Z', Date.parse('2026-11-09')), '2026-11-08T12:30:00.000Z');
});

async function edge(body, status = 200, data = { ok: true }, token = 'test-token-not-a-secret-00000000000000') {
  let handler; const calls = [];
  const source = readFileSync(new URL('../functions/nexo-device-web-orders/index.ts', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  const context = { receiptTimestamp, Request, Response, console, Date, JSON,
    Deno: { serve: fn => { handler = fn; }, env: { get: key => key === 'WOO_URL' ? 'https://test.invalid' : 'test-value' } },
    createClient: () => ({ rpc: async () => ({ data: { person: { name: 'Fixture', phone: '', wooUserId: 1 }, deviceId: 'fixture-device' } }) }),
    fetch: async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return new Response(JSON.stringify(data), { status }); },
  };
  vm.runInNewContext(js, context);
  const response = await handler(new Request('https://test.invalid', { method: 'POST', headers: { 'x-nexo-device-token': token }, body: JSON.stringify(body) }));
  return { status: response.status, body: await response.json(), calls };
}
test('edge forwards original time with unchanged amounts and identity', async () => {
  const r = await edge(chargeRequest(charge));
  assert.equal(r.status, 200); assert.equal(r.calls.length, 1);
  assert.equal(r.calls[0].body.cashReceivedAt, charge.createdAt);
  assert.equal(r.calls[0].body.chargeId, charge.chargeId);
  assert.equal(r.calls[0].body.collectedUsd, 50);
});
test('edge rejects invalid dates before calling the web, without reversal codes', async () => {
  const r = await edge({ ...chargeRequest(charge), cashReceivedAt: 'bad' });
  assert.equal(r.status, 422); assert.equal(r.body.error, 'receipt_date'); assert.equal(r.calls.length, 0);
});
test('legacy request forwards no invented timestamp', async () => {
  const b = chargeRequest(charge); delete b.cashReceivedAt;
  const r = await edge(b); assert.equal(r.status, 200); assert.equal(r.calls[0].body.cashReceivedAt, undefined);
});
test('receipt-only acknowledgement and conflict retain their safe semantics', async () => {
  const r = await edge(chargeRequest(charge), 200, { ok: true, receiptOnly: true });
  assert.equal(r.body.receiptOnly, true);
  const conflict = await edge(chargeRequest(charge), 409, { code: 'cvd_caja_receipt_conflict', message: 'review' });
  assert.equal(conflict.status, 422); assert.equal(conflict.body.error, 'core');
});
test('no authentication means no web request', async () => {
  const r = await edge(chargeRequest(charge), 200, { ok: true }, '');
  assert.equal(r.status, 401); assert.equal(r.calls.length, 0);
});
