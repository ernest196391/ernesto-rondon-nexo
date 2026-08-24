"use client";

import { FormEvent, useEffect, useState } from "react";

export default function ContentStudioClient() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState("");

  useEffect(() => () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

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
      <input id="content-file" type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v" required onChange={(e) => setFile(e.target.files?.[0] || null)} />
      {file && <div className="content-file"><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(1)} MB</span></div>}
      <button disabled={loading || !file} type="submit">{loading ? "Procesando vídeo…" : "Crear versión vertical →"}</button>
      <small>Primera fase funcional: convierte a 1080×1920 con recorte centrado, H.264 + AAC. Máximo 25 MB.</small>
    </form>

    {error && <div className="content-error" role="alert">{error}</div>}

    {resultUrl && <section className="content-result" aria-live="polite">
      <div><span>RESULTADO</span><h2>Tu versión vertical está lista.</h2><p>Procesada por el worker de NEXO. Esta fase no añade todavía transcripción, cortes inteligentes ni subtítulos.</p></div>
      <video src={resultUrl} controls playsInline />
      <a href={resultUrl} download="nexo-vertical.mp4">Descargar MP4</a>
    </section>}
  </div>;
}
