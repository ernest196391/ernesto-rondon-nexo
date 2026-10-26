"use client";
import { useEffect, useMemo, useState } from "react";
import "./saldo360.css";

type Provider = { id:string; name:string; area:string; rate:number; available:number; methods:string[]; active:boolean; eta:string };
type Request = { id:string; amount:number; cost:number; provider:string; method:string; created:string; status:"Solicitud de prueba" };
const providers:Provider[]=[
{id:"mariela",name:"Mariela Recargas",area:"Playa, La Habana",rate:4.8,available:0,methods:["Transfermóvil","EnZona"],active:false,eta:"No disponible"},
{id:"centro",name:"Saldo Centro",area:"Centro Habana",rate:4.7,available:500,methods:["Transfermóvil","Efectivo"],active:true,eta:"15–30 min (simulado)"},
{id:"viva",name:"Punto Viva",area:"Vedado",rate:4.9,available:1200,methods:["Transfermóvil","EnZona","Efectivo"],active:true,eta:"30–60 min (simulado)"}
];
const KEY="saldo360-demo-requests-v1";
const money=(v:number)=>new Intl.NumberFormat("es-CU",{maximumFractionDigits:0}).format(v)+" CUP";
export default function Saldo360Page(){
const [amount,setAmount]=useState("300"),[method,setMethod]=useState("Transfermóvil"),[section,setSection]=useState<"recargar"|"pedidos"|"proveedor">("recargar"),[chosen,setChosen]=useState<string|null>(null),[requests,setRequests]=useState<Request[]>([]),[loaded,setLoaded]=useState(false),[notice,setNotice]=useState("");
useEffect(()=>{try{const stored=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(stored))setRequests(stored.slice(0,25));}catch{}setLoaded(true)},[]);
useEffect(()=>{if(loaded)localStorage.setItem(KEY,JSON.stringify(requests));},[requests,loaded]);
const num=Number(amount);const valid=Number.isInteger(num)&&num>=10&&num<=10000;
const offers=useMemo(()=>providers.filter(p=>p.active&&p.available>=num&&p.methods.includes(method)).sort((a,b)=>a.rate-b.rate),[num,method]);
const selected=offers.find(p=>p.id===chosen);
function reset(){setChosen(null);setNotice("");}
function demoRequest(){if(!valid||!selected)return;const next:Request={id:"D-"+Date.now().toString(36).toUpperCase(),amount:num,cost:num*selected.rate,provider:selected.name,method,created:new Date().toLocaleString("es-CU"),status:"Solicitud de prueba"};setRequests(prev=>[next,...prev].slice(0,25));setChosen(null);setSection("pedidos");setNotice("Prueba guardada. No se envió nada.");}
return <main className="s360">
<div className="s360-shell">
<header className="s360-top"><a href="/saldo360" className="s360-logo" aria-label="Saldo 360 inicio"><img src="/saldo360/logo.svg" width="38" height="38" alt=""/><span>saldo<strong>360</strong></span></a><a href="/saldo360/ofertas" className="s360-header-link">Explorar ofertas ↗</a></header>
<div className="s360-warning" role="status">Demo con datos ficticios · Sin pagos ni recargas.</div>
<nav className="s360-tabs" aria-label="Secciones de Saldo 360">
<button className={section==="recargar"?"current":""} onClick={()=>{setSection("recargar");setNotice("")}}>Recargar</button>
<button className={section==="pedidos"?"current":""} onClick={()=>setSection("pedidos")}>Mis pedidos {requests.length>0&&<span className="s360-count">{requests.length}</span>}</button>
<button className={section==="proveedor"?"current":""} onClick={()=>setSection("proveedor")}>Soy proveedor</button>
</nav>
{section==="recargar"&&<section className="s360-content">
<div className="s360-intro"><span className="s360-eyebrow">SALDO MÓVIL EN CUBA</span><h1>Prueba Saldo 360.</h1><p>Elige un monto. Compara precios de ejemplo.</p></div>
<div className="s360-card"><label htmlFor="s360-amount" className="s360-label">¿Cuánto necesitas?</label><div className="s360-amount"><input id="s360-amount" inputMode="numeric" type="number" min="10" max="10000" step="1" value={amount} onChange={e=>{setAmount(e.target.value);reset()}}/><span>CUP</span></div>
<div className="s360-chips">{[100,300,500,1000].map(v=><button type="button" key={v} aria-pressed={num===v} className={num===v?"active":""} onClick={()=>{setAmount(String(v));reset()}}>{v.toLocaleString("es-CU")}</button>)}</div>
<label htmlFor="s360-method" className="s360-label">¿Cómo pagarás?</label><select id="s360-method" value={method} onChange={e=>{setMethod(e.target.value);reset()}}>{["Transfermóvil","EnZona","Efectivo"].map(m=><option key={m}>{m}</option>)}</select>
{!valid&&<p className="s360-error">Introduce un importe entero entre 10 y 10 000 CUP.</p>}</div>
<h2 className="s360-heading">Ofertas de ejemplo <span>{valid?offers.length:0}</span></h2>
{valid&&offers.length>0?offers.map(p=><article className={"s360-offer "+(chosen===p.id?"picked":"")} key={p.id}><div className="s360-offer-head"><div><h3>{p.name}</h3><p>{p.area}</p></div><span className="s360-live">● Disponible*</span></div><div className="s360-price"><div><small>Recibes</small><strong>{money(num)}</strong></div><span className="s360-arrow">→</span><div><small>Pagas</small><strong>{money(num*p.rate)}</strong></div></div><div className="s360-offer-bottom"><span>Tiempo de ejemplo: {p.eta}</span><button onClick={()=>{setChosen(chosen===p.id?null:p.id);setNotice("")}}>{chosen===p.id?"Seleccionado ✓":"Elegir"}</button></div></article>):<div className="s360-empty">{valid?"No hay opciones simuladas para este importe y forma de pago.":"Comprueba el importe para ver ofertas."}</div>}
{selected&&<div className="s360-confirm"><h2>Revisa tu prueba</h2><p>{money(num)} con {selected.name}, por {money(num*selected.rate)} mediante {method}.</p><button onClick={demoRequest}>Guardar prueba</button><small>No solicita teléfono ni realiza cobros o transferencias.</small></div>}
<p className="s360-footnote">* Disponibilidad, precios y tiempos son ficticios. No son ofertas comerciales reales.</p>
</section>}
{section==="pedidos"&&<section className="s360-content"><div className="s360-intro"><span className="s360-eyebrow">TUS PRUEBAS</span><h1>Mis pruebas</h1><p>Solicitudes de ejemplo en este dispositivo.</p></div>{notice&&<p className="s360-success" role="status">{notice}</p>}{requests.length===0?<div className="s360-empty">Sin pruebas todavía.<p><button onClick={()=>setSection("recargar")}>Probar ahora</button></p></div>:<div className="s360-orders">{requests.map(r=><article key={r.id} className="s360-card"><div className="s360-order-top"><strong>{r.id}</strong><span>{r.status}</span></div><p>{r.provider} · {r.created}</p><div className="s360-price"><div><small>Saldo</small><strong>{money(r.amount)}</strong></div><div><small>Pago simulado</small><strong>{money(r.cost)}</strong></div></div><small>{r.method} · No se envió dinero ni saldo</small></article>)}</div>}</section>}
{section==="proveedor"&&<section className="s360-content"><div className="s360-intro"><span className="s360-eyebrow">PARA VENDEDORES</span><h1>Consigue más compradores.</h1><p>Pronto podrás tener tu propia tienda.</p></div><div className="s360-card"><h2>Tu tienda en Saldo 360</h2><p>Publica ofertas, recibe consultas y construye tu reputación.</p><p className="s360-footnote">Registro aún no disponible.</p></div></section>}
<footer className="s360-footer"><span>Saldo 360 · Demo</span><span>Sin transacciones reales</span></footer>
</div></main>;
}
