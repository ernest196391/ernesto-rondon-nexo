import type { Metadata } from "next";
import Link from "next/link";
import { specialists } from "../../lib/studio/catalog";
import NewProjectForm from "./NewProjectForm";
import ProjectHistory from "./ProjectHistory";
import "./studio.css";

export const metadata: Metadata = {
  title: "Studio",
  description: "NEXO Studio organiza proyectos y convierte contexto en resultados utilizables.",
};

const stages = [
  ["01", "Cuenta el problema", "Objetivo, URL, archivos y contexto."],
  ["02", "NEXO trabaja", "El especialista analiza y prepara un resultado."],
  ["03", "Revisa y continúa", "Confirma, guarda y sigue desde el mismo proyecto."],
];

const specialistRoutes: Record<string, string> = {
  "web-studio": "/studio/web",
  conversations: "/studio/conversations",
  "business-audit": "/studio/business",
  "commerce-audit": "/studio/commerce",
  "brand-intelligence": "/studio/brand",
  "creator-intelligence": "/studio/creator",
  "content-studio": "/studio/content",
  "kit-builder": "/studio/kit-builder",
};

export default function StudioPage() {
  return <main className="studio-shell" id="main-content">
    <section className="studio-hero">
      <div className="studio-kicker">NEXO STUDIO</div>
      <div className="studio-hero-grid">
        <div>
          <h1>¿Qué quieres resolver?</h1>
          <p>Crea un proyecto, añade el contexto necesario y usa el especialista adecuado. NEXO guarda el trabajo para que puedas continuar después.</p>
          <div className="studio-actions">
            <a className="studio-button primary" href="#nuevo-proyecto">Crear proyecto →</a>
            <a className="studio-button secondary" href="#proyectos">Continuar proyecto</a>
          </div>
        </div>
        <aside className="studio-status-card">
          <div className="studio-status-dot" />
          <div>
            <span>Studio</span>
            <strong>9 especialistas disponibles</strong>
            <p>Auditorías, web, contenido, conversaciones y creación de nuevos especialistas desde una sola base.</p>
          </div>
        </aside>
      </div>
    </section>

    <section className="studio-flow">
      {stages.map(([n, t, d]) => <article key={n}><span>{n}</span><h2>{t}</h2><p>{d}</p></article>)}
    </section>

    <section className="studio-section" id="nuevo-proyecto">
      <div className="studio-section-heading"><div><div className="studio-kicker">EMPEZAR</div><h2>Nuevo proyecto</h2></div><p>Lo mínimo necesario para que NEXO entienda el trabajo.</p></div>
      <NewProjectForm />
    </section>

    <section className="studio-section" id="proyectos">
      <div className="studio-section-heading"><div><div className="studio-kicker">CONTINUAR</div><h2>Tus proyectos</h2></div><p>Retoma contexto, decisiones, ejecuciones y resultados guardados.</p></div>
      <ProjectHistory />
    </section>

    <section className="studio-section" id="especialistas">
      <div className="studio-section-heading"><div><div className="studio-kicker">HERRAMIENTAS</div><h2>¿Qué necesitas hacer?</h2></div><p>También puedes abrir un especialista directamente.</p></div>
      <div className="studio-catalog">
        <Link className="studio-specialist" href="/studio/products" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="studio-specialist-top"><span className="studio-index">P01</span><span className="studio-chip ready">Operativo</span></div>
          <h3>Product Studio</h3><p>Convierte fotografías reales en evidencia, investigación, precio y borrador de WooCommerce.</p><div className="studio-input-hint">Necesita · 1–8 fotografías del mismo producto</div>
        </Link>
        {specialists.map((item) => {
          const content = <>
            <div className="studio-specialist-top"><span className="studio-index">{item.accent}</span><span className={`studio-chip ${item.status}`}>{item.status === "ready" ? "Disponible" : "En preparación"}</span></div>
            <h3>{item.shortName}</h3>
            <p>{item.description}</p>
            <div className="studio-input-hint">Necesita · {item.inputHint}</div>
          </>;
          const route = specialistRoutes[item.id];
          return route ? <Link className="studio-specialist" key={item.id} href={route} style={{ textDecoration: "none", color: "inherit" }}>{content}</Link> : <article className="studio-specialist" key={item.id}>{content}</article>;
        })}
      </div>
    </section>
  </main>;
}
