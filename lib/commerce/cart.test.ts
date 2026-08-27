import { describe, expect, it } from "vitest";
import { formatMoney, itemCount, optimisticQuantity, optimisticRemove, productCountLabel, type Cart } from "./cart";

const money = { currency_code: "USD", currency_symbol: "$", currency_minor_unit: 2 };
const cart: Cart = {
  items: [
    { key: "gwell", id: 1017, name: "GWELL GF-8816", quantity: 1, images: [], prices: { ...money, price: "9000" }, totals: { ...money, line_total: "9000" }, quantity_limits: { minimum: 1, maximum: 5, multiple_of: 1 } },
    { key: "fridge", id: 1023, name: "Refrigerador", quantity: 1, images: [], prices: { ...money, price: "87900" }, totals: { ...money, line_total: "87900" } },
  ],
  totals: { ...money, total_items: "96900", total_price: "96900" },
};

describe("commerce cart totals", () => {
  it("formats canonical minor units without an ambiguous symbol", () => expect(formatMoney("87900", money)).toBe("879 USD"));
  it("counts quantities and pluralizes products", () => {
    expect(itemCount(cart)).toBe(2);
    expect(productCountLabel(1)).toBe("1 producto");
    expect(productCountLabel(2)).toBe("2 productos");
  });
  it("updates quantity, line subtotal and global total together", () => {
    const next = optimisticQuantity(cart, "gwell", 2);
    expect(next.items[0].quantity).toBe(2);
    expect(next.items[0].totals.line_total).toBe("18000");
    expect(next.totals.total_price).toBe("105900");
  });
  it("removes a line and reaches a consistent empty cart", () => {
    const one = optimisticRemove(cart, "fridge");
    const empty = optimisticRemove(one, "gwell");
    expect(one.totals.total_price).toBe("9000");
    expect(empty.items).toHaveLength(0);
    expect(empty.totals.total_price).toBe("0");
  });
  it("does not mutate the previous server snapshot", () => {
    optimisticQuantity(cart, "gwell", 3);
    expect(cart.items[0].quantity).toBe(1);
    expect(cart.totals.total_price).toBe("96900");
  });
});
