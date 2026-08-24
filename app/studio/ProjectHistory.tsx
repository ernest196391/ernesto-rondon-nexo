"use client";

import { useEffect, useState } from "react";
import { specialists } from "../../lib/studio/catalog";
import type { Project } from "../../lib/studio/types";

export default function ProjectHistory() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProjects() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/studio/projects", { cache: "no-store" });
      if (!response.ok) throw new Error("unavailable");
      const data = (await response.json()) as { projects: Project[] };
      setProjects(data.projects);
    } catch {
      setError("No pudimos cargar el historial de proyectos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
    const handler = () => void loadProjects();
    window.addEventListener("nexo-studio-projects-changed", handler);
    return () => window.removeEventListener("nexo-studio-projects-changed", handler);
  }, []);

  return (
    <div className="studio-panel" aria-live="polite">
      <div className="studio-kicker">PROYECTOS</div>
      <h2>Continúa donde lo dejaste.</h2>
      <p className="studio-intro">Los proyectos guardados en NEXO aparecen aquí, también cuando vuelvas desde otro dispositivo.</p>

      {loading ? <p className="studio-note">Cargando proyectos…</p> : null}
      {error ? <p className="studio-note" role="alert">{error}</p> : null}
      {!loading && !error && projects.length === 0 ? <p className="studio-note">Todavía no hay proyectos guardados. Crea el primero arriba.</p> : null}

      {!loading && projects.length > 0 ? (
        <div className="studio-catalog">
          {projects.slice(0, 8).map((project) => {
            const specialist = specialists.find((item) => item.id === project.specialistId);
            const source = project.sources.find((item) => item.type === "url");
            return (
              <article className="studio-specialist" key={project.id}>
                <div className="studio-specialist-top">
                  <span className="studio-index">{specialist?.accent ?? "NX"}</span>
                  <span className="studio-chip ready">{project.status}</span>
                </div>
                <h3>{project.name}</h3>
                <p>{project.objective}</p>
                <div className="studio-input-hint">Especialista · {specialist?.shortName ?? project.specialistId ?? "Sin asignar"}</div>
                {source ? <div className="studio-input-hint">Fuente · {source.value}</div> : null}
                <div className="studio-input-hint">Actualizado · {new Date(project.updatedAt).toLocaleString("es")}</div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
