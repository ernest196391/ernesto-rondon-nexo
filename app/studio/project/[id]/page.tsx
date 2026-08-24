import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "../../../../lib/studio/db";
import { specialists } from "../../../../lib/studio/catalog";
import ProjectActions from "./ProjectActions";
import "../../studio.css";

export const dynamic = "force-dynamic";

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

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const specialist = specialists.find((item) => item.id === project.specialistId);
  const route = project.specialistId ? specialistRoutes[project.specialistId] : undefined;
  const artifacts = project.runs.flatMap((run) => run.artifacts ?? []);

  return (
    <main className="studio-shell" id="main-content">
      <section className="studio-hero">
        <div className="studio-kicker">PROYECTO · {project.status.toUpperCase()}</div>
        <div className="studio-hero-grid">
          <div>
            <h1>{project.name}</h1>
            <p>{project.objective}</p>
            <div className="studio-actions">
              {route ? <Link className="studio-button primary" href={route}>Abrir {specialist?.shortName ?? "especialista"} →</Link> : null}
              <Link className="studio-button secondary" href="/studio#proyectos">Volver a proyectos</Link>
            </div>
          </div>
          <aside className="studio-status-card">
            <div className="studio-status-dot" />
            <div>
              <span>Memoria operativa</span>
              <strong>{project.runs.length} runs · {project.memory?.length ?? 0} notas · {artifacts.length} artefactos</strong>
              <p>Última actualización: {new Date(project.updatedAt).toLocaleString("es")}</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="studio-section">
        <div className="studio-section-heading"><div><div className="studio-kicker">CONTEXTO</div><h2>Lo que NEXO conserva.</h2></div><p>{project.businessType}</p></div>
        <div className="studio-panel">
          {project.context ? <p>{project.context}</p> : <p className="studio-note">Sin contexto adicional todavía.</p>}
          <div className="studio-summary-grid">
            <div><span>Especialista</span><strong>{specialist?.name ?? project.specialistId ?? "Sin asignar"}</strong></div>
            <div><span>Fuentes</span><strong>{project.sources.length}</strong></div>
            <div><span>Estado</span><strong>{project.status}</strong></div>
          </div>
        </div>
      </section>

      <section className="studio-section">
        <div className="studio-section-heading"><div><div className="studio-kicker">HISTORIAL</div><h2>Runs y artefactos.</h2></div><p>Trazabilidad de ejecución.</p></div>
        <div className="studio-panel">
          {project.runs.length === 0 ? <p className="studio-note">Todavía no hay runs. Crea el primero para iniciar la ejecución trazable.</p> : (
            <div className="studio-catalog">
              {project.runs.slice().reverse().map((run) => (
                <article className="studio-specialist" key={run.id}>
                  <div className="studio-specialist-top"><span className="studio-index">RUN</span><span className="studio-chip ready">{run.status}</span></div>
                  <h3>{specialists.find((item) => item.id === run.specialistId)?.shortName ?? run.specialistId}</h3>
                  <p>{new Date(run.createdAt).toLocaleString("es")}</p>
                  <div className="studio-input-hint">Artefactos · {run.artifacts.length}</div>
                  {run.artifacts.map((artifact) => <div className="studio-input-hint" key={artifact.id}>{artifact.kind} · {artifact.title}</div>)}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="studio-section">
        <div className="studio-section-heading"><div><div className="studio-kicker">MEMORIA</div><h2>Decisiones que sobreviven al chat.</h2></div><p>Hechos, decisiones y restricciones.</p></div>
        <div className="studio-panel">
          {(project.memory?.length ?? 0) === 0 ? <p className="studio-note">Aún no hay memoria explícita para este proyecto.</p> : (
            <div className="studio-catalog">
              {project.memory?.slice().reverse().map((entry) => (
                <article className="studio-specialist" key={entry.id}>
                  <div className="studio-specialist-top"><span className="studio-index">MEM</span><span className="studio-chip ready">{entry.kind}</span></div>
                  <p>{entry.text}</p>
                  <div className="studio-input-hint">{new Date(entry.createdAt).toLocaleString("es")}</div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <ProjectActions projectId={project.id} specialistId={project.specialistId} />
    </main>
  );
}
