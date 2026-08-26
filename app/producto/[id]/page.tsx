import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWooProduct, wooConfigured } from "../../../lib/commerce/woocommerce";
import "../../marketplace/marketplace.css";
import "./product.css";

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
  const requiresConfirmation = product.meta_data?.some((m: any) => m.key === "nexo_availability_confirmation" && m.value === "required");
  const storeUrl = process.env.WOOCOMMERCE_URL?.replace(/\/$/, "") || "";
  const buyUrl = `${storeUrl}/?add-to-cart=${product.id}${ref ? `&ref=${encodeURIComponent(ref)}` : ""}`;
  return <main className="product-page">
    <header className="market-header"><Link href="/"><Image src="/brand/nexo-logo.png" width={210} height={75} alt="NEXO" /></Link><Link href="/">← Catálogo</Link></header>
    <div className="product-layout"><section className="product-gallery">{product.images?.[0] ? <img src={product.images[0].src} alt={product.images[0].alt || product.name} /> : <div>Sin fotografía</div>}</section>
      <section className="product-purchase"><small>{product.categories?.map((x: any) => x.name).join(" · ")}</small><h1>{product.name}</h1><strong className="product-price">${product.price}</strong><p className="stock">{product.stock_status === "instock" ? "Disponible" : "Agotado"}</p><div dangerouslySetInnerHTML={{ __html: product.short_description }} />
        {requiresConfirmation && <div className="confirmation"><b>Confirmamos antes de completar la compra</b><p>Producto sujeto a confirmación de disponibilidad. NEXO verifica existencia y precio antes de completar la compra.</p></div>}
        <a className="buy-button" href={buyUrl}>Añadir al carrito</a><a className="whatsapp" href={`https://wa.me/?text=${encodeURIComponent(`Hola, quiero consultar ${product.name}`)}`}>Consultar por WhatsApp</a>
        <details><summary>Descripción y beneficios</summary><div dangerouslySetInnerHTML={{ __html: product.description }} /></details><details><summary>Entrega y garantía</summary><p>La mensajería se calcula por separado según destino y volumen. La garantía mostrada corresponde a la ficha verificada del producto.</p></details>
      </section></div>
  </main>;
}
