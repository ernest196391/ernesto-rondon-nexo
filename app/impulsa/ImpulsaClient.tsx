"use client";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product={id:number;name:string;price:string;currency:string;image:string;stockStatus:string};
type Rule={id:string;scope:string;productId:number|null;mode:"base"|"fixed"|"percent"|"custom_final";value:number;version:number};
type Dashboard={profile:{publicName:string;slug:string;referralCode:string;status:string;defaultCurrency:string};productIds:number[];rules:Rule[];catalog:Product[];ledger:Array<{id:string;orderId:number;type:string;amount:number;currency:string;status:string}>;available:Record<string,number>};

export default function ImpulsaClient({initial}:{initial:Dashboard}){
 const router=useRouter(),[data,setData]=useState(initial),[selected,setSelected]=useState<number[]>(initial.productIds),[query,setQuery]=useState(""),[mode,setMode]=useState<"base"|"fixed"|"percent">((initial.rules.find(x=>x.scope==="global")?.mode as "base"|"fixed"|"percent")||"base"),[value,setValue]=useState(initial.rules.find(x=>x.scope==="global")?.value||0),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const activeRule=useMemo(()=>data.rules.find(x=>x.scope==="global"),[data.rules]);
 const visible=useMemo(()=>data.catalog.filter(p=>p.name.toLowerCase().includes(query.toLowerCase().trim())),[data.catalog,query]);
 const dirty=useMemo(()=>[...selected].sort().join(",")!==[...data.productIds].sort().join(","),[selected,data.productIds]);
 const sample=useMemo(()=>data.catalog.find(p=>selected.includes(p.id))||data.catalog[0],[data.catalog,selected]);
 const base=Number(sample?.price||0),final=mode==="fixed"?base+Number(value):mode==="percent"?base*(1+Number(value)/100):base;
 const storeUrl=typeof window==="undefined"?`/g/${data.profile.slug}`:`${window.location.origin}/g/${data.profile.slug}`;

 async function refresh(){const r=await fetch("/api/gestoras/dashboard",{cache:"no-store"});if(r.ok){const next=await r.json();setData(next);setSelected(next.productIds)}}
 async function post(body:object,success:string){setBusy(true);setMessage("");try{const r=await fetch("/api/gestoras/dashboard",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}),d=await r.json();if(!r.ok)throw new Error(d.error||"No pudimos guardar.");await refresh();setMessage(success)}catch(e){setMessage(e instanceof Error?e.message:"No pudimos guardar.")}finally{setBusy(false)}}
 function toggle(id:number){setSelected(x=>x.includes(id)?x.filter(v=>v!==id):[...x,id])}
 async function saveProducts(e:FormEvent){e.preventDefault();await post({action:"products",productIds:selected},selected.length?"Selección publicada.":"Tu tienda quedó en borrador y sin productos.")}
 async function savePrice(e:FormEvent){e.preventDefault();await post({action:"price_rule",scope:"global",mode,value:mode==="base"?0:Number(value),currency:"USD",minFinal:"",maxFinal:"",rounding:.01},"Precio actualizado.")}
 async function share(){try{if(navigator.share)await navigator.share({title:`Tienda ${data.profile.publicName}`,url:storeUrl});else{await navigator.clipboard.writeText(storeUrl);setMessage("Enlace copiado.")}}catch{}}
 async function logout(){setBusy(true);await fetch("/api/gestoras/auth/logout",{method:"POST"});router.replace("/impulsa/login");router.refresh()}
 const available=Object.entries(data.available).map(([c,v])=>`${v.toFixed(2)} ${c}`).join(" · ")||"Sin saldo";
 return <main className="impulsa-shell">
  <header className="office-header"><a href="#inicio" className="office-brand"><img src="/brand/nexo-logo-001g.png" alt="NEXO"/><span>IMPULSA</span></a><div className="office-actions"><button type="button" className="quiet" onClick={share}>Compartir</button><a className="primary-link" href={`/g/${data.profile.slug}`}>Ver tienda</a><button type="button" className="icon-button" onClick={logout} disabled={busy} aria-label="Cerrar sesión">Salir</button></div></header>
  <div className="office-wrap">
   <section id="inicio" className="impulsa-hero"><div><span>MI NEGOCIO</span><h1>Hola, {data.profile.publicName}.</h1><p>Elige productos, define tu margen y comparte tu tienda.</p></div><div className="store-status"><span className={data.productIds.length?"live":"draft"}>{data.productIds.length?"Publicada":"Borrador"}</span><b>{data.productIds.length} productos</b><small>{data.profile.referralCode}</small></div></section>
   <section className="impulsa-cards" aria-label="Resumen"><article><small>Productos</small><strong>{data.productIds.length}</strong></article><article><small>Margen</small><strong>{activeRule?.mode==="fixed"?`+${activeRule.value} USD`:activeRule?.mode==="percent"?`+${activeRule.value}%`:"Sin margen"}</strong></article><article><small>Ganancias disponibles</small><strong>{available}</strong></article></section>
   <section className="impulsa-tools"><a className="impulsa-tool-card" href="/impulsa/buscar"><div><span>NEXO BUSCA</span><h2>Encuentra un producto por foto</h2><p>Compara opciones y prepara el mensaje para tu cliente.</p></div><b>Buscar →</b></a></section>
   <section id="mi-tienda" className="impulsa-panel products-panel"><div className="panel-heading"><div><span>PASO 1</span><h2>Productos de tu tienda</h2><p>Solo se publican los que selecciones.</p></div><b>{selected.length} elegidos</b></div>
    <form className="catalog-form" onSubmit={saveProducts}><div className="catalog-tools"><label className="search-field"><span>Buscar en el catálogo</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nombre del producto"/></label><div><button type="button" className="quiet" onClick={()=>setSelected(Array.from(new Set([...selected,...visible.map(p=>p.id)])))}>Elegir visibles</button><button type="button" className="quiet" onClick={()=>setSelected([])}>Limpiar</button></div></div>
     <div className="impulsa-products">{visible.map(p=><label className={selected.includes(p.id)?"selected":""} key={p.id}><input type="checkbox" checked={selected.includes(p.id)} onChange={()=>toggle(p.id)} aria-label={`Publicar ${p.name}`}/>{p.image&&<img src={p.image} alt=""/>}<span><b>{p.name}</b><small>{p.price} {p.currency}</small></span></label>)}</div>
     {!visible.length&&<div className="empty-state">No encontramos productos con ese nombre.</div>}
     <div className="sticky-save"><span>{dirty?"Tienes cambios sin publicar.":"Tu selección está actualizada."}</span><button disabled={busy||!dirty}>{busy?"Guardando…":selected.length?"Publicar selección":"Guardar como borrador"}</button></div>
    </form>
   </section>
   <section id="negocio" className="impulsa-panel"><div className="panel-heading"><div><span>PASO 2</span><h2>Tu margen</h2><p>La entrega se cobra aparte y no lleva margen.</p></div></div>
    <form className="price-form" onSubmit={savePrice}><label>Regla<select value={mode} onChange={e=>setMode(e.target.value as "base"|"fixed"|"percent")}><option value="base">Sin margen</option><option value="fixed">Sumar importe</option><option value="percent">Sumar porcentaje</option></select></label>{mode!=="base"&&<label>{mode==="fixed"?"Importe (USD)":"Porcentaje"}<input type="number" min="0" step={mode==="fixed"?".01":".1"} value={value} onChange={e=>setValue(Number(e.target.value))}/></label>}<button disabled={busy}>Guardar margen</button></form>
    {sample&&<div className="price-preview"><span><small>Ejemplo</small><b>{sample.name}</b></span><span><small>Precio NEXO</small><b>{base.toFixed(2)} USD</b></span><span><small>Tu precio</small><b>{final.toFixed(2)} USD</b></span><span><small>Tu ganancia</small><b>{Math.max(0,final-base).toFixed(2)} USD</b></span></div>}
   </section>
   <section id="pedidos" className="impulsa-panel"><div className="panel-heading"><div><span>ACTIVIDAD</span><h2>Pedidos y ganancias</h2></div></div>{data.ledger.length?<ul>{data.ledger.map(x=><li key={x.id}><span>Pedido #{x.orderId} · {x.type}</span><strong>{x.amount.toFixed(2)} {x.currency}</strong></li>)}</ul>:<div className="empty-state"><b>Aún no hay movimientos.</b><span>Aparecerán cuando un pedido se entregue y se cobre.</span></div>}</section>
   {message&&<div className="toast" role="status">{message}</div>}
  </div>
  <nav className="mobile-nav" aria-label="Navegación de la oficina"><a href="#inicio">Inicio</a><a href="#mi-tienda">Tienda</a><a className="nav-search" href="/impulsa/buscar">Buscar</a><a href="#pedidos">Pedidos</a><a href="#negocio">Margen</a></nav>
 </main>
}