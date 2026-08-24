"use client";

import { FormEvent, useState } from "react";

type Result = {
  result?: { response: string; intent: string; leadScore: number; handoff: boolean };
  guardrails?: { blocked: boolean; reason: string | null };
  provider?: string;
  error?: string;
};

export default function ConversationsClient() {
  const [businessName, setBusinessName] = useState("Casa Viva");
  const [objective, setObjective] = useState("Atender consultas, calificar necesidades y llevar al cliente al siguiente paso sin inventar datos.");
  const [allowedPrices, setAllowedPrices] = useState("");
  const [allowedHosts, setAllowedHosts] = useState("casavivadecuba.com");
  const [handoffKeywords, setHandoffKeywords] = useState("humano, reclamación, queja, devolución, denuncia");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<Result | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setOutput(null);
    try {
      const response = await fetch("/api/studio/conversations/reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessName, objective, allowedPrices, allowedHosts, handoffKeywords, message }),
      });
      const data = (await response.json()) as Result;
      if (!response.ok) throw new Error(data.error || "No se pudo simular la respuesta.");
      setOutput(data);
    } catch (error) {
      setOutput({ error: error instanceof Error ? error.message : "No se pudo simular la respuesta." });
    } finally {
      setLoading(false);
    }
  }

  return <div className="conversations-app">
    <section className="conversation-config">
      <div className="conversation-grid two">
        <label>Negocio<input value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></label>
        <label>Objetivo<input value={objective} onChange={(e) => setObjective(e.target.value)} /></label>
      </div>
      <div className="conversation-grid three">
        <label>Precios autorizados<textarea value={allowedPrices} onChange={(e) => setAllowedPrices(e.target.value)} placeholder="90 USD, 320 USD" /></label>
        <label>Hosts autorizados<textarea value={allowedHosts} onChange={(e) => setAllowedHosts(e.target.value)} placeholder="midominio.com" /></label>
        <label>Palabras de handoff<textarea value={handoffKeywords} onChange={(e) => setHandoffKeywords(e.target.value)} /></label>
      </div>
    </section>

    <form className="conversation-simulator" onSubmit={submit}>
      <div className="conversation-sim-head"><div><span>SIMULADOR</span><h2>Prueba una conversación antes de conectar WhatsApp.</h2></div><small>IA si hay proveedor configurado; fallback determinista si no.</small></div>
      <label htmlFor="conversation-message">Mensaje del cliente</label>
      <textarea id="conversation-message" required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hola, ¿cuánto cuesta y cómo puedo comprar?" />
      <button disabled={loading}>{loading ? "Simulando…" : "Simular respuesta →"}</button>
    </form>

    {output?.error && <div className="conversation-error" role="alert">{output.error}</div>}
    {output?.result && <section className="conversation-result" aria-live="polite">
      <div className="conversation-bubble customer">{message}</div>
      <div className="conversation-bubble agent">{output.result.response}</div>
      <div className="conversation-meta">
        <span>Intent · <strong>{output.result.intent}</strong></span>
        <span>Lead · <strong>{output.result.leadScore}/100</strong></span>
        <span>Handoff · <strong>{output.result.handoff ? "Sí" : "No"}</strong></span>
        <span>Motor · <strong>{output.provider}</strong></span>
      </div>
      {output.guardrails?.blocked && <aside className="conversation-guardrail"><strong>Guardrail activado</strong><span>{output.guardrails.reason}</span></aside>}
    </section>}
  </div>;
}
