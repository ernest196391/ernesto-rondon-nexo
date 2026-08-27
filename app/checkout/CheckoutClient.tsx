"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Cart, CommercePhase } from "../../lib/commerce/cart";
import { formatMoney, itemCount, productCountLabel } from "../../lib/commerce/cart";

type Draft = { firstName:string;lastName:string;phone:string;alternatePhone:string;email:string;address:string;municipality:string;reference:string;notes:string;deliveryWindow:string;paymentMethod:string };
const emptyDraft:Draft={firstName:"",lastName:"",phone:"",alternatePhone:"",email:"",address:"",municipality:"",reference:"",notes:"",deliveryWindow:"",paymentMethod:""};
const paymentLabel:Record<string,string>={cvd_whatsapp:"Coordinar pedido por WhatsApp",bacs:"Transferencia bancaria"};
function message(error:unknown){return error instanceof Error?error.message:"No pudimos continuar. Revisa tu conexión e inténtalo de nuevo.";}

export default function CheckoutClient({initialReferral}:{initialReferral:string}){
  const router=useRouter();
  const [phase,setPhase]=useState<CommercePhase>("restoring");
  const [cart,setCart]=useState<Cart|null>(null);
  const [referral,setReferral]=useState(initialReferral);
  const [draft,setDraft]=useState<Draft>(emptyDraft);
  const [error,setError]=useState("");
  const [idempotencyKey,setIdempotencyKey]=useState("");

  const restore=useCallback(async()=>{
    setPhase("validating");setError("");
    const response=await fetch(`/api/commerce/checkout?nexo_session=${Date.now()}`,{cache:"no-store",signal:AbortSignal.timeout(25_000)});
    const data=await response.json();if(!response.ok)throw new Error(data.error||"No pudimos comprobar tu carrito.");
    setCart(data.cart);setReferral(data.referral||initialReferral);
    setDraft(current=>({...current,paymentMethod:current.paymentMethod&&data.cart.payment_methods?.includes(current.paymentMethod)?current.paymentMethod:(data.cart.payment_methods?.[0]||"")}));
    setPhase(data.cart.items?.length?"ready":"empty");
  },[initialReferral]);
  useEffect(()=>{const timer=window.setTimeout(()=>{const saved=sessionStorage.getItem("nexo_checkout_draft");if(saved){try{setDraft({...emptyDraft,...JSON.parse(saved)});}catch{sessionStorage.removeItem("nexo_checkout_draft");}}setIdempotencyKey(crypto.randomUUID());void restore().catch(caught=>{setError(message(caught));setPhase("error");});},0);return()=>window.clearTimeout(timer);},[restore]);
  useEffect(()=>{if(phase!=="restoring")sessionStorage.setItem("nexo_checkout_draft",JSON.stringify(draft));},[draft,phase]);
  const query=useMemo(()=>referral?`?ref=${encodeURIComponent(referral)}`:"",[referral]);
  function field(name:keyof Draft,value:string){setDraft(current=>({...current,[name]:value}));}
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(phase!=="ready")return;
    setPhase("submitting");setError("");
    try{
      const response=await fetch("/api/commerce/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...draft,idempotencyKey}),signal:AbortSignal.timeout(55_000)});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"No pudimos crear el pedido.");
      setPhase("success");sessionStorage.removeItem("nexo_checkout_draft");router.push(data.confirmationUrl);
    }catch(caught){setError(message(caught));setPhase("error");}
  }
  if(phase==="restoring"||phase==="validating")return <section className="checkout-state" aria-live="polite"><span className="checkout-spinner"/><h1>Comprobando carrito…</h1><p>Confirmamos precio y disponibilidad antes de continuar.</p></section>;
  if(phase==="empty")return <section className="checkout-state"><h1>Tu carrito está vacío</h1><p>Añade un producto antes de finalizar el pedido.</p><Link href={`/marketplace${query}`}>Explorar productos</Link></section>;
  if(phase==="error"&&!cart)return <section className="checkout-state error" role="alert"><h1>No pudimos abrir el checkout</h1><p>{error}</p><button type="button" onClick={()=>void restore().catch(caught=>{setError(message(caught));setPhase("error");})}>Reintentar</button></section>;
  if(!cart)return null;
  const count=itemCount(cart),busy=phase==="submitting";
  return <div className="checkout-shell">
    <form className="checkout-form" onSubmit={submit} noValidate={false}>
      <header><span>DATOS DEL PEDIDO</span><h1>Finalizar pedido</h1><p>Completa tus datos para registrar el pedido oficial.</p></header>
      {error&&<div className="checkout-error" role="alert"><strong>No pudimos completar el pedido.</strong><p>{error}</p></div>}
      <fieldset disabled={busy}><legend>Contacto</legend><div className="field-grid two"><label><span>Nombre</span><input autoComplete="given-name" required minLength={2} value={draft.firstName} onChange={e=>field("firstName",e.target.value)}/></label><label><span>Apellidos</span><input autoComplete="family-name" required minLength={2} value={draft.lastName} onChange={e=>field("lastName",e.target.value)}/></label></div><div className="field-grid two"><label><span>Teléfono</span><input type="tel" inputMode="tel" autoComplete="tel" required minLength={7} value={draft.phone} onChange={e=>field("phone",e.target.value)}/></label><label><span>Teléfono alternativo <small>Opcional</small></span><input type="tel" inputMode="tel" value={draft.alternatePhone} onChange={e=>field("alternatePhone",e.target.value)}/></label></div><label><span>Correo para la confirmación</span><input type="email" autoComplete="email" required value={draft.email} onChange={e=>field("email",e.target.value)}/></label></fieldset>
      <fieldset disabled={busy}><legend>Entrega</legend><label><span>Dirección completa</span><input autoComplete="street-address" required minLength={8} value={draft.address} onChange={e=>field("address",e.target.value)}/></label><div className="field-grid two"><label><span>Municipio o zona</span><input autoComplete="address-level2" required value={draft.municipality} onChange={e=>field("municipality",e.target.value)}/></label><label><span>Franja preferida <small>Opcional</small></span><select value={draft.deliveryWindow} onChange={e=>field("deliveryWindow",e.target.value)}><option value="">Sin preferencia</option><option value="Mañana">Mañana</option><option value="Tarde">Tarde</option></select></label></div><label><span>Referencia para llegar <small>Opcional</small></span><input value={draft.reference} onChange={e=>field("reference",e.target.value)}/></label><label><span>Notas <small>Opcional</small></span><textarea rows={3} maxLength={500} value={draft.notes} onChange={e=>field("notes",e.target.value)}/></label></fieldset>
      <fieldset disabled={busy}><legend>Coordinación del pago</legend><div className="payment-options">{(cart.payment_methods||[]).map(method=><label key={method}><input type="radio" name="paymentMethod" required checked={draft.paymentMethod===method} onChange={()=>field("paymentMethod",method)}/><span><strong>{paymentLabel[method]||"Método disponible"}</strong><small>{method==="cvd_whatsapp"?"Registramos el pedido y coordinamos los próximos pasos.":"Recibirás los datos necesarios después de registrar el pedido."}</small></span></label>)}</div></fieldset>
      <button className="checkout-submit" type="submit" disabled={busy||phase!=="ready"}>{busy?"Procesando pedido…":"Confirmar pedido"}</button>
      <p className="submit-note">No se realizará ningún cobro automático al pulsar este botón.</p>
    </form>
    <aside className="checkout-summary"><span>RESUMEN</span><p className="summary-count">{productCountLabel(count)}</p><ul>{cart.items.map(item=><li key={item.key}><span>{item.quantity} × {item.name}</span><strong>{formatMoney(item.totals.line_total,item.totals)}</strong></li>)}</ul><div className="summary-row"><span>Productos</span><strong>{formatMoney(cart.totals.total_items,cart.totals)}</strong></div><div className="summary-row"><span>Mensajería</span><span>Se calcula según la entrega</span></div><div className="summary-total"><span>Total provisional</span><strong>{formatMoney(cart.totals.total_price,cart.totals)}</strong></div><p>Confirmaremos disponibilidad, mensajería y total antes de finalizar la coordinación.</p><Link href={`/carrito${query}`}>Volver al carrito</Link></aside>
  </div>;
}
