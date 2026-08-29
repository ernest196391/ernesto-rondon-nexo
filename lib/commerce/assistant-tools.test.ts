import { describe, expect, it } from "vitest";
import { publicProduct, searchProducts } from "./assistant-tools";

const fan = { id: 27, name: "Ventilador solar Royal", sku: "ROYAL-1", price: "78.00", stock_status: "instock", catalog_visibility: "visible", images: [{ src: "https://img.test/fan.jpg" }], categories: [{ id: 2, name: "Ventiladores" }] };
describe("herramientas públicas del asistente", () => {
  it("construye URL canónica y conserva atribución", () => {
    expect(publicProduct(fan, "https://nexotienda.casavivadecuba.com", "gestora-1").productUrl).toBe("https://nexotienda.casavivadecuba.com/producto/27?ref=gestora-1");
  });
  it("busca solo productos comprables y limita recomendaciones", () => {
    const result = searchProducts([fan, { ...fan, id: 28, stock_status: "outofstock" }], "ventilador para apagones", "https://nexotienda.casavivadecuba.com");
    expect(result).toHaveLength(1);
    expect(result[0].imageUrl).toBe("https://img.test/fan.jpg");
  });
});
