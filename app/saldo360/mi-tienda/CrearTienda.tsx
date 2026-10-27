"use client";
import { useState } from "react";
import { dbError, normalizeCubanMobile, slugFromName } from "../../../lib/saldo360/shop-rules";
import { saldoSupabase } from "../../../lib/saldo360/supabase-browser";

export default function CrearTienda({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [locality, setLocality] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const whatsapp = normalizeCubanMobile(phone);
  const ok = name.trim().length >= 2 && !!whatsapp && consent;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const sb = saldoSupabase();
    if (!sb || !ok) return;
    setBusy(true); setError("");
    const slug = slugFromName(name, Math.random().toString(36).slice(2, 6));
    const { error } = await sb.from("shops").insert({ slug, name: name.trim(), locality: locality.trim(), whatsapp_e164: whatsapp });
    setBusy(false);
    if (error) return setError(dbError(error.message));
    onCreated();
  }

  return <>
    <div className="s360-intro"><h1>Crea tu tienda</h1><p>Así te verán los compradores.</p></div>
    <form className="s360-card s360-sell-form" onSubmit={create}>
      <label className="s360-label" htmlFor="shop">Nombre de tu tienda</label>
      <input id="shop" maxLength={60} required placeholder="Ej. Saldo Rápido Playa" value={name} onChange={(e) => setName(e.target.value)}/>
      <label className="s360-label" htmlFor="loc">¿Dónde estás? <span className="s360-muted">(opcional)</span></label>
      <input id="loc" maxLength={60} placeholder="Municipio o provincia" value={locality} onChange={(e) => setLocality(e.target.value)}/>
      <label className="s360-label" htmlFor="wa">Tu WhatsApp</label>
      <div className="s360-amount s360-phone"><span>+53</span><input id="wa" type="tel" inputMode="tel" autoComplete="tel" placeholder="5XXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)}/></div>
      {phone && !whatsapp && <p className="s360-error s360-form-msg">Escribe un móvil cubano: 8 cifras que empiezan por 5.</p>}
      <label className="s360-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}/>
        <span>Autorizo que Saldo 360 muestre el nombre de mi tienda y este WhatsApp a los compradores.</span></label>
      <button className="s360-primary" type="submit" disabled={!ok || busy}>{busy ? "Creando…" : "Crear tienda"}</button>
      {error && <p role="alert" className="s360-error s360-form-msg">{error}</p>}
    </form>
    <p className="s360-footnote">Revisamos cada tienda antes de mostrarla (comprobamos que el WhatsApp es tuyo). Mientras tanto ya puedes preparar tus ofertas.</p>
  </>;
}
