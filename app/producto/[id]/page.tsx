import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWooProduct, wooConfigured } from "../../../lib/commerce/woocommerce";
import { catalogImageFor } from "../../../lib/commerce/catalog-images";
import "../../marketplace/marketplace.css";
import "./product.css";
import AddToCartButton from "./AddToCartButton";

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
  const purchasable = product.stock_status === "instock" && Boolean(product.price);
  const imageSrc = catalogImageFor(product);
  return <main className="product-page">
    <header className="market-header"><Link href={ref ? `/?ref=${encodeURIComponent(ref)}` : "/"}><Image src="/brand/nexo-logo.png" width={210} height={75} alt="NEXO" /></Link><div className="product-header-actions"><Link href={ref ? `/?ref=${encodeURIComponent(ref)}` : "/"}>← Catálogo</Link><Link href={`/carrito${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`}>Carrito</Link></div></header>
    <div className="product-layout"><section className="product-gallery">{imageSrc ? <img src={imageSrc} alt={product.images?.[0]?.alt || product.name} /> : <div>Sin fotografía</div>}</section>
      <section className="product-purchase"><small>{product.categories?.map((x: any) => x.name).join(" · ")}</small><h1>{product.name}</h1>{product.price && <strong className="product-price">${product.price}</strong>}<p className="stock">{purchasable ? "Disponible" : "No disponible para compra"}</p><div dangerouslySetInnerHTML={{ __html: product.short_description }} />
        {requiresConfirmation && <div className="confirmation"><b>Confirmamos antes de completar la compra</b><p>Producto sujeto a confirmación de disponibilidad. NEXO verifica existencia y precio antes de completar la compra.</p></div>}
        <AddToCartButton productId={product.id} referral={ref} disabled={!purchasable} /><a className="whatsapp" href={`https://wa.me/?text=${encodeURIComponent(`Hola, quiero consultar ${product.name}`)}`}>Consultar por WhatsApp</a>
        <details><summary>Descripción y beneficios</summary><div dangerouslySetInnerHTML={{ __html: product.description }} /></details><details><summary>Entrega y garantía</summary><p>La mensajería se calcula por separado según destino y volumen. La garantía mostrada corresponde a la ficha verificada del producto.</p></details>
      </section></div>
  </main>;
}
