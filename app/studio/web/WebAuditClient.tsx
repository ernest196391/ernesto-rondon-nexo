"use client";

import { FormEvent, useState } from "react";
import type { WebAuditResult } from "../../../lib/web-studio/audit";
import { buildWebPrototype } from "../../../lib/web-studio/prototype";
import { projectIdFromLocation, traceCompletedExecution } from "../../../lib/studio/client-trace";

type ApiResponse = { ok?: boolean; result?: WebAuditResult; error?: string };
type ReviewState = "pending" | "approved" | "changes";

export default function WebAuditClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<WebAuditResult | null>(null);
  const [review, setReview] = useState<ReviewState>("pending");
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setResult(null); setReview("pending"); setSaved(false);
    try {
      const response = await fetch("/api/studio/web-audit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.result) throw new Error(data.error || "No se pudo analizar la web.");
      setResult(data.result);
      const projectId = projectIdFromLocation();
      if (projectId) {
        await traceCompletedExecution({ projectId, specialistId: "web-studio", title: `Auditoría web: ${data.result.title || data.result.finalUrl}`, kind: "report", memory: `Web Studio auditó ${data.result.finalUrl} y detectó ${data.result.findings.length} hallazgos trazables.` });
        setSaved(true);
      }
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo analizar la web."); }
    finally { setLoading(false); }
  }

  async function approvePrototype() {
    setReview("approved");
    const projectId = projectIdFromLocation();
    if (projectId && result) {
      await traceCompletedExecution({ projectId, specialistId: "web-studio", title: `Prototipo aprobado: ${result.title || result.finalUrl}`, kind: "prototype", memory: `Se aprobó el prototipo estructural generado para ${result.finalUrl}.` });
      setSaved(true);
    }
  }

  const prototype = result ? buildWebPrototype(result) : null;

  return <div className="web-audit-app">
    <form className="web-audit-form" onSubmit={submit}>
      <label htmlFor="web-url">URL de la web</label>
      <div className="web-audit-row"><input id="web-url" type="url" required placeholder="https://ejemplo.com" value={url} onChange={(event) => setUrl(event.target.value)} /><button type="submit" disabled={loading}>{loading ? "Analizando…" : "Analizar web"}</button></div>
      <p>Solo lectura. NEXO no modifica la web.</p>
    </form>

    {error && <div className="web-audit-error" role="alert">{error}</div>}
    {saved && <div className="web-audit-error" role="status">Resultado guardado en el proyecto.</div>}

    {result && prototype && <section className="web-audit-result" aria-live="polite">
      <div className="web-audit-summary">
        <div><span className="web-audit-kicker">RESUMEN</span><h2>{result.title || "Página sin título"}</h2><p>{result.description || "No se detectó una descripción pública."}</p></div>
        <dl><div><dt>Estado</dt><dd>{result.status}</dd></div><div><dt>Problemas</dt><dd>{result.findings.length}</dd></div><div><dt>Formularios</dt><dd>{result.signals.formCount}</dd></div><div><dt>Enlaces</dt><dd>{result.signals.linkCount}</dd></div></dl>
      </div>

      <div className="web-audit-findings">
        <span className="web-audit-kicker">QUÉ CORREGIR PRIMERO</span>
        {result.findings.map((finding, index) => <article key={finding.id}><div className={`web-severity ${finding.severity}`}>{String(index + 1).padStart(2, "0")}</div><h3>{finding.evidence}</h3><p>{finding.impact}</p><p><strong>Haz esto:</strong> {finding.recommendation}</p></article>)}
      </div>

      <div className="web-audit-brief">
        <div><span className="web-audit-kicker">PROPUESTA</span><h3>{result.brief.detectedPositioning}</h3><p>{result.brief.primaryGoal}</p></div>
        <div className="web-brief-grid"><article><h4>3 prioridades</h4><ol>{result.brief.priorityActions.map((item) => <li key={item}>{item}</li>)}</ol></article><article><h4>Estructura recomendada</h4><ol>{result.brief.recommendedSections.map((item) => <li key={item}>{item}</li>)}</ol></article></div>
      </div>

      <div className="web-prototype-block">
        <div className="web-prototype-heading"><div><span className="web-audit-kicker">BORRADOR</span><h3>Así podría ordenarse mejor la página.</h3></div><span className={`web-review-state ${review}`}>{review === "approved" ? "Aprobado" : review === "changes" ? "Revisar" : "Pendiente"}</span></div>
        <div className="web-prototype-canvas"><header className="web-prototype-hero"><span>{prototype.eyebrow}</span><h2>{prototype.heroTitle}</h2><p>{prototype.heroCopy}</p><div className="web-prototype-actions"><button type="button">{prototype.primaryCta}</button><a href="#prototype-sections">{prototype.secondaryCta}</a></div></header><div id="prototype-sections" className="web-prototype-sections">{prototype.sections.map((section, index) => <article key={section.title}><span>{String(index + 1).padStart(2, "0")}</span><h4>{section.title}</h4><p>{section.purpose}</p></article>)}</div></div>
        <div className="web-prototype-review"><div><strong>¿La propuesta va en la dirección correcta?</strong><p>NEXO no publica ningún cambio automáticamente.</p></div><div className="web-review-actions"><button type="button" onClick={approvePrototype}>Aprobar</button><button type="button" className="secondary" onClick={() => setReview("changes")}>Quiero cambios</button></div></div>
      </div>

      <details className="web-prototype-rules"><summary>Ver criterios y límites del análisis</summary><ul>{result.brief.prototypeRules.map((item) => <li key={item}>{item}</li>)}{result.limitations.map((item) => <li key={item}>{item}</li>)}</ul></details>
    </section>}
  </div>;
}
