"use client";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product={id:number;name:string;price:string;currency:string;image:string;stockStatus:string};
type Rule={id:string;scope:string;productId:number|null;mode:"base"|"fixed"|"percent"|"custom_final";value:number;version:number};
type Dashboard={profile:{publicName:string;slug:string;referralCode:string;status:string;defaultCurrency:string};productIds:number[];rules:Rule[];catalog:Product[];ledger:Array<{id:string;orderId:number;type:string;amount:number;currency:string;status:string}>;available:Record<string,number>};

export default function ImpulsaClient({initial}:{initial:Dashboard}){
 const router=useRouter(),[data,setData]=useState(initial),[selected,setSelected]=useState<number[]>(initial.productIds),[query,setQuery]=useState(""),[showCount,setShowCount]=useState(12),[mode,setMode]=useState<"base"|"fixed"|"percent">((initial.rules.find(x=>x.scope==="global")?.mode as "base"|"fixed"|"percent")||"base"),[value,setValue]=useState(initial.rules.find(x=>x.scope==="global")?.value||0),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const activeRule=useMemo(()=>data.rules.find(x=>x.scope==="global"),[data.rules]);
 const visible=useMemo(()=>data.catalog.filter(p=>p.name.toLowerCase().includes(query.toLowerCase().trim())),[data.catalog,query]);
 const dirty=useMemo(()=>[...selected].sort().join(",")!==[...data.productIds].sort().join(","),[selected,data.productIds]);
 const sample=useMemo(()=>data.catalog.find(p=>selected.includes(p.id))||data.catalog[0],[data.catalog,selected]);
 const base=Number(sample?.price||0),final=mode==="fixed"?base+Number(value):mode==="percent"?base*(1+Number(value)/100):base;
 const storeUrl=typeof window==="undefined"?`/g/${data.profile.slug}`:`${window.location.origin}/g/${data.profile.slug}`;
 const available=Object.entries(data.available).map(([c,v])=>`${v.toFixed(2)} ${c}`).join(" · ")||"0.00 USD";
 const margin=activeRule?.mode==="fixed"?`+${activeRule.value} USD`:activeRule?.mode==="percent"?`+${activeRule.value}%`:"Sin aumento";
 async function refresh(){const r=await fetch("/api/gestoras/dashboard",{cache:"no-store"});if(r.ok){const next=await r.json();setData(next);setSelected(next.productIds)}}
 async function post(body:object,success:string){setBusy(true);setMessage("");try{const r=await fetch("/api/gestoras/dashboard",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}),d=await r.json();if(!r.ok)throw new Error(d.error||"No pudimos guardar.");await refresh();setMessage(success)}catch(e){setMessage(e instanceof Error?e.message:"No pudimos guardar.")}finally{setBusy(false)}}
 function toggle(id:number){setSelected(x=>x.includes(id)?x.filter(v=>v!==id):[...x,id])}
 async function saveProducts(e:FormEvent){e.preventDefault();await post({action:"products",productIds:selected},selected.length?"Cambios publicados.":"Tu tienda quedó sin productos visibles.")}
 async function savePrice(e:FormEvent){e.preventDefault();await post({action:"price_rule",scope:"global",mode,value:mode==="base"?0:Number(value),currency:"USD",minFinal:"",maxFinal:"",rounding:.01},"Margen actualizado.")}
 async function share(){try{if(navigator.share)await navigator.share({title:`Tienda de ${data.profile.publicName}`,text:"Te comparto mi selección de productos",url:storeUrl});else{await navigator.clipboard.writeText(storeUrl);setMessage("Enlace copiado.")}}catch{}}
 async function logout(){setBusy(true);await fetch("/api/gestoras/auth/logout",{method:"POST"});router.replace("/impulsa/login");router.refresh()}
 return <main className="impulsa-shell">
  <header className="office-header"><a href="#inicio" className="office-brand"><img src="/brand/nexo-logo-001g.png" alt="NEXO"/><span>IMPULSA</span></a><div className="office-actions"><a className="primary-link" href={`/g/${data.profile.slug}`}>Ver tienda</a><button type="button" className="icon-button" onClick={logout} disabled={busy}>Salir</button></div></header>
  <div className="office-wrap">
   <section id="inicio" className="impulsa-hero"><div><span>MI NEGOCIO</span><h1>Hola, {data.profile.publicName}.</h1><p>Busca productos, atiende clientes y controla tus ventas.</p></div><div className="store-status"><span className={data.productIds.length?"live":"draft"}>{data.productIds.length?"Publicada":"Borrador"}</span><b>{data.productIds.length} productos</b></div></section>
   <section className="office-tools simple-office" aria-label="Acciones principales">
    <a className="office-tool office-tool-primary" href="/impulsa/buscar"><span>01</span><div><b>Buscar para un cliente</b><small>Sube una foto o escribe lo que necesita y prepara una propuesta.</small></div><strong>→</strong></a>
    <div className="office-quick-grid">
     <a className="office-tool" href="#mi-tienda"><span>02</span><div><b>Mi tienda</b><small>{data.productIds.length} productos · {margin}</small></div><strong>→</strong></a>
     <a className="office-tool" href="#pedidos"><span>03</span><div><b>Pedidos</b><small>{data.ledger.length?`${data.ledger.length} movimientos`:"Sin pedidos nuevos"}</small></div><strong>→</strong></a>
     <a className="office-tool" href="#pedidos"><span>04</span><div><b>Ganancias</b><small>{available} disponibles</small></div><strong>→</strong></a>
    </div>
   </section>
   <section className="store-command" aria-label="Tu tienda"><div><span>TU TIENDA</span><h2>Lista para compartir</h2><p>Abre tu tienda o envíasela directamente a un cliente.</p></div><div className="store-command-actions"><a href={`/g/${data.profile.slug}`}>Abrir tienda</a><button type="button" onClick={share}>Compartir tienda</button></div></section>
   <details id="mi-tienda" className="impulsa-panel work-detail"><summary><span><b>Administrar mi tienda</b><small>Elegir productos y cambiar precios</small></span><strong>Configurar</strong></summary><div className="work-detail-body">
    <section className="products-panel"><div className="panel-heading"><div><span>PRODUCTOS</span><h2>Qué quieres vender</h2><p>Marca solo los productos que quieras mostrar.</p></div><b>{selected.length} elegidos</b></div>
     <form className="catalog-form" onSubmit={saveProducts}><div className="catalog-tools"><label className="search-field"><span>Buscar productos</span><input type="search" value={query} onChange={e=>{setQuery(e.target.value);setShowCount(12)}} placeholder="Nombre del producto"/></label><div><button type="button" className="quiet" onClick={()=>setSelected(Array.from(new Set([...selected,...visible.map(p=>p.id)])))}>Elegir visibles</button><button type="button" className="quiet" onClick={()=>setSelected([])}>Limpiar</button></div></div><div className="impulsa-products">{visible.slice(0,showCount).map(p=><label className={selected.includes(p.id)?"selected":""} key={p.id}><input type="checkbox" checked={selected.includes(p.id)} onChange={()=>toggle(p.id)}/>{p.image&&<img src={p.image} alt=""/>}<span><b>{p.name}</b><small>{p.price} {p.currency}</small></span></label>)}</div>{visible.length>showCount&&<button type="button" className="catalog-more" onClick={()=>setShowCount(x=>x+12)}>Mostrar más</button>}{dirty&&<div className="sticky-save"><button disabled={busy}>{busy?"Guardando…":"Publicar cambios"}</button></div>}</form>
    </section>
    <section id="negocio" className="margin-inside"><div className="panel-heading"><div><span>PRECIO</span><h2>Tu margen</h2><p>Opcional. La entrega se cobra aparte.</p></div></div><form className="price-form" onSubmit={savePrice}><label>Cómo quieres vender<select value={mode} onChange={e=>setMode(e.target.value as "base"|"fixed"|"percent")}><option value="base">Sin aumento</option><option value="fixed">Sumar un importe</option><option value="percent">Sumar un porcentaje</option></select></label>{mode!=="base"&&<label>{mode==="fixed"?"Importe (USD)":"Porcentaje"}<input type="number" min="0" step={mode==="fixed"?".01":".1"} value={value} onChange={e=>setValue(Number(e.target.value))}/></label>}<button disabled={busy}>Guardar</button></form>{sample&&<div className="price-preview"><span><small>Ejemplo</small><b>{sample.name}</b></span><span><small>Precio base</small><b>{base.toFixed(2)} USD</b></span><span><small>Tu precio</small><b>{final.toFixed(2)} USD</b></span><span><small>Ganancia</small><b>{Math.max(0,final-base).toFixed(2)} USD</b></span></div>}</section>
   </div></details>
   <section id="pedidos" className="impulsa-panel"><div className="panel-heading"><div><span>ACTIVIDAD</span><h2>Pedidos y ganancias</h2></div></div>{data.ledger.length?<ul>{data.ledger.map(x=><li key={x.id}><span>Pedido #{x.orderId}</span><strong>{x.amount.toFixed(2)} {x.currency}</strong></li>)}</ul>:<div className="empty-state"><b>Aún no tienes pedidos.</b><span>Cuando vendas, aparecerán aquí junto con tus ganancias.</span></div>}</section>
   {message&&<div className="toast" role="status">{message}</div>}
  </div>
  <nav className="mobile-nav" aria-label="Navegación"><a href="#inicio">Inicio</a><a href="#mi-tienda">Tienda</a><a className="nav-search" href="/impulsa/buscar">Buscar</a><a href="#pedidos">Pedidos</a><a href="#inicio">Cuenta</a></nav>
 </main>
}