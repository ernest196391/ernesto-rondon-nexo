import BusinessAuditClient from "./BusinessAuditClient";
import "./business.css";

export default function BusinessAuditPage() {
  return <main className="business-page" id="main-content">
    <a className="business-back" href="/studio">← NEXO Studio</a>
    <section className="business-hero">
      <span>AUDITORÍA DE NEGOCIO</span>
      <h1>Descubre qué está frenando el negocio.</h1>
      <p>Combina lo que ve un cliente con cómo funciona el negocio por dentro y convierte ambas partes en prioridades claras.</p>
    </section>
    <BusinessAuditClient />
  </main>;
}
