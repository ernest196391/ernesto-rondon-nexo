import Link from "next/link";
import type { Metadata } from "next";
import WebAuditClient from "./WebAuditClient";
import "./web-audit.css";

export const metadata: Metadata = {
  title: "Web Studio",
  description: "Audita una web pública con NEXO Web Studio.",
};

export default function WebStudioPage() {
  return (
    <main className="web-studio-page" id="main-content">
      <div className="web-studio-topbar">
        <Link href="/studio">← Studio</Link>
        <span>Kit 01 · Cazador de webs → NEXO Web Studio</span>
      </div>

      <section className="web-studio-hero">
        <div className="web-audit-kicker">WEB STUDIO · MVP 0.1</div>
        <h1>Una URL deja de ser una opinión.</h1>
        <p>Reconocimiento seguro, evidencia observable y cinco hallazgos concretos antes de proponer cambios.</p>
      </section>

      <WebAuditClient />
    </main>
  );
}
