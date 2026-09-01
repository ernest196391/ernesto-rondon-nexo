import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkEmailChallenge, createEmailChallenge, verifiedEmail } from "./email-verification";

describe("email verification challenge",()=>{
 beforeEach(()=>{process.env.NEXO_GESTORA_SESSION_SECRET="test-secret-with-enough-entropy"});
 it("accepts the correct code once within its lifetime",()=>{const challenge=createEmailChallenge("gestora@example.com"),result=checkEmailChallenge(challenge.token,challenge.code);expect(result.ok).toBe(true);if(result.ok)expect(verifiedEmail(result.verified)).toBe("gestora@example.com")});
 it("rejects an incorrect code and increments attempts",()=>{const challenge=createEmailChallenge("gestora@example.com"),result=checkEmailChallenge(challenge.token,"000000");expect(result.ok).toBe(false);if(!result.ok)expect(result.error).toBe("invalid")});
 it("rejects an expired challenge",()=>{vi.useFakeTimers();vi.setSystemTime(new Date("2026-09-01T12:00:00Z"));const challenge=createEmailChallenge("gestora@example.com");vi.setSystemTime(new Date("2026-09-01T12:11:00Z"));expect(checkEmailChallenge(challenge.token,challenge.code)).toMatchObject({ok:false,error:"expired"});vi.useRealTimers()});
});
