import { afterEach, describe, expect, it } from "vitest";
import {
  isNexoCatalogProduct,
  isPubliclyPurchasable,
  storefrontProducts,
} from "./storefront";

afterEach(() => {
  delete process.env.NEXO_CATALOG_SCOPE;
});

describe("frontera pública NEXO", () => {
  it("con alcance 'nexo' incluye solo productos marcados para NEXO", () => {
    expect(isNexoCatalogProduct({ sku: "NEXO-GF-8816", status: "publish" }, "nexo")).toBe(true);
    expect(isNexoCatalogProduct({ sku: "CV-OTRO", status: "publish" }, "nexo")).toBe(false);
  });
  it("por defecto muestra todo lo publicado del comercio conectado", () => {
    expect(isNexoCatalogProduct({ sku: "BC-120698", status: "publish" })).toBe(true);
    expect(isNexoCatalogProduct({ sku: "BC-1", status: "draft" })).toBe(false);
  });
  it("NEXO_CATALOG_SCOPE=nexo vuelve al filtro NEXO", () => {
    process.env.NEXO_CATALOG_SCOPE = "nexo";
    expect(
      storefrontProducts([
        { sku: "NEXO-A", stock_status: "instock", price: "10" },
        { sku: "CV-B", stock_status: "instock", price: "10" },
      ]),
    ).toHaveLength(1);
  });
  it("excluye agotados y productos sin precio", () => {
    expect(
      isPubliclyPurchasable({ sku: "NEXO-BERA", status: "publish", stock_status: "outofstock", price: "" }),
    ).toBe(false);
    expect(
      storefrontProducts([
        { sku: "BC-A", stock_status: "instock", price: "10" },
        { sku: "BC-B", stock_status: "outofstock", price: "10" },
        { sku: "BC-C", stock_status: "instock", price: "" },
      ]),
    ).toHaveLength(1);
  });
});
