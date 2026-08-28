"use client";

import { FormEvent, useState } from "react";

type AssistantReply = {
  status?: string;
  answer?: {
    answer?: string;
    confidence?: "confirmed" | "probable" | "unknown";
    needsHumanConfirmation?: boolean;
    productId?: string | null;
  };
  error?: string;
};

const suggestions = [
  "¿Qué características están confirmadas?",
  "¿Qué debo saber antes de comprarlo?",
  "¿Está disponible y cuál es el precio actual?",
];

export default function ProductAssistant({ productId, productName }: { productId: number; productName: string }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<"confirmed" | "probable" | "unknown" | null>(null);
  const [needsHumanConfirmation, setNeedsHumanConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(value: string) {
    const clean = value.trim();
    if (!clean || loading) return;
    setQuestion(clean);
    setLoading(true);
    setError(null);
    setAnswer(null);
    setConfidence(null);
    setNeedsHumanConfirmation(false);

    try {
      const response = await fetch("/api/assistant/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: String(productId), question: clean }),
      });
      const payload = await response.json() as AssistantReply;
      if (!response.ok) throw new Error(payload.error || "No pudimos consultar a NEXO ahora mismo.");
      const text = payload.answer?.answer?.trim();
      if (!text) throw new Error("NEXO no devolvió una respuesta utilizable.");
      setAnswer(text);
      setConfidence(payload.answer?.confidence ?? null);
      setNeedsHumanConfirmation(Boolean(payload.answer?.needsHumanConfirmation));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos consultar a NEXO ahora mismo.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  return <section className="product-assistant" aria-labelledby="product-assistant-title">
    <button
      className="assistant-toggle"
      type="button"
      aria-expanded={open}
      aria-controls="product-assistant-panel"
      onClick={() => setOpen((current) => !current)}
    >
      <span className="assistant-icon" aria-hidden="true">✦</span>
      <span><b>Pregunta a NEXO</b><small>Resuelve dudas sobre {productName}</small></span>
      <span aria-hidden="true">{open ? "−" : "+"}</span>
    </button>

    {open && <div id="product-assistant-panel" className="assistant-panel">
      <p id="product-assistant-title">Te respondo usando la información verificada de este producto. Si un dato no está confirmado, te lo diré.</p>

      <div className="assistant-suggestions" aria-label="Preguntas sugeridas">
        {suggestions.map((suggestion) => <button key={suggestion} type="button" disabled={loading} onClick={() => void ask(suggestion)}>{suggestion}</button>)}
      </div>

      <form onSubmit={submit} className="assistant-form">
        <label htmlFor="nexo-product-question">Tu pregunta</label>
        <div className="assistant-input-row">
          <input
            id="nexo-product-question"
            value={question}
            maxLength={500}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ej. ¿Cuánto dura la batería?"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !question.trim()}>{loading ? "Consultando…" : "Preguntar"}</button>
        </div>
      </form>

      <div aria-live="polite" aria-atomic="true">
        {loading && <p className="assistant-status">NEXO está revisando la ficha verificada…</p>}
        {error && <div className="assistant-error" role="alert"><b>No pudimos responder.</b><p>{error}</p></div>}
        {answer && <div className="assistant-answer">
          <p>{answer}</p>
          {(confidence === "probable" || confidence === "unknown" || needsHumanConfirmation) && <small>Hay información que todavía requiere confirmación de NEXO.</small>}
        </div>}
      </div>
    </div>}
  </section>;
}
