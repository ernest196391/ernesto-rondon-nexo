"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saldoSupabase } from "../../../lib/saldo360/supabase-browser";
import { Top } from "../ui";
import { useCuenta } from "../useCuenta";
import "../saldo360.css";

const ROLE = { buyer: "Comprador", seller: "Vendedor", admin: "Administración" } as const;

export default function Cuenta() {
  const router = useRouter();
  const { loading, user, profile } = useCuenta();

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
            <p>{user.email} · {profile ? ROLE[profile.role] : "Comprador"}</p></div>
          {profile?.status === "suspended" && <div className="s360-card"><p className="s360-error">Tu cuenta está suspendida. Escríbenos para revisarla.</p></div>}
          <nav className="s360-menu">
            {profile?.role === "seller"
              ? <Link href="/saldo360/mi-tienda"><strong>Mi tienda</strong><small>Ofertas, foto y datos</small></Link>
              : <Link href="/saldo360/mi-tienda"><strong>Vender saldo</strong><small>Crea tu tienda gratis</small></Link>}
            <Link href="/saldo360/ofertas"><strong>Busco saldo</strong><small>Ofertas vigentes</small></Link>
            {profile?.role === "admin" && <Link href="/saldo360/admin"><strong>Revisar tiendas</strong><small>Aprobar o suspender</small></Link>}
          </nav>
          <button className="s360-secondary" type="button" onClick={salir}>Cerrar sesión</button>
        </>}
    </section>
  </div></main>;
}
