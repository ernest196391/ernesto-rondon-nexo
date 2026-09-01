const localCatalogImages: Record<string, string> = {
  "NEXO-BOVIET-BVM8611M-620": "/catalog/owner/boviet-620w.webp?v=001k",
  "NEXO-ROYAL-REG202V": "/catalog/owner/royal-reg202v.webp?v=001k",
  "NEXO-KONFORT-120X190": "/catalog/owner/konfort-canonical-001l.webp?v=001l",
  "NEXO-KONFORT-135X190": "/catalog/owner/konfort-canonical-001l.webp?v=001l",
  "NEXO-SUMRY-4000W-24V": "https://casavivadecuba.com/wp-content/uploads/2026/09/sumry-4000w-1.webp",
  "NEXO-BLUETTI-ELITE100-V2": "https://casavivadecuba.com/wp-content/uploads/2026/09/bluetti-elite-100-v2-1.webp",
  "NEXO-ECOFLOW-DELTA3-ULTRA": "https://casavivadecuba.com/wp-content/uploads/2026/09/ecoflow-delta-3-ultra-1.webp",
  "NEXO-LAMPARA-LED-30W": "https://casavivadecuba.com/wp-content/uploads/2026/09/lampara-led-recargable-30w-1.webp",
  "NEXO-OCEDAR-EASYWRING": "https://casavivadecuba.com/wp-content/uploads/2026/09/o-cedar-easywring-1.webp",
  "NEXO-LOLARAN-AL1000": "/catalog/owner/lolaran-al1000.webp?v=20260901",
  "NEXO-ASPIRADORA-MANO-USB": "/catalog/owner/aspiradora-portatil-usb.webp?v=20260901",
  "NEXO-LUMIVAULT-X3PRO": "/catalog/owner/lumivault-x3pro.webp?v=20260901",
  "NEXO-LOGIC-ML8": "/catalog/owner/logic-ml8.webp?v=20260901",
  "NEXO-BAMBU-A1-COMBO": "/catalog/owner/bambu-lab-a1-combo.webp?v=20260901",
  "NEXO-MOCHILA-COMPACTA": "/catalog/owner/mochila-compacta.webp?v=20260901",
  "NEXO-CINTURON-TERMICO": "/catalog/owner/cinturon-termico.webp?v=20260901",
};
export function catalogImageFor(product: { sku?: string; images?: Array<{ src?: string }> }) {
  const sku = product.sku?.trim();
  if (sku && localCatalogImages[sku]) return localCatalogImages[sku];
  return product.images?.[0]?.src || "";
}
