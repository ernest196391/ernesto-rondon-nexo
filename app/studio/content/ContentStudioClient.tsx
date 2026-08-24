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
      if (!response.ok) { const data = (await response.json().catch(() => ({}))) as { error?: string }; throw new Error(data.error || "No se pudo renderizar el plan aprobado."); }
      setResultUrl(URL.createObjectURL(await response.blob()));
      await traceMedia(`Vídeo editado: ${file.name}`, `Content Studio renderizó ${file.name} desde una transcripción real y un plan aprobado, con ${(transcript.cutPlan ?? []).length} segmentos propuestos.`);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo renderizar el vídeo."); }
    finally { setRendering(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!file) return;
    setLoading(true); setError(""); resetResult();
    const body = new FormData(); body.append("file", file);
    try {
      const response = await fetch("/api/studio/content/process", { method: "POST", body });
      if (!response.ok) { const data = (await response.json().catch(() => ({}))) as { error?: string }; throw new Error(data.error || "No se pudo procesar el vídeo."); }
      setResultUrl(URL.createObjectURL(await response.blob()));
      await traceMedia(`Versión vertical: ${file.name}`, `Content Studio generó una versión vertical 1080×1920 de ${file.name}.`);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo procesar el vídeo."); }
    finally { setLoading(false); }
  }

  return <div className="content-app">
    <form onSubmit={submit} className="content-form"><label htmlFor="content-file">Vídeo original</label><input id="content-file" type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v" required onChange={(e) => { setFile(e.target.files?.[0] || null); setAnalysis(null); setTranscript(null); setApproved(false); resetResult(); }} />{file && <div className="content-file"><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(1)} MB</span></div>}<button disabled={analyzing || !file} type="button" onClick={analyze}>{analyzing ? "Analizando…" : "1. Analizar fuente"}</button><button disabled={transcribing || !file} type="button" onClick={transcribe}>{transcribing ? "Transcribiendo…" : "2. Transcribir + detectar pausas"}</button><button disabled={loading || !file} type="submit">{loading ? "Procesando…" : "Versión vertical rápida"}</button><small>La transcripción usa la API configurada y solo genera consumo cuando pulsas transcribir.</small></form>
    {error && <div className="content-error" role="alert">{error}</div>}{saved && <div className="content-error" role="status">Artefacto guardado en el proyecto.</div>}
    {analysis && <section className="content-result" aria-live="polite"><div><span>PLAN KIT 05</span><h2>NEXO entendió esto.</h2><p>{analysis.truthPolicy}</p></div><div><p><strong>Fuente:</strong> {analysis.source?.width || "—"}×{analysis.source?.height || "—"} · {analysis.source?.durationSeconds ? `${analysis.source.durationSeconds.toFixed(1)} s` : "duración no detectada"} · {analysis.source?.hasAudio ? "con audio" : "sin audio detectable"}</p>{analysis.steps?.map(step => <article key={step.id}><strong>{step.id}. {step.name}</strong><p>{step.status} — {step.evidence}</p></article>)}</div></section>}
    {transcript && <section className="content-result" aria-live="polite"><div><span>TRANSCRIPCIÓN REAL</span><h2>{transcript.words?.length || 0} palabras con timestamps.</h2><p>{transcript.truthPolicy}</p></div><div><p><strong>Idioma:</strong> {transcript.language || "no informado"} · <strong>Duración:</strong> {transcript.durationSeconds ? `${transcript.durationSeconds.toFixed(1)} s` : "—"}</p><p>{transcript.text}</p><h3>Plan de cortes por pausas</h3>{transcript.cutPlan?.length ? transcript.cutPlan.map((cut, index) => <article key={`${cut.start}-${cut.end}`}><strong>Corte {index + 1}: {cut.start.toFixed(1)}–{cut.end.toFixed(1)} s</strong><p>{cut.reason}</p></article>) : <p>No se detectaron pausas suficientes; se conservará la intervención completa.</p>}<label><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} /> Confirmo que NEXO entendió la transcripción y el plan.</label><button type="button" disabled={!approved || rendering || !transcript.words?.length} onClick={renderApproved}>{rendering ? "Renderizando edición…" : "4. Renderizar cortes + subtítulos sincronizados"}</button></div></section>}
    {resultUrl && <section className="content-result" aria-live="polite"><div><span>RESULTADO</span><h2>Tu vídeo está listo para revisar.</h2><p>Salida 9:16. Cuando usas el plan aprobado, NEXO aplica los segmentos y subtítulos temporizados derivados de la transcripción real.</p></div><video src={resultUrl} controls playsInline /><a href={resultUrl} download="nexo-editado.mp4">Descargar MP4</a></section>}
  </div>;
}
