import { NextResponse } from "next/server";
import { listWooProducts, wooConfigured } from "../../../../lib/commerce/woocommerce";
import { catalogImageFor } from "../../../../lib/commerce/catalog-images";
import { storefrontProducts } from "../../../../lib/commerce/storefront";
import { applyEditorial } from "../../../../lib/commerce/product-editorial";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  if (!wooConfigured()) {
    return NextResponse.json(
      { products: [], configured: false, error: "Catálogo WooCommerce pendiente de credenciales." },
      { status: 503, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const category = url.searchParams.get("category") || undefined;
  const requestedPage = url.searchParams.get("page");
  // Sin página pedida: trae hasta 300 productos (6 páginas de 50) para mostrar el catálogo completo del comercio.
  const pages = requestedPage ? [Number(requestedPage) || 1] : [1, 2, 3, 4, 5, 6];
  const products: any[] = [];
  for (const page of pages) {
    const batch = await listWooProducts({ search, category, page, perPage: 50 });
    if (!Array.isArray(batch) || batch.length === 0) break;
    products.push(...batch);
    if (batch.length < 50) break;
  }

  const normalizedProducts = storefrontProducts(products).map((raw: any) => {
    const product = applyEditorial(raw);
    const imageSrc = catalogImageFor(product);
    if (!imageSrc) return product;
    const originalImage = product.images?.[0] || {};
    return {
      ...product,
      images: [
        {
          ...originalImage,
          src: imageSrc,
          alt: originalImage.alt || product.name,
        },
        ...(product.images?.slice(1) || []),
      ],
    };
  });

  return NextResponse.json(
    { products: normalizedProducts, configured: true, total: normalizedProducts.length },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}
