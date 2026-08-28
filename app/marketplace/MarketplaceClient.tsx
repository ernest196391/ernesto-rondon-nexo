"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { catalogImageFor } from "../../lib/commerce/catalog-images";
type WooProduct = {
  id: number;
  name: string;
  sku?: string;
  price: string;
  stock_status: string;
  images: Array<{ src: string; alt: string }>;
  categories: Array<{ id: number; name: string }>;
};
export default function MarketplaceClient() {
  const [products, setProducts] = useState<WooProduct[]>([]),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("Todos"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [refCode] = useState(() =>
      typeof window === "undefined"
        ? ""
        : new URLSearchParams(window.location.search).get("ref")?.trim() || "",
    );
  useEffect(() => {
    void fetch("/api/marketplace/products", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok)
          throw new Error(d.error || "No pudimos cargar los productos.");
        setProducts(d.products);
      })
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "No pudimos cargar los productos.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  const categories = useMemo(
      () => [
        "Todos",
        ...Array.from(
          new Set(products.flatMap((p) => p.categories.map((c) => c.name))),
        ).sort((a, b) => a.localeCompare(b, "es")),
      ],
      [products],
    ),
    clean = query.trim().toLocaleLowerCase("es");
  const visible = useMemo(
      () =>
        products.filter(
          (p) =>
            (category === "Todos" ||
              p.categories.some((c) => c.name === category)) &&
            (!clean ||
              `${p.name} ${p.sku || ""} ${p.categories.map((c) => c.name).join(" ")}`
                .toLocaleLowerCase("es")
                .includes(clean)),
        ),
      [products, category, clean],
    ),
    suggestions = clean ? visible.slice(0, 5) : [],
    withRef = (path: string) =>
      `${path}${refCode ? `?ref=${encodeURIComponent(refCode)}` : ""}`;
  return (
    <main className="marketplace-shell">
      <header className="market-header">
        <Link href={withRef("/")} aria-label="NEXO — Inicio">
          <Image
            src="/brand/nexo-logo.png"
            width={210}
            height={75}
            alt="NEXO"
            priority
          />
        </Link>
        <nav aria-label="Navegación de la tienda">
          <a href="#productos">Productos</a>
          <Link className="market-cart" href={withRef("/carrito")}>
            Carrito
          </Link>
        </nav>
      </header>
      <section className="store-intro">
        <p>TIENDA NEXO</p>
        <h1>Productos para tu día a día</h1>
        <span>
          Compra desde NEXO y coordina la entrega al confirmar tu pedido.
        </span>
      </section>
      <section className="market-search" aria-label="Buscar productos">
        <label htmlFor="market-search">¿Qué estás buscando?</label>
        <div className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            id="market-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca por nombre, marca o categoría"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
            hidden={!query}
          >
            ×
          </button>
        </div>
        {suggestions.length > 0 && (
          <ul
            className="search-suggestions"
            aria-label="Sugerencias de productos"
          >
            {suggestions.map((p) => (
              <li key={p.id}>
                <Link href={withRef(`/producto/${p.id}`)}>
                  {p.name}
                  <strong>{p.price} USD</strong>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <nav className="category-strip" aria-label="Categorías">
        {categories.map((c) => (
          <button
            key={c}
            className={category === c ? "active" : ""}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </nav>
      <section id="productos" className="products-section">
        <header>
          <div>
            <p>CATÁLOGO</p>
            <h2>{category === "Todos" ? "Todos los productos" : category}</h2>
          </div>
          {!loading && !error && (
            <span>
              {visible.length} {visible.length === 1 ? "producto" : "productos"}
            </span>
          )}
        </header>
        {loading && (
          <div className="product-state" aria-live="polite">
            Cargando productos…
          </div>
        )}
        {error && (
          <div className="product-state error" role="alert">
            <strong>No pudimos cargar la tienda</strong>
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && !visible.length && (
          <div className="product-state">
            <strong>No encontramos coincidencias</strong>
            <p>Prueba con otra palabra o categoría.</p>
          </div>
        )}
        <div className="product-grid">
          {visible.map((p) => {
            const src = catalogImageFor(p);
            return (
              <article className="product-card" key={p.id}>
                <Link href={withRef(`/producto/${p.id}`)}>
                  <div className="product-media">
                    {src ? (
                      <img src={src} alt={p.images?.[0]?.alt || p.name} />
                    ) : (
                      <div className="no-photo" aria-hidden="true">
                        N
                      </div>
                    )}
                  </div>
                  <div className="product-info">
                    <small>{p.categories[0]?.name || "NEXO"}</small>
                    <h3>{p.name}</h3>
                    <strong>{p.price} USD</strong>
                    <span>Ver producto →</span>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </section>
      <section className="store-trust">
        <div>
          <b>Pedido registrado</b>
          <span>Tu compra queda guardada antes de continuar.</span>
        </div>
        <div>
          <b>Entrega coordinada</b>
          <span>Selecciona domicilio o recogida al finalizar.</span>
        </div>
        <div>
          <b>Atención NEXO</b>
          <span>Te acompañamos hasta completar el pedido.</span>
        </div>
      </section>
    </main>
  );
}
