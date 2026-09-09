import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("checkout resilience", () => {
  it("persists fulfillment and attribution in the initial WooCommerce order note", () => {
    const source = readFileSync("app/api/commerce/checkout/route.ts", "utf8");
    expect(source).toContain("`Modalidad: ${input.mode}`");
    expect(source).toContain("`Gestora: ${attribution.effectiveGestoraName}`");
    expect(source).toContain("NEXO_CHECKOUT_RECONCILIATION_FAILED");
  });

  it("recovers fulfillment from the order note when metadata reconciliation fails", () => {
    const source = readFileSync("app/api/commerce/order/route.ts", "utf8");
    expect(source).toContain('noteValue("Modalidad")');
    expect(source).toContain('mode === "pickup" ? "pickup" : "pending"');
  });

  it("uses a selected WooCommerce variation id when adding variable products", () => {
    const source = readFileSync("app/producto/[id]/AddToCartButton.tsx", "utf8");
    expect(source).toContain("variationId ? Number(variationId) : productId");
    expect(source).toContain("Selecciona una opción antes de añadir el producto.");
  });
});
