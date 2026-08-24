import Link from "next/link";
import type { Metadata } from "next";
import WebAuditClient from "./WebAuditClient";
import "./web-audit.css";

export const metadata: Metadata = {
  title: "Web Studio",
  description: "Detecta qué está frenando una web y convierte el diagnóstico en una propuesta de mejora.",
};

export default function WebStudioPage() {
  return (
    <main className="web-studio-page" id="main-content">
      <div className="web-studio-topbar"><Link href="/studio">← NEXO Studio</Link></div>
      <section className="web-studio-hero">
        <div className="web-audit-kicker">MEJORAR UNA WEB</div>
        <h1>Pega una URL. NEXO te dice qué corregir primero.</h1>
        <p>Analiza la página en modo lectura, detecta cinco problemas concretos y prepara una propuesta estructural para revisarla.</p>
      </section>
      <WebAuditClient />
    </main>
  );
}
