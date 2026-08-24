"use client";

import { FormEvent, useEffect, useState } from "react";

type Result = { result?: { response: string; intent: string; leadScore: number; handoff: boolean }; guardrails?: { blocked: boolean; reason: string | null }; provider?: string; error?: string };
type TransportState = { provider?: string; configured?: boolean; transport?: string; sendRequiresApproval?: boolean };

const goals = [
  "Atender consultas y llevar al cliente al siguiente paso sin inventar datos.",
  "Calificar oportunidades de venta y pedir ayuda humana cuando sea necesario.",
  "Responder preguntas frecuentes con información autorizada del negocio.",
  "Ayudar con pedidos y derivar incidencias a una persona.",
];

export default function ConversationsClient() {
  const [businessName, setBusinessName] = useState("Casa Viva");
  const [objective, setObjective] = useState(goals[0]);
  const [allowedPrices, setAllowedPrices] = useState("");
  const [allowedHosts, setAllowedHosts] = useState("casavivadecuba.com");
  const [handoffKeywords, setHandoffKeywords] = useState("humano, reclamación, queja, devolución, denuncia");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<Result | null>(null);
  const [transport, setTransport] = useState<TransportState | null>(null);

  useEffect(() => {
    fetch("/api/studio/conversations/provider", { cache: "no-store" }).then((response) => response.json()).then((data) => setTransport(data as TransportState)).catch(() => setTransport(null));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setOutput(null);
    try {
      const response = await fetch("/api/studio/conversations/reply", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ businessName, objective, allowedPrices, allowedHosts, handoffKeywords, message }) });
      const data = (await response.json()) as Result;
      if (!response.ok) throw new Error(data.error || "No se pudo probar la respuesta.");
      setOutput(data);
    } catch (error) { setOutput({ error: error instanceof Error ? error.message : "No se pudo probar la respuesta." }); }
    finally { setLoading(false); }
  }

  return <div className="conversations-app">
    <section className="conversation-config">
      <div className="conversation-sim-head">
        <div><span>CONFIGURACIÓN</span><h2>¿Qué debe hacer el asistente?</h2></div>
        <small>{transport?.configured ? "WhatsApp oficial preparado" : "Simulación segura · WhatsApp aún no conectado"}</small>
      </div>
      <div className="conversation-grid two">
        <label>Negocio<input value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></label>
        <label>Objetivo<select value={objective} onChange={(e) => setObjective(e.target.value)}>{goals.map((goal) => <option key={goal} value={goal}>{goal}</option>)}</select></label>
      </div>
      <details>
        <summary>Ajustes avanzados</summary>
        <div className="conversation-grid three">
          <label>Precios que puede mencionar<textarea value={allowedPrices} onChange={(e) => setAllowedPrices(e.target.value)} placeholder="90 USD, 320 USD" /></label>
          <label>Webs autorizadas<textarea value={allowedHosts} onChange={(e) => setAllowedHosts(e.target.value)} placeholder="midominio.com" /></label>
          <label>Cuándo pedir ayuda humana<textarea value={handoffKeywords} onChange={(e) => setHandoffKeywords(e.target.value)} /></label>
        </div>
      </details>
    </section>

    <form className="conversation-simulator" onSubmit={submit}>
      <div className="conversation-sim-head"><div><span>PRUEBA</span><h2>Escribe como si fueras un cliente.</h2></div><small>No se envía ningún mensaje real.</small></div>
      <label htmlFor="conversation-message">Mensaje del cliente</label>
      <textarea id="conversation-message" required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hola, ¿cuánto cuesta y cómo puedo comprar?" />
      <button disabled={loading}>{loading ? "Probando…" : "Ver respuesta →"}</button>
    </form>

    {output?.error && <div className="conversation-error" role="alert">{output.error}</div>}
    {output?.result && <section className="conversation-result" aria-live="polite">
      <div className="conversation-bubble customer">{message}</div>
      <div className="conversation-bubble agent">{output.result.response}</div>
      <div className="conversation-meta">
        <span>Intención · <strong>{output.result.intent}</strong></span>
        <span>Oportunidad · <strong>{output.result.leadScore}/100</strong></span>
        <span>Ayuda humana · <strong>{output.result.handoff ? "Sí" : "No"}</strong></span>
      </div>
      {output.guardrails?.blocked && <aside className="conversation-guardrail"><strong>Respuesta limitada por una regla</strong><span>{output.guardrails.reason}</span></aside>}
    </section>}
  </div>;
}
