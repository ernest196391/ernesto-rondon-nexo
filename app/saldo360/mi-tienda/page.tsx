"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { saldoSupabase } from "../../../lib/saldo360/supabase-browser";
import { Top } from "../ui";
import { useCuenta } from "../useCuenta";
import CrearTienda from "./CrearTienda";
import Ofertas from "./Ofertas";
import Tienda, { type Shop } from "./Tienda";
import "../saldo360.css";

async function fetchShop(uid: string): Promise<Shop | null> {
  const sb = saldoSupabase();
  if (!sb) return null;
  const { data } = await sb.from("shops").select("id, slug, name, bio, locality, whatsapp_e164, photo_path, status, verified_at").eq("owner_id", uid).maybeSingle();
  return (data as Shop | null) ?? null;
}

export default function MiTienda() {
  const { loading, user, profile, refresh } = useCuenta();
  const [shop, setShop] = useState<Shop | null | undefined>(undefined);

  const loadShop = useCallback(async (uid: string) => setShop(await fetchShop(uid)), []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    fetchShop(user.id).then((s) => { if (alive) setShop(s); });
    return () => { alive = false; };
  }, [user]);

  const ready = !loading && (!user || shop !== undefined);
  return <main className="s360"><div className="s360-shell">
    <Top right={<Link className="s360-header-link" href="/saldo360/mi-cuenta">Mi cuenta</Link>}/>
    <section className="s360-content">
      {!ready ? <div className="s360-empty"><p>Cargando…</p></div>
        : !user ? <>
          <div className="s360-intro"><h1>Vende tu saldo</h1><p>Crea tu tienda gratis. Los compradores te escriben directo por WhatsApp.</p></div>
          <Link className="s360-primary" href="/saldo360/entrar?modo=registro&rol=vendedor">Crear mi tienda</Link>
          <Link className="s360-secondary" href="/saldo360/entrar?rol=vendedor">Ya tengo cuenta</Link>
        </> : profile?.status === "suspended" ? <div className="s360-card"><p className="s360-error">Tu cuenta está suspendida. Escríbenos para revisarla.</p></div>
        : !shop ? <CrearTienda onCreated={async () => { await loadShop(user.id); await refresh(); }}/>
        : <>
          <Tienda shop={shop} userId={user.id} onChange={() => loadShop(user.id)}/>
          <Ofertas shop={shop}/>
        </>}
    </section>
  </div></main>;
}
