"use client";
import { FormEvent, useMemo, useState } from "react";
type Product = {
  id: number;
  name: string;
  price: string;
  currency: string;
  image: string;
  stockStatus: string;
};
type Rule = {
  id: string;
  scope: string;
  productId: number | null;
  mode: "base" | "fixed" | "percent" | "custom_final";
  value: number;
  version: number;
};
type Dashboard = {
  profile: {
    publicName: string;
    slug: string;
    referralCode: string;
    status: string;
    defaultCurrency: string;
  };
  productIds: number[];
  rules: Rule[];
  catalog: Product[];
  ledger: Array<{
    id: string;
    orderId: number;
    type: string;
    amount: number;
    currency: string;
    status: string;
  }>;
  available: Record<string, number>;
};
export default function ImpulsaClient({ initial }: { initial: Dashboard }) {
  const [data, setData] = useState(initial),
    [selected, setSelected] = useState<number[]>(initial.productIds),
    [mode, setMode] = useState<"base" | "fixed" | "percent">(
      (initial.rules.find((x) => x.scope === "global")?.mode as any) || "base",
    ),
    [value, setValue] = useState(
      initial.rules.find((x) => x.scope === "global")?.value || 0,
    ),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const activeRule = useMemo(
    () => data.rules.find((x) => x.scope === "global"),
    [data.rules],
  );
  async function refresh() {
    const r = await fetch("/api/gestoras/dashboard", { cache: "no-store" });
    if (r.ok) {
      const next = await r.json();
      setData(next);
      setSelected(next.productIds);
    }
  }
  async function post(body: object) {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/gestoras/dashboard", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await refresh();
      setMessage("Cambios guardados y publicados.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "No pudimos guardar.");
    } finally {
      setBusy(false);
    }
  }
  function toggle(id: number) {
    setSelected((x) =>
      x.includes(id) ? x.filter((v) => v !== id) : [...x, id],
    );
  }
  async function saveProducts(e: FormEvent) {
    e.preventDefault();
    await post({ action: "products", productIds: selected });
  }
  async function savePrice(e: FormEvent) {
    e.preventDefault();
    await post({
      action: "price_rule",
      scope: "global",
      mode,
      value: mode === "base" ? 0 : Number(value),
      currency: "USD",
      minFinal: "",
      maxFinal: "",
      rounding: 0.01,
    });
  }
  return (
    <main className="impulsa-shell">
      <header>
        <div>
          <span>NEXO IMPULSA</span>
          <strong>{data.profile.publicName}</strong>
        </div>
        <a href={`/g/${data.profile.slug}`}>Ver mi tienda</a>
      </header>
      <section className="impulsa-hero">
        <span>MI NEGOCIO</span>
        <h1>Tu centro de operaciones.</h1>
        <p>
          Tu tienda parte siempre del catálogo y precio oficial de NEXO. Tú
          decides qué productos mostrar y si quieres añadir margen.
        </p>
        <div className="impulsa-link">
          <b>Tu enlace:</b> /g/{data.profile.slug} · <b>Referencia:</b>{" "}
          {data.profile.referralCode}
        </div>
      </section>
      <section className="impulsa-tools">
        <a className="impulsa-tool-card" href="/impulsa/buscar">
          <span>NUEVA HERRAMIENTA</span>
          <h2>📷 Buscar producto para un cliente</h2>
          <p>
            Sube una foto o captura. NEXO encuentra opciones, compara precios y
            prepara tu mensaje.
          </p>
          <b>Empezar búsqueda →</b>
        </a>
      </section>
      <section className="impulsa-cards">
        <article>
          <small>Productos activos</small>
          <strong>{data.productIds.length}</strong>
        </article>
        <article>
          <small>Precio aplicado</small>
          <strong>
            {activeRule?.mode === "fixed"
              ? `+${activeRule.value} USD`
              : activeRule?.mode === "percent"
                ? `+${activeRule.value}%`
                : "Precio NEXO"}
          </strong>
        </article>
        <article>
          <small>Disponible</small>
          <strong>
            {Object.entries(data.available)
              .map(([c, v]) => `${v.toFixed(2)} ${c}`)
              .join(" · ") || "0.00"}
          </strong>
        </article>
      </section>
      <section className="impulsa-panel">
        <h2>1. Elige tus productos</h2>
        <p>Marca los productos que quieres publicar en tu tienda espejo.</p>
        <form className="catalog-form" onSubmit={saveProducts}>
          <div className="impulsa-products">
            {data.catalog.map((p) => (
              <label
                className={selected.includes(p.id) ? "selected" : ""}
                key={p.id}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => toggle(p.id)}
                />
                {p.image && <img src={p.image} alt="" />}
                <span>
                  <b>{p.name}</b>
                  <small>
                    {p.price} {p.currency} · precio NEXO
                  </small>
                </span>
              </label>
            ))}
          </div>
          <button disabled={busy}>Guardar productos</button>
        </form>
      </section>
      <section className="impulsa-panel">
        <h2>2. Decide tu precio</h2>
        <p>
          Si no añades margen, tu tienda publica exactamente el precio NEXO.
        </p>
        <form className="price-form" onSubmit={savePrice}>
          <label>
            Regla
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
            >
              <option value="base">Usar precio NEXO</option>
              <option value="fixed">Sumar importe fijo</option>
              <option value="percent">Sumar porcentaje</option>
            </select>
          </label>
          {mode !== "base" && (
            <label>
              {mode === "fixed"
                ? "Importe adicional (USD)"
                : "Porcentaje adicional"}
              <input
                type="number"
                min="0"
                step={mode === "fixed" ? "0.01" : "0.1"}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
              />
            </label>
          )}
          <button disabled={busy}>Aplicar precio</button>
        </form>
        {message && (
          <p className="impulsa-message" role="status">
            {message}
          </p>
        )}
      </section>
      <section className="impulsa-panel">
        <h2>Últimos movimientos</h2>
        {data.ledger.length ? (
          <ul>
            {data.ledger.map((x) => (
              <li key={x.id}>
                <span>
                  Pedido #{x.orderId} · {x.type}
                </span>
                <strong>
                  {x.amount.toFixed(2)} {x.currency}
                </strong>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Aún no hay ganancias registradas. Cuando un pedido se entregue y
            cobre, aparecerá aquí.
          </p>
        )}
      </section>
    </main>
  );
}
