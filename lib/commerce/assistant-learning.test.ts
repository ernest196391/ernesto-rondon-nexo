import { describe, expect, it } from "vitest";
import {
  assistantQuestionFingerprint,
  normalizeBacklogResolutionInput,
  redactAssistantQuestion,
} from "./assistant-learning";

describe("assistant learning privacy", () => {
  it("redacts contact data before persisting unresolved questions", () => {
    const redacted = redactAssistantQuestion("Mi correo es cliente@example.com, teléfono +53 5405 6173 y mira https://example.com/foto");
    expect(redacted).toContain("[email]");
    expect(redacted).toContain("[phone]");
    expect(redacted).toContain("[url]");
    expect(redacted).not.toContain("cliente@example.com");
    expect(redacted).not.toContain("5405 6173");
  });

  it("creates a stable fingerprint from the redacted question", () => {
    const first = assistantQuestionFingerprint("pk_test", "¿Cuánto dura? mi correo a@b.com");
    const second = assistantQuestionFingerprint("pk_test", "¿Cuánto dura? mi correo c@d.com");
    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });
});

describe("assistant knowledge backlog lifecycle", () => {
  it("accepts an evidence-backed administrative resolution without promoting it to knowledge", () => {
    expect(normalizeBacklogResolutionInput({
      id: "aq_test",
      resolved: true,
      note: "Confirmado contra manual físico del producto.",
      evidenceUrl: "https://example.com/manual.pdf",
    })).toEqual({
      id: "aq_test",
      resolved: true,
      note: "Confirmado contra manual físico del producto.",
      evidenceUrl: "https://example.com/manual.pdf",
    });
  });

  it("clears resolution metadata when a backlog item is reopened", () => {
    expect(normalizeBacklogResolutionInput({
      id: "aq_test",
      resolved: false,
      note: "Esta nota no debe conservarse como resolución.",
      evidenceUrl: "https://example.com/old-source",
    })).toEqual({
      id: "aq_test",
      resolved: false,
      note: null,
      evidenceUrl: null,
    });
  });

  it("rejects non-web evidence URLs", () => {
    expect(() => normalizeBacklogResolutionInput({
      id: "aq_test",
      resolved: true,
      evidenceUrl: "javascript:alert(1)",
    })).toThrow(/http o https/);
  });
});
