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

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "No se pudo completar el análisis.");
        return;
      }
      setData(payload.data || null);
    } catch {
      setError("No se pudo conectar con el analizador.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="section tool">
      <div className="eyebrow">Herramienta gratuita · MVP</div>
      <h1>NEXO Business Analyzer</h1>
      <p className="lead">
        Describe una idea de negocio. El sistema la someterá a un primer filtro de problema,
        cliente, monetización, riesgos y validación. La puntuación orienta la siguiente prueba;
        no garantiza éxito.
      </p>

      <textarea
        value={idea}
        maxLength={5000}
        onChange={(event) => setIdea(event.target.value)}
        placeholder="Ejemplo: Quiero conectar electricistas disponibles con personas que necesitan reparaciones en su casa..."
        aria-label="Describe tu idea de negocio"
      />
      <div className="muted" style={{ marginTop: 8 }}>
        {idea.length}/5000 caracteres
      </div>
      <button onClick={analyze} disabled={loading || idea.trim().length < 10}>
        {loading ? "Analizando..." : "Analizar mi idea"}
      </button>

      {error && (
        <div className="result" role="alert">
          <strong>No pudimos completar el análisis.</strong>
          <div style={{ marginTop: 8 }}>{error}</div>
        </div>
      )}

      {data && (
        <section className="result" aria-live="polite">
          <div className="eyebrow">Resultado NEXO</div>
          <h2 style={{ marginTop: 10, marginBottom: 8 }}>{data.score}/100 · {data.decision}</h2>
          <p className="muted">Úsalo como hipótesis de trabajo y valida con evidencia real antes de invertir más.</p>

          <h3>Problema</h3>
          <p>{data.problem}</p>

          <h3>Cliente</h3>
          <p>{data.customer}</p>

          <h3>Monetización</h3>
          <p>{data.monetization}</p>

          <h3>Diferenciación</h3>
          <p>{data.differentiation}</p>

          <h3>Riesgos</h3>
          <ul>{data.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul>

          <h3>MVP recomendado</h3>
          <p>{data.mvp}</p>

          <h3>Prueba de validación</h3>
          <p>{data.validation_test}</p>

          <h3>Próximos pasos</h3>
          <ol>{data.next_steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </section>
      )}
    </main>
  );
}
