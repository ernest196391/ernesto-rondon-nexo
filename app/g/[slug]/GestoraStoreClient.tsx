"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
type Product={id:number;name:string;price:string;currency:string;stock_status:string;images:Array<{src:string;alt:string}>};
type Store={gestora:{publicName:string;slug:string;referralCode:string;whatsapp:string};products:Product[]};
const PAGE_SIZE=12;
export default function GestoraStoreClient({store,isOwner=false}:{store:Store;isOwner?:boolean}){
 const ref=encodeURIComponent(store.gestora.referralCode),[query,setQuery]=useState(""),[visible,setVisible]=useState(PAGE_SIZE),[notice,setNotice]=useState("");
 const filtered=useMemo(()=>{const term=query.trim().toLocaleLowerCase("es");return term?store.products.filter(p=>p.name.toLocaleLowerCase("es").includes(term)):store.products},[query,store.products]);
 const products=filtered.slice(0,visible);
 function absolute(path:string){return typeof window==="undefined"?path:`${window.location.origin}${path}`}
 async function shareUrl(url:string,title:string,text:string){setNotice("");try{if(navigator.share){await navigator.share({title,text,url});return}await navigator.clipboard.writeText(url);setNotice("Enlace copiado. Ya puedes pegarlo donde quieras.")}catch(e){if((e as Error)?.name!=="AbortError")setNotice("No se pudo compartir. Inténtalo de nuevo.")}}
 const shareStore=()=>shareUrl(absolute(`/g/${store.gestora.slug}`),`Tienda de ${store.gestora.publicName}`,`Mira los productos disponibles en la tienda de ${store.gestora.publicName}.`);
 const shareProduct=(p:Product)=>shareUrl(absolute(`/producto/${p.id}?ref=${ref}`),p.name,`${p.name} · ${p.price} ${p.currency}`);
 return <main className="gestora-store">
  {isOwner&&<nav className="gestora-owner" aria-label="Administrar mi tienda"><Link href="/impulsa">← Oficina</Link><Link href="/impulsa/tienda">Editar tienda</Link><button type="button" onClick={shareStore}>Compartir tienda</button></nav>}
  <header className="gestora-header"><Link href={`/g/${store.gestora.slug}`} className="gestora-brand" aria-label={`Tienda de ${store.gestora.publicName}`}><img src="/brand/nexo-logo-001g.png" alt="NEXO"/></Link><Link href={`/carrito?ref=${ref}`} className="gestora-cart">Carrito</Link></header>
  <section className="gestora-hero"><div><span>TIENDA</span><h1>La tienda de {store.gestora.publicName}</h1><p>Encuentra lo que necesitas y completa tu pedido desde aquí.</p></div><strong>{store.products.length} {store.products.length===1?"producto":"productos"}</strong></section>
  {store.products.length?<>
   <section className="gestora-tools" aria-label="Buscar productos"><label htmlFor="gestora-search">¿Qué estás buscando?</label><div><input id="gestora-search" type="search" inputMode="search" placeholder="Buscar producto" value={query} onChange={e=>{setQuery(e.target.value);setVisible(PAGE_SIZE)}}/><span aria-hidden="true">⌕</span></div></section>
   {products.length?<section className="gestora-grid" aria-label="Productos">{products.map(p=><article key={p.id}><Link className="gestora-product-link" href={`/producto/${p.id}?ref=${ref}`} aria-label={`Ver ${p.name}`}><div className="gestora-media">{p.images[0]?<img src={p.images[0].src} alt={p.images[0].alt||p.name} loading="lazy"/>:<div className="gestora-image-missing" aria-label="Imagen no disponible">Imagen no disponible</div>}</div><div className="gestora-product-copy"><h2>{p.name}</h2><strong>{p.price} {p.currency}</strong><b>Ver producto <span aria-hidden="true">→</span></b></div></Link>{isOwner&&<button className="gestora-share-product" type="button" onClick={()=>shareProduct(p)} aria-label={`Compartir ${p.name}`}>Compartir</button>}</article>)}</section>:<section className="gestora-no-results" role="status"><h2>No encontramos resultados</h2><p>Prueba con otra palabra.</p><button type="button" onClick={()=>setQuery("")}>Ver todos</button></section>}
   {visible<filtered.length&&<button className="gestora-more" type="button" onClick={()=>setVisible(v=>v+PAGE_SIZE)}>Ver más</button>}
  </>:<section className="gestora-empty"><span>TIENDA EN PREPARACIÓN</span><h2>Todavía no hay productos publicados.</h2><p>Vuelve pronto para ver las novedades.</p>{isOwner&&<Link href="/impulsa/tienda">Elegir productos</Link>}</section>}
  {notice&&<div className="gestora-toast" role="status">{notice}</div>}
 </main>
}
