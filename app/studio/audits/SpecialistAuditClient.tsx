"use client";

import { FormEvent, useState } from "react";
import type { SpecialistAuditKind, SpecialistAuditResult } from "../../../lib/studio/url-audit";
import { projectIdFromLocation, traceCompletedExecution } from "../../../lib/studio/client-trace";

type Props = { kind: SpecialistAuditKind; title: string; subtitle: string; placeholder: string };
type ApiResponse = { result?: SpecialistAuditResult; error?: string };
const specialistIds: Record<SpecialistAuditKind, string> = { commerce: "commerce-audit", brand: "brand-intelligence", creator: "creator-intelligence" };

export default function SpecialistAuditClient({ kind, title, subtitle, placeholder }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SpecialistAuditResult | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setResult(null); setSaved(false);
    try {
      const response = await fetch("/api/studio/specialist-audit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, url }) });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.result) throw new Error(data.error || "No se pudo completar el análisis.");
      setResult(data.result);
      const projectId = projectIdFromLocation();
      if (projectId) {
        await traceCompletedExecution({ projectId, specialistId: specialistIds[kind], title: `${title}: ${data.result.title || data.result.finalUrl}`, kind: "report", memory: `${title} completado sobre ${data.result.finalUrl}. ${data.result.summary}` });
        setSaved(true);
      }
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo completar el análisis."); }
    finally { setLoading(false); }
  }

  return <main className="specialist-audit-page" id="main-content">
    <a className="specialist-back" href="/studio">← NEXO Studio</a>
    <section className="specialist-hero"><span>NEXO SPECIALIST</span><h1>{title}</h1><p>{subtitle}</p></section>
    <form className="specialist-form" onSubmit={submit}><label htmlFor={`${kind}-url`}>URL pública</label><div><input id={`${kind}-url`} type="url" required placeholder={placeholder} value={url} onChange={(event) => setUrl(event.target.value)} /><button disabled={loading} type="submit">{loading ? "Analizando…" : "Analizar"}</button></div><small>Solo lectura. NEXO separa evidencia, interpretación y acción recomendada.</small></form>
    {error && <div className="specialist-error" role="alert">{error}</div>}
    {saved && <div className="specialist-error" role="status">Resultado guardado en el proyecto.</div>}
    {result && <section className="specialist-result" aria-live="polite"><header><span>RESULTADO</span><h2>{result.title || new URL(result.finalUrl).hostname}</h2><p>{result.summary}</p></header><div className="specialist-findings">{result.findings.map((finding, index) => <article key={finding.id}><div className={`specialist-severity ${finding.severity}`}>{String(index + 1).padStart(2, "0")} · {finding.severity}</div><h3>{finding.evidence}</h3><p><strong>Qué significa:</strong> {finding.interpretation}</p><p><strong>Siguiente acción:</strong> {finding.action}</p></article>)}</div><aside className="specialist-limitations"><span>LÍMITES DE ESTA EJECUCIÓN</span><ul>{result.limitations.map((item) => <li key={item}>{item}</li>)}</ul></aside></section>}
  </main>;
}
