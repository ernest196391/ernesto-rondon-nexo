"use client";

import { useState } from "react";

type AnalysisData = {
  score: number;
  decision: "GO" | "TEST FIRST" | "PIVOT" | "STOP";
  problem: string;
  customer: string;
  monetization: string;
  differentiation: string;
  risks: string[];
  mvp: string;
  validation_test: string;
  next_steps: string[];
};

const decisionLabel: Record<AnalysisData["decision"], string> = {
  GO: "Avanzar",
  "TEST FIRST": "Validar primero",
  PIVOT: "Replantear",
  STOP: "Detener",
};

export default function Page() {
  const [idea, setIdea] = useState("");
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!idea.trim() || loading) return;
    setLoading(true);
    setData(null);
    setError("");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 35000);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        signal: controller.signal,
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "No se pudo completar el análisis.");
        return;
      }
      setData(payload.data || null);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === "AbortError") {
        setError("El análisis tardó demasiado. Inténtalo de nuevo.");
      } else {
        setError("No se pudo conectar con el analizador.");
      }
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <main className="section tool analyzer-page" id="main-content">
      <div className="eyebrow">Herramienta gratuita · MVP</div>
      <h1>NEXO Business Analyzer</h1>
      <p className="lead">
        Describe una idea de negocio. El sistema la someterá a un primer filtro de problema,
        cliente, monetización, diferenciación, riesgos y validación. La puntuación orienta la
        siguiente prueba; no garantiza éxito.
      </p>

      <div className="analyzer-input-card">
        <label className="analyzer-label" htmlFor="business-idea">Describe la oportunidad</label>
        <textarea
          id="business-idea"
          value={idea}
          maxLength={5000}
          onChange={(event) => setIdea(event.target.value)}
          placeholder="Ejemplo: Quiero conectar electricistas disponibles con personas que necesitan reparaciones en su casa..."
          aria-describedby="idea-help"
        />
        <div className="analyzer-input-meta" id="idea-help">
          <span>Incluye quién tiene el problema, cómo lo resuelve hoy y por qué tu idea sería mejor.</span>
          <span>{idea.length}/5000</span>
        </div>
        <button onClick={analyze} disabled={loading || idea.trim().length < 10}>
          {loading ? "Analizando oportunidad..." : "Analizar mi idea"}
        </button>
      </div>

      {loading && (
        <div className="analyzer-status" role="status" aria-live="polite">
          <span className="status-dot" aria-hidden="true" />
          NEXO está evaluando la idea. Puede tardar unos segundos.
        </div>
      )}

      {error && (
        <div className="result analyzer-error" role="alert">
          <strong>No pudimos completar el análisis.</strong>
          <p>{error}</p>
        </div>
      )}

      {data && (
        <section className="result analyzer-result" aria-live="polite" aria-label="Resultado del análisis NEXO">
          <header className="analyzer-summary">
            <div>
              <div className="eyebrow">Resultado NEXO</div>
              <div className="score-line"><strong>{data.score}</strong><span>/100</span></div>
            </div>
            <div className="decision-block">
              <span className="decision-code">{data.decision}</span>
              <strong>{decisionLabel[data.decision]}</strong>
            </div>
          </header>

          <p className="analyzer-disclaimer">Úsalo como hipótesis de trabajo y valida con evidencia real antes de invertir más.</p>

          <div className="analysis-grid">
            <article><h3>Problema</h3><p>{data.problem}</p></article>
            <article><h3>Cliente</h3><p>{data.customer}</p></article>
            <article><h3>Monetización</h3><p>{data.monetization}</p></article>
            <article><h3>Diferenciación</h3><p>{data.differentiation}</p></article>
          </div>

          <div className="analysis-section">
            <h3>Riesgos que hay que resolver</h3>
            <ul>{data.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul>
          </div>

          <div className="analysis-grid analysis-grid-wide">
            <article><h3>MVP recomendado</h3><p>{data.mvp}</p></article>
            <article><h3>Prueba de validación</h3><p>{data.validation_test}</p></article>
          </div>

          <div className="analysis-section next-steps">
            <h3>Próximos pasos</h3>
            <ol>{data.next_steps.map((step) => <li key={step}>{step}</li>)}</ol>
          </div>
        </section>
      )}
    </main>
  );
}
