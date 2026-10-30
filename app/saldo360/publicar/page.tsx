"use client";
import Link from "next/link";
import { useState } from "react";
import { METHODS_BY_CURRENCY, PAYMENT_METHODS, formatCup, totalCup, type PaymentMethod } from "../../../lib/saldo360/market";
import { Top } from "../ui";
import "../saldo360.css";

// Mientras no haya cuentas, la oferta se envía al equipo de Saldo 360, que la verifica y la publica.
const OPERATOR = (process.env.NEXT_PUBLIC_SALDO360_OPERATOR_WHATSAPP || "").replace(/\D/g, "");

export default function Publicar() {
  const [stock, setStock] = useState("1000");
  const [price, setPrice] = useState("");
  const [methods, setMethods] = useState<PaymentMethod[]>(["transfermovil"]);
  const [shop, setShop] = useState("");
  const [locality, setLocality] = useState("");
  const [consent, setConsent] = useState(false);
  const [copied, setCopied] = useState<"" | "ok" | "error">("");

  const n = Number(stock), p = Number(price);
  const amountOk = Number.isInteger(n) && n >= 1 && n <= 100000;
  const priceOk = Number.isFinite(p) && p > 0 && p <= 100000;
  const ok = amountOk && priceOk && methods.length > 0 && shop.trim().length >= 2 && consent;
  const message = [
    "SALDO360 OFERTA",
    `Tienda: ${shop.trim()}${locality.trim() ? ` (${locality.trim()})` : ""}`,
    `Saldo disponible: ${n} CUP`,
    `Por 100 CUP cobro ${p} CUP`,
    `Pago: ${methods.map((m) => PAYMENT_METHODS[m]).join(", ")}`,
    "Autorizo a Saldo 360 a publicar mi nombre de tienda y este WhatsApp con esta oferta durante 24 horas.",
  ].join("\n");

  const toggle = (m: PaymentMethod) => { setMethods((xs) => (xs.includes(m) ? xs.filter((x) => x !== m) : [...xs, m])); setCopied(""); };
  async function copy() {
    if (!ok) return;
    try { await navigator.clipboard.writeText(message); setCopied("ok"); } catch { setCopied("error"); }
  }

  return <main className="s360"><div className="s360-shell">
    <Top right={<Link href="/saldo360/ofertas" className="s360-header-link">Busco saldo</Link>}/>
    <section className="s360-content">
      <div className="s360-intro"><h1>Tengo saldo</h1><p>Publica tu oferta gratis. Los compradores te escriben directo.</p></div>
      <Link className="s360-primary" href="/saldo360/mi-tienda">Crear mi tienda</Link>
      <p className="s360-muted s360-center">Con tu tienda cambias precios y pausas ofertas cuando quieras.</p>
      <h2 className="s360-heading">¿Sin correo? Envíanos tu oferta</h2>
      <div className="s360-card s360-sell-form" onChange={() => setCopied("")}>
        <label className="s360-label" htmlFor="stock">¿Cuánto saldo tienes?</label>
        <div className="s360-amount"><input id="stock" type="number" inputMode="numeric" min="1" max="100000" value={stock} onChange={(e) => setStock(e.target.value)}/><span>CUP</span></div>
        <label className="s360-label" htmlFor="rate">¿Cuánto cobras por cada 100 CUP de saldo?</label>
        <div className="s360-amount"><input id="rate" type="number" inputMode="decimal" min="0.01" max="100000" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}/><span>CUP</span></div>
        {priceOk && <p className="s360-preview">Quien compre 300 CUP de saldo te pagará <strong>{formatCup(totalCup(300, p))}</strong>.</p>}
        <fieldset className="s360-methods"><legend className="s360-label">¿Cómo te pagan? <span className="s360-muted">(en dólares o USDT: crea tu tienda)</span></legend>
          {METHODS_BY_CURRENCY.CUP.map((k) => <label key={k} className={methods.includes(k) ? "active" : ""}>
            <input type="checkbox" checked={methods.includes(k)} onChange={() => toggle(k)}/>{PAYMENT_METHODS[k]}</label>)}
        </fieldset>
        <label className="s360-label" htmlFor="shop">Nombre de tu tienda</label>
        <input id="shop" maxLength={60} placeholder="Ej. Saldo Rápido Playa" value={shop} onChange={(e) => setShop(e.target.value)}/>
        <label className="s360-label" htmlFor="locality">¿Dónde estás? <span className="s360-muted">(opcional)</span></label>
        <input id="locality" maxLength={60} placeholder="Municipio o provincia" value={locality} onChange={(e) => setLocality(e.target.value)}/>
        <label className="s360-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}/>
          <span>Autorizo publicar mi nombre de tienda y mi WhatsApp con esta oferta.</span></label>
        {OPERATOR
          ? <a className={"s360-primary" + (ok ? "" : " disabled")} aria-disabled={!ok} href={ok ? `https://wa.me/${OPERATOR}?text=${encodeURIComponent(message)}` : undefined} target="_blank" rel="noopener noreferrer">Enviar oferta por WhatsApp</a>
          : <button className="s360-primary" type="button" disabled={!ok} onClick={copy}>Copiar oferta</button>}
        {!ok && <p className="s360-muted">Completa saldo, precio, forma de pago, nombre y autorización.</p>}
        {copied === "ok" && <p role="status" className="s360-success">Copiada. Pégala en WhatsApp a quien te invitó a Saldo 360.</p>}
        {copied === "error" && <><p role="alert" className="s360-error">No se pudo copiar. Copia este texto:</p><textarea readOnly aria-label="Texto de la oferta" value={message}/></>}
      </div>
      <p className="s360-footnote">Verificamos cada oferta antes de publicarla. Vence a las 24 h si no la confirmas. Saldo 360 no cobra ni transfiere saldo.</p>
    </section>
  </div></main>;
}
