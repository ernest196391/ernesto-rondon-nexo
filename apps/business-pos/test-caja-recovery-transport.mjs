import {test} from "node:test";
import assert from "node:assert/strict";
import {listCajaOrders, CAJA_RECOVERY_URL} from "./src/caja-recovery-transport.ts";
const token="x".repeat(64), data={orders:[{id:1,chargeable:true}],generatedAt:"2026-11-21T12:00:00Z"};
const fail = status => async () => {throw Object.assign(new Error("failed"),{status});};
test("normal primary never sends token to fallback",async()=>{
  assert.equal(await listCajaOrders(async()=>data,token,true,()=>assert.fail(),()=>assert.fail()),data);
});
test("402 and masked CORS failure lock first and only list approved endpoint",async()=>{
  for(const primary of [fail(402),async()=>{throw new TypeError("network");}]){
    let locked=false;
    const got=await listCajaOrders(primary,token,true,()=>{locked=true;},async(url,opts)=>{
      assert.equal(locked,true); assert.equal(url,CAJA_RECOVERY_URL);
      assert.equal(url,"https://ernesto-rondon-nexo.onrender.com/api/business/caja-recovery"); assert.equal(opts.redirect,"error");
      assert.equal(opts.credentials,"omit"); assert.equal(opts.headers["x-nexo-device-token"],token);
      assert.deepEqual(JSON.parse(opts.body),{action:"list"});
      return Response.json({...data,recoveryReadOnly:true});
    });
    assert.equal(got.orders[0].chargeable,false); assert.equal(got.recoveryReadOnly,true);
  }
});
test("401, 403, disabled, invalid token never send fallback",async()=>{
  for(const [status,enabled,credential,expectLock] of [[401,true,token,false],[403,true,token,false],[402,false,token,true],[402,true,"x",true]]){
    let locked=false;
    await assert.rejects(listCajaOrders(fail(status),credential,enabled,()=>{locked=true;},()=>assert.fail()));
    assert.equal(locked,expectLock);
  }
});
test("fallback must prove read-only, reject upstream failure and invalid time",async()=>{
  for(const response of [Response.json(data),Response.json({...data,recoveryReadOnly:true,generatedAt:"bad"}),Response.json({}, {status:503})])
    await assert.rejects(listCajaOrders(fail(402),token,true,()=>{},async()=>response));
});
