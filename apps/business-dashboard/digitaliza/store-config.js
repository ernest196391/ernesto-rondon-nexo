// Configuración por tienda de "Digitaliza tus productos". Una tienda nueva de
// NEXO = una entrada más aquí (luego vendrá de Core). Nada de lógica.

/** @typedef {{ code: string, label: string }} Currency */

export const STORES = {
  "casa-viva": {
    businessId: "casa-viva",
    name: "Casa Viva",
    theme: "casaviva",
    /** @type {Currency[]} */
    currencies: [{ code: "USD", label: "USD" }, { code: "CUP", label: "CUP" }],
    defaultCurrency: "USD",
    // Lo que la tienda no quiere en su contenido (bloque 2 en adelante).
    voice: { tone: "discreta, útil, sin grandilocuencia", forbid: ["descuentos inventados", "escasez", "garantías no escritas", "testimonios no autorizados"] },
    // Canales previstos; en este bloque solo se guardan en Core.
    channels: ["web", "gestoras", "instagram", "facebook", "revolico", "whatsapp-estados"],
    webBase: "https://casaviva.company",
    // De dónde salen hoy las existencias de los productos importados.
    externalStockSource: "BizneCubano",
  },
};

export function storeConfig(businessId) {
  return STORES[businessId] ?? null;
}
