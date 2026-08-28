import { describe, expect, it } from "vitest";
import {
  isNexoCatalogProduct,
  isPubliclyPurchasable,
  storefrontProducts,
} from "./storefront";

describe("frontera pública NEXO", () => {
  it("incluye solo productos marcados para NEXO", () => {
    expect(
      isNexoCatalogProduct({ sku: "NEXO-GF-8816", status: "publish" }),
    ).toBe(true);
    expect(isNexoCatalogProduct({ sku: "CV-OTRO", status: "publish" })).toBe(
      false,
    );
  });
  it("excluye agotados y productos sin precio", () => {
    expect(
      isPubliclyPurchasable({
        sku: "NEXO-BERA",
        status: "publish",
        stock_status: "outofstock",
        price: "",
      }),
    ).toBe(false);
    expect(
      storefrontProducts([
        { sku: "NEXO-A", stock_status: "instock", price: "10" },
        { sku: "CV-B", stock_status: "instock", price: "10" },
      ]),
    ).toHaveLength(1);
  });
});
