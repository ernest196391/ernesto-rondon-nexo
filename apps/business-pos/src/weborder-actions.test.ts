// «Pedido web: cancelar o devolver» (31-oct): el caso de la olla Ariete en la caja.
import { describe, expect, it } from "vitest";
import { amountMinor, buildRefunds, confirmText, friendly, parseOrderNumber, productsText, validateAction, type ActionOrder } from "./weborder-actions-logic";

const olla: ActionOrder = {
  id: 5612, number: "5612", date: "2026-10-28T15:00:00-04:00", status: "completed", statusLabel: "Entregado y cobrado",
  customer: "Clienta", gestora: "Oliuska", totalUsd: 62, charged: { method: "cash_usd", usd: 62, cup: 0, at: "" },
  products: [{ itemId: 701, name: "Olla de presión eléctrica Ariete digital", qty: 1, totalUsd: 62, sku: "CV-OLLA" }],
  can: "return", why: "", cancelReason: "", returnInfo: null, test: false,
};

describe("pedido web: cancelar o devolver", () => {
  it("lee el número como viene en el vale", () => {
    expect(parseOrderNumber("#5612")).toBe("5612");
    expect(parseOrderNumber(" CV-PEDIDO-5612 ")).toBe("5612");
    expect(parseOrderNumber("olla")).toBe("");
  });

  it("la olla: 62 USD en efectivo, una línea, con causa", () => {
    const refunds = buildRefunds("62", "cash", "", "");
    expect(refunds).toEqual([{ method: "cash", currency: "USD", amountMinor: 6200 }]);
    const lines = [{ itemId: 701, name: olla.products[0].name, qty: 1 }];
    expect(validateAction("return", "La olla no calienta", lines, olla)).toBe("");
    const text = confirmText("return", olla, "La olla no calienta", lines, refunds as never);
    expect(text).toContain("#5612");
    expect(text).toContain("1× Olla de presión eléctrica Ariete digital");
    expect(text).toContain("62 USD en efectivo (sale del cajón)");
    expect(text).toContain("Causa: La olla no calienta");
    expect(productsText(lines)).toBe("1× Olla de presión eléctrica Ariete digital");
  });

  it("frenos: sin causa, sin producto, más unidades, dinero mal escrito o sin forma", () => {
    const lines = [{ itemId: 701, name: "Olla", qty: 1 }];
    expect(validateAction("return", "  ", lines, olla)).toMatch(/causa/);
    expect(validateAction("cancel", "no", [], olla)).toMatch(/por qué/);
    expect(validateAction("return", "rota", [{ ...lines[0], qty: 0 }], olla)).toMatch(/qué producto/);
    expect(validateAction("return", "rota", [{ ...lines[0], qty: 2 }], olla)).toMatch(/tiene 1/);
    expect(buildRefunds("-5", "cash", "", "")).toMatch(/mal escrito/);
    expect(buildRefunds("62", "", "", "")).toMatch(/efectivo o por transferencia/);
    expect(buildRefunds("", "", "12000", "transfer")).toEqual([{ method: "transfer", currency: "CUP", amountMinor: 1200000 }]);
    expect(amountMinor("62,5")).toBe(6250);
  });

  it("errores de la web en palabras de la tienda; sin red queda en la cola", () => {
    expect(friendly({ status: 409, code: "refused", message: "Este pedido ya tiene una devolución registrada." })).toEqual({ text: "Este pedido ya tiene una devolución registrada.", final: true });
    expect(friendly({ message: "Failed to fetch" })).toEqual({ text: "Sin conexión: quedó guardado y se envía solo al volver la red.", final: false });
    expect(friendly({ status: 502, code: "core", message: "" }).final).toBe(false);
  });
});
