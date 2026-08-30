import { describe, expect, it } from "vitest";
import { assistantCapability } from "./assistant-routing";

describe("assistantCapability", () => {
  it("envía preguntas sencillas de catálogo a Gemini", () => {
    expect(assistantCapability("¿Qué potencia tiene el panel solar y cuánto cuesta?")).toBe("fast_chat");
  });

  it("reserva razonamiento complejo para Terra", () => {
    expect(
      assistantCapability(
        "Compara los paneles teniendo en cuenta mi consumo, presupuesto y condiciones para decidir cuál me conviene.",
      ),
    ).toBe("complex_reasoning");
  });

  it("mantiene los adjuntos en una capacidad compatible", () => {
    expect(assistantCapability("Analiza esta imagen", true)).toBe("vision");
  });
});
