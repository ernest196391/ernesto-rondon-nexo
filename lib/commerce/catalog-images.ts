const localCatalogImages: Record<string, string> = {
  "NEXO-BOVIET-BVM8611M-620": "/catalog/gestora/01-panel-boviet-bifacial-620w-ecommerce.webp",
  "NEXO-ROYAL-REG202V": "/catalog/gestora/02-cocina-royal-reg202v-ecommerce.webp",
  "NEXO-KONFORT-135X190": "/catalog/gestora/03-colchon-konfort-135x190-ecommerce.webp",
};

export function catalogImageFor(product: { sku?: string; images?: Array<{ src?: string }> }) {
  const sku = product.sku?.trim();
  if (sku && localCatalogImages[sku]) return localCatalogImages[sku];
  return product.images?.[0]?.src || "";
}
