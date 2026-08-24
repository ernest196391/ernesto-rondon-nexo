"use client";

import { FormEvent, useMemo, useState } from "react";
import { generateKit, normalizeSlug, type KitBuilderInput } from "../../../lib/kit-builder/generate";

const initial: KitBuilderInput = {
  name: "",
  slug: "",
  problem: "",
  inputDescription: "",
  outputDescription: "",
  dataSources: "",
  qualityCriteria: "",
  risks: "",
};

export default function KitBuilderClient() {
  const [form, setForm] = useState(initial);
  const [generated, setGenerated] = useState<ReturnType<typeof generateKit> | null>(null);
  const suggestedSlug = useMemo(() => normalizeSlug(form.slug || form.name), [form.slug, form.name]);

  function update<K extends keyof KitBuilderInput>(key: K, value: KitBuilderInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setGenerated(generateKit({ ...form, slug: form.slug || suggestedSlug }));
  }

  function download(filename: string, content: string, type = "text/plain") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return <div className="kit-builder-app">
    <form onSubmit={submit} className="kit-builder-form">
      <div className="kit-grid two">
        <label>Nombre del especialista<input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Auditor de restaurantes" /></label>
        <label>Slug<input value={form.slug} onChange={(e) => update("slug", e.target.value)} placeholder={suggestedSlug || "auditor-restaurantes"} /></label>
      </div>
      <label>Problema repetitivo<textarea required value={form.problem} onChange={(e) => update("problem", e.target.value)} placeholder="Qué tarea repetitiva debe resolver y por qué importa." /></label>
      <div className="kit-grid two">
        <label>Entrada esperada<textarea required value={form.inputDescription} onChange={(e) => update("inputDescription", e.target.value)} placeholder="URL + menú + objetivo del negocio" /></label>
        <label>Salida esperada<textarea required value={form.outputDescription} onChange={(e) => update("outputDescription", e.target.value)} placeholder="Diagnóstico + prioridades + propuesta" /></label>
      </div>
      <div className="kit-grid three">
        <label>Fuentes / dependencias<textarea value={form.dataSources} onChange={(e) => update("dataSources", e.target.value)} placeholder="web pública, archivo CSV" /></label>
        <label>Criterios de calidad<textarea value={form.qualityCriteria} onChange={(e) => update("qualityCriteria", e.target.value)} placeholder="5 hallazgos trazables, cero datos inventados" /></label>
        <label>Riesgos<textarea value={form.risks} onChange={(e) => update("risks", e.target.value)} placeholder="PII, publicación, gasto externo" /></label>
      </div>
      <button type="submit">Construir contrato del kit →</button>
    </form>

    {generated && <section className="kit-output" aria-live="polite">
      <div className="kit-output-heading"><div><span>RESULTADO</span><h2>Kit portable listo para implementar.</h2><p>NEXO genera el contrato, no marca el especialista como terminado: todavía debe ejecutarse un caso de práctica y pasar QA.</p></div></div>
      <div className="kit-artifacts">
        <article><div><strong>manifest.json</strong><small>Contrato portable</small></div><button onClick={() => download("manifest.json", generated.manifest, "application/json")}>Descargar</button><pre>{generated.manifest}</pre></article>
        <article><div><strong>SPEC.md</strong><small>Problema, entrada, salida y gates</small></div><button onClick={() => download("SPEC.md", generated.spec)}>Descargar</button><pre>{generated.spec}</pre></article>
        <article><div><strong>workflow.md</strong><small>Runtime común NEXO</small></div><button onClick={() => download("workflow.md", generated.workflow)}>Descargar</button><pre>{generated.workflow}</pre></article>
      </div>
      <aside className="kit-checklist"><span>CHECKLIST ANTES DE READY</span><ul>{generated.checklist.map((item) => <li key={item}>{item}</li>)}</ul></aside>
    </section>}
  </div>;
}
