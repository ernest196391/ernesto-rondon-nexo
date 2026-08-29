import { describe, expect, it } from "vitest";
import { familyForProduct, STOREFRONT_CATEGORIES } from "./storefront-categories";

describe("familias públicas", () => {
  it("mantiene exactamente cinco familias ordenadas", () => {
    expect(STOREFRONT_CATEGORIES.filter((family) => family.enabled).map((family) => family.id)).toEqual(["electrodomesticos", "cocina", "habitacion", "energia", "otros"]);
  });
  it("mapea categorías técnicas sin duplicados", () => {
    expect(familyForProduct({ categories: [{ id: 1, name: "Colchones" }] }).id).toBe("habitacion");
    expect(familyForProduct({ categories: [{ id: 2, name: "Energía solar" }] }).id).toBe("energia");
    expect(familyForProduct({ categories: [{ id: 3, name: "Televisores" }] }).id).toBe("otros");
  });
});
