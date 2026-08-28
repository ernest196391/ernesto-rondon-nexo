import { describe, expect, it } from "vitest";
import { assistantQuestionFingerprint, redactAssistantQuestion } from "./assistant-learning";

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
