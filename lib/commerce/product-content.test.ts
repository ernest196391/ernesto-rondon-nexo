import { describe, expect, it } from "vitest";
import { productContentFor, validateProductCopyForPublication } from "./product-content";

describe("contenido público de producto", () => {
  it("recupera descripción, beneficios y especificaciones desde WooCommerce", () => {
    const content = productContentFor({
      name: "Butaca",
      short_description: "<p>Butaca individual tapizada y compacta.</p>",
      description: "<p>Diseñada para completar una sala.</p><h2>Beneficios</h2><ul><li>Formato compacto para espacios pequeños</li></ul><h2>Especificaciones</h2><ul><li><strong>Tipo:</strong> Butaca individual</li><li><strong>Entrega:</strong> Tarifa de Mensajería #2</li></ul>",
    });
    expect(content.descriptionHtml).toContain("Diseñada");
    expect(content.keyBenefits).toHaveLength(1);
    expect(content.specifications).toEqual([
      { label: "Tipo", value: "Butaca individual" },
      { label: "Entrega", value: "Tarifa de Mensajería #2" },
    ]);
  });

  it("usa atributos técnicos cuando la descripción no contiene lista de especificaciones", () => {
    const content = productContentFor({
      name: "Sofá",
      short_description: "<p>Sofá tapizado.</p>",
      description: "<p>Sofá para sala.</p>",
      attributes: [{ name: "Plazas", options: ["3"] }],
    });
    expect(content.specifications).toEqual([{ label: "Plazas", value: "3" }]);
  });

  it("rechaza una ficha sin contenido editorial suficiente", () => {
    expect(validateProductCopyForPublication({
      title: "Butaca",
      shortDescription: "",
      description: "",
      benefits: [],
      specifications: [],
    })).toEqual(expect.arrayContaining([
      "Falta una descripción breve completa.",
      "Falta una descripción detallada.",
      "Faltan beneficios.",
      "Faltan especificaciones.",
    ]));
  });
});
