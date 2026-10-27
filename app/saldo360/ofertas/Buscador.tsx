"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PAYMENT_METHODS, ago, filterOffers, formatCup, reputationLabel, totalCup, whatsAppLink, type MarketOffer, type PaymentMethod } from "../../../lib/saldo360/market";
import { Avatar, SAFETY } from "../ui";

const AMOUNTS = [100, 300, 500, 1000];
const SUPABASE_URL = process.env.NEXT_PUBLIC_SALDO360_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SALDO360_SUPABASE_ANON_KEY || "";

// Un clic a WhatsApp se cuenta como «contacto» para el proveedor. Nunca como venta.
function logContact(offerId: string, amountCup: number) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  fetch(`${SUPABASE_URL}/rest/v1/rpc/log_contact`, {
    method: "POST", keepalive: true,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_offer_id: offerId, p_amount_cup: amountCup }),
  }).catch(() => {});
}

type Props = { offers: MarketOffer[]; error: boolean; initialAmount: number; initialMethod: PaymentMethod | "any"; nowIso: string };

export default function Buscador({ offers, error, initialAmount, initialMethod, nowIso }: Props) {
  const [amount, setAmount] = useState(initialAmount);
  const [method, setMethod] = useState<PaymentMethod | "any">(initialMethod);
  const now = useMemo(() => new Date(nowIso), [nowIso]);

  // Al volver atrás se conservan monto y forma de pago (van en la dirección).
  useEffect(() => {
    const q = new URLSearchParams({ monto: String(amount), ...(method !== "any" ? { pago: method } : {}) });
    window.history.replaceState(null, "", `?${q}`);
  }, [amount, method]);

  const results = useMemo(() => filterOffers(offers, amount, method, now), [offers, amount, method, now]);

  return <section className="s360-content">
    <div className="s360-card s360-search">
      <label className="s360-label" htmlFor="amount">¿Cuánto saldo buscas?</label>
      <div className="s360-amount"><input id="amount" type="number" inputMode="numeric" min={1} max={100000} value={amount}
        onChange={(e) => setAmount(Math.max(1, Math.min(100000, Math.trunc(Number(e.target.value)) || 1)))}/><span>CUP</span></div>
      <div className="s360-chips">{AMOUNTS.map((v) => <button key={v} type="button" aria-pressed={amount === v} className={amount === v ? "active" : ""} onClick={() => setAmount(v)}>{v.toLocaleString("es-CU")}</button>)}</div>
      <label className="s360-label" htmlFor="payment">¿Cómo pagas?</label>
      <select id="payment" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod | "any")}>
        <option value="any">Cualquier forma</option>
        {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </div>

    <h2 className="s360-heading" aria-live="polite">Ofertas vigentes <span>{results.length}</span></h2>
    {error ? <div className="s360-empty"><strong>No pudimos cargar las ofertas.</strong><p>Revisa tu conexión y vuelve a intentarlo.</p></div>
      : results.length === 0 ? <div className="s360-empty"><strong>No hay ofertas vigentes para {formatCup(amount)}.</strong><p>Prueba otro monto o vuelve más tarde.</p></div>
      : results.map((o) => <article className="s360-offer" key={o.id}>
        <Link className="s360-offer-head" href={`/saldo360/proveedores/${encodeURIComponent(o.shopSlug)}`}>
          <Avatar offer={o}/>
          <span><strong>{o.shopName}</strong><small>{o.locality || "Cuba"} · {reputationLabel(o)}</small></span>
        </Link>
        <div className="s360-price">
          <div><small>Recibes</small><strong>{formatCup(amount)}</strong></div>
          <div><small>Pagas</small><strong className="s360-total">{formatCup(totalCup(amount, o.pricePer100Cup))}</strong></div>
        </div>
        <p className="s360-meta">{formatCup(o.pricePer100Cup)} por cada 100 · hasta {formatCup(o.maxCup)} · {o.paymentMethods.map((m) => PAYMENT_METHODS[m]).join(", ")} · confirmada {ago(o.confirmedAt, now)}</p>
        <a className="s360-chat" target="_blank" rel="noopener noreferrer" href={whatsAppLink(o, amount)} onClick={() => logContact(o.id, amount)}>Escribir por WhatsApp</a>
      </article>)}
    <p className="s360-footnote">{SAFETY}</p>
  </section>;
}
