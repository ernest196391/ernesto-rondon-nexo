"use client";

import { FormEvent, useEffect, useState } from "react";
import type { BusinessAuditResult } from "../../../lib/studio/business-audit";
import type { BusinessPublicResult } from "../../../lib/studio/business-public";
import { projectIdFromLocation, traceCompletedExecution } from "../../../lib/studio/client-trace";

type UnifiedResult = { inside: BusinessAuditResult; outside: BusinessPublicResult | null; outsideError: string | null; reportHtml: string };

export default function BusinessAuditClient() {
  const [url, setUrl] = useState("");
  const [answers, setAnswers] = useState("");
  const [result, setResult] = useState<UnifiedResult | null>(null);
  const [privacyResult, setPrivacyResult] = useState<BusinessAuditResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportUrl, setReportUrl] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => () => { if (reportUrl) URL.revokeObjectURL(reportUrl); }, [reportUrl]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setResult(null); setPrivacyResult(null); setSaved(false);
    if (reportUrl) URL.revokeObjectURL(reportUrl); setReportUrl("");
    try {
      const response = await fetch("/api/studio/business-audit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers, url: url.trim() || undefined }) });
      const data = await response.json() as { result?: UnifiedResult | BusinessAuditResult; error?: string };
      if (response.status === 422 && data.result && "privacyBlocked" in data.result) { setPrivacyResult(data.result as BusinessAuditResult); return; }
      if (!response.ok || !data.result || !("inside" in data.result)) throw new Error(data.error || "No se pudo analizar el negocio.");
      const unified = data.result as UnifiedResult;
      setResult(unified);
      setReportUrl(URL.createObjectURL(new Blob([unified.reportHtml], { type: "text/html;charset=utf-8" })));
      const projectId = projectIdFromLocation();
      if (projectId) {
        await traceCompletedExecution({ projectId, specialistId: "business-audit", title: `Business Audit${unified.outside?.finalUrl ? `: ${unified.outside.finalUrl}` : ""}`, kind: "report", memory: `Business Audit completado. Presencia digital: ${unified.outside?.score ?? "sin datos"}/100; madurez interna: ${unified.inside.maturity ?? "sin datos"}/5.` });
        setSaved(true);
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo analizar el negocio."); }
    finally { setLoading(false); }
  }

  const inside = result?.inside;
  const outside = result?.outside;
  const topActions = outside?.quickWins.slice(0, 3) ?? inside?.areas.filter((area) => area.level !== null).sort((a, b) => (a.level ?? 9) - (b.level ?? 9)).slice(0, 3).map((area) => area.next) ?? [];

  return <>
    <form className="business-form" onSubmit={submit}>
      <label>Web del negocio <span className="business-optional">recomendada</span><input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://negocio.com" /></label>
      <label>Respuestas del negocio<textarea required value={answers} onChange={(event) => setAnswers(event.target.value)} placeholder="P1. Nombre del negocio…&#10;P7. Nos contactan por…&#10;P31. Las tareas repetitivas…" /></label>
      <div className="business-form-foot"><small>No incluyas contraseñas, tokens ni datos personales de clientes.</small><button disabled={loading}>{loading ? "Analizando…" : "Crear diagnóstico →"}</button></div>
    </form>

    {error && <div className="business-alert" role="alert">{error}</div>}
    {saved && <div className="business-alert" role="status">Informe guardado en el proyecto.</div>}
    {privacyResult?.privacyBlocked && <div className="business-alert danger"><strong>Análisis detenido por privacidad.</strong><p>{privacyResult.privacyReason}</p></div>}

    {result && inside && !inside.privacyBlocked && <section className="business-result" aria-live="polite">
      <header>
        <span>RESUMEN</span>
        <div className="business-score-row">
          <div><small>Presencia digital</small><div className="business-score">{outside?.score ?? "—"}<small>/ 100</small></div><p>{outside?.band ?? (result.outsideError ? "no evaluada" : "sin web")}</p></div>
          <div><small>Operación interna</small><div className="business-score">{inside.maturity?.toFixed(1) ?? "—"}<small>/ 5</small></div><p>{inside.band}</p></div>
        </div>
        {topActions.length > 0 && <div className="business-priorities"><strong>Empieza por aquí</strong><ol>{topActions.map((item) => <li key={item}>{item}</li>)}</ol></div>}
        {reportUrl && <div className="business-report-actions"><a href={reportUrl} target="_blank" rel="noreferrer">Abrir informe completo</a><a href={reportUrl} download="nexo-business-audit.html">Descargar HTML</a></div>}
      </header>

      {result.outsideError && <div className="business-alert"><strong>La parte interna sí terminó.</strong><p>No se pudo revisar la web: {result.outsideError}</p></div>}

      {inside.risks.length > 0 && <section className="business-focus"><div className="business-section-title"><span>RIESGOS</span><h2>Lo que requiere atención.</h2></div><div className="business-areas">{inside.risks.slice(0, 4).map((risk, index) => <article key={`${risk.title}-${index}`}><div><span>{risk.severity}</span><h3>{risk.title}</h3></div><p>{risk.consequence}</p></article>)}</div></section>}

      <details className="business-details" open>
        <summary>Ver diagnóstico exterior</summary>
        {outside ? <><div className="business-areas public-dimensions">{outside.dimensions.map((dimension) => <article key={dimension.id}><div><span>{dimension.score ?? "—"}</span><h3>{dimension.name}</h3></div><p>{dimension.status === "scored" ? `${dimension.score}/100` : "Sin datos suficientes"}</p>{dimension.evidence.length ? <ul>{dimension.evidence.map((evidence) => <li key={evidence}>{evidence}</li>)}</ul> : null}<p><strong>Siguiente paso:</strong> {dimension.action}</p></article>)}</div>{outside.crosses.length > 0 && <><div className="business-section-title"><span>CRUCES</span><h2>Lo que no encaja.</h2></div><div className="business-areas">{outside.crosses.map((cross) => <article key={cross.title}><div><span>{cross.severity}</span><h3>{cross.title}</h3></div><p>{cross.implication}</p><p><strong>Fuera:</strong> {cross.outsideEvidence}</p><p><strong>Dentro:</strong> {cross.insideEvidence}</p></article>)}</div></>}</> : <p>Sin web pública para analizar.</p>}
      </details>

      <details className="business-details">
        <summary>Ver operación interna</summary>
        <div className="business-areas">{inside.areas.map((area) => <article key={area.name}><div><span>{area.level ?? "—"}</span><h3>{area.name}</h3></div><p><strong>Evidencia:</strong> {area.evidence}</p><p><strong>Siguiente paso:</strong> {area.next}</p></article>)}</div>
        <aside><strong>Tiempo recuperable</strong><p>{inside.hoursNote}</p>{inside.recoverableTasks.map((task, index) => <p key={`${task.task}-${index}`}><strong>{task.task}</strong><br /><small>{task.formula}</small></p>)}</aside>
      </details>

      {outside && <details className="business-details">
        <summary>Ver recorrido y plan de 90 días</summary>
        <div className="business-journeys"><article><h3>Recorrido actual</h3><ol>{outside.currentJourney.map((step) => <li key={step}>{step}</li>)}</ol></article><article><h3>Recorrido propuesto</h3><ol>{outside.futureJourney.map((step) => <li key={step}>{step}</li>)}</ol></article></div>
        <div className="business-roadmap">{outside.roadmap.map((phase) => <article key={phase.horizon}><h3>{phase.horizon}</h3><ul>{phase.actions.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div>
      </details>}
    </section>}
  </>;
}
