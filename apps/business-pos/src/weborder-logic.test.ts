// Caja 1.1.1 (Lennys 21-oct): tasa del pedido, «Cambiar tasa», buscador y código de alta.
import { describe, expect, it } from "vitest";
import { METHODS, settle, type Rate, type Row } from "./checkout";
import { chargeNote, looksLikeEnrollCode, matchesOrder, orderRates, parseRate, rateLine, rateOverrides, searchOrders, transferFrom } from "./weborder-logic";

/** Tasas de HOY en la caja (distintas a las del pedido a propósito). */
const today = (): Map<string, Rate> => new Map([["CUP", { currency: "CUP", perUsd: "830", setAt: "2026-10-21T12:00:00Z" }]]);
const withOverrides = (o: Record<string, string>) => {
  const rates = today();
  for (const [currency, perUsd] of Object.entries(o)) rates.set(currency, { currency, perUsd, setAt: "" });
  return rates;
};
const def = (key: string) => METHODS.find(m => m.key === key)!;
const row = (key: string, amount: number): Row => ({ id: key, def: def(key), amountMinor: Math.round(amount * 100), provider: "", ref: "1234", accountId: "" });

describe("tasa del pedido (se cobra como estaba el día del vale)", () => {
  const order4243 = { cupRate: 810, cupTransferRate: 972, cupRateDay: "18-oct", payment: { kind: "cash_usd", currency: "USD", factor: null } };

  it("usa cupRate y cupTransferRate del pedido, nunca la de hoy", () => {
    expect(orderRates(order4243)).toEqual({ cash: 810, transfer: 972, day: "18-oct" });
    expect(rateOverrides(orderRates(order4243))).toEqual({ CUP: "810", CUP_TRANSFER: "972" });
    expect(rateLine(orderRates(order4243)!)).toBe("Tasa del pedido: 810 (18-oct) · transferencia 972");
  });

  it("sin cupTransferRate: transferencia = tasa × (1 + %) al entero", () => {
    expect(orderRates({ cupRate: 815, cupRateDay: "20-oct" }, 20)).toEqual({ cash: 815, transfer: 978, day: "20-oct" });
    expect(transferFrom(810, 20)).toBe(972);
  });

  it("web vieja sin cupRate: el factor del vale en CUP; sin nada → null (tasa de hoy)", () => {
    expect(orderRates({ payment: { kind: "cash_cup", currency: "CUP", factor: 790 } })).toEqual({ cash: 790, transfer: 948, day: "" });
    expect(orderRates({ payment: { kind: "transfer_cup", currency: "CUP", factor: 960 } })).toEqual({ cash: 800, transfer: 960, day: "" });
    expect(orderRates({ payment: { kind: "cash_usd", currency: "USD", factor: null } })).toBeNull();
    expect(rateOverrides(null)).toEqual({});
  });

  it("#4243: 35 USD en efectivo CUP a 810 = 28.350 CUP y cuadra (con la de hoy, 830, sobraría)", () => {
    const s = settle([row("cash-cup", 28350)], 3500, withOverrides(rateOverrides(orderRates(order4243))));
    expect(s.remaining).toBe(0);
    expect(s.payments[0]).toMatchObject({ currency: "CUP", amountMinor: 2835000, usdMinor: 3500, exchangeRate: "810" });
  });

  it("#4243 real: mixto 20 USD + 12.150 CUP efectivo (15 USD × 810) cierra sin «falta»", () => {
    const s = settle([row("cash-usd", 20), row("cash-cup", 12150)], 3500, withOverrides(rateOverrides(orderRates(order4243))));
    expect(s.remaining).toBe(0);
    expect(s.changeMinor).toBe(0);
    expect(s.payments.map(p => [p.currency, p.amountMinor, p.usdMinor])).toEqual([["USD", 2000, 2000], ["CUP", 1215000, 1500]]);
    // Con la tasa de hoy (830) faltarían 36 centavos: el error que vio Lennys.
    expect(settle([row("cash-usd", 20), row("cash-cup", 12150)], 3500, today()).remaining).toBe(36);
  });

  it("transferencia CUP del pedido usa su tasa de transferencia (35 × 972 = 34.020 CUP)", () => {
    const s = settle([row("transfer-cup", 34020)], 3500, withOverrides(rateOverrides(orderRates(order4243))));
    expect(s.remaining).toBe(0);
    expect(s.payments[0]).toMatchObject({ method: "transfer", currency: "CUP", usdMinor: 3500, exchangeRate: "972" });
  });

  it("venta normal sin tasa de transferencia propia: la transferencia sigue con la CUP de hoy", () => {
    const s = settle([row("transfer-cup", 8300)], 1000, today());
    expect(s.remaining).toBe(0);
    expect(s.payments[0].exchangeRate).toBe("830");
  });

  it("«Cambiar tasa»: valida la tasa y deja la nota con el motivo", () => {
    expect(parseRate("850")).toBe(850);
    expect(parseRate("850,5")).toBe(850.5);
    expect(parseRate("8")).toBeNull();
    expect(parseRate("abc")).toBeNull();
    const order = orderRates(order4243);
    expect(chargeNote(order, order)).toBe("Tasa del pedido: 810 (18-oct), transferencia 972.");
    expect(chargeNote(order, { cash: 850, transfer: 1020, day: "" }, "Lennys autorizó"))
      .toBe("Tasa cambiada en la caja: 850 (transferencia 1020) en vez de 810 del 18-oct. Motivo: Lennys autorizó");
    expect(chargeNote(null, null)).toBe("");
  });
});

describe("buscador de «Cobrar pedido web» (Lennys 20-oct)", () => {
  const orders = [
    { number: "4243", customer: "María José Pérez", phone: "+5352345678" },
    { number: "4925", customer: "Daniel Ruiz", phone: "53 5 811 2233" },
    { number: "4953", customer: "Tienda", phone: "" },
  ];
  it("por #número, nombre sin tildes (cualquier palabra) o teléfono", () => {
    expect(searchOrders(orders, "#4243").map(o => o.number)).toEqual(["4243"]);
    expect(searchOrders(orders, "49").map(o => o.number)).toEqual(["4925", "4953"]);
    expect(searchOrders(orders, "maria perez").map(o => o.number)).toEqual(["4243"]);
    expect(searchOrders(orders, "RUIZ").map(o => o.number)).toEqual(["4925"]);
    expect(searchOrders(orders, "8112233").map(o => o.number)).toEqual(["4925"]);
    expect(searchOrders(orders, "  ").length).toBe(3);
    expect(matchesOrder(orders[0], "pedro")).toBe(false);
  });
});

describe("código de alta escrito en «Clave del dispositivo» (Lennys 21-oct)", () => {
  it("6–7 letras o cifras es un código; una clave larga no", () => {
    expect(looksLikeEnrollCode("k7m2qx")).toBe("K7M2QX");
    expect(looksLikeEnrollCode(" K7M-2QX ")).toBe("K7M2QX");
    expect(looksLikeEnrollCode("ABC12")).toBeNull();
    expect(looksLikeEnrollCode("a".repeat(40))).toBeNull();
  });
});
