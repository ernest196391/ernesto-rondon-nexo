import ConversationsClient from "./ConversationsClient";
import "./conversations.css";

export default function ConversationsPage() {
  return <main className="conversations-page" id="main-content">
    <a className="conversations-back" href="/studio">← NEXO Studio</a>
    <section className="conversations-hero">
      <span>NEXO CONVERSATIONS · 02</span>
      <h1>Diseña, prueba y blinda el agente antes de conectarlo a un canal real.</h1>
      <p>Esta fase conserva del Kit 02 lo más valioso: configuración por negocio, guardrails, calificación de leads y handoff humano. El transporte queda desacoplado para priorizar WhatsApp Business Platform oficial en producción.</p>
    </section>
    <ConversationsClient />
  </main>;
}
