import { describe, expect, it } from "vitest";
import { assistantInstructionsForAudience, createAssistantRequest, sanitizeAssistantQuestion } from "./assistant";

describe("NEXO product assistant contract", () => {
  it("normaliza y limita preguntas", () => {
    expect(sanitizeAssistantQuestion("  ¿Cuánto   cuesta?  ")).toBe("¿Cuánto cuesta?");
    expect(sanitizeAssistantQuestion("x".repeat(700))).toHaveLength(500);
  });

  it("obliga a usar WooCommerce para precio y stock", () => {
    const instructions = assistantInstructionsForAudience("customer");
    expect(instructions).toContain("Precio, stock y disponibilidad");
    expect(instructions).toContain("woocommerce-live");
    expect(instructions).toContain("no uses precios históricos");
  });

  it("no permite convertir probable en confirmado", () => {
    const instructions = assistantInstructionsForAudience("gestora");
    expect(instructions).toContain("Nunca conviertas un dato probable en confirmado");
    expect(instructions).toContain("needsHumanConfirmation=true");
  });

  it("serializa solamente el contexto proyectado que recibe", () => {
    const context = {
      audience: "customer",
      summary: "Producto de prueba",
      commerce: { source: "woocommerce-live", price: "90" },
      rules: { internalEvidenceHidden: true },
    };
    const request = createAssistantRequest(context, "¿Qué precio tiene?", "customer");
    const parsed = JSON.parse(request.input) as { audience: string; question: string; context: Record<string, unknown> };
    expect(parsed.audience).toBe("customer");
    expect(parsed.question).toBe("¿Qué precio tiene?");
    expect(parsed.context).toEqual(context);
    expect(request.input).not.toContain("Fuente interna");
  });

  it("diferencia instrucciones de cliente y gestora", () => {
    expect(assistantInstructionsForAudience("customer")).toContain("conocimiento público autorizado");
    expect(assistantInstructionsForAudience("gestora")).toContain("argumentos de venta y objeciones");
  });
});
