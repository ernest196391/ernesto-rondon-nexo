"use client";
import Image from "next/image";
import Link from "next/link";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
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
    [activeSuggestion, setActiveSuggestion] = useState(-1),
    [category, setCategory] = useState("Todos"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [refCode] = useState(() =>
      typeof window === "undefined"
        ? ""
        : new URLSearchParams(window.location.search).get("ref")?.trim() || "",
    ),
    searchRef = useRef<HTMLInputElement>(null);
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
    clean = query
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLocaleLowerCase("es");
  const visible = useMemo(
      () =>
        products.filter(
          (p) =>
            (category === "Todos" ||
              p.categories.some((c) => c.name === category)) &&
            (!clean ||
              `${p.name} ${p.sku || ""} ${p.categories.map((c) => c.name).join(" ")}`
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLocaleLowerCase("es")
                .includes(clean)),
        ),
      [products, category, clean],
    ),
    suggestions = clean.length >= 2 ? visible.slice(0, 6) : [],
    withRef = (path: string) =>
      `${path}${refCode ? `?ref=${encodeURIComponent(refCode)}` : ""}`;
  return (
    <main className="marketplace-shell">
      <header className="market-header">
        <Link href={withRef("/")} aria-label="NEXO — Inicio">
          <Image
            className="market-logo"
            src="/brand/nexo-logo.png"
            width={380}
            height={140}
            alt="NEXO"
            priority
          />
          <Image
            className="market-symbol"
            src="/brand/nexo-symbol.png"
            width={512}
            height={512}
            alt=""
            aria-hidden="true"
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
      <div className="store-notice">Compra fácil y segura · Productos disponibles en NEXO</div>
      <section className="store-intro">
        <p>CATÁLOGO</p>
        <h1>Encuentra lo que necesitas</h1>
        <span>Productos disponibles en NEXO.</span>
      </section>
      <section className="market-search" aria-label="Buscar productos">
        <label htmlFor="market-search">Buscar productos</label>
        <div className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            id="market-search"
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={suggestions.length > 0}
            aria-controls="market-search-suggestions"
            aria-activedescendant={activeSuggestion >= 0 ? `market-suggestion-${suggestions[activeSuggestion]?.id}` : undefined}
            ref={searchRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveSuggestion(-1); }}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (!suggestions.length) return;
              if (e.key === "ArrowDown") { e.preventDefault(); setActiveSuggestion((x) => Math.min(x + 1, suggestions.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActiveSuggestion((x) => Math.max(x - 1, 0)); }
              if (e.key === "Escape") { setQuery(""); setActiveSuggestion(-1); }
              if (e.key === "Enter" && activeSuggestion >= 0) { e.preventDefault(); window.location.assign(withRef(`/producto/${suggestions[activeSuggestion].id}`)); }
            }}
            placeholder="Buscar productos"
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
            id="market-search-suggestions"
            role="listbox"
            className="search-suggestions"
            aria-label="Sugerencias de productos"
          >
            {suggestions.map((p) => (
              <li id={`market-suggestion-${p.id}`} role="option" aria-selected={activeSuggestion === suggestions.indexOf(p)} key={p.id}>
                <Link href={withRef(`/producto/${p.id}`)}>
                  <img src={catalogImageFor(p) || "/brand/nexo-symbol.png"} alt="" />
                  <span><b>{p.name}</b><small>{p.categories[0]?.name || "NEXO"}</small></span>
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
            <strong>No encontramos productos con ese nombre.</strong>
            <p>Prueba con otra palabra o revisa todo el catálogo.</p>
            <button type="button" onClick={() => { setQuery(""); setCategory("Todos"); searchRef.current?.focus(); }}>Ver todo el catálogo</button>
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
