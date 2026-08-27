"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { catalogImageFor } from "../../lib/commerce/catalog-images";

type WooProduct = {
  id: number; name: string; slug: string; sku?: string; price: string; regular_price: string;
  sale_price: string; stock_status: string;
  images: Array<{ src: string; alt: string }>;
  categories: Array<{ id: number; name: string }>;
  meta_data?: Array<{ key: string; value: unknown }>;
};

function availability(product: WooProduct) {
  const needsConfirmation = product.meta_data?.some(
    (item) => item.key === "nexo_availability_confirmation" && item.value === "required",
  );
  if (needsConfirmation) return "Disponibilidad por confirmar";
  return product.stock_status === "instock" ? "Disponible" : "Agotado";
}

export default function MarketplaceClient() {
  const [products, setProducts] = useState<WooProduct[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refCode, setRefCode] = useState("");

  async function load(search = "") {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/marketplace/products${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo cargar el catálogo.");
      setProducts(data.products);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar el catálogo.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setRefCode(params.get("ref")?.trim() || "");
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const featured = useMemo(
    () => products.find((product) => /ventilador|fan/i.test(product.name)) || products[0],
    [products],
  );

  const productUrl = (id: number) => `/producto/${id}${refCode ? `?ref=${encodeURIComponent(refCode)}` : ""}`;
  const nexoPath = (path: string) => `${path}${refCode ? `?ref=${encodeURIComponent(refCode)}` : ""}`;
  const submit = (event: FormEvent) => { event.preventDefault(); void load(query); };
  const filter = (label: string) => { setQuery(label); void load(label); };
  const featuredImage = featured ? catalogImageFor(featured) : "";

  return <main className="marketplace-shell">
    <div className="market-notice"><span>Compra acompañada</span><b>Confirmamos existencia y precio antes de completar tu pedido.</b></div>
    <header className="market-header">
      <Link href={refCode ? `/?ref=${encodeURIComponent(refCode)}` : "/"} aria-label="NEXO Marketplace"><Image src="/brand/nexo-logo.png" width={210} height={75} alt="NEXO" priority /></Link>
      <div className="market-actions"><a href="#productos">Productos</a><Link className="market-cart" href={nexoPath("/carrito")}>Carrito</Link></div>
    </header>
    <section className="market-search" aria-label="Buscar en el catálogo">
      <form onSubmit={submit}><label className="sr-only" htmlFor="market-search">Buscar productos</label><input id="market-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="¿Qué estás buscando?"/><button>Buscar</button></form>
      <nav aria-label="Categorías"><button onClick={() => { setQuery(""); void load(); }}>Todo</button><button onClick={() => filter("ventilador")}>Ventiladores</button><button onClick={() => filter("hogar")}>Hogar</button><button onClick={() => filter("electrodoméstico")}>Electrodomésticos</button><button onClick={() => filter("tecnología")}>Tecnología</button></nav>
    </section>
    <section className="market-hero">
      <div className="market-hero-copy"><span>NEXO Marketplace</span><h1>Lo que buscas,<br/><em>más cerca.</em></h1><p>Productos seleccionados, compra acompañada y entrega coordinada.</p><a href="#productos">Comprar ahora</a></div>
      {featuredImage ? <Link className="market-hero-product" href={productUrl(featured.id)} aria-label={`Ver ${featured.name}`}><img src={featuredImage} alt={featured.images?.[0]?.alt || featured.name}/><span>{featured.name}</span></Link> : <div className="hero-orb" aria-hidden="true"/>}
    </section>
    <section id="productos" className="products-section">
      <header><div><span>Catálogo real</span><h2>Listos para consultar</h2></div>{!loading && !error && <p>{products.length} productos</p>}</header>
      {loading && <div className="product-state">Cargando catálogo…</div>}{error && <div className="product-state error"><strong>Catálogo pendiente de conexión</strong><p>{error}</p></div>}{!loading && !error && products.length === 0 && <div className="product-state">No encontramos productos con esa búsqueda.</div>}
      <div className="product-grid">{products.map((product) => {
        const purchasable = product.stock_status === "instock" && Boolean(product.price);
        const imageSrc = catalogImageFor(product);
        return <article className="product-card" key={product.id}><Link href={productUrl(product.id)}><div className="product-media">{imageSrc ? <img src={imageSrc} alt={product.images?.[0]?.alt || product.name}/> : <div className="no-photo">NEXO</div>}<span>{availability(product)}</span></div><div className="product-info"><small>{product.categories?.[0]?.name || "NEXO"}</small><h3>{product.name}</h3><div className="price-row"><div>{product.sale_price && <del>{product.regular_price} USD</del>}<strong>{product.price ? `${product.price} USD` : "Precio por confirmar"}</strong></div>{purchasable && <span className="add-symbol" aria-hidden="true">＋</span>}</div></div></Link></article>;
      })}</div>
    </section>
    <section className="market-benefits"><div><b>Compra segura</b><span>Tu pedido queda registrado oficialmente.</span></div><div><b>Entrega coordinada</b><span>La mensajería se calcula por separado.</span></div><div><b>Acompañamiento</b><span>Confirmamos existencia y precio antes de completar.</span></div></section>
    <footer><Image src="/brand/nexo-logo.png" width={168} height={60} alt="NEXO"/><p>Lo que buscas, más cerca.</p><nav><a href="#productos">Productos</a><Link href={nexoPath("/carrito")}>Carrito</Link></nav></footer>
  </main>;
}
