import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWooProduct, wooConfigured } from "../../../lib/commerce/woocommerce";
import { catalogImageFor } from "../../../lib/commerce/catalog-images";
import "../../marketplace/marketplace.css";
import "./product.css";
import AddToCartButton from "./AddToCartButton";
import { isPubliclyPurchasable } from "../../../lib/commerce/storefront";
import { applyEditorial, editorialFor } from "../../../lib/commerce/product-editorial";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

async function loadProduct(id: string) {
  if (!wooConfigured()) return null;
  try {
    const product = await getWooProduct(Number(id));
    return isPubliclyPurchasable(product) ? applyEditorial(product) : null;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product: any = await loadProduct(id);
  if (!product) return { title: "Producto no disponible" };
  const seo = product.seo;
  const image = catalogImageFor(product);
  const url = `https://nexotienda.casavivadecuba.com/producto/${id}`;
  return {
    title: seo?.seoTitle || product.name,
    description: seo?.metaDescription || product.short_description?.replace(/<[^>]+>/g, ""),
    alternates: { canonical: url },
    openGraph: { title: seo?.seoTitle || product.name, description: seo?.metaDescription, url, type: "website", images: image ? [{ url: image, alt: product.images?.[0]?.alt || product.name }] : [] },
    twitter: { card: "summary_large_image", title: seo?.seoTitle || product.name, description: seo?.metaDescription, images: image ? [image] : [] },
  };
}

export default async function ProductPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { id } = await params;
  const { ref } = await searchParams;
  if (!wooConfigured()) return <main className="product-unavailable"><h1>Catálogo pendiente de conexión</h1><p>WooCommerce todavía no tiene sus credenciales seguras configuradas en Render.</p><Link href="/">Volver a NEXO</Link></main>;
  const product: any = await loadProduct(id);
  if (!product) notFound();
  const purchasable = true;
  const imageSrc = catalogImageFor(product);
  const editorial = editorialFor(product);
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: product.name, sku: product.sku, image: imageSrc ? [imageSrc] : undefined, description: editorial?.shortDescription, brand: editorial?.specifications.find((x) => x.label === "Marca")?.value ? { "@type": "Brand", name: editorial.specifications.find((x) => x.label === "Marca")?.value } : undefined, offers: { "@type": "Offer", price: product.price, priceCurrency: "USD", availability: "https://schema.org/InStock", url: `https://nexotienda.casavivadecuba.com/producto/${id}` } };
  return <main className="product-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <header className="market-header"><Link href={ref ? `/?ref=${encodeURIComponent(ref)}` : "/"} aria-label="NEXO — Inicio"><Image className="market-logo" src="/brand/nexo-logo.png" width={380} height={140} alt="NEXO" /><Image className="market-symbol" src="/brand/nexo-symbol.png" width={512} height={512} alt="" aria-hidden="true" /></Link><div className="product-header-actions"><Link href={ref ? `/?ref=${encodeURIComponent(ref)}` : "/"}>← Catálogo</Link><Link href={`/carrito${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`}>Carrito</Link></div></header>
    <div className="product-layout"><section className="product-gallery">{imageSrc ? <img src={imageSrc} alt={product.images?.[0]?.alt || product.name} /> : <div>Sin fotografía</div>}</section>
      <section className="product-purchase"><small>{product.categories?.map((x: any) => x.name).join(" · ")}</small><h1>{product.name}</h1><strong className="product-price">{product.price} USD</strong><div dangerouslySetInnerHTML={{ __html: product.short_description }} />
        <AddToCartButton productId={product.id} referral={ref} disabled={!purchasable} />
        <details><summary>Descripción</summary><p>{editorial?.longDescription}</p></details><details><summary>Especificaciones</summary><dl>{editorial?.specifications.map((spec) => <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl></details><details><summary>Entrega</summary><p>Elige entrega a domicilio o recogida al completar tu pedido.</p></details>
      </section></div>
  </main>;
}
