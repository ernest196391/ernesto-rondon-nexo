import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWooProduct, wooConfigured } from "../../../lib/commerce/woocommerce";
import { catalogImageFor } from "../../../lib/commerce/catalog-images";
import "../../marketplace/marketplace.css";
import "./product.css";
import AddToCartButton from "./AddToCartButton";
import { isPubliclyPurchasable } from "../../../lib/commerce/storefront";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { id } = await params;
  const { ref } = await searchParams;
  if (!wooConfigured()) return <main className="product-unavailable"><h1>Catálogo pendiente de conexión</h1><p>WooCommerce todavía no tiene sus credenciales seguras configuradas en Render.</p><Link href="/">Volver a NEXO</Link></main>;
  let product: any;
  try { product = await getWooProduct(Number(id)); } catch { notFound(); }
  if (!isPubliclyPurchasable(product)) notFound();
  const requiresConfirmation = product.meta_data?.some((m: any) => m.key === "nexo_availability_confirmation" && m.value === "required");
  const purchasable = true;
  const imageSrc = catalogImageFor(product);
  return <main className="product-page">
    <header className="market-header"><Link href={ref ? `/?ref=${encodeURIComponent(ref)}` : "/"} aria-label="NEXO — Inicio"><Image className="market-logo" src="/brand/nexo-logo.png" width={380} height={140} alt="NEXO" /><Image className="market-symbol" src="/brand/nexo-symbol.png" width={512} height={512} alt="" aria-hidden="true" /></Link><div className="product-header-actions"><Link href={ref ? `/?ref=${encodeURIComponent(ref)}` : "/"}>← Catálogo</Link><Link href={`/carrito${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`}>Carrito</Link></div></header>
    <div className="product-layout"><section className="product-gallery">{imageSrc ? <img src={imageSrc} alt={product.images?.[0]?.alt || product.name} /> : <div>Sin fotografía</div>}</section>
      <section className="product-purchase"><small>{product.categories?.map((x: any) => x.name).join(" · ")}</small><h1>{product.name}</h1><strong className="product-price">{product.price} USD</strong><p className="stock">Disponible para pedir</p><div dangerouslySetInnerHTML={{ __html: product.short_description }} />
        {requiresConfirmation && <p className="purchase-note">Confirmaremos los detalles de entrega al preparar tu pedido.</p>}
        <AddToCartButton productId={product.id} referral={ref} disabled={!purchasable} />
        <details><summary>Descripción y beneficios</summary><div dangerouslySetInnerHTML={{ __html: product.description }} /></details><details><summary>Entrega</summary><p>Puedes elegir entrega a domicilio o recogida en tienda durante el checkout. La tarifa de mensajería se calcula según la zona.</p></details>
      </section></div>
  </main>;
}
