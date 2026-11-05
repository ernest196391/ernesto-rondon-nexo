"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { dbError } from "../../../lib/saldo360/shop-rules";
import { photoUrl, saldoSupabase } from "../../../lib/saldo360/supabase-browser";
import { Avatar, Top } from "../ui";
import { useCuenta } from "../useCuenta";
import "../saldo360.css";

type Row = { id: string; slug: string; name: string; locality: string; whatsapp_e164: string | null; photo_path: string | null; status: "pending" | "approved" | "paused" | "suspended"; created_at: string; owner?: { owner_id: string; phone: string } };
const ORDER = { pending: 0, approved: 1, paused: 2, suspended: 3 } as const;
const LABEL = { pending: "En revisión", approved: "Publicada", paused: "Pausada", suspended: "Suspendida" } as const;

async function fetchShops(): Promise<Row[]> {
  const sb = saldoSupabase()!;
  const [{ data }, { data: owners }] = await Promise.all([
    sb.from("shops").select("id, slug, name, locality, whatsapp_e164, photo_path, status, created_at").limit(200),
    sb.rpc("admin_shop_owners"),
  ]);
  const byShop = new Map(((owners as { shop_id: string; owner_id: string; phone: string }[]) ?? []).map((o) => [o.shop_id, o]));
  return ((data as Row[]) ?? []).map((s) => ({ ...s, owner: byShop.get(s.id) }))
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.created_at.localeCompare(a.created_at));
}

// Moderación: la base solo deja pasar a cuentas con rol admin (RLS + admin_set_shop_status).
export default function Admin() {
  const { loading, profile } = useCuenta();
  const [shops, setShops] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [temp, setTemp] = useState<{ shop: Row; code: string } | null>(null);

  const load = useCallback(async () => setShops(await fetchShops()), []);
  useEffect(() => {
    if (profile?.role !== "admin") return;
    let alive = true;
    fetchShops().then((s) => { if (alive) setShops(s); });
    return () => { alive = false; };
  }, [profile]);

  async function setStatus(id: string, status: Row["status"]) {
    setBusy(id); setError("");
    const { error } = await saldoSupabase()!.rpc("admin_set_shop_status", { p_shop_id: id, p_status: status, p_note: "panel" });
    setBusy("");
    if (error) return setError(dbError(error.message));
    load();
  }

  // Clave temporal: la base la genera; el admin se la manda él mismo por WhatsApp (nada automático).
  async function tempPassword(s: Row) {
    if (!s.owner || !window.confirm(`¿Crear una clave temporal para «${s.name}»? La clave actual dejará de servir.`)) return;
    setBusy(s.id); setError(""); setTemp(null);
    const { data, error } = await saldoSupabase()!.rpc("admin_temp_password", { p_user_id: s.owner.owner_id });
    setBusy("");
    if (error) return setError(dbError(error.message));
    setTemp({ shop: s, code: data as string });
  }
  const sendTemp = (t: { shop: Row; code: string }) => `https://wa.me/${t.shop.owner!.phone}?text=${encodeURIComponent(`Hola, te escribe Saldo 360. Tu clave temporal es ${t.code}. Entra con tu número y cámbiala en «Mi cuenta».`)}`;
  const verify = (s: Row) => `https://wa.me/${s.whatsapp_e164}?text=${encodeURIComponent(`Hola, te escribe Saldo 360. ¿Creaste la tienda «${s.name}»? Responde SÍ para publicarla.`)}`;
  return <main className="s360"><div className="s360-shell">
    <Top right={<Link className="s360-header-link" href="/saldo360/mi-cuenta">Mi cuenta</Link>}/>
    <section className="s360-content">
      <div className="s360-intro"><h1>Revisar tiendas</h1><p>Aprueba solo si el WhatsApp responde y es de quien creó la tienda.</p></div>
      {loading ? <div className="s360-empty"><p>Cargando…</p></div>
        : profile?.role !== "admin" ? <div className="s360-empty"><strong>Solo para administración.</strong></div>
        : <>
          {error && <p role="alert" className="s360-error s360-form-msg">{error}</p>}
          {temp && <div className="s360-card s360-status approved"><strong>Clave temporal de «{temp.shop.name}»: {temp.code}</strong>
            <p>Mándasela tú por WhatsApp. Al entrar, que la cambie en «Mi cuenta».</p>
            <div className="s360-actions"><a href={sendTemp(temp)} target="_blank" rel="noopener noreferrer">Enviar por WhatsApp</a><button type="button" onClick={() => setTemp(null)}>Listo</button></div></div>}
          {shops === null ? <div className="s360-empty"><p>Cargando…</p></div>
            : shops.length === 0 ? <div className="s360-empty"><p>No hay tiendas todavía.</p></div>
            : shops.map((s) => <article className="s360-offer" key={s.id}>
              <div className="s360-offer-head">
                <Avatar offer={{ shopName: s.name, photoUrl: photoUrl(s.photo_path) }}/>
                <span><strong>{s.name}</strong><small>{LABEL[s.status]} · {s.locality || "Cuba"} · +{s.whatsapp_e164 ?? "sin WhatsApp"}</small></span>
              </div>
              <div className="s360-actions">
                {s.whatsapp_e164 && s.status === "pending" && <a href={verify(s)} target="_blank" rel="noopener noreferrer">Verificar por WhatsApp</a>}
                {s.status !== "approved" && s.status !== "paused" && <button type="button" disabled={busy === s.id || !s.whatsapp_e164} onClick={() => setStatus(s.id, "approved")}>Aprobar</button>}
                {s.owner && <button type="button" disabled={busy === s.id} onClick={() => tempPassword(s)}>Clave temporal</button>}
                {s.status !== "suspended" && <button type="button" className="danger" disabled={busy === s.id} onClick={() => { if (window.confirm(`¿Suspender «${s.name}»?`)) setStatus(s.id, "suspended"); }}>Suspender</button>}
              </div>
            </article>)}
        </>}
    </section>
  </div></main>;
}
