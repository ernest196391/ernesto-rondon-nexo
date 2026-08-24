"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "../studio.css";

export default function StudioLoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [accessKey, setAccessKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/studio/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accessKey }) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error || "No se pudo iniciar sesión.");
      const next = search.get("next");
      router.replace(next && next.startsWith("/studio") ? next : "/studio");
      router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo iniciar sesión."); }
    finally { setBusy(false); }
  }

  return <main className="studio-shell" id="main-content">
    <section className="studio-hero"><div className="studio-kicker">NEXO STUDIO · ACCESO PRIVADO</div><div className="studio-hero-grid"><div><h1>Tu espacio de trabajo, protegido.</h1><p>Los proyectos, ejecuciones y memoria de Studio no son públicos. Introduce tu código para continuar.</p></div><aside className="studio-status-card"><div className="studio-status-dot"/><div><span>Sesión segura</span><strong>12 horas</strong><p>Cookie HTTP-only firmada. El código no se guarda en el navegador.</p></div></aside></div></section>
    <section className="studio-panel"><form className="studio-form" onSubmit={submit}><label><span>Código de acceso</span><input autoFocus autoComplete="current-password" type="password" required value={accessKey} onChange={(event) => setAccessKey(event.target.value)} /></label><button className="studio-button primary" type="submit" disabled={busy || !accessKey}>{busy ? "Comprobando…" : "Entrar a Studio →"}</button>{error ? <p className="studio-note" role="alert">{error}</p> : null}</form></section>
  </main>;
}
