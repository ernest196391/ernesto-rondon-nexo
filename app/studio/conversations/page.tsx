import ConversationsClient from "./ConversationsClient";
import "./conversations.css";

export default function ConversationsPage() {
  return <main className="conversations-page" id="main-content">
    <a className="conversations-back" href="/studio">← NEXO Studio</a>
    <section className="conversations-hero">
      <span>ASISTENTE DE VENTAS</span>
      <h1>Prueba cómo debería responder antes de conectarlo a WhatsApp.</h1>
      <p>Define qué puede decir, cuándo debe pedir ayuda humana y ensaya conversaciones reales sin enviar nada.</p>
    </section>
    <ConversationsClient />
  </main>;
}
