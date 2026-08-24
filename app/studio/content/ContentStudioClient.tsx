"use client";

import { FormEvent, useEffect, useState } from "react";

type AnalysisStep = { id: number; name: string; status: string; evidence: string };
type AnalysisResult = {
  source?: { durationSeconds?: number | null; width?: number | null; height?: number | null; hasAudio?: boolean };
  steps?: AnalysisStep[];
  truthPolicy?: string;
};

export default function ContentStudioClient() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  async function analyze() {
    if (!file) return;
    setAnalyzing(true);
    setError("");
    setAnalysis(null);
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch("/api/studio/content/analyze", { method: "POST", body });
      const data = (await response.json().catch(() => ({}))) as AnalysisResult & { error?: string };
      if (!response.ok) throw new Error(data.error || "No se pudo analizar el vídeo.");
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo analizar el vídeo.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl("");
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch("/api/studio/content/process", { method: "POST", body });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "No se pudo procesar el vídeo.");
      }
      const blob = await response.blob();
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar el vídeo.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="content-app">
    <form onSubmit={submit} className="content-form">
      <label htmlFor="content-file">Vídeo original</label>
      <input id="content-file" type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v" required onChange={(e) => { setFile(e.target.files?.[0] || null); setAnalysis(null); }} />
      {file && <div className="content-file"><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(1)} MB</span></div>}
      <button disabled={analyzing || !file} type="button" onClick={analyze}>{analyzing ? "Analizando…" : "Analizar antes de editar"}</button>
      <button disabled={loading || !file} type="submit">{loading ? "Procesando vídeo…" : "Crear versión vertical →"}</button>
      <small>Kit 05: primero inspecciona la fuente y deja claro qué pasos tienen evidencia real. La versión vertical sale a 1080×1920, H.264/AAC y audio normalizado a -14 LUFS cuando existe pista de audio.</small>
    </form>

    {error && <div className="content-error" role="alert">{error}</div>}

    {analysis && <section className="content-result" aria-live="polite">
      <div><span>PLAN KIT 05</span><h2>NEXO entendió esto.</h2><p>{analysis.truthPolicy}</p></div>
      <div>
        <p><strong>Fuente:</strong> {analysis.source?.width || "—"}×{analysis.source?.height || "—"} · {analysis.source?.durationSeconds ? `${analysis.source.durationSeconds.toFixed(1)} s` : "duración no detectada"} · {analysis.source?.hasAudio ? "con audio" : "sin audio detectable"}</p>
        {analysis.steps?.map(step => <article key={step.id}><strong>{step.id}. {step.name}</strong><p>{step.status} — {step.evidence}</p></article>)}
      </div>
    </section>}

    {resultUrl && <section className="content-result" aria-live="polite">
      <div><span>RESULTADO</span><h2>Tu versión vertical está lista.</h2><p>Procesada por el worker de NEXO. No se añaden todavía transcripción, cortes inteligentes ni subtítulos si no existe evidencia real para generarlos.</p></div>
      <video src={resultUrl} controls playsInline />
      <a href={resultUrl} download="nexo-vertical.mp4">Descargar MP4</a>
    </section>}
  </div>;
}
