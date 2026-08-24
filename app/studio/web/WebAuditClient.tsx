"use client";

import { FormEvent, useState } from "react";
import type { WebAuditResult } from "../../../lib/web-studio/audit";

type ApiResponse = { ok?: boolean; result?: WebAuditResult; error?: string };

export default function WebAuditClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<WebAuditResult | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/studio/web-audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.result) throw new Error(data.error || "No se pudo completar la auditoría.");
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la auditoría.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="web-audit-app">
      <form className="web-audit-form" onSubmit={submit}>
        <label htmlFor="web-url">URL pública</label>
        <div className="web-audit-row">
          <input id="web-url" type="url" required placeholder="https://ejemplo.com" value={url} onChange={(event) => setUrl(event.target.value)} />
          <button type="submit" disabled={loading}>{loading ? "Analizando…" : "Auditar web"}</button>
        </div>
        <p>Solo lectura. NEXO no ejecuta scripts remotos, formularios ni acciones sobre la web.</p>
      </form>

      {error && <div className="web-audit-error" role="alert">{error}</div>}

      {result && (
        <section className="web-audit-result" aria-live="polite">
          <div className="web-audit-summary">
            <div>
              <span className="web-audit-kicker">RECONOCIMIENTO</span>
              <h2>{result.title || "Página sin título detectado"}</h2>
              <p>{result.description || "Sin meta description detectada."}</p>
            </div>
            <dl>
              <div><dt>HTTP</dt><dd>{result.status}</dd></div>
              <div><dt>H1</dt><dd>{result.signals.h1Count}</dd></div>
              <div><dt>Enlaces</dt><dd>{result.signals.linkCount}</dd></div>
              <div><dt>Formularios</dt><dd>{result.signals.formCount}</dd></div>
            </dl>
          </div>

          <div className="web-audit-findings">
            <span className="web-audit-kicker">DIAGNÓSTICO · 5 HALLAZGOS</span>
            {result.findings.map((finding, index) => (
              <article key={finding.id}>
                <div className={`web-severity ${finding.severity}`}>{String(index + 1).padStart(2, "0")} · {finding.severity}</div>
                <h3>{finding.evidence}</h3>
                <p><strong>Impacto:</strong> {finding.impact}</p>
                <p><strong>Acción:</strong> {finding.recommendation}</p>
              </article>
            ))}
          </div>

          <div className="web-audit-brief">
            <div>
              <span className="web-audit-kicker">BRIEF DETECTADO</span>
              <h3>{result.brief.detectedPositioning}</h3>
              <p><strong>Prioridad:</strong> {result.brief.primaryGoal}</p>
            </div>
            <div className="web-brief-grid">
              <article>
                <h4>Acciones primero</h4>
                <ol>{result.brief.priorityActions.map((item) => <li key={item}>{item}</li>)}</ol>
              </article>
              <article>
                <h4>Estructura recomendada</h4>
                <ol>{result.brief.recommendedSections.map((item) => <li key={item}>{item}</li>)}</ol>
              </article>
            </div>
          </div>

          <div className="web-prototype-rules">
            <span className="web-audit-kicker">CONTRATO DEL PROTOTIPO</span>
            <p>Estas reglas se aplicarán cuando NEXO genere la reconstrucción automática.</p>
            <ul>{result.brief.prototypeRules.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>

          <div className="web-audit-limitations">
            <span className="web-audit-kicker">LÍMITES DE ESTA FASE</span>
            <ul>{result.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </section>
      )}
    </div>
  );
}
