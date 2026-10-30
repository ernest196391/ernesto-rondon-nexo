import { describe, expect, it } from "vitest";
import { sortOptions, stockInfo } from "./variants";

describe("opciones de un producto (Caja 1.1.3)", () => {
  it("todas dicen cuánto queda, con el mismo formato", () => {
    expect(stockInfo({ quantity: 5, lowAt: 2 }).text).toBe("Quedan 5");
    expect(stockInfo({ quantity: 1, lowAt: 2 })).toMatchObject({ text: "Quedan 1", tone: "low" });
    expect(stockInfo({ quantity: 0, lowAt: 2 }).text).toBe("Agotado");
    expect(stockInfo({ quantity: -1, lowAt: 2 }).text).toBe("Agotado");
    expect(stockInfo(undefined).text).toBe("Sin dato");
  });
  it("las agotadas y sin dato van al final", () => {
    const stock: Record<string, { quantity: number; lowAt: number } | undefined> = {
      azul: { quantity: 0, lowAt: 2 }, blanco: { quantity: 1, lowAt: 2 }, gris: undefined, rosado: { quantity: 2, lowAt: 2 }, aqua: { quantity: 9, lowAt: 2 },
    };
    const names = sortOptions(Object.keys(stock), n => n, n => stock[n]);
    expect(names).toEqual(["aqua", "blanco", "rosado", "azul", "gris"]);
  });
});
