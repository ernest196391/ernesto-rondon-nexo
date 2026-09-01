"use client";
import { FormEvent, useMemo, useState } from "react";
import type {
  NexoSearchResponse,
  ProductSearchResult,
} from "../../../lib/product-search/types";
import { calculateOffer } from "../../../lib/product-search/validation";
const labels = {
  exact: "Exacto",
  close: "Muy parecido",
  alternative: "Alternativa",
  unconfirmed: "Sin confirmar",
};
export default function NexoBuscaClient() {
  const [preview, setPreview] = useState(""),
    [result, setResult] = useState<NexoSearchResponse | null>(null),
    [selected, setSelected] = useState<ProductSearchResult | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [quantity, setQuantity] = useState(1),
    [mode, setMode] = useState<"fixed" | "percent" | "final">("fixed"),
    [markup, setMarkup] = useState(5),
    [delivery, setDelivery] = useState(0),
    [audience, setAudience] = useState<"gestora" | "client">("gestora");
  const offer = useMemo(
    () =>
      selected?.price == null
        ? null
        : calculateOffer({
            cost: selected.price,
            quantity,
            mode,
            markup,
            delivery,
          }),
    [selected, quantity, mode, markup, delivery],
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/gestoras/busca", {
          method: "POST",
          body: new FormData(e.currentTarget),
        }),
        b = await r.json();
      if (!r.ok) throw new Error(b.error);
      setResult(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos buscar.");
    } finally {
      setBusy(false);
    }
  }
  const message = useMemo(() => {
    if (!selected) return "";
    const price = offer
      ? `${offer.productTotal.toFixed(2)} ${selected.currency}`
      : "precio por confirmar";
    return audience === "client"
      ? `Hola. Estuve buscando ${result?.hypothesis.name || "el producto"} y encontré esta opción:\n\n• ${selected.title}\n• ${price}${delivery ? `\n• Mensajería: ${delivery.toFixed(0)} CUP` : ""}\n\nLa disponibilidad debe confirmarse antes de reservar. Si te interesa, avísame y verifico todos los detalles.`
      : `Esto fue lo que encontré para ${result?.hypothesis.name}:\n\n${selected.title}\nPrecio observado: ${selected.priceLabel || price}\nZona: ${selected.location || "no indicada"}\nContacto: ${selected.phone || "no publicado"}\nEnlace: ${selected.url}\nCoincidencia: ${labels[selected.match]}\n\nAntes de ofrecerlo, confirma disponibilidad, precio actual, modelo, ubicación y recogida. No compres ni reserves hasta que la cliente confirme.${offer ? `\n\nOferta: ${offer.productTotal.toFixed(2)} ${selected.currency}. Ganancia estimada: ${offer.earning.toFixed(2)} ${selected.currency}. Mensajería separada: ${offer.delivery.toFixed(0)} CUP.` : ""}`;
  }, [selected, result, offer, audience, delivery]);
  return (
    <main className="impulsa-shell busca-shell">
      <header>
        <div>
          <span>NEXO IMPULSA</span>
          <strong>NEXO Busca</strong>
        </div>
        <a href="/impulsa">Mi oficina</a>
      </header>
      <section className="busca-hero">
        <span>BUSCAR PARA UN CLIENTE</span>
        <h1>Encuentra lo que te están pidiendo.</h1>
        <p>
          Sube una foto o captura. NEXO identifica el producto, busca opciones
          actuales y te ayuda a preparar la oferta.
        </p>
        <aside>🔒 Evita información personal innecesaria en la captura.</aside>
      </section>
      <section className="busca-grid">
        <form className="busca-card busca-form" onSubmit={submit}>
          <h2>1. Sube la solicitud</h2>
          <label className="upload-zone">
            {preview ? (
              <img src={preview} alt="Vista previa" />
            ) : (
              <>
                <b>📷 Añadir foto o captura</b>
                <small>JPG, PNG o WebP · máximo 8 MB</small>
              </>
            )}
            <input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPreview(URL.createObjectURL(f));
              }}
            />
          </label>
          <label>
            ¿Qué explicó la cliente?
            <textarea
              name="context"
              placeholder="Ej.: quiere la capa roja para conducir"
            />
          </label>
          <label>
            Zona del cliente
            <input name="location" placeholder="Municipio o reparto" />
          </label>
          <button disabled={busy}>
            {busy ? "Investigando opciones…" : "Analizar y buscar"}
          </button>
          {busy && (
            <p role="status">
              Revisando la imagen y comparando fuentes actuales…
            </p>
          )}
          {error && (
            <p className="busca-error" role="alert">
              {error}
            </p>
          )}
        </form>
        {result && (
          <article className="busca-card understood">
            <span>NEXO ENTENDIÓ ESTO</span>
            <h2>{result.hypothesis.name}</h2>
            <p>{result.hypothesis.request}</p>
            <div className="confidence">
              <i style={{ width: `${result.hypothesis.confidence * 100}%` }} />
            </div>
            <small>
              {Math.round(result.hypothesis.confidence * 100)}% de confianza ·
              revisa antes de ofrecer
            </small>
            {result.hypothesis.distinction && (
              <aside>{result.hypothesis.distinction}</aside>
            )}
            <ul>
              {result.hypothesis.visibleAttributes.map((x) => (
                <li key={x}>✓ {x}</li>
              ))}
            </ul>
            {result.hypothesis.missingImportant.length > 0 && (
              <div className="missing">
                <b>Conviene confirmar</b>
                {result.hypothesis.missingImportant.map((x) => (
                  <span key={x}>{x}</span>
                ))}
              </div>
            )}
          </article>
        )}
      </section>
      {result && (
        <section className="results">
          <header>
            <span>2. OPCIONES ENCONTRADAS</span>
            <h2>
              {result.results.length
                ? `${result.results.length} opciones para comparar`
                : "Sin opciones verificables"}
            </h2>
            <p>{result.summary}</p>
          </header>
          <div className="result-list">
            {result.results.map((item) => (
              <article
                className={
                  selected?.id === item.id
                    ? "result-card selected"
                    : "result-card"
                }
                key={item.id}
              >
                <div className="result-top">
                  <b className={`match ${item.match}`}>{labels[item.match]}</b>
                  <small>
                    {item.availability === "advertised"
                      ? "Disponibilidad anunciada"
                      : "Por confirmar"}
                  </small>
                </div>
                <h3>{item.title}</h3>
                <strong>
                  {item.priceLabel ||
                    (item.price == null
                      ? "Consultar"
                      : `${item.price} ${item.currency}`)}
                </strong>
                <p>
                  {item.location || "Ubicación no indicada"}
                  {item.phone && (
                    <>
                      {" "}
                      · <a href={`tel:${item.phone}`}>{item.phone}</a>
                    </>
                  )}
                </p>
                <small>
                  {item.source} · {item.observedAt || "consulta actual"}
                </small>
                <p>{item.note}</p>
                <footer>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    Ver fuente
                  </a>
                  <button onClick={() => setSelected(item)}>
                    {selected?.id === item.id
                      ? "Seleccionada"
                      : "Elegir opción"}
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </section>
      )}
      {selected && (
        <section className="offer">
          <header>
            <span>3. PREPARA TU OFERTA</span>
            <h2>Precio y mensaje</h2>
          </header>
          <div className="offer-grid">
            <div className="busca-card calculator">
              <label>
                Cantidad
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Number(e.target.value)))
                  }
                />
              </label>
              <label>
                Margen
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                >
                  <option value="fixed">Sumar importe fijo</option>
                  <option value="percent">Sumar porcentaje</option>
                  <option value="final">Definir precio final</option>
                </select>
              </label>
              <label>
                {mode === "percent"
                  ? "Porcentaje"
                  : mode === "final"
                    ? "Precio final"
                    : "Importe adicional"}
                <input
                  type="number"
                  min="0"
                  step=".01"
                  value={markup}
                  onChange={(e) => setMarkup(Number(e.target.value))}
                />
              </label>
              <label>
                Mensajería CUP
                <input
                  type="number"
                  min="0"
                  value={delivery}
                  onChange={(e) => setDelivery(Number(e.target.value))}
                />
              </label>
              {offer && (
                <div className="summary">
                  <p>
                    <span>Coste observado</span>
                    <b>
                      {offer.cost.toFixed(2)} {selected.currency}
                    </b>
                  </p>
                  <p>
                    <span>Precio producto</span>
                    <b>
                      {offer.productTotal.toFixed(2)} {selected.currency}
                    </b>
                  </p>
                  <p>
                    <span>Ganancia estimada</span>
                    <b>
                      {offer.earning.toFixed(2)} {selected.currency}
                    </b>
                  </p>
                  <p>
                    <span>Mensajería separada</span>
                    <b>{offer.delivery.toFixed(0)} CUP</b>
                  </p>
                </div>
              )}
            </div>
            <div className="busca-card message">
              <nav>
                <button
                  className={audience === "gestora" ? "active" : ""}
                  onClick={() => setAudience("gestora")}
                >
                  Para mi trabajo
                </button>
                <button
                  className={audience === "client" ? "active" : ""}
                  onClick={() => setAudience("client")}
                >
                  Para la cliente
                </button>
              </nav>
              <textarea value={message} readOnly />
              <button onClick={() => navigator.clipboard.writeText(message)}>
                Copiar mensaje
              </button>
              <small>NEXO no contacta ni reserva automáticamente.</small>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
