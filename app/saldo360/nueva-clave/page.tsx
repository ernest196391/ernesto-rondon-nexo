"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authError, saldoSupabase } from "../../../lib/saldo360/supabase-browser";
import { Top } from "../ui";
import "../saldo360.css";

// Llega aquí desde el enlace del correo de recuperación: Supabase abre la sesión con el enlace.
export default function NuevaClave() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    const sb = saldoSupabase();
    if (!sb) return;
    setBusy(true); setError("");
    const { error } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message.toLowerCase().includes("session") ? "El enlace venció. Pide uno nuevo." : authError(error.message));
    router.push("/saldo360/mi-cuenta");
  }

  return <main className="s360"><div className="s360-shell">
    <Top/>
    <section className="s360-content">
      <div className="s360-intro"><h1>Contraseña nueva</h1></div>
      <form className="s360-card s360-sell-form" onSubmit={submit}>
        <label className="s360-label" htmlFor="password">Nueva contraseña</label>
        <input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)}/>
        <button className="s360-primary" type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar y entrar"}</button>
        {error && <p role="alert" className="s360-error s360-form-msg">{error}</p>}
      </form>
    </section>
  </div></main>;
}
