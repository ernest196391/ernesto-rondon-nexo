// Caso piloto confirmado por Ernesto (2026-10-05): Olla Reina EON.
// Precio y existencias van a Core por la recepción (no son hechos de la ficha).
// Lo que no tiene evidencia queda "declared" (lo dice el anuncio/proveedor) o
// "pending" sin valor. Nada se completa por suposición.

export const OLLA_REINA_EON = {
  intake: {
    kind: "new",
    product: { name: "Olla Reina EON", category: "Cocina", prices: { USD: 6500 } },
    lines: [{ label: null, quantity: 10 }], // disponibilidad declarada: 10 unidades
  },
  facts: [
    { key: "capacity", label: "Capacidad", kind: "feature", value: "4", unit: "L", status: "declared", source: "Anuncio del producto (sin manual)" },
    { key: "power", label: "Potencia", kind: "feature", value: "800", unit: "W", status: "declared", source: "Anuncio del producto (sin manual)" },
    { key: "voltage", label: "Voltaje", kind: "feature", value: "120", unit: "V", status: "declared", source: "Anuncio del producto (sin manual)" },
    { key: "warranty", label: "Garantía", kind: "warranty", value: "6", unit: "meses", status: "declared", source: "Política de Casa Viva (confirmada por Ernesto)" },
    { key: "spare_gasket", label: "Junta de repuesto incluida", kind: "included", value: "Sí", status: "declared", source: "Confirmado por Ernesto" },
    { key: "free_shipping_havana", label: "Envío gratis en La Habana", kind: "offer", value: "Sí", status: "declared", source: "Condición de Casa Viva (confirmada por Ernesto)" },
    { key: "manual", label: "Manual del fabricante", kind: "documentation", value: "No disponible", status: "declared", source: "Confirmado por Ernesto" },
    { key: "manufacturer_model", label: "Fabricante y modelo exacto", kind: "documentation", status: "pending", source: "Búsqueda web 2026-10-05",
      note: "No se encontró documentación de un modelo «EON». «Reina» es un nombre genérico en Cuba para ollas de presión eléctricas de varias marcas: lo encontrado es información de categoría, no de este producto. Siguiente paso: foto de la placa de características y de la caja.",
      evidence: [
        { url: "https://tienda.centralamericacargo.com/en/product/royal-4l-reina-pressure-cooker", title: "Royal REPC40E 4 L (otra marca)", conclusion: "Categoría: 4 L 800 W existe en otras marcas. No prueba nada de la EON." },
        { url: "https://elyerromenu.com/b/venta-de-equipos-electrodomesticos-y-mas/product/olla-reina-de-presion-electrica-marca-sanumo", title: "Sanumo «Reina» 4 L", conclusion: "Categoría: otra marca con el mismo nombre comercial." },
      ] },
    { key: "cooking_times", label: "Tiempos de cocción reales", kind: "usage", status: "pending", source: "Pendiente de prueba en tienda" },
    { key: "energy_use", label: "Consumo real (kWh por cocción)", kind: "usage", status: "pending", source: "Pendiente de prueba con medidor" },
  ],
};
