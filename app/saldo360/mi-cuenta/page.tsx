"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { phoneFromLogin, prettyPhone } from "../../../lib/saldo360/shop-rules";
import { authError, saldoSupabase } from "../../../lib/saldo360/supabase-browser";
import { Top } from "../ui";
import { useCuenta } from "../useCuenta";
import "../saldo360.css";

const ROLE = { buyer: "Comprador", seller: "Vendedor", admin: "Administración" } as const;

function CambiarClave() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return setMsg({ ok: false, text: "La clave debe tener al menos 6 caracteres." });
    setBusy(true); setMsg(null);
    const { error } = await saldoSupabase()!.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: authError(error.message) });
    setPassword(""); setOpen(false); setMsg({ ok: true, text: "Clave cambiada." });
  }

  return <>
    {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "s360-success" : "s360-error s360-form-msg"}>{msg.text}</p>}
    {!open ? <button className="s360-secondary" type="button" onClick={() => { setMsg(null); setOpen(true); }}>Cambiar mi clave</button>
      : <form className="s360-card s360-sell-form" onSubmit={save}>
        <label className="s360-label" htmlFor="newpass">Clave nueva</label>
        <input id="newpass" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)}/>
        <button className="s360-primary" type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar clave"}</button>
        <button className="s360-link-btn" type="button" onClick={() => setOpen(false)}>Cancelar</button>
      </form>}
  </>;
}

export default function Cuenta() {
  const router = useRouter();
  const { loading, user, profile } = useCuenta();
  const phone = phoneFromLogin(user?.email);

  async function salir() {
    await saldoSupabase()?.auth.signOut();
    router.push("/saldo360");
  }

  return <main className="s360"><div className="s360-shell">
    <Top/>
    <section className="s360-content">
      {loading ? <div className="s360-empty"><p>Cargando…</p></div>
        : !user ? <>
          <div className="s360-intro"><h1>Mi cuenta</h1><p>Para comprar no hace falta cuenta. Para vender, sí.</p></div>
          <Link className="s360-primary" href="/saldo360/entrar">Entrar</Link>
          <Link className="s360-secondary" href="/saldo360/entrar?modo=registro">Crear cuenta</Link>
        </> : <>
          <div className="s360-intro"><h1>Hola{profile?.display_name ? `, ${profile.display_name}` : ""}</h1>
            <p>{phone ? prettyPhone(phone) : user.email} · {profile ? ROLE[profile.role] : "Comprador"}</p></div>
          {profile?.status === "suspended" && <div className="s360-card"><p className="s360-error">Tu cuenta está suspendida. Escríbenos para revisarla.</p></div>}
          <nav className="s360-menu">
            {profile?.role === "seller"
              ? <Link href="/saldo360/mi-tienda"><strong>Mi tienda</strong><small>Ofertas, foto y datos</small></Link>
              : <Link href="/saldo360/mi-tienda"><strong>Vender saldo</strong><small>Crea tu tienda gratis</small></Link>}
            <Link href="/saldo360/ofertas"><strong>Busco saldo</strong><small>Ofertas vigentes</small></Link>
            {profile?.role === "admin" && <Link href="/saldo360/admin"><strong>Revisar tiendas</strong><small>Aprobar, suspender, claves temporales</small></Link>}
          </nav>
          <CambiarClave/>
          <button className="s360-link-btn" type="button" onClick={salir}>Cerrar sesión</button>
        </>}
    </section>
  </div></main>;
}
