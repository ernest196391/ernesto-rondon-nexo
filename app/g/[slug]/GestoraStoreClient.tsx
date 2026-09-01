"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
type Product={id:number;name:string;price:string;currency:string;stock_status:string;images:Array<{src:string;alt:string}>};
type Store={gestora:{publicName:string;slug:string;referralCode:string;whatsapp:string};products:Product[]};
const PAGE_SIZE=12;
export default function GestoraStoreClient({store}:{store:Store}){
 const ref=encodeURIComponent(store.gestora.referralCode),[query,setQuery]=useState(""),[visible,setVisible]=useState(PAGE_SIZE);
 const filtered=useMemo(()=>{const term=query.trim().toLocaleLowerCase("es");return term?store.products.filter(p=>p.name.toLocaleLowerCase("es").includes(term)):store.products},[query,store.products]);
 const products=filtered.slice(0,visible);
 return <main className="gestora-store">
  <header className="gestora-header"><Link href={`/?ref=${ref}`} className="gestora-brand" aria-label="NEXO — Inicio"><img src="/brand/nexo-logo-001g.png" alt="NEXO"/></Link><div className="gestora-header-actions"><Link href={`/marketplace?ref=${ref}`}>Explorar NEXO</Link><Link href={`/carrito?ref=${ref}`} className="gestora-cart">Carrito</Link></div></header>
  <section className="gestora-hero"><div><span>SELECCIÓN NEXO</span><h1>La tienda de {store.gestora.publicName}</h1><p>Productos elegidos para ti, con compra segura y entrega coordinada por NEXO.</p></div><strong>{store.products.length} productos seleccionados</strong></section>
  {store.products.length?<>
   <section className="gestora-tools" aria-label="Buscar productos"><label htmlFor="gestora-search">Buscar en esta tienda</label><div><input id="gestora-search" type="search" inputMode="search" placeholder="¿Qué estás buscando?" value={query} onChange={e=>{setQuery(e.target.value);setVisible(PAGE_SIZE)}}/><span aria-hidden="true">⌕</span></div></section>
   {products.length?<section className="gestora-grid" aria-label="Productos">{products.map(p=><article key={p.id}><Link href={`/producto/${p.id}?ref=${ref}`} aria-label={`Ver ${p.name}`}><div className="gestora-media">{p.images[0]?<img src={p.images[0].src} alt={p.images[0].alt||p.name} loading="lazy"/>:<img src="/brand/nexo-symbol.png" alt=""/>}</div><div className="gestora-product-copy"><h2>{p.name}</h2><strong>{p.price} {p.currency}</strong><b>Ver producto <span aria-hidden="true">→</span></b></div></Link></article>)}</section>:<section className="gestora-no-results" role="status"><h2>No encontramos ese producto</h2><p>Prueba con otra palabra o explora toda la selección.</p><button type="button" onClick={()=>setQuery("")}>Ver todos</button></section>}
   {visible<filtered.length&&<button className="gestora-more" type="button" onClick={()=>setVisible(v=>v+PAGE_SIZE)}>Ver más productos</button>}
  </>:<section className="gestora-empty"><span>TIENDA EN PREPARACIÓN</span><h2>Esta selección estará disponible muy pronto.</h2><p>Mientras tanto, puedes descubrir todos los productos disponibles en NEXO.</p><Link href={`/marketplace?ref=${ref}`}>Explorar NEXO</Link></section>}
 </main>
}
