"use client";

import { FormEvent, useEffect, useState } from "react";
import { projectIdFromLocation, traceCompletedExecution } from "../../../lib/studio/client-trace";

type AnalysisStep = { id: number; name: string; status: string; evidence: string };
type AnalysisResult = { source?: { durationSeconds?: number | null; width?: number | null; height?: number | null; hasAudio?: boolean }; steps?: AnalysisStep[]; truthPolicy?: string };
type Word = { word: string; start: number; end: number };
type Cut = { start: number; end: number; reason: string };
type TranscriptResult = { text?: string; language?: string | null; durationSeconds?: number | null; words?: Word[]; cutPlan?: Cut[]; truthPolicy?: string };

export default function ContentStudioClient() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => () => { if (resultUrl) URL.revokeObjectURL(resultUrl); }, [resultUrl]);
  function resetResult() { if (resultUrl) URL.revokeObjectURL(resultUrl); setResultUrl(""); setSaved(false); }
  async function traceMedia(title: string, memory: string) {
    const projectId = projectIdFromLocation();
    if (!projectId) return;
    await traceCompletedExecution({ projectId, specialistId: "content-studio", title, kind: "media", memory });
    setSaved(true);
  }

  async function analyze() {
    if (!file) return;
    setAnalyzing(true); setError(""); setAnalysis(null);
    const body = new FormData(); body.append("file", file);
    try {
      const response = await fetch("/api/studio/content/analyze", { method: "POST", body });
      const data = (await response.json().catch(() => ({}))) as AnalysisResult & { error?: string };
      if (!response.ok) throw new Error(data.error || "No se pudo analizar el vídeo.");
      setAnalysis(data);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo analizar el vídeo."); }
    finally { setAnalyzing(false); }
  }

  async function transcribe() {
    if (!file) return;
    setTranscribing(true); setError(""); setTranscript(null); setApproved(false);
    const body = new FormData(); body.append("file", file);
    try {
      const response = await fetch("/api/studio/content/transcribe", { method: "POST", body });
      const data = (await response.json().catch(() => ({}))) as TranscriptResult & { error?: string };
      if (!response.ok) throw new Error(data.error || "No se pudo transcribir el vídeo.");
      setTranscript(data);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo transcribir el vídeo."); }
    finally { setTranscribing(false); }
  }

  async function renderApproved() {
    if (!file || !transcript?.words?.length || !approved) return;
    setRendering(true); setError(""); resetResult();
    const body = new FormData(); body.append("file", file); body.append("approved", "true"); body.append("words", JSON.stringify(transcript.words)); body.append("cuts", JSON.stringify(transcript.cutPlan ?? []));
    try {
      const response = await fetch("/api/studio/content/render", { method: "POST", body });
      if (!response.ok) { const data = (await response.json().catch(() => ({}))) as { error?: string }; throw new Error(data.error || "No se pudo generar la edición."); }
      setResultUrl(URL.createObjectURL(await response.blob()));
      await traceMedia(`Vídeo editado: ${file.name}`, `Content Studio renderizó ${file.name} desde una transcripción real y un plan aprobado, con ${(transcript.cutPlan ?? []).length} segmentos propuestos.`);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo generar la edición."); }
    finally { setRendering(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!file) return;
    setLoading(true); setError(""); resetResult();
    const body = new FormData(); body.append("file", file);
    try {
      const response = await fetch("/api/studio/content/process", { method: "POST", body });
      if (!response.ok) { const data = (await response.json().catch(() => ({}))) as { error?: string }; throw new Error(data.error || "No se pudo crear la versión vertical."); }
      setResultUrl(URL.createObjectURL(await response.blob()));
      await traceMedia(`Versión vertical: ${file.name}`, `Content Studio generó una versión vertical 1080×1920 de ${file.name}.`);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo crear la versión vertical."); }
    finally { setLoading(false); }
  }

  const cuts = transcript?.cutPlan ?? [];

  return <div className="content-app">
    <form onSubmit={submit} className="content-form">
      <label htmlFor="content-file">1. Sube el vídeo</label>
      <input id="content-file" type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v" required onChange={(e) => { setFile(e.target.files?.[0] || null); setAnalysis(null); setTranscript(null); setApproved(false); resetResult(); }} />
      {file && <div className="content-file"><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(1)} MB</span></div>}
      <button disabled={loading || !file} type="submit">{loading ? "Creando versión…" : "Crear versión vertical rápida"}</button>
      <button disabled={analyzing || !file} type="button" onClick={analyze}>{analyzing ? "Analizando…" : "Revisar antes de editar"}</button>
      <button disabled={transcribing || !file} type="button" onClick={transcribe}>{transcribing ? "Transcribiendo…" : "Preparar edición con transcripción"}</button>
      <small>La opción con transcripción usa la API configurada solo cuando la eliges.</small>
    </form>

    {error && <div className="content-error" role="alert">{error}</div>}
    {saved && <div className="content-error" role="status">Resultado guardado en el proyecto.</div>}

    {analysis && <section className="content-result" aria-live="polite">
      <div><span>REVISIÓN</span><h2>NEXO puede trabajar con este archivo.</h2><p>{analysis.source?.width || "—"}×{analysis.source?.height || "—"} · {analysis.source?.durationSeconds ? `${analysis.source.durationSeconds.toFixed(1)} s` : "duración no detectada"} · {analysis.source?.hasAudio ? "con audio" : "sin audio detectable"}</p></div>
      <details><summary>Ver comprobaciones técnicas</summary>{analysis.steps?.map(step => <article key={step.id}><strong>{step.name}</strong><p>{step.evidence}</p></article>)}</details>
    </section>}

    {transcript && <section className="content-result" aria-live="polite">
      <div><span>EDICIÓN PROPUESTA</span><h2>{cuts.length || 1} segmentos · {transcript.words?.length || 0} palabras.</h2><p>Revisa la propuesta antes de generar el vídeo final.</p></div>
      <div>
        <p><strong>Idioma:</strong> {transcript.language || "no informado"} · <strong>Duración:</strong> {transcript.durationSeconds ? `${transcript.durationSeconds.toFixed(1)} s` : "—"}</p>
        <details><summary>Leer transcripción</summary><p>{transcript.text}</p></details>
        <details><summary>Revisar cortes</summary>{cuts.length ? cuts.map((cut, index) => <article key={`${cut.start}-${cut.end}`}><strong>{index + 1}. {cut.start.toFixed(1)}–{cut.end.toFixed(1)} s</strong><p>{cut.reason}</p></article>) : <p>No se detectaron pausas suficientes; se conservará la intervención completa.</p>}</details>
        <label><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} /> La transcripción y los cortes se ven correctos.</label>
        <button type="button" disabled={!approved || rendering || !transcript.words?.length} onClick={renderApproved}>{rendering ? "Generando vídeo…" : "Crear edición recomendada"}</button>
      </div>
    </section>}

    {resultUrl && <section className="content-result" aria-live="polite">
      <div><span>RESULTADO</span><h2>Listo para revisar.</h2><p>Comprueba el vídeo y descárgalo cuando estés conforme.</p></div>
      <video src={resultUrl} controls playsInline />
      <a href={resultUrl} download="nexo-editado.mp4">Descargar MP4</a>
    </section>}
  </div>;
}
