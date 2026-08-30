import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("contrato de textos comerciales", () => {
  it("mantiene una jerarquía editorial sin el encabezado redundante anterior", () => {
    const page = readFileSync("app/producto/[id]/page.tsx", "utf8");
    expect(page).toContain("Características principales");
    expect(page).not.toContain("Lo más importante");
  });

  it("deja el pie de página reducido a marca y lema", () => {
    const footer = readFileSync("app/CommerceFooter.tsx", "utf8");
    expect(footer).toContain("Más cerca de ti.");
    expect(footer).not.toMatch(/Comprar|Explorar|WhatsApp/);
  });

  it("no vuelve a mostrar tutoriales largos de permisos", () => {
    const assistant = readFileSync("app/GlobalCommerceAssistant.tsx", "utf8");
    const checkout = readFileSync("app/checkout/CheckoutClient.tsx", "utf8");
    expect(`${assistant}\n${checkout}`).not.toMatch(/Cómo activarlo|En Chrome|Configuración del sitio/);
    expect(assistant).toContain("Puedes escribir o adjuntar un audio");
  });
});
