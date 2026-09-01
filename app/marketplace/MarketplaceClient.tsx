"use client";
import Image from "next/image";
import Link from "next/link";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { catalogImageFor } from "../../lib/commerce/catalog-images";
import { familyForProduct, STOREFRONT_CATEGORIES, type StorefrontCategory } from "../../lib/commerce/storefront-categories";
type WooProduct = {
  id: number;
  name: string;
  sku?: string;
  price: string;
  stock_status: string;
  images: Array<{ src: string; alt: string }>;
  categories: Array<{ id: number; name: string }>;
  search_text?: string;
};
export default function MarketplaceClient() {
  const [products, setProducts] = useState<WooProduct[]>([]),
    [query, setQuery] = useState(""),
    [activeSuggestion, setActiveSuggestion] = useState(-1),
    [category, setCategory] = useState(() => {
      if (typeof window === "undefined") return "";
      const requested = new URLSearchParams(window.location.search).get("familia") || "";
      return STOREFRONT_CATEGORIES.some((family) => family.slug === requested) ? requested : "";
    }),
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
  const families = useMemo(() => STOREFRONT_CATEGORIES
      .filter((family) => family.enabled)
      .sort((a, b) => a.order - b.order), []),
    activeFamily = families.find((family) => family.slug === category),
    clean = query
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLocaleLowerCase("es");
  const visible = useMemo(
      () =>
        products.filter(
          (p) =>
            (!category || familyForProduct(p).slug === category) &&
            (!clean ||
              `${p.search_text || p.name} ${p.sku || ""} ${p.categories.map((c) => c.name).join(" ")}`
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLocaleLowerCase("es")
                .includes(clean)),
        ),
      [products, category, clean],
    ),
    suggestions = clean.length >= 2 ? visible.slice(0, 6) : [],
    withRef = (path: string) =>
      `${path}${refCode ? `?ref=${encodeURIComponent(refCode)}` : ""}`,
    selectCategory = (slug: string) => {
      setCategory(slug);
      const url = new URL(window.location.href);
      if (slug) url.searchParams.set("familia", slug); else url.searchParams.delete("familia");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    };
  return (
    <main className="marketplace-shell">
      <header className="market-header">
        <Link href={withRef("/")} aria-label="NEXO — Inicio">
          <Image
            className="market-logo"
            src="/brand/nexo-logo-001g.png"
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
      <div className="store-notice">Compra fácil · Entrega coordinada</div>
      <section className="store-intro">
        <h1>Más cerca de ti</h1>
        <span>Encuentra lo que necesitas para tu hogar.</span>
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
                  <span><b>{p.name}</b><small>{familyForProduct(p).label}</small></span>
                  <strong>{p.price} USD</strong>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <nav className="category-strip" aria-label="Categorías">
        {families.map((family) => (
          <button
            key={family.id}
            className={category === family.slug ? "active" : ""}
            aria-pressed={category === family.slug}
            onClick={() => selectCategory(category === family.slug ? "" : family.slug)}
          >
            <CategoryIcon family={family} />
            <span>{family.label}</span>
          </button>
        ))}
      </nav>
      <section id="productos" className="products-section">
        <header>
          <div>
            <h2>{clean ? `Resultados para “${query.trim()}”` : activeFamily?.label || "Productos"}</h2>
            {activeFamily && <button className="clear-family" type="button" onClick={() => selectCategory("")}>Ver todo</button>}
          </div>
          {!loading && !error && (
            <span>
              {visible.length} {clean ? (visible.length === 1 ? "resultado" : "resultados") : (visible.length === 1 ? "producto" : "productos")}
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
            <strong>No encontramos coincidencias.</strong>
            <button type="button" onClick={() => { setQuery(""); selectCategory(""); searchRef.current?.focus(); }}>Ver productos</button>
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
                    <small>{familyForProduct(p).label}</small>
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
    </main>
  );
}

function CategoryIcon({ family }: { family: StorefrontCategory }) {
  const common = { width: 28, height: 28, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, "aria-hidden": true } as const;
  if (family.icon === "cooking") return <svg {...common}><path d="M5 10h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8Z"/><path d="M3 10h18M9 6c0-1 1-1.5 1-2.5M14 6c0-1 1-1.5 1-2.5"/></svg>;
  if (family.icon === "bedroom") return <svg {...common}><path d="M3 19v-9h18v9M3 15h18M6 10V7h5a3 3 0 0 1 3 3"/></svg>;
  if (family.icon === "energy") return <svg {...common}><path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z"/></svg>;
  if (family.icon === "technology") return <svg {...common}><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
  if (family.icon === "furniture") return <svg {...common}><path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3"/><path d="M4 10a2 2 0 0 0-2 2v5h20v-5a2 2 0 0 0-2-2M5 17v3M19 17v3"/></svg>;
  if (family.icon === "other") return <svg {...common}><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>;
  return <svg {...common}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M5 9h14M9 6h6M9 14h6M9 17h6"/></svg>;
}
