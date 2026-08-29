const localCatalogImages: Record<string, string> = {
  "NEXO-BOVIET-BVM8611M-620": "/catalog/owner/boviet-620w.webp?v=001k",
  "NEXO-ROYAL-REG202V": "/catalog/owner/royal-reg202v.webp?v=001k",
  "NEXO-KONFORT-120X190": "/catalog/owner/konfort-120x190.webp?v=001k",
  "NEXO-KONFORT-135X190": "/catalog/gestora/03-colchon-konfort-135x190-ecommerce.webp",
};
export function catalogImageFor(product: { sku?: string; images?: Array<{ src?: string }> }) {
  const sku = product.sku?.trim();
  if (sku && localCatalogImages[sku]) return localCatalogImages[sku];
  return product.images?.[0]?.src || "";
}
