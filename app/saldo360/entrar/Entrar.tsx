"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authError, saldoSupabase } from "../../../lib/saldo360/supabase-browser";

type Mode = "login" | "signup" | "forgot";

export default function Entrar({ initialMode, seller }: { initialMode: "login" | "signup"; seller: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const next = seller ? "/saldo360/mi-tienda" : "/saldo360/mi-cuenta";

  const switchTo = (m: Mode) => { setMode(m); setError(""); setNotice(""); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const sb = saldoSupabase();
    if (!sb) return setError("El registro aún no está disponible.");
    setBusy(true); setError(""); setNotice("");
    const origin = window.location.origin;
    try {
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (error) return setError(authError(error.message));
        router.push(next);
      } else if (mode === "signup") {
        if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
        const { data, error } = await sb.auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim().slice(0, 80) }, emailRedirectTo: origin + next } });
        if (error) return setError(authError(error.message));
        if (data.session) router.push(next);
        else setNotice("Te enviamos un correo. Ábrelo y toca el enlace para activar tu cuenta.");
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: origin + "/saldo360/nueva-clave" });
        if (error) return setError(authError(error.message));
        setNotice("Si ese correo tiene cuenta, te llegará un enlace para crear una contraseña nueva.");
      }
    } finally { setBusy(false); }
  }

  const title = mode === "login" ? "Entrar" : mode === "signup" ? (seller ? "Crea tu tienda" : "Crea tu cuenta") : "Recuperar contraseña";
  const action = mode === "login" ? "Entrar" : mode === "signup" ? "Crear cuenta" : "Enviar enlace";

  return <section className="s360-content">
    <div className="s360-intro"><h1>{title}</h1>{mode === "signup" && seller && <p>Gratis. Luego publicas tus ofertas en 1 minuto.</p>}</div>
    <form className="s360-card s360-sell-form" onSubmit={submit}>
      {mode === "signup" && <><label className="s360-label" htmlFor="name">Tu nombre</label>
        <input id="name" autoComplete="name" maxLength={80} required value={name} onChange={(e) => setName(e.target.value)}/></>}
      <label className="s360-label" htmlFor="email">Correo</label>
      <input id="email" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}/>
      {mode !== "forgot" && <><label className="s360-label" htmlFor="password">Contraseña</label>
        <input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "signup" ? 8 : undefined} required value={password} onChange={(e) => setPassword(e.target.value)}/></>}
      <button className="s360-primary" type="submit" disabled={busy}>{busy ? "Un momento…" : action}</button>
      {error && <p role="alert" className="s360-error s360-form-msg">{error}</p>}
      {notice && <p role="status" className="s360-success">{notice}</p>}
    </form>
    <div className="s360-links">
      {mode === "login" && <><button type="button" onClick={() => switchTo("signup")}>¿No tienes cuenta? <strong>Créala</strong></button>
        <button type="button" onClick={() => switchTo("forgot")}>Olvidé mi contraseña</button></>}
      {mode === "signup" && <button type="button" onClick={() => switchTo("login")}>¿Ya tienes cuenta? <strong>Entrar</strong></button>}
      {mode === "forgot" && <button type="button" onClick={() => switchTo("login")}>Volver a entrar</button>}
    </div>
    <p className="s360-footnote">Para buscar saldo no hace falta cuenta. <Link href="/saldo360/ofertas">Ver ofertas</Link></p>
  </section>;
}
