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

export default function StudioPage() {
  return (
    <main className="studio-shell" id="main-content">
      <section className="studio-hero">
        <div className="studio-kicker">NEXO STUDIO · FOUNDATION</div>
        <div className="studio-hero-grid">
          <div>
            <h1>Trae el proyecto. NEXO organiza el trabajo.</h1>
            <p>
              Una sola base para analizar, construir y mejorar negocios con especialistas de IA, herramientas y procesos verificables.
            </p>
            <div className="studio-actions">
              <a className="studio-button primary" href="#nuevo-proyecto">Nuevo proyecto →</a>
              <a className="studio-button secondary" href="#especialistas">Explorar especialistas</a>
            </div>
          </div>
          <aside className="studio-status-card" aria-label="Estado de NEXO Studio">
            <div className="studio-status-dot" />
            <div>
              <span>Estado actual</span>
              <strong>Foundation activa</strong>
              <p>Proyectos locales, catálogo y contratos base listos para conectar el primer motor real.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="studio-flow" aria-label="Cómo funciona NEXO Studio">
        {stages.map(([n, title, description]) => (
          <article key={n}>
            <span>{n}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section className="studio-section" id="nuevo-proyecto">
        <div className="studio-section-heading">
          <div>
            <div className="studio-kicker">EMPEZAR</div>
            <h2>Primer proyecto</h2>
          </div>
          <p>Menos configuración. Más contexto útil.</p>
        </div>
        <NewProjectForm />
      </section>

      <section className="studio-section" id="especialistas">
        <div className="studio-section-heading">
          <div>
            <div className="studio-kicker">ESPECIALISTAS</div>
            <h2>Un sistema, distintas capacidades.</h2>
          </div>
          <p>Los siete kits originales se convierten en especialistas portables de NEXO.</p>
        </div>
        <div className="studio-catalog">
          {specialists.map((item) => (
            <article className="studio-specialist" key={item.id}>
              <div className="studio-specialist-top">
                <span className="studio-index">{item.accent}</span>
                <span className={`studio-chip ${item.status}`}>{item.status === "ready" ? "Base lista" : "Planificado"}</span>
              </div>
              <h3>{item.shortName}</h3>
              <p>{item.description}</p>
              <div className="studio-input-hint">Entrada · {item.inputHint}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="studio-next">
        <div>
          <div className="studio-kicker">SIGUIENTE BLOQUE</div>
          <h2>Web Studio será el primer motor real.</h2>
          <p>URL → adquisición segura → diagnóstico → brief detectado → propuesta de mejora → prototipo.</p>
        </div>
        <Link className="studio-button secondary" href="/herramientas">Ver herramientas actuales</Link>
      </section>
    </main>
  );
}
