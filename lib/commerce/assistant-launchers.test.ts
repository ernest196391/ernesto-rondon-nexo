import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("lanzadores móviles del asistente", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const component = readFileSync("app/GlobalCommerceAssistant.tsx", "utf8");

  it("solo oculta IA y WhatsApp mientras el diálogo está abierto", () => {
    expect(component).toContain('open?" assistant-open":""');
    expect(css).toContain(".global-assistant.assistant-open>.global-assistant-trigger");
    expect(css).toContain(".global-assistant.assistant-open>.global-whatsapp-trigger{visibility:hidden;pointer-events:none}");
    expect(css).not.toMatch(/@media\(max-width:700px\)[^}]*\.global-assistant-trigger,\.global-whatsapp-trigger\{visibility:hidden\}/);
  });
});
