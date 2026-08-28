import { beforeEach, describe, expect, it } from "vitest";
import { assistantClientKey, consumeAssistantRateLimit, resetAssistantRateLimitsForTests } from "./assistant-rate-limit";

describe("NEXO public assistant rate limit", () => {
  beforeEach(() => resetAssistantRateLimitsForTests());

  it("prefiere la IP original de x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10, 10.0.0.1" });
    expect(assistantClientKey(headers)).toBe("203.0.113.10");
  });

  it("permite doce consultas y bloquea la siguiente dentro de la ventana", () => {
    for (let index = 0; index < 12; index += 1) {
      expect(consumeAssistantRateLimit("client", 1_000).allowed).toBe(true);
    }
    const blocked = consumeAssistantRateLimit("client", 1_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("abre una nueva ventana después de cinco minutos", () => {
    for (let index = 0; index < 12; index += 1) consumeAssistantRateLimit("client", 1_000);
    expect(consumeAssistantRateLimit("client", 301_001).allowed).toBe(true);
  });
});
