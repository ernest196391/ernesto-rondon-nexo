import { describe, expect, it } from "vitest";
import { filterSelectedProducts } from "./storefront";

const catalog = [{ id: 1, name: "Uno" }, { id: 2, name: "Dos" }, { id: 3, name: "Tres" }];

describe("selección de productos de la tienda gestora", () => {
  it("no publica ningún producto cuando la selección está vacía", () => {
    expect(filterSelectedProducts(catalog, [])).toEqual([]);
  });
  it("publica únicamente los productos seleccionados", () => {
    expect(filterSelectedProducts(catalog, [2])).toEqual([{ id: 2, name: "Dos" }]);
  });
});
