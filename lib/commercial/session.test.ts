import { afterEach, describe, expect, it } from "vitest";
import { createGestoraSession, readGestoraSession } from "./session";
const previous=process.env.NEXO_GESTORA_SESSION_SECRET;
afterEach(()=>{if(previous===undefined)delete process.env.NEXO_GESTORA_SESSION_SECRET;else process.env.NEXO_GESTORA_SESSION_SECRET=previous;});
describe("gestora sessions",()=>{
  it("round-trips a signed owner session",()=>{process.env.NEXO_GESTORA_SESSION_SECRET="test-secret-long-enough";const token=createGestoraSession({userId:"u1",gestoraId:"g1",role:"gestora"});expect(readGestoraSession(token)).toMatchObject({userId:"u1",gestoraId:"g1",role:"gestora"});});
  it("rejects tampering",()=>{process.env.NEXO_GESTORA_SESSION_SECRET="test-secret-long-enough";const token=createGestoraSession({userId:"u1",gestoraId:"g1",role:"gestora"});expect(readGestoraSession(`${token}x`)).toBeNull();});
  it("rejects expired sessions",()=>{process.env.NEXO_GESTORA_SESSION_SECRET="test-secret-long-enough";const token=createGestoraSession({userId:"u1",gestoraId:"g1",role:"gestora"},-1);expect(readGestoraSession(token)).toBeNull();});
});
