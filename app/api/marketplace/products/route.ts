import { NextResponse } from "next/server";
import { listWooProducts, wooConfigured } from "../../../../lib/commerce/woocommerce";
import { catalogImageFor } from "../../../../lib/commerce/catalog-images";

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
  const products = await listWooProducts({
    search: url.searchParams.get("search") || undefined,
    category: url.searchParams.get("category") || undefined,
    page: Number(url.searchParams.get("page") || 1),
    perPage: Number(url.searchParams.get("perPage") || 24),
  });

  const normalizedProducts = products.map((product: any) => {
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
    { products: normalizedProducts, configured: true },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}
