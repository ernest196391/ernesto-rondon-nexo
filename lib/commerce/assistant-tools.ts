import { catalogImageFor } from "./catalog-images";
import { familyForProduct } from "./storefront-categories";
import { applyEditorial } from "./product-editorial";

export type AssistantProduct = { id: number; name: string; price: string; currency: string; imageUrl: string; productUrl: string; family: string; purchasable: boolean };
export function publicProduct(product: any, origin: string, ref = ""): AssistantProduct {
  product = applyEditorial(product);
  const url = new URL(`/producto/${product.id}`, origin);
  if (ref) url.searchParams.set("ref", ref);
  return { id: product.id, name: product.name, price: String(product.price), currency: "USD", imageUrl: catalogImageFor(product) || "/brand/nexo-symbol.png", productUrl: url.toString(), family: familyForProduct(product).label, purchasable: product.stock_status !== "outofstock" && product.catalog_visibility !== "hidden" };
}
export function searchProducts(products: any[], query: string, origin: string, ref = "", limit = 3) {
  const words = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/\s+/).filter((word) => word.length > 2);
  return products.map((product) => applyEditorial(product)).filter((product) => product.stock_status !== "outofstock" && product.catalog_visibility !== "hidden")
    .map((product) => ({ product, score: words.reduce((score, word) => `${product.search_text || product.name} ${product.sku || ""} ${product.categories?.map((c: any) => c.name).join(" ") || ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(word) ? score + 1 : score, 0) }))
    .filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).slice(0, Math.min(3, limit)).map(({ product }) => publicProduct(product, origin, ref));
}
