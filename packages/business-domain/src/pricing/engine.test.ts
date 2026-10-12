import { describe, expect, it } from "vitest";
import policyJson from "./config/casa-viva.v1.json";
import { quoteAtMarketPrice, quotePrice, resolveRules, roundPrice } from "./engine";
import type { PriceInput, PricingPolicy } from "./types";

// Casos reales de docs/nexo-business/motor-de-precios.md (11-oct) con las reglas de Lennys.
// Datos fijos de los ejemplos: gastos fijos 1,6 USD por unidad, imprevistos 1 %, variables 2,5 %.
const policy = policyJson as unknown as PricingPolicy;
const rates = { cup: 780, otherCup: { source: "nube", value: 775 } };

function tienda(productId: string, cost: number, extra: Partial<PriceInput> = {}): PriceInput {
  return { productId, profile: "tienda-casa-viva", cost: { amount: cost, currency: "USD", purchaseRate: 1 }, fixedCostShareUsd: 1.6, rates, ...extra };
}
function withLayers(layers: Partial<PricingPolicy["layers"]>): PricingPolicy {
  return { ...policy, layers: { category: {}, supplier: {}, product: {}, ...layers } };
}
const codes = (q: { guards: { code: string }[] }) => q.guards.map((g) => g.code);
const fixed = (value: number) => ({ mode: "fixed_usd" as const, value, skipGuard: true, source: "web-hoy" });

describe("reglas versionadas", () => {
  it("el archivo de reglas trae los tres perfiles y una versión", () => {
    expect(policy.version).toMatch(/^1\./);
    expect(Object.keys(policy.profiles).sort()).toEqual(["bolsa-bot", "nexo-bajo-pedido", "tienda-casa-viva"]);
  });
  it("redondeo: dólar entero hasta 100, de 5 en 5 hasta 500, de 10 en 10 después", () => {
    const r = policy.profiles["tienda-casa-viva"].rules.rounding;
    expect(roundPrice(r, 29.31)).toBe(30);
    expect(roundPrice(r, 27)).toBe(27);
    expect(roundPrice(r, 390.6)).toBe(395);
    expect(roundPrice(r, 512)).toBe(520);
  });
  it("sin costo no hay precio (D11)", () => {
    expect(() => quotePrice(policy, { productId: "x", profile: "tienda-casa-viva", cost: null })).toThrow(/D11/);
  });
});

describe("perfil tienda-casa-viva", () => {
  it("Royale: hoy 27 con 4 de comisión deja 2,53; la regla sugiere 28 con 3 de comisión", () => {
    const input = tienda("royale", 18);
    const hoy = quoteAtMarketPrice(policy, input, 27, fixed(4));
    expect(hoy.costs.totalUsd).toBe(19.8);
    expect(hoy.ownerProfitUsd).toBe(2.53);
    expect(hoy.priceCup).toBe(21100);
    expect(codes(hoy)).toContain("tasa-distinta");

    const q = quotePrice(policy, input);
    expect(q.suggestedUsd).toBe(28);
    expect(q.commissionUsd).toBe(3);
    expect(q.ownerProfitUsd).toBe(4.5);
    expect(q.priceCup).toBe(21900);
    expect(q.receipt.policyVersion).toBe(policy.version);
    expect(q.receipt.engineVersion).toBe("1.0.0");
    expect(q.receipt.layers).toEqual(["perfil:tienda-casa-viva"]);
  });

  it("Majestic King: la regla reproduce el precio de hoy (27, comisión 3, tienda 4,54)", () => {
    const q = quotePrice(policy, tienda("majestic-king", 17));
    expect(q.suggestedUsd).toBe(27);
    expect(q.commissionUsd).toBe(3);
    expect(q.ownerProfitUsd).toBe(4.54);
  });

  it("Majestic King con +10 % propio de la gestora: el recargo SUMA (3 + 2,70)", () => {
    const q = quoteAtMarketPrice(policy, tienda("majestic-king", 17, { gestoraMarkup: { mode: "pct", value: 10 } }), 27);
    expect(q.gestora.markupUsd).toBe(2.7);
    expect(q.gestora.totalUsd).toBe(5.7);
    expect(q.gestora.salePriceUsd).toBe(29.7);
    expect(q.ownerProfitUsd).toBe(4.54);
  });

  it("capas: categoría pisa al perfil y producto pisa a categoría", () => {
    const p = withLayers({ category: { "Habitación": { targetNetMarginPct: 20 } }, product: { mk: { targetNetMarginPct: 15 } } });
    const cat = quotePrice(p, tienda("otro", 17, { category: "Habitación" }));
    expect(cat.receipt.layers).toEqual(["perfil:tienda-casa-viva", "categoria:Habitación"]);
    expect(cat.suggestedUsd).toBe(30);
    const prod = quotePrice(p, tienda("mk", 17, { category: "Habitación" }));
    expect(prod.receipt.layers).toEqual(["perfil:tienda-casa-viva", "categoria:Habitación", "producto:mk"]);
    expect(prod.suggestedUsd).toBe(27);
  });

  it("consignación: margen más bajo (rotación antes que ganancia)", () => {
    const q = quotePrice(policy, tienda("majestic-king", 17, { consignment: true }));
    expect(q.receipt.layers).toContain("consignacion");
    expect(q.suggestedUsd).toBe(25);
    expect(q.rules.targetNetMarginPct).toBe(10);
  });

  it("Juego de ollas: hoy 50 con 7 deja 9,83; con la regla de Lennys a 50 la gestora cobra 6 (50 → 5–6)", () => {
    const input = tienda("ollas", 30);
    expect(quoteAtMarketPrice(policy, input, 50, fixed(7)).ownerProfitUsd).toBe(9.83);
    const mercado = quoteAtMarketPrice(policy, input, 50);
    expect(mercado.commissionUsd).toBe(6);
    expect(mercado.ownerProfitUsd).toBe(10.83);
    const q = quotePrice(policy, input);
    expect(q.suggestedUsd).toBe(45);
    expect(q.commissionUsd).toBe(5);
    expect(q.ownerProfitUsd).toBe(6.96);
  });

  it("Cortina roller: comisión fija de 7 por producto (capa producto)", () => {
    const p = withLayers({ product: { "cortina-roller": { commission: { mode: "fixed_usd", fixedUsd: 7 } } } });
    const input = tienda("cortina-roller", 35);
    const hoy = quoteAtMarketPrice(p, input, 55);
    expect(hoy.commissionUsd).toBe(7);
    expect(hoy.ownerProfitUsd).toBe(9.66);
    const q = quotePrice(p, input);
    expect(q.receipt.layers).toEqual(["perfil:tienda-casa-viva", "producto:cortina-roller"]);
    expect(q.suggestedUsd).toBe(54);
    expect(q.ownerProfitUsd).toBe(8.68);
  });

  it("Toallas Cisne Blanco: a 8 con costo 10 pierde dinero y avisa (¿paquete?)", () => {
    const input = tienda("toallas-cisne", 10);
    const hoy = quoteAtMarketPrice(policy, input, 8, fixed(2));
    expect(hoy.ownerProfitUsd).toBe(-5.92);
    expect(codes(hoy)).toEqual(expect.arrayContaining(["bajo-costo", "perdida-tras-comision", "posible-paquete", "bajo-suelo"]));
    const q = quotePrice(policy, input);
    expect(q.floorUsd).toBe(14);
    expect(q.suggestedUsd).toBe(17);
    expect(q.commissionUsd).toBe(2);
  });

  it("guardia de Lennys: si la tienda gana menos de 2,5, la comisión baja (nunca de 1)", () => {
    const q = quoteAtMarketPrice(policy, tienda("barato", 10), 16);
    expect(q.commissionBeforeGuardUsd).toBe(2);
    expect(q.commissionUsd).toBe(1);
    expect(q.ownerProfitUsd).toBe(2.88);
    expect(codes(q)).toContain("comision-reducida");
  });

  it("CUP en vez de USD: costo 140 y precio 10 se marca", () => {
    const q = quoteAtMarketPrice(policy, tienda("toalla-pequena", 140), 10, fixed(1));
    expect(codes(q)).toContain("posible-cup-como-usd");
  });

  it("costo en CUP con su tasa de compra se pasa a USD", () => {
    const q = quotePrice(policy, { ...tienda("cup", 0), cost: { amount: 7800, currency: "CUP", purchaseRate: 780 } });
    expect(q.costs.purchaseUsd).toBe(10);
  });

  it("tasa vieja (> 36 h) avisa", () => {
    const q = quotePrice(policy, tienda("x", 10, { rates: { cup: 780, updatedAt: "2026-10-09T00:00:00Z" }, now: "2026-10-11T12:00:00Z" }));
    expect(codes(q)).toContain("tasa-vieja");
  });

  it("gastos fijos desde las reglas y la tasa del día cuando no vienen en la entrada", () => {
    const rules = resolveRules(policy, tienda("x", 10)).rules;
    expect(rules.includeFixedCosts).toBe(true);
    const q = quotePrice(policy, { productId: "x", profile: "tienda-casa-viva", cost: { amount: 10, currency: "USD", purchaseRate: 1 }, rates: { cup: 780 } });
    expect(q.costs.fixedShareUsd).toBe(1.58);
  });
});

describe("perfil nexo-bajo-pedido (D43): aire split Parker, producto 1013", () => {
  // Datos de Ernesto (11-oct): proveedor 351 USD, precio en la web 380, transporte real T aún sin saber.
  const parker = (T: number, extra: Partial<PriceInput> = {}): PriceInput => ({
    productId: "1013", profile: "nexo-bajo-pedido", supplierId: "nexus",
    cost: { amount: 351, currency: "USD", purchaseRate: 1 }, freightUsd: T, rates, ...extra,
  });

  it.each([
    [0, 29, 11.6, 17.4, false],
    [5, 24, 9.6, 14.4, false],
    [15, 14, 5.6, 8.4, true],
  ])("T = %s: margen %s → gestora %s / NEXO %s", (T, margin, gestora, nexo, low) => {
    const q = quoteAtMarketPrice(policy, parker(T), 380);
    expect(q.marginUsd).toBe(margin);
    expect(q.commissionUsd).toBe(gestora);
    expect(q.ownerProfitUsd).toBe(nexo);
    expect(codes(q).includes("ganancia-minima-no-alcanzada")).toBe(low);
  });

  it("T = 30: margen negativo, la gestora no cobra y NEXO pierde", () => {
    const q = quoteAtMarketPrice(policy, parker(30), 380);
    expect(q.commissionUsd).toBe(0);
    expect(q.ownerProfitUsd).toBe(-1);
    expect(codes(q)).toContain("perdida-tras-comision");
    expect(codes(q)).toContain("bajo-suelo");
  });

  it("el recargo propio del gestor (8,84) cuenta dentro de su 40 %", () => {
    const q = quoteAtMarketPrice(policy, parker(0, { gestoraMarkup: { mode: "usd", value: 8.84 } }), 380);
    expect(q.commissionUsd).toBe(2.76);
    expect(q.gestora.totalUsd).toBe(11.6);
    expect(q.ownerProfitUsd).toBe(26.24);
  });

  it("hoy en la web: comisión fija de 10 → NEXO 19 antes del transporte; con T = 10 rompe el mínimo de 10", () => {
    expect(quoteAtMarketPrice(policy, parker(0), 380, fixed(10)).ownerProfitUsd).toBe(19);
    const t10 = quoteAtMarketPrice(policy, parker(10), 380, fixed(10));
    expect(t10.ownerProfitUsd).toBe(9);
    expect(codes(t10)).toContain("ganancia-minima-no-alcanzada");
  });

  it("precio sugerido: 351 + el mayor de 30 y 9 % (31,59) = 382,59 → 385; suelo 370", () => {
    const q = quotePrice(policy, parker(0));
    expect(q.rawPriceUsd).toBe(382.59);
    expect(q.suggestedUsd).toBe(385);
    expect(q.floorUsd).toBe(370);
    expect(q.ownerProfitUsd).toBe(20.4);
    expect(q.receipt.layers).toEqual(["perfil:nexo-bajo-pedido"]);
  });

  it("con transporte de 20 el sugerido sube a 405", () => {
    expect(quotePrice(policy, parker(20)).suggestedUsd).toBe(405);
  });
});

describe("perfil bolsa-bot (igual que VivaBot myPrice)", () => {
  const bolsa = (cost: number, size?: string): PriceInput => ({ productId: "b", profile: "bolsa-bot", cost: { amount: cost, currency: "USD", purchaseRate: 1 }, size, rates });
  it("pequeño +5, grande +10, mitad para el gestor", () => {
    const q = quotePrice(policy, bolsa(20, "pequeno"));
    expect(q.suggestedUsd).toBe(25);
    expect(q.commissionUsd).toBe(2.5);
    expect(q.ownerProfitUsd).toBe(2.5);
    expect(quotePrice(policy, bolsa(50, "grande")).suggestedUsd).toBe(60);
  });
  it("más de 300 USD: +5 %", () => {
    expect(quotePrice(policy, bolsa(400)).suggestedUsd).toBe(420);
  });
});
