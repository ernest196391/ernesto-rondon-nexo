"use client";

import { FormEvent, useEffect, useState } from "react";
import type { BusinessAuditResult } from "../../../lib/studio/business-audit";
import type { BusinessPublicResult } from "../../../lib/studio/business-public";

type UnifiedResult = {
  inside: BusinessAuditResult;
  outside: BusinessPublicResult | null;
  outsideError: string | null;
  reportHtml: string;
};

export default function BusinessAuditClient() {
  const [url, setUrl] = useState("");
  const [answers, setAnswers] = useState("");
  const [result, setResult] = useState<UnifiedResult | null>(null);
  const [privacyResult, setPrivacyResult] = useState<BusinessAuditResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportUrl, setReportUrl] = useState("");

  useEffect(() => () => { if (reportUrl) URL.revokeObjectURL(reportUrl); }, [reportUrl]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError(""); setResult(null); setPrivacyResult(null);
    if (reportUrl) URL.revokeObjectURL(reportUrl);
    setReportUrl("");
    try {
      const response = await fetch("/api/studio/business-audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers, url: url.trim() || undefined }),
      });
      const data = await response.json() as { result?: UnifiedResult | BusinessAuditResult; error?: string };
      if (response.status === 422 && data.result && "privacyBlocked" in data.result) {
        setPrivacyResult(data.result as BusinessAuditResult); return;
      }
      if (!response.ok || !data.result || !("inside" in data.result)) throw new Error(data.error || "No se pudo analizar el negocio.");
      const unified = data.result as UnifiedResult;
      setResult(unified);
      const blob = new Blob([unified.reportHtml], { type: "text/html;charset=utf-8" });
      setReportUrl(URL.createObjectURL(blob));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo analizar el negocio.");
    } finally { setLoading(false); }
  }

  const inside = result?.inside;
  const outside = result?.outside;

  return <>
    <form className="business-form" onSubmit={submit}>
      <label>Web pública del negocio <span className="business-optional">opcional, recomendada</span>
        <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://negocio.com" />
      </label>
      <label>Respuestas del formulario de 36 preguntas
        <textarea required value={answers} onChange={(event) => setAnswers(event.target.value)} placeholder="P1. Nombre del negocio…&#10;P7. Nos contactan por…&#10;P31. Las tareas repetitivas…" />
      </label>
      <div className="business-form-foot"><small>No pegues listados de clientes, historiales, facturas, contraseñas, tokens ni accesos.</small><button disabled={loading}>{loading ? "Analizando fuera + dentro…" : "Crear auditoría completa →"}</button></div>
    </form>

    {error && <div className="business-alert" role="alert">{error}</div>}
    {privacyResult?.privacyBlocked && <div className="business-alert danger"><strong>Privacidad: análisis detenido.</strong><p>{privacyResult.privacyReason}</p></div>}

    {result && inside && !inside.privacyBlocked && <section className="business-result" aria-live="polite">
      <header>
        <span>BUSINESS AUDIT · DOS MITADES</span>
        <div className="business-score-row">
          <div><small>Presencia digital</small><div className="business-score">{outside?.score ?? "—"}<small>/ 100</small></div><p>{outside?.band ?? (result.outsideError ? "URL no evaluada" : "sin URL pública")}</p></div>
          <div><small>Madurez interna</small><div className="business-score">{inside.maturity?.toFixed(1) ?? "—"}<small>/ 5</small></div><p>{inside.band}</p></div>
        </div>
        <p>NEXO no mezcla ambas notas. La presencia pública y la madurez operativa se leen juntas, pero se puntúan por separado.</p>
        {reportUrl && <div className="business-report-actions"><a href={reportUrl} target="_blank" rel="noreferrer">Abrir informe imprimible</a><a href={reportUrl} download="nexo-business-audit.html">Descargar HTML</a></div>}
      </header>

      {result.outsideError && <div className="business-alert"><strong>La parte interna sí terminó.</strong><p>No se pudo auditar la URL pública: {result.outsideError}</p></div>}

      {outside && <>
        <div className="business-section-title"><span>PARTE A · EXTERIOR</span><h2>11 dimensiones con evidencia</h2><p>Las dimensiones sin dos evidencias aparecen como “sin datos” y no reciben cero.</p></div>
        <div className="business-areas public-dimensions">{outside.dimensions.map((dimension) => <article key={dimension.id}>
          <div><span>{dimension.score ?? "—"}</span><h3>{dimension.name}</h3></div>
          <p><strong>Estado:</strong> {dimension.status === "scored" ? `${dimension.score}/100 · peso ${dimension.weight}` : `sin datos · peso ${dimension.weight}`}</p>
          {dimension.evidence.length ? <ul>{dimension.evidence.map((evidence) => <li key={evidence}>{evidence}</li>)}</ul> : <p>Sin dos evidencias concretas.</p>}
          <p><strong>Acción:</strong> {dimension.action}</p>
        </article>)}</div>

        <div className="business-section-title"><span>CRUCE EXTERIOR / INTERIOR</span><h2>Lo que no encaja</h2></div>
        {outside.crosses.length ? <div className="business-areas">{outside.crosses.map((cross) => <article key={cross.title}>
          <div><span>{cross.severity}</span><h3>{cross.title}</h3></div>
          <p><strong>Fuera:</strong> {cross.outsideEvidence}</p><p><strong>Dentro:</strong> {cross.insideEvidence}</p><p>{cross.implication}</p>
        </article>)}</div> : <aside><strong>Sin cruces demostrables</strong><p>La evidencia actual no permite afirmar una inconsistencia entre lo público y lo interno.</p></aside>}

        <div className="business-section-title"><span>MAPAS</span><h2>Recorrido actual → recorrido futuro</h2></div>
        <div className="business-journeys"><article><h3>Actual</h3><ol>{outside.currentJourney.map((step) => <li key={step}>{step}</li>)}</ol></article><article><h3>Futuro</h3><ol>{outside.futureJourney.map((step) => <li key={step}>{step}</li>)}</ol></article></div>
      </>}

      <div className="business-section-title"><span>PARTE B · INTERIOR</span><h2>Madurez tecnológica</h2></div>
      <div className="business-areas">{inside.areas.map((area) => <article key={area.name}><div><span>{area.level ?? "—"}</span><h3>{area.name}</h3></div><p><strong>Evidencia:</strong> {area.evidence}</p><p><strong>Para subir un nivel:</strong> {area.next}</p></article>)}</div>

      <aside><strong>Datos faltantes</strong><p>{inside.missing.length ? `Sin respuesta: ${inside.missing.map((n) => `P${n}`).join(", ")}. No se rellenan huecos.` : "Las 36 preguntas tienen contenido detectable."}</p><strong>Tiempo recuperable</strong><p>{inside.hoursNote}</p>{inside.recoverableTasks.map((task, index) => <p key={`${task.task}-${index}`}><strong>{task.task}</strong><br /><small>{task.formula}</small></p>)}</aside>

      {inside.stack.length > 0 && <div className="business-areas"><article><h3>Inventario del stack</h3>{inside.stack.map((item, index) => <p key={`${item.name}-${index}`}><strong>{item.verdict}</strong> · {item.name}{item.costMonthly !== null ? ` · ${item.costMonthly} €/mes` : ""}<br /><small>{item.evidence}</small></p>)}</article></div>}
      {inside.risks.length > 0 && <><div className="business-section-title"><span>RIESGOS</span><h2>Lo que puede bloquear el negocio</h2></div><div className="business-areas">{inside.risks.map((risk, index) => <article key={`${risk.title}-${index}`}><div><span>{risk.severity}</span><h3>{risk.title}</h3></div><p>{risk.consequence}</p><p><strong>Evidencia:</strong> {risk.evidence}</p></article>)}</div></>}

      {outside && <><div className="business-section-title"><span>PLAN ÚNICO</span><h2>Quick wins + roadmap</h2></div><div className="business-journeys"><article><h3>3–5 quick wins</h3><ol>{outside.quickWins.map((item) => <li key={item}>{item}</li>)}</ol></article><article><h3>No automatizar todavía</h3><ul>{outside.doNotAutomateYet.length ? outside.doNotAutomateYet.map((item) => <li key={item}>{item}</li>) : <li>No se detectaron procesos de nivel 1 con evidencia suficiente.</li>}</ul></article></div><div className="business-roadmap">{outside.roadmap.map((phase) => <article key={phase.horizon}><h3>{phase.horizon}</h3><ul>{phase.actions.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div></>}
    </section>}
  </>;
}
