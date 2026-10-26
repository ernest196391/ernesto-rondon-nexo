"use client";
import {useEffect,useMemo,useState} from "react";
import providersFile from "../../../data/saldo360/providers.json";
import {providerIsCurrent,whatsAppOffer,type SaldoProvider} from "../../../lib/saldo360/providers";
import "../saldo360.css";
const amountOptions=[100,300,500,1000];
const currency=(n:number)=>new Intl.NumberFormat("es-CU",{maximumFractionDigits:0}).format(n)+" CUP";
export default function Saldo360Ofertas(){
 const [amount,setAmount]=useState(300);
 const [method,setMethod]=useState("Cualquiera");
 const [now,setNow]=useState<Date|null>(null);
 useEffect(()=>setNow(new Date()),[]);
 const providers=useMemo(()=>now?(providersFile.providers as SaldoProvider[]).filter(p=>providerIsCurrent(p,now)&&amount>=p.minAmountCup&&amount<=p.maxAmountCup&&(method==="Cualquiera"||p.paymentMethods.includes(method))).sort((a,b)=>a.rateCupPerCup-b.rateCupPerCup):[],[amount,method,now]);
 return <main className="s360 s360-real"><div className="s360-shell">
 <header className="s360-top"><a href="/saldo360/ofertas" className="s360-logo"><span className="s360-mark">s</span><span>saldo<strong>360</strong></span></a><span className="s360-tag">DIRECTORIO DE PROVEEDORES</span></header>
 <div className="s360-warning">Saldo 360 solo pone en contacto a compradores y proveedores. Confirma disponibilidad y precio antes de pagar. No enviamos dinero ni saldo.</div>
 <section className="s360-content">
 <div className="s360-intro" style={{marginTop:36}}><span className="s360-eyebrow">SALDO CUBACEL · CUBA</span><h1>Encuentra saldo. Sin vueltas.</h1><p>Consulta las ofertas confirmadas recientemente y habla directamente con el proveedor.</p></div>
 <div className="s360-card"><label className="s360-label" htmlFor="amount">¿Cuánto saldo necesitas?</label><div className="s360-amount"><input id="amount" type="number" min={1} max={500000} value={amount} onChange={e=>setAmount(Math.max(1,Math.min(500000,Number(e.target.value)||1)))}/><span>CUP</span></div><div className="s360-chips">{amountOptions.map(v=><button key={v} type="button" className={amount===v?"active":""} onClick={()=>setAmount(v)}>{v.toLocaleString("es-CU")}</button>)}</div><label className="s360-label" htmlFor="payment">¿Cómo quieres pagar?</label><select id="payment" value={method} onChange={e=>setMethod(e.target.value)}>{["Cualquiera","Transfermóvil","EnZona","Efectivo"].map(v=><option key={v}>{v}</option>)}</select></div>
 <h2 className="s360-heading">Proveedores con oferta vigente <span>{providers.length}</span></h2>
 {providers.length===0?<div className="s360-empty"><strong>Aún no hay ofertas confirmadas para esta búsqueda.</strong><p>Estamos incorporando proveedores. Nunca mostraremos precios inventados ni proveedores desconectados como disponibles.</p><a href="/saldo360" style={{color:"#245dd5"}}>Ver cómo funciona la demo →</a></div>:providers.map(p=><article className="s360-offer" key={p.id}><div className="s360-offer-head"><div><h3>{p.name}</h3><p>{p.locality}</p></div><span className="s360-live">✓ Oferta reciente</span></div><div className="s360-price"><div><small>Recibes</small><strong>{currency(amount)}</strong></div><span className="s360-arrow">→</span><div><small>Precio publicado</small><strong>{currency(amount*p.rateCupPerCup)}</strong></div></div><div className="s360-offer-bottom"><span>Actualizado: {new Date(p.confirmedAt).toLocaleDateString("es-CU")} · Confirma antes de pagar</span><a target="_blank" rel="noopener noreferrer" className="s360-chat" href={whatsAppOffer(p,amount)}>Consultar por WhatsApp ↗</a></div></article>)}
 <p className="s360-footnote">Los proveedores son independientes de Saldo 360. No garantizamos precio, saldo ni entrega. Nunca envíes dinero sin comprobar a quién estás pagando.</p>
 </section><footer className="s360-footer"><span>Saldo 360 · Contacto directo</span><span><a href="/saldo360">Demo</a></span></footer></div></main>;
}
