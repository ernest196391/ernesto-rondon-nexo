import { describe, expect, it } from "vitest";
import { buildOrderWhatsappMessage } from "./order-whatsapp";

const base = {
  orderNumber: "1040",
  lines: [{ quantity: 1, name: "GWELL GF-8816", subtotal: "90 USD" }],
  productsTotal: "90 USD",
  shipping: "3.500 CUP",
  fullName: "Cliente Prueba",
  phone: "+53 50000000",
  pickup: { name: "NEXO", address: "Nuevo Vedado, La Habana" },
};

describe("vale WhatsApp NEXO", () => {
  it("genera entrega con la ubicación canónica y omite vacíos", () => {
    const message = buildOrderWhatsappMessage({
      ...base,
      mode: "delivery",
      municipality: "Boyeros",
      locality: "Santiago de las Vegas",
      address: "Calle 1 #2",
      latitude: "23.01",
      longitude: "-82.40",
    });
    expect(message).toContain("NEXO · PEDIDO #1040");
    expect(message).toContain("Mensajería: 3.500 CUP");
    expect(message).toContain("https://www.google.com/maps/search/?api=1&query=23.01,-82.40");
    expect(message).not.toContain("Alternativo:");
    expect(message).not.toContain("disponibilidad");
    expect(message).toContain("✅ Pedido registrado en NEXO.");
    expect(message).toContain("🚚 Escríbenos");
  });

  it("genera recogida sin dirección del cliente ni mensajería", () => {
    const message = buildOrderWhatsappMessage({ ...base, mode: "pickup" });
    expect(message).toContain("Recogida: Sin costo");
    expect(message).toContain("Punto: NEXO");
    expect(message).not.toContain("Mensajería:");
    expect(message).not.toContain("Municipio:");
  });
});
