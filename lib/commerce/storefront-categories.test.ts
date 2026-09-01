import { describe, expect, it } from "vitest";
import { familyForProduct, STOREFRONT_CATEGORIES } from "./storefront-categories";

describe("familias públicas", () => {
  it("mantiene las familias públicas ordenadas", () => {
    expect(STOREFRONT_CATEGORIES.filter((family) => family.enabled).map((family) => family.id)).toEqual(["electrodomesticos", "cocina", "habitacion", "energia", "tecnologia", "muebles", "otros"]);
  });
  it("mapea categorías técnicas sin duplicados", () => {
    expect(familyForProduct({ categories: [{ id: 1, name: "Colchones" }] }).id).toBe("habitacion");
    expect(familyForProduct({ categories: [{ id: 2, name: "Energía solar" }] }).id).toBe("energia");
    expect(familyForProduct({ categories: [{ id: 3, name: "Televisores" }] }).id).toBe("tecnologia");
    expect(familyForProduct({ categories: [{ id: 4, name: "Televisión digital" }] }).id).toBe("tecnologia");
    expect(familyForProduct({ categories: [{ id: 5, name: "Butacas" }] }).id).toBe("muebles");
  });
});
