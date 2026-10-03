import { describe, expect, it } from "vitest";
import { countAdjustment, stockByLocation, transferMovements } from "./location-inventory";

describe("location inventory", () => {
  it("derives stock per location and assigns legacy movements to the default", () => {
    const stock = stockByLocation(
      [
        { productId: "p1", quantityDelta: -2 },
        { productId: "p1", locationId: "wh", quantityDelta: 10 },
        ...transferMovements({ productId: "p1", fromLocationId: "wh", toLocationId: "store", quantity: 4, availableAtSource: 10 }),
      ],
      "store",
    );
    expect(stock.get("store|p1")).toBe(2);
    expect(stock.get("wh|p1")).toBe(6);
  });

  it("rejects invalid transfers", () => {
    const base = { productId: "p1", fromLocationId: "wh", toLocationId: "store", quantity: 4, availableAtSource: 3 };
    expect(() => transferMovements(base)).toThrow("source stock");
    expect(() => transferMovements({ ...base, toLocationId: "wh", availableAtSource: 9 })).toThrow("differ");
    expect(() => transferMovements({ ...base, quantity: 0, availableAtSource: 9 })).toThrow("positive");
  });

  it("reconciles a count with its difference", () => {
    expect(countAdjustment(5, 2)).toBe(-3);
    expect(countAdjustment(0, 10)).toBe(10);
    expect(() => countAdjustment(0, -1)).toThrow();
  });
});
