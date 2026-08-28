export type StorefrontProduct = {
  sku?: string;
  status?: string;
  stock_status?: string;
  price?: string;
  purchasable?: boolean;
  meta_data?: Array<{ key: string; value: unknown }>;
};

const NEXO_MARKERS = new Set([
  "nexo_pilot_batch",
  "nexo_catalog_batch",
  "nexo_capture_id",
]);

export function isNexoCatalogProduct(product: StorefrontProduct) {
  if (product.status && product.status !== "publish") return false;
  if (product.sku?.toUpperCase().startsWith("NEXO-")) return true;
  return Boolean(
    product.meta_data?.some(
      (entry) => NEXO_MARKERS.has(entry.key) && entry.value,
    ),
  );
}

export function isPubliclyPurchasable(product: StorefrontProduct) {
  return (
    isNexoCatalogProduct(product) &&
    product.stock_status === "instock" &&
    Boolean(product.price) &&
    product.purchasable !== false
  );
}

export function storefrontProducts<T extends StorefrontProduct>(products: T[]) {
  return products.filter(isPubliclyPurchasable);
}
