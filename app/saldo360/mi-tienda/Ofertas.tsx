"use client";
import { useCallback, useEffect, useState } from "react";
import { METHODS_BY_CURRENCY, PAYMENT_METHODS, formatCup, formatMoney, methodsText, totalCup, type Currency, type PaymentMethod } from "../../../lib/saldo360/market";
import { dbError, timeLeft } from "../../../lib/saldo360/shop-rules";
import { saldoSupabase } from "../../../lib/saldo360/supabase-browser";
import type { Shop } from "./Tienda";

type Offer = {
  id: string; min_cup: number; max_cup: number; price_per_100_cup: string; payment_methods: PaymentMethod[]; status: "active" | "paused";
  confirmed_at: string; expires_at: string; price_currency: Currency; custom_payment_methods: string[] | null;
  wholesale_min_cup: number | null; wholesale_price_per_100: string | null;
};
type Draft = { min: string; max: string; price: string; currency: Currency; methods: PaymentMethod[]; custom: string; hours: number; wMin: string; wPrice: string };
const EMPTY: Draft = { min: "100", max: "1000", price: "", currency: "CUP", methods: ["transfermovil"], custom: "", hours: 24, wMin: "", wPrice: "" };

/** «PayPal, Saldo móvil» → hasta 3 formas propias de 2 a 30 letras. */
const customList = (t: string) => t.split(",").map((x) => x.trim().replace(/[<>\r\n]/g, "")).filter((x) => x.length >= 2).slice(0, 3).map((x) => x.slice(0, 30));

function OfferForm({ initial, submitLabel, busy, onSubmit, onCancel }: { initial: Draft; submitLabel: string; busy: boolean; onSubmit: (d: Draft) => void; onCancel?: () => void }) {
  const [d, setD] = useState(initial);
  const [mayorista, setMayorista] = useState(!!initial.wMin);
  const min = Number(d.min), max = Number(d.max), price = Number(d.price), wMin = Number(d.wMin), wPrice = Number(d.wPrice);
  const custom = customList(d.custom);
  const wOk = !mayorista || (Number.isInteger(wMin) && wMin > min && wMin <= max && wPrice > 0 && wPrice <= price);
  const ok = Number.isInteger(min) && Number.isInteger(max) && min >= 1 && max >= min && max <= 100000 && price > 0 && price <= 100000
    && d.methods.length + custom.length > 0 && wOk;
  const toggle = (m: PaymentMethod) => setD({ ...d, methods: d.methods.includes(m) ? d.methods.filter((x) => x !== m) : [...d.methods, m] });
  const setCurrency = (c: Currency) => setD({ ...d, currency: c, methods: d.methods.filter((m) => METHODS_BY_CURRENCY[c].includes(m)) });
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (ok) onSubmit(mayorista ? d : { ...d, wMin: "", wPrice: "" }); };
  return <form className="s360-card s360-sell-form" onSubmit={submit}>
    <label className="s360-label" htmlFor="max">¿Cuánto saldo tienes?</label>
    <div className="s360-amount"><input id="max" type="number" inputMode="numeric" min={1} max={100000} value={d.max} onChange={(e) => setD({ ...d, max: e.target.value })}/><span>CUP</span></div>
    <fieldset className="s360-methods"><legend className="s360-label">¿En qué moneda cobras?</legend>
      {(["CUP", "USD"] as Currency[]).map((c) => <label key={c} className={d.currency === c ? "active" : ""}>
        <input type="radio" name="currency" checked={d.currency === c} onChange={() => setCurrency(c)}/>{c === "CUP" ? "Pesos (CUP)" : "Dólares (USD)"}</label>)}
    </fieldset>
    <label className="s360-label" htmlFor="price">¿Cuánto cobras por cada 100 CUP de saldo?</label>
    <div className="s360-amount"><input id="price" type="number" inputMode="decimal" min="0.01" max="100000" step="0.01" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value })}/><span>{d.currency}</span></div>
    {price > 0 && <p className="s360-preview">Quien compre 300 CUP de saldo te pagará <strong>{formatMoney(totalCup(300, price), d.currency)}</strong>.</p>}
    <label className="s360-label" htmlFor="min">Venta mínima</label>
    <div className="s360-amount"><input id="min" type="number" inputMode="numeric" min={1} max={100000} value={d.min} onChange={(e) => setD({ ...d, min: e.target.value })}/><span>CUP</span></div>
    <fieldset className="s360-methods"><legend className="s360-label">¿Cómo te pagan?</legend>
      {METHODS_BY_CURRENCY[d.currency].map((k) => <label key={k} className={d.methods.includes(k) ? "active" : ""}>
        <input type="checkbox" checked={d.methods.includes(k)} onChange={() => toggle(k)}/>{PAYMENT_METHODS[k]}</label>)}
    </fieldset>
    <label className="s360-label" htmlFor="custom">¿Otra forma? <span className="s360-muted">(opcional, separadas por comas)</span></label>
    <input id="custom" maxLength={100} placeholder="Ej. PayPal, Saldo móvil" value={d.custom} onChange={(e) => setD({ ...d, custom: e.target.value })}/>
    <label className="s360-consent"><input type="checkbox" checked={mayorista} onChange={(e) => setMayorista(e.target.checked)}/>
      <span>Tengo precio mayorista (más barato desde cierta cantidad)</span></label>
    {mayorista && <>
      <label className="s360-label" htmlFor="wmin">Mayorista desde</label>
      <div className="s360-amount"><input id="wmin" type="number" inputMode="numeric" min={1} max={100000} value={d.wMin} onChange={(e) => setD({ ...d, wMin: e.target.value })}/><span>CUP</span></div>
      <label className="s360-label" htmlFor="wprice">Precio mayorista por cada 100 CUP</label>
      <div className="s360-amount"><input id="wprice" type="number" inputMode="decimal" min="0.01" step="0.01" value={d.wPrice} onChange={(e) => setD({ ...d, wPrice: e.target.value })}/><span>{d.currency}</span></div>
      {!wOk && <p className="s360-muted">El mayorista va desde más que la venta mínima hasta tu saldo, y no puede ser más caro que el precio normal.</p>}
    </>}
    <label className="s360-label" htmlFor="hours">¿Por cuánto tiempo?</label>
    <select id="hours" value={d.hours} onChange={(e) => setD({ ...d, hours: Number(e.target.value) })}>
      <option value={24}>24 horas</option><option value={48}>48 horas</option><option value={72}>72 horas</option>
    </select>
    {!ok && <p className="s360-muted">Revisa: saldo mayor o igual que la venta mínima, precio y al menos una forma de pago.</p>}
    <button className="s360-primary" type="submit" disabled={!ok || busy}>{busy ? "Guardando…" : submitLabel}</button>
    {onCancel && <button className="s360-link-btn" type="button" onClick={onCancel}>Cancelar</button>}
  </form>;
}

async function fetchOffers(shopId: string): Promise<Offer[]> {
  const { data } = await saldoSupabase()!.from("offers")
    .select("id, min_cup, max_cup, price_per_100_cup, payment_methods, status, confirmed_at, expires_at, price_currency, custom_payment_methods, wholesale_min_cup, wholesale_price_per_100")
    .eq("shop_id", shopId).neq("status", "removed").order("created_at", { ascending: false });
  return (data as Offer[]) ?? [];
}

export default function Ofertas({ shop }: { shop: Shop }) {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [mode, setMode] = useState<"list" | "new" | string>("list"); // string = id de la oferta en edición
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(async () => { setOffers(await fetchOffers(shop.id)); setNow(new Date()); }, [shop.id]);
  useEffect(() => {
    let alive = true;
    fetchOffers(shop.id).then((o) => { if (alive) { setOffers(o); setNow(new Date()); } });
    return () => { alive = false; };
  }, [shop.id]);

  async function run(label: string, fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true); setMsg(null);
    const { error } = await fn();
    setBusy(false);
    if (error) return setMsg({ ok: false, text: dbError(error.message) });
    setMsg({ ok: true, text: label }); setMode("list"); load();
  }
  const sb = () => saldoSupabase()!;
  const args = (d: Draft) => ({
    p_min_cup: Number(d.min), p_max_cup: Number(d.max), p_price_per_100_cup: Number(d.price), p_payment_methods: d.methods,
    p_valid_hours: d.hours, p_currency: d.currency, p_custom_methods: customList(d.custom),
    p_wholesale_min_cup: d.wMin ? Number(d.wMin) : null, p_wholesale_price: d.wPrice ? Number(d.wPrice) : null,
  });
  const draftOf = (o: Offer): Draft => ({
    min: String(o.min_cup), max: String(o.max_cup), price: String(Number(o.price_per_100_cup)), currency: o.price_currency, methods: o.payment_methods,
    custom: (o.custom_payment_methods ?? []).join(", "), hours: 24,
    wMin: o.wholesale_min_cup ? String(o.wholesale_min_cup) : "", wPrice: o.wholesale_price_per_100 ? String(Number(o.wholesale_price_per_100)) : "",
  });

  const live = (o: Offer) => o.status === "active" && Date.parse(o.expires_at) > now.getTime();
  return <section className="s360-offers-admin">
    <h2 className="s360-heading">Mis ofertas <span>{offers?.filter(live).length ?? 0}</span></h2>
    {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "s360-success" : "s360-error s360-form-msg"}>{msg.text}</p>}
    {mode === "new" ? <OfferForm initial={EMPTY} submitLabel="Publicar oferta" busy={busy} onCancel={() => setMode("list")}
        onSubmit={(d) => run(shop.status === "approved" ? "Oferta publicada." : "Oferta guardada. Saldrá cuando aprobemos tu tienda.", () => sb().rpc("publish_offer", { p_shop_id: shop.id, ...args(d) }))}/>
      : <button className="s360-primary" type="button" onClick={() => { setMsg(null); setMode("new"); }}>Publicar oferta</button>}
    {offers === null ? <div className="s360-empty"><p>Cargando…</p></div>
      : offers.length === 0 && mode !== "new" ? <div className="s360-empty"><p>Aún no tienes ofertas.</p></div>
      : offers.map((o) => mode === o.id
        ? <OfferForm key={o.id} busy={busy} submitLabel="Guardar cambios" onCancel={() => setMode("list")} initial={draftOf(o)}
            onSubmit={(d) => run("Oferta actualizada.", () => sb().rpc("update_offer", { p_offer_id: o.id, ...args(d) }))}/>
        : <article className="s360-offer" key={o.id}>
          <div className="s360-price">
            <div><small>Por cada 100 CUP</small><strong className="s360-total">{formatMoney(Number(o.price_per_100_cup), o.price_currency)}</strong></div>
            <div><small>Disponible</small><strong>{formatCup(o.max_cup)}</strong></div>
          </div>
          <p className="s360-meta">Desde {formatCup(o.min_cup)} · {methodsText({ paymentMethods: o.payment_methods, customMethods: o.custom_payment_methods ?? [] })}
            {o.wholesale_min_cup && o.wholesale_price_per_100 ? ` · mayorista desde ${formatCup(o.wholesale_min_cup)} a ${formatMoney(Number(o.wholesale_price_per_100), o.price_currency)}` : ""}
            {" · "}{o.status === "paused" ? "pausada" : timeLeft(o.expires_at, now)}</p>
          <div className="s360-actions">
            <button type="button" disabled={busy} onClick={() => run("Renovada por 24 horas.", () => sb().rpc("confirm_offer", { p_offer_id: o.id, p_valid_hours: 24 }))}>{live(o) ? "Sigue en pie" : "Renovar"}</button>
            <button type="button" disabled={busy} onClick={() => { setMsg(null); setMode(o.id); }}>Cambiar</button>
            {live(o) && <button type="button" disabled={busy} onClick={() => run("Oferta pausada.", () => sb().from("offers").update({ status: "paused" }).eq("id", o.id))}>Pausar</button>}
            <button type="button" className="danger" disabled={busy} onClick={() => { if (window.confirm("¿Quitar esta oferta?")) run("Oferta quitada.", () => sb().from("offers").update({ status: "removed" }).eq("id", o.id)); }}>Quitar</button>
          </div>
        </article>)}
    <p className="s360-footnote">Las ofertas vencen solas. Toca «Sigue en pie» cada día para que los compradores sepan que es real.</p>
  </section>;
}
