"use client";
import { FormEvent, useEffect, useState } from "react";
type Product = { id: number; name: string };
export default function GlobalCommerceAssistant() {
  const [open, setOpen] = useState(false),
    [products, setProducts] = useState<Product[]>([]),
    [product, setProduct] = useState(""),
    [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open || products.length) return;
    void fetch("/api/marketplace/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setError("No pudimos cargar los productos."));
  }, [open, products.length]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!product || !question.trim()) return;
    setBusy(true);
    setError("");
    setAnswer("");
    try {
      const r = await fetch("/api/assistant/product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: product, question }),
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error || "No pudimos responder ahora.");
      setAnswer(d.answer?.answer || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos responder ahora.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <aside className="global-assistant">
      <button
        className="global-assistant-trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">✦</span> Pregunta a NEXO
      </button>
      {open && (
        <div className="global-assistant-panel">
          <header>
            <strong>Pregunta a NEXO</strong>
            <button
              aria-label="Cerrar asistente"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </header>
          <p>Elige un producto y consulta su información verificada.</p>
          <form onSubmit={submit}>
            <label>
              Producto
              <select
                required
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              >
                <option value="">Selecciona un producto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tu pregunta
              <input
                required
                maxLength={500}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ej. ¿Qué incluye?"
              />
            </label>
            <button disabled={busy}>
              {busy ? "Consultando…" : "Preguntar"}
            </button>
          </form>
          <div aria-live="polite">
            {error && <p className="assistant-global-error">{error}</p>}
            {answer && <p className="assistant-global-answer">{answer}</p>}
          </div>
        </div>
      )}
    </aside>
  );
}
