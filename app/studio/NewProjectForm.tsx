"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { specialists } from "../../lib/studio/catalog";
import type { Project } from "../../lib/studio/types";

type FormState = {
  name: string;
  businessType: string;
  objective: string;
  url: string;
  context: string;
  specialistId: string;
};

const initialState: FormState = {
  name: "",
  businessType: "",
  objective: "",
  url: "",
  context: "",
  specialistId: "web-studio",
};

async function persistProject(project: Project) {
  const response = await fetch("/api/studio/projects", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(project),
  });
  if (!response.ok) throw new Error("No se pudo guardar el proyecto.");
  const data = (await response.json()) as { project: Project };
  return data.project;
}

export default function NewProjectForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [created, setCreated] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [migrated, setMigrated] = useState(false);

  const selected = useMemo(
    () => specialists.find((item) => item.id === form.specialistId),
    [form.specialistId],
  );

  useEffect(() => {
    const raw = window.localStorage.getItem("nexo-studio-last-project");
    if (!raw) return;
    try {
      const legacy = JSON.parse(raw) as Project;
      persistProject(legacy)
        .then(() => {
          window.localStorage.removeItem("nexo-studio-last-project");
          setMigrated(true);
          window.dispatchEvent(new Event("nexo-studio-projects-changed"));
        })
        .catch(() => undefined);
    } catch {
      // Preserve an unreadable legacy draft rather than deleting user data.
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const now = new Date().toISOString();
    const project: Project = {
      id: `project-${Date.now()}`,
      name: form.name.trim(),
      businessType: form.businessType.trim(),
      objective: form.objective.trim(),
      context: form.context.trim() || undefined,
      specialistId: form.specialistId,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      sources: form.url.trim()
        ? [{ id: `source-${Date.now()}`, type: "url", label: "Sitio principal", value: form.url.trim() }]
        : [],
      runs: [],
    };

    try {
      const saved = await persistProject(project);
      setCreated(saved);
      window.dispatchEvent(new Event("nexo-studio-projects-changed"));
    } catch {
      setError("No pudimos guardar el proyecto en NEXO. Intenta de nuevo en unos segundos.");
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <section className="studio-panel studio-success" aria-live="polite">
        <div className="studio-kicker">PROYECTO GUARDADO</div>
        <h2>{created.name}</h2>
        <p>
          NEXO ya conserva el contexto del proyecto. El siguiente paso será ejecutar <strong>{selected?.name}</strong> con un run trazable.
        </p>
        <div className="studio-summary-grid">
          <div><span>Objetivo</span><strong>{created.objective}</strong></div>
          <div><span>Estado</span><strong>Guardado en NEXO</strong></div>
          <div><span>Especialista</span><strong>{selected?.shortName}</strong></div>
        </div>
        <div className="studio-actions">
          <button className="studio-button" type="button" onClick={() => setCreated(null)}>Crear otro proyecto</button>
          <a className="studio-button secondary" href="#proyectos">Ver proyectos</a>
        </div>
        <p className="studio-note">El proyecto queda disponible en el servidor para continuar desde otro dispositivo.</p>
      </section>
    );
  }

  return (
    <form className="studio-panel studio-form" onSubmit={submit}>
      <div className="studio-kicker">NUEVO PROYECTO</div>
      <h2>Cuéntale a NEXO qué quieres conseguir.</h2>
      <p className="studio-intro">Solo pedimos lo necesario para preparar el trabajo. Podrás ampliar el contexto después.</p>
      {migrated ? <p className="studio-note" role="status">Tu último borrador local se migró a NEXO.</p> : null}
      {error ? <p className="studio-note" role="alert">{error}</p> : null}

      <label>
        <span>Nombre del proyecto</span>
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Casa Viva — nueva tienda" />
      </label>

      <div className="studio-two-cols">
        <label>
          <span>Tipo de negocio o proyecto</span>
          <input required value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} placeholder="E-commerce, restaurante, marca personal…" />
        </label>
        <label>
          <span>URL <small>opcional</small></span>
          <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" />
        </label>
      </div>

      <label>
        <span>Objetivo principal</span>
        <textarea required rows={3} value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="Qué quieres mejorar, validar, construir o automatizar." />
      </label>

      <label>
        <span>Especialista</span>
        <select value={form.specialistId} onChange={(e) => setForm({ ...form, specialistId: e.target.value })}>
          {specialists.map((item) => <option key={item.id} value={item.id}>{item.shortName}{item.status === "planned" ? " · próximamente" : ""}</option>)}
        </select>
      </label>

      <label>
        <span>Contexto adicional <small>opcional</small></span>
        <textarea rows={4} value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} placeholder="Restricciones, público, competencia, información que NEXO deba tener en cuenta…" />
      </label>

      <div className="studio-selection" aria-live="polite">
        <div>
          <span className="studio-selection-label">NEXO sugiere</span>
          <strong>{selected?.name}</strong>
        </div>
        <p>{selected?.description}</p>
      </div>

      <button className="studio-button primary" type="submit" disabled={saving}>{saving ? "Guardando…" : "Preparar proyecto →"}</button>
      <p className="studio-note">El proyecto se guarda en NEXO. No se envía a proveedores de IA hasta que ejecutes un especialista.</p>
    </form>
  );
}
