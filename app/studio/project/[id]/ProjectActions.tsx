"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = { projectId: string; specialistId?: string };

export default function ProjectActions({ projectId, specialistId }: Props) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"memory" | "run" | "">("");
  const [message, setMessage] = useState("");

  async function addMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note.trim()) return;
    setBusy("memory");
    setMessage("");
    try {
      const response = await fetch("/api/studio/memory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, entry: { kind: "decision", text: note.trim() } }),
      });
      if (!response.ok) throw new Error("failed");
      setNote("");
      setMessage("Decisión guardada en la memoria del proyecto.");
      router.refresh();
    } catch {
      setMessage("No pudimos guardar la decisión.");
    } finally {
      setBusy("");
    }
  }

  async function startRun() {
    if (!specialistId) return;
    setBusy("run");
    setMessage("");
    try {
      const response = await fetch("/api/studio/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, specialistId }),
      });
      if (!response.ok) throw new Error("failed");
      setMessage("Run creado y preparado para ejecución.");
      router.refresh();
    } catch {
      setMessage("No pudimos crear el run.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="studio-panel">
      <div className="studio-kicker">SIGUIENTE ACCIÓN</div>
      <h2>Continúa el proyecto.</h2>
      <div className="studio-actions">
        <button className="studio-button primary" type="button" onClick={startRun} disabled={!specialistId || busy !== ""}>
          {busy === "run" ? "Preparando…" : "Crear run →"}
        </button>
      </div>
      <form className="studio-form" onSubmit={addMemory}>
        <label>
          <span>Guardar una decisión o restricción</span>
          <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ej. Mantener el checkout en una sola página." />
        </label>
        <button className="studio-button secondary" type="submit" disabled={!note.trim() || busy !== ""}>
          {busy === "memory" ? "Guardando…" : "Guardar en memoria"}
        </button>
      </form>
      {message ? <p className="studio-note" role="status">{message}</p> : null}
    </section>
  );
}
