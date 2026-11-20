import { test } from "vitest";
import assert from "node:assert/strict";
import { createCajaRecoveryHandler } from "./caja-recovery-adapter.mjs";
const key = "a".repeat(64);
const request = (action = "list", token = key, method = "POST") => new Request("https://example.invalid/recovery", {
  method, headers: { "x-nexo-device-token": token }, ...(method === "POST" ? { body: JSON.stringify({ action }) } : {}),
});
const current = { current: true, businessId: "tenant-fixture", canReadOrders: true };
const data = { recoveryReadOnly: true, generatedAt: "2026-11-20T15:00:00Z", orders: [{ id: 1, chargeable: true }] };
const handler = (authorizeCurrentDevice, readCoreOrders) => createCajaRecoveryHandler({ businessId: "tenant-fixture", authorizeCurrentDevice, readCoreOrders });
test("only fresh tenant-scoped authorized list reaches Core", async () => {
  let calls = 0;
  const read = async () => { calls++; return data; };
  const ok = handler(async () => current, read);
  for (const [req, status] of [[request("charge"),503],[request("change"),503],[request("info"),503],[request("list","bad"),401],[request("list",key,"GET"),405]]) {
    assert.equal((await ok(req)).status,status);
  }
  for (const w of [null, {...current,current:false}, {...current,businessId:"other"}, {...current,canReadOrders:false}]) {
    assert.equal((await handler(async()=>w,read)(request())).status,401);
  }
  assert.equal((await handler(async()=>{throw Error("offline")},read)(request())).status,503);
  assert.equal(calls,0);
  const response = await ok(request());
  assert.equal(response.status,200);
  assert.equal(response.headers.get("cache-control"),"no-store, private");
  assert.deepEqual(await response.json(), {...data,orders:[{id:1,chargeable:false}]});
  assert.equal(calls,1);
});
test("malformed or unavailable Core cannot produce a successful list", async()=>{
  for (const d of [null, {...data,recoveryReadOnly:false}, {...data,orders:null}, {...data,generatedAt:"bad"}]) {
    assert.equal((await handler(async()=>current,async()=>d)(request())).status,502);
  }
  assert.equal((await handler(async()=>current,async()=>{throw Error("offline")})(request())).status,502);
});
