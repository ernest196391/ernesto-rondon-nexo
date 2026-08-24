import type { Metadata } from "next";
import Link from "next/link";
import { specialists } from "../../lib/studio/catalog";
import NewProjectForm from "./NewProjectForm";
import "./studio.css";

export const metadata: Metadata = {
  title: "Studio",
  description: "NEXO Studio convierte contexto en diagnósticos, prototipos, contenido y sistemas ejecutables.",
};

const stages = [
  ["01", "Contexto", "URL, archivos, objetivo y restricciones."],
  ["02", "Especialista", "NEXO prepara la herramienta adecuada para la tarea."],
  ["03", "Ejecución", "Datos, análisis, revisión humana y acciones trazables."],
  ["04", "Resultado", "Informe, propuesta, prototipo, contenido o sistema."],
];

const specialistRoutes: Record<string, string> = {
  "web-studio": "/studio/web",
  "commerce-audit": "/studio/commerce",
  "brand-intelligence": "/studio/brand",
  "creator-intelligence": "/studio/creator",
};

export default function StudioPage() {
  return (
    <main className="studio-shell" id="main-content">
      <section className="studio-hero">
        <div className="studio-kicker">NEXO STUDIO</div>
        <div className="studio-hero-grid">
          <div>
            <h1>Trae el proyecto. NEXO organiza el trabajo.</h1>
            <p>Una sola base para analizar, construir y mejorar negocios con especialistas, herramientas y procesos verificables.</p>
            <div className="studio-actions">
              <Link className="studio-button primary" href="/studio/web">Probar Web Studio →</Link>
              <a className="studio-button secondary" href="#especialistas">Ver especialistas</a>
            </div>
          </div>
          <aside className="studio-status-card" aria-label="Estado de NEXO Studio">
            <div className="studio-status-dot" />
            <div>
              <span>Estado actual</span>
              <strong>Cuatro especialistas activos</strong>
              <p>Web, Commerce, Brand y Creator ya tienen una primera ejecución real basada en evidencia pública.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="studio-flow" aria-label="Cómo funciona NEXO Studio">
        {stages.map(([n, title, description]) => <article key={n}><span>{n}</span><h2>{title}</h2><p>{description}</p></article>)}
      </section>

      <section className="studio-section" id="nuevo-proyecto">
        <div className="studio-section-heading"><div><div className="studio-kicker">EMPEZAR</div><h2>Primer proyecto</h2></div><p>Menos configuración. Más contexto útil.</p></div>
        <NewProjectForm />
      </section>

      <section className="studio-section" id="especialistas">
        <div className="studio-section-heading"><div><div className="studio-kicker">ESPECIALISTAS</div><h2>Un sistema, distintas capacidades.</h2></div><p>Los kits fuente se convierten en especialistas portables de NEXO.</p></div>
        <div className="studio-catalog">
          {specialists.map((item) => {
            const content = <><div className="studio-specialist-top"><span className="studio-index">{item.accent}</span><span className={`studio-chip ${item.status}`}>{item.status === "ready" ? "Disponible" : "Planificado"}</span></div><h3>{item.shortName}</h3><p>{item.description}</p><div className="studio-input-hint">Entrada · {item.inputHint}</div></>;
            const route = specialistRoutes[item.id];
            return route ? <Link className="studio-specialist" key={item.id} href={route} style={{ textDecoration: "none", color: "inherit" }}>{content}</Link> : <article className="studio-specialist" key={item.id}>{content}</article>;
          })}
        </div>
      </section>

      <section className="studio-next">
        <div><div className="studio-kicker">MOTORES ACTIVOS</div><h2>Auditorías trazables antes de automatizar.</h2><p>Web Studio lidera reconstrucción. Commerce, Brand y Creator comparten el principio evidencia → interpretación → acción.</p></div>
        <Link className="studio-button secondary" href="/studio/commerce">Abrir Commerce Audit</Link>
      </section>
    </main>
  );
}
