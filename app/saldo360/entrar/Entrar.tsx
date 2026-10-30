"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { normalizeCubanMobile, phoneLogin } from "../../../lib/saldo360/shop-rules";
import { authError, saldoSupabase } from "../../../lib/saldo360/supabase-browser";

type Mode = "login" | "signup" | "forgot";

// Piloto: la cuenta es el número de móvil + una clave. No se envían SMS, correos ni WhatsApp automáticos.
export default function Entrar({ initialMode, seller }: { initialMode: "login" | "signup"; seller: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [byEmail, setByEmail] = useState(false); // cuentas antiguas o de administración con correo
  const [email, setEmail] = useState("");
  const next = seller ? "/saldo360/mi-tienda" : "/saldo360/mi-cuenta";
  const e164 = normalizeCubanMobile(phone);

  const switchTo = (m: Mode) => { setMode(m); setError(""); setNotice(""); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const sb = saldoSupabase();
    if (!sb) return setError("Las cuentas aún no están disponibles.");
    const loginEmail = byEmail && mode === "login" ? email.trim() : e164 ? phoneLogin(e164) : null;
    if (!loginEmail) return setError(byEmail ? "Escribe tu correo." : "Escribe tu móvil cubano: 8 cifras que empiezan por 5.");
    if (password.length < 6) return setError("La clave debe tener al menos 6 caracteres.");
    setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email: loginEmail, password });
        if (error) return setError(authError(error.message).replace("Número o clave", byEmail ? "Correo o clave" : "Número o clave"));
        router.push(next);
      } else {
        const { data, error } = await sb.auth.signUp({ email: loginEmail, password, options: { data: { display_name: name.trim().slice(0, 80) } } });
        if (error) return setError(authError(error.message));
        if (data.session) router.push(next);
        else setNotice("Cuenta creada. La activamos en breve; luego entra con tu número y tu clave.");
      }
    } finally { setBusy(false); }
  }

  const title = mode === "login" ? "Entrar" : mode === "signup" ? (seller ? "Crea tu tienda" : "Crea tu cuenta") : "¿Olvidaste tu clave?";

  return <section className="s360-content">
    <div className="s360-intro"><h1>{title}</h1>{mode === "signup" && <p>{seller ? "Gratis. Solo tu número y una clave." : "Solo tu número y una clave."}</p>}</div>
    {mode === "forgot" ? <div className="s360-card">
      <p>Escríbele al equipo de Saldo 360 desde tu WhatsApp. Te damos una clave temporal y luego la cambias en «Mi cuenta».</p>
    </div> : <form className="s360-card s360-sell-form" onSubmit={submit}>
      {mode === "signup" && <><label className="s360-label" htmlFor="name">Tu nombre</label>
        <input id="name" autoComplete="name" maxLength={80} required value={name} onChange={(e) => setName(e.target.value)}/></>}
      {byEmail && mode === "login" ? <><label className="s360-label" htmlFor="email">Correo</label>
        <input id="email" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}/></>
      : <><label className="s360-label" htmlFor="phone">Tu número de móvil</label>
        <div className="s360-amount s360-phone"><span>+53</span><input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="5XXXXXXX" required value={phone} onChange={(e) => setPhone(e.target.value)}/></div>
        {phone && !e164 && <p className="s360-error s360-form-msg">8 cifras que empiezan por 5.</p>}</>}
      <label className="s360-label" htmlFor="password">{mode === "signup" ? "Crea una clave" : "Clave"}</label>
      <input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)}/>
      <button className="s360-primary" type="submit" disabled={busy}>{busy ? "Un momento…" : mode === "login" ? "Entrar" : "Crear cuenta"}</button>
      {error && <p role="alert" className="s360-error s360-form-msg">{error}</p>}
      {notice && <p role="status" className="s360-success">{notice}</p>}
    </form>}
    <div className="s360-links">
      {mode === "login" && <><button type="button" onClick={() => switchTo("signup")}>¿No tienes cuenta? <strong>Créala</strong></button>
        <button type="button" onClick={() => switchTo("forgot")}>Olvidé mi clave</button>
        <button type="button" onClick={() => { setByEmail(!byEmail); setError(""); }}>{byEmail ? "Entrar con mi número" : "Entrar con correo"}</button></>}
      {mode !== "login" && <button type="button" onClick={() => switchTo("login")}>¿Ya tienes cuenta? <strong>Entrar</strong></button>}
    </div>
    <p className="s360-footnote">Para buscar saldo no hace falta cuenta. <Link href="/saldo360/ofertas">Ver ofertas</Link></p>
  </section>;
}
