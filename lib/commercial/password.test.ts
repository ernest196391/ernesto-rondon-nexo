import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("gestora password security",()=>{it("hashes with a random salt and verifies without storing plaintext",async()=>{const one=await hashPassword("segura-123"),two=await hashPassword("segura-123");expect(one).not.toBe(two);expect(one).not.toContain("segura-123");expect(await verifyPassword("segura-123",one)).toBe(true);expect(await verifyPassword("incorrecta",one)).toBe(false);});});
