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
import { resolvedProductPrice } from "../../../lib/commercial/storefront";
import { productContentFor } from "../../../lib/commerce/product-content";

export const dynamic = "force-dynamic";

async function loadProduct(id: string) {
  if (!wooConfigured()) return null;
  try {
    const product = await getWooProduct(Number(id));
    return isPubliclyPurchasable(product) ? applyEditorial(product) : null;
  } catch { return null; }
}

function purchaseSummary(html: string) {
  const text = html
    .replace(/<li[^>]*>/gi, " · ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\s*[·•-]\s*/, "")
    .trim();
  if (!text) return "";
  const firstSentence = text.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  const summary = firstSentence && firstSentence.length <= 150 ? firstSentence : text.slice(0, 145).trimEnd() + (text.length > 145 ? "…" : "");
  return summary;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product: any = await loadProduct(id);
  if (!product) return { title: "Producto no disponible" };
  const seo = product.seo;
  const image = catalogImageFor(product);
  const url = `https://nexotienda.casavivadecuba.com/producto/${id}`;
  return {
    title: { absolute: seo?.seoTitle || `${product.name} | NEXO` },
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
  const commercial = ref ? await resolvedProductPrice(ref, Number(id)).catch(() => null) : null;
  const publicPrice = commercial?.resolved.final.toFixed(2) || product.price;
  const purchasable = true;
  const imageSrc = catalogImageFor(product);
  const editorial = editorialFor(product);
  const content = productContentFor(product, editorial);
  const summary = purchaseSummary(content.shortDescriptionHtml);
  const brand = content.specifications.find((x) => x.label.toLocaleLowerCase("es") === "marca")?.value;
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: product.name, sku: product.sku, image: imageSrc ? [imageSrc] : undefined, description: content.shortDescriptionHtml.replace(/<[^>]+>/g, " "), brand: brand ? { "@type": "Brand", name: brand } : undefined, offers: { "@type": "Offer", price: publicPrice, priceCurrency: "USD", availability: "https://schema.org/InStock", url: `https://nexotienda.casavivadecuba.com/producto/${id}` } };
  return <main className="product-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <header className="market-header"><Link href={ref ? `/?ref=${encodeURIComponent(ref)}` : "/"} aria-label="NEXO — Inicio"><Image className="market-logo" src="/brand/nexo-logo.png" width={380} height={140} alt="NEXO" /><Image className="market-symbol" src="/brand/nexo-symbol.png" width={512} height={512} alt="" aria-hidden="true" /></Link><div className="product-header-actions"><Link href={ref ? `/?ref=${encodeURIComponent(ref)}` : "/"}>← Catálogo</Link><Link href={`/carrito${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`}>Carrito</Link></div></header>
    <div className="product-layout"><section className="product-gallery">{imageSrc ? <img src={imageSrc} alt={product.images?.[0]?.alt || product.name} /> : <div>Sin fotografía</div>}</section>
      <section className="product-purchase"><small>{product.categories?.map((x: any) => x.name).join(" · ")}</small><h1>{product.name}</h1><strong className="product-price">{publicPrice} USD</strong>{summary && <p className="product-purchase-summary">{summary}</p>}
        <AddToCartButton productId={product.id} referral={ref} disabled={!purchasable} />
        {content.keyBenefits.length > 0 && <section className="product-benefits" aria-labelledby="benefits-title"><h2 id="benefits-title">Características principales</h2><ul>{content.keyBenefits.map((benefit) => <li key={`${benefit.title}-${benefit.detail}`}><strong>{benefit.title}</strong><span>{benefit.detail}</span></li>)}</ul></section>}
        {content.descriptionHtml && <details open><summary>Descripción</summary><div dangerouslySetInnerHTML={{ __html: content.descriptionHtml }} /></details>}{content.specifications.length > 0 && <details open><summary>Especificaciones</summary><dl>{content.specifications.map((spec) => <div key={`${spec.label}-${spec.value}`}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl></details>}{content.faq.length > 0 && <details><summary>Preguntas frecuentes</summary>{content.faq.map((item) => <div className="product-faq" key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></div>)}</details>}<details><summary>Entrega</summary><p>Elige entrega a domicilio o recogida al completar tu pedido.</p></details>
      </section></div>
  </main>;
}