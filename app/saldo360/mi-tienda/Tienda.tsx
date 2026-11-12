"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { dbError, normalizeCubanMobile, prettyPhone } from "../../../lib/saldo360/shop-rules";
import { photoUrl, saldoSupabase } from "../../../lib/saldo360/supabase-browser";

export type Shop = { id: string; slug: string; name: string; bio: string; locality: string; whatsapp_e164: string | null; photo_path: string | null; status: "pending" | "approved" | "paused" | "suspended"; verified_at: string | null };

const STATUS = {
  pending: ["En revisión", "Comprobamos tu WhatsApp y la publicamos. Tus ofertas se verán al aprobarla."],
  approved: ["Publicada", "Los compradores ven tu tienda y tus ofertas vigentes."],
  paused: ["Pausada", "Nadie ve tu tienda ni tus ofertas hasta que la reactives."],
  suspended: ["Suspendida", "Escríbenos para revisarla."],
} as const;

/** Recorta al centro y reduce a 512×512 WebP: foto ligera para datos móviles. */
async function shrink(file: File): Promise<Blob> {
  const img = await createImageBitmap(file);
  const side = Math.min(img.width, img.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  canvas.getContext("2d")!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 512, 512);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("foto"))), "image/webp", 0.82));
}

// Número del bot que verifica tiendas (VivaBot filtra los mensajes «SALDO360»). Solo se muestra con
// NEXT_PUBLIC_SALDO360_VERIFY_ON=1, que se pone cuando el bot ya tiene el cambio (vivabot#24).
const BOT = process.env.NEXT_PUBLIC_SALDO360_VERIFY_ON === "1" ? (process.env.NEXT_PUBLIC_SALDO360_BOT_WHATSAPP || "").replace(/\D/g, "") : "";

/** El vendedor manda «SALDO360 <código>» desde SU WhatsApp; el bot comprueba número y código y aprueba la tienda. */
function Verificar({ shop, onDone }: { shop: Shop; onDone: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true); setError("");
    const { data, error } = await saldoSupabase()!.rpc("start_shop_verification", { p_shop_id: shop.id });
    setBusy(false);
    if (error) return setError(dbError(error.message));
    setCode(String(data));
  }

  if (!code) return <>
    <button className="s360-primary" type="button" disabled={busy} onClick={start}>{busy ? "Un momento…" : "Verificar por WhatsApp"}</button>
    <p className="s360-muted">Se publica sola en cuanto nos escribes desde el WhatsApp de tu tienda.</p>
    {error && <p role="alert" className="s360-error s360-form-msg">{error}</p>}
  </>;
  const text = `SALDO360 ${code}`;
  return <>
    <p className="s360-verify">Envía <strong>{text}</strong> desde el WhatsApp <strong>{prettyPhone(shop.whatsapp_e164!)}</strong>. Vale 30 minutos.</p>
    <a className="s360-chat" href={`https://wa.me/${BOT}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">Abrir WhatsApp y enviar</a>
    <button className="s360-link-btn" type="button" onClick={onDone}>Ya lo envié</button>
  </>;
}

export default function Tienda({ shop, userId, onChange }: { shop: Shop; userId: string; onChange: () => void }) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(shop.name);
  const [locality, setLocality] = useState(shop.locality);
  const [bio, setBio] = useState(shop.bio);
  const [phone, setPhone] = useState(shop.whatsapp_e164?.slice(2) ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [contacts, setContacts] = useState<number | null>(null);

  useEffect(() => {
    const since = new Date(Date.now() - 7 * 86400_000).toISOString();
    saldoSupabase()?.from("contact_events").select("id", { count: "exact", head: true }).eq("shop_id", shop.id).gte("created_at", since)
      .then(({ count }) => setContacts(count ?? 0));
  }, [shop.id]);

  const whatsapp = normalizeCubanMobile(phone);
  const phoneChanged = whatsapp !== shop.whatsapp_e164;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!whatsapp) return setMsg({ ok: false, text: "Escribe un móvil cubano: 8 cifras que empiezan por 5." });
    setBusy(true); setMsg(null);
    const { error } = await saldoSupabase()!.from("shops").update({ name: name.trim(), locality: locality.trim(), bio: bio.trim(), whatsapp_e164: whatsapp }).eq("id", shop.id);
    setBusy(false);
    if (error) return setMsg({ ok: false, text: dbError(error.message) });
    setEdit(false); setMsg({ ok: true, text: phoneChanged ? "Guardado. Como cambiaste el WhatsApp, revisamos la tienda otra vez." : "Guardado." });
    onChange();
  }

  async function setStatus(status: "approved" | "paused") {
    setBusy(true); setMsg(null);
    const { error } = await saldoSupabase()!.from("shops").update({ status }).eq("id", shop.id);
    setBusy(false);
    if (error) return setMsg({ ok: false, text: dbError(error.message) });
    onChange();
  }

  async function uploadPhoto(file: File | undefined) {
    if (!file) return;
    const sb = saldoSupabase()!;
    setBusy(true); setMsg(null);
    try {
      const path = `${userId}/perfil-${Date.now()}.webp`;
      const { error } = await sb.storage.from("shop-photos").upload(path, await shrink(file), { contentType: "image/webp" });
      if (error) throw error;
      const { error: e2 } = await sb.from("shops").update({ photo_path: path }).eq("id", shop.id);
      if (e2) throw e2;
      if (shop.photo_path?.startsWith(`${userId}/`)) await sb.storage.from("shop-photos").remove([shop.photo_path]);
      setMsg({ ok: true, text: "Foto actualizada." });
      onChange();
    } catch {
      setMsg({ ok: false, text: "No se pudo subir la foto. Prueba con otra imagen." });
    } finally { setBusy(false); }
  }

  const [label, help] = STATUS[shop.status];
  const src = photoUrl(shop.photo_path);
  return <>
    <div className="s360-seller-hero">
      <label className="s360-photo" aria-label="Cambiar foto">
        {src ? <img className="s360-avatar large" src={src} alt="" width={72} height={72}/> : <span className="s360-avatar large" aria-hidden="true">{shop.name.trim()[0]?.toUpperCase()}</span>}
        <span className="s360-photo-btn">{src ? "Cambiar foto" : "Subir foto"}</span>
        <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => uploadPhoto(e.target.files?.[0])}/>
      </label>
      <div><h1>{shop.name}</h1><p>{shop.locality || "Cuba"}</p></div>
    </div>

    <div className={`s360-card s360-status ${shop.status}`}>
      <strong>{label}</strong><p>{help}</p>
      {shop.status === "approved" && <p className="s360-muted"><Link href={`/saldo360/proveedores/${shop.slug}`}>Ver mi tienda como comprador</Link> · {contacts ?? "…"} contactos en 7 días (no son ventas)</p>}
      {shop.status === "approved" && <button className="s360-link-btn" type="button" disabled={busy} onClick={() => setStatus("paused")}>Pausar tienda</button>}
      {shop.status === "paused" && <button className="s360-primary" type="button" disabled={busy} onClick={() => setStatus("approved")}>Reactivar tienda</button>}
      {shop.status === "pending" && shop.whatsapp_e164 && BOT && <Verificar shop={shop} onDone={onChange}/>}
    </div>

    {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "s360-success" : "s360-error s360-form-msg"}>{msg.text}</p>}

    {!edit ? <button className="s360-secondary" type="button" onClick={() => setEdit(true)}>Editar datos de la tienda</button>
      : <form className="s360-card s360-sell-form" onSubmit={save}>
        <label className="s360-label" htmlFor="name">Nombre</label>
        <input id="name" maxLength={60} required value={name} onChange={(e) => setName(e.target.value)}/>
        <label className="s360-label" htmlFor="loc">Municipio o provincia</label>
        <input id="loc" maxLength={60} value={locality} onChange={(e) => setLocality(e.target.value)}/>
        <label className="s360-label" htmlFor="bio">Sobre tu tienda <span className="s360-muted">(opcional)</span></label>
        <input id="bio" maxLength={280} placeholder="Ej. Respondo de 8:00 a 22:00" value={bio} onChange={(e) => setBio(e.target.value)}/>
        <label className="s360-label" htmlFor="wa">WhatsApp</label>
        <div className="s360-amount s360-phone"><span>+53</span><input id="wa" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)}/></div>
        {phoneChanged && whatsapp && <p className="s360-muted">Si cambias el WhatsApp, la tienda vuelve a revisión.</p>}
        <button className="s360-primary" type="submit" disabled={busy}>Guardar</button>
        <button className="s360-link-btn" type="button" onClick={() => setEdit(false)}>Cancelar</button>
      </form>}
  </>;
}
