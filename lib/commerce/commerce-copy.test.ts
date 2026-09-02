import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("contrato de textos comerciales", () => {
  it("mantiene una jerarquía editorial sin el encabezado redundante anterior", () => {
    const page = readFileSync("app/producto/[id]/page.tsx", "utf8");
    expect(page).toContain("Características principales");
    expect(page).not.toContain("Lo más importante");
  });

  it("deja el pie de página reducido a la marca", () => {
    const footer = readFileSync("app/CommerceFooter.tsx", "utf8");
    expect(footer).not.toMatch(/Más cerca de ti|Comprar|Explorar|WhatsApp/);
  });

  it("mantiene una portada móvil centrada en la necesidad y sin bloques repetidos", () => {
    const home = readFileSync("app/page.tsx", "utf8");
    const marketplace = readFileSync("app/marketplace/MarketplaceClient.tsx", "utf8");
    expect(home).toContain('dynamic = "force-dynamic"');
    expect(marketplace).toContain("¿Qué quieres hoy?");
    expect(marketplace).toContain("Busca un producto");
    expect(marketplace).toContain("Vender");
    expect(marketplace.match(/<h1/g)).toHaveLength(1);
    expect(marketplace).not.toMatch(/Buscar en NEXO|Elige dónde recibir|Más cerca de ti|campaigns|trust-strip/);
  });

  it("no vuelve a mostrar tutoriales largos de permisos", () => {
    const assistant = readFileSync("app/GlobalCommerceAssistant.tsx", "utf8");
    const checkout = readFileSync("app/checkout/CheckoutClient.tsx", "utf8");
    expect(`${assistant}\n${checkout}`).not.toMatch(/Cómo activarlo|En Chrome|Configuración del sitio/);
    expect(assistant).toContain("intentarlo nuevamente o adjuntar un audio");
  });
});
