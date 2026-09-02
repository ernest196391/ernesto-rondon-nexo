"use client";

type HomeData={publicName:string;slug:string;publishedCount:number;ordersCount:number;available:string;margin:string};
export default function ImpulsaHomeClient({data}:{data:HomeData}){
 const storeUrl=typeof window==="undefined"?`/g/${data.slug}`:`${window.location.origin}/g/${data.slug}`;
 async function share(){try{if(navigator.share)await navigator.share({title:`Tienda de ${data.publicName}`,text:"Te comparto mi selección de productos",url:storeUrl});else await navigator.clipboard.writeText(storeUrl)}catch{}}
 return <main className="impulsa-shell">
  <header className="office-header"><a href="/impulsa" className="office-brand"><img src="/brand/nexo-logo-001g.png" alt="NEXO"/><span>IMPULSA</span></a><a className="primary-link" href={`/g/${data.slug}`}>Ver tienda</a></header>
  <div className="office-wrap focused-wrap">
   <section className="impulsa-hero focused-hero"><div><span>HOY</span><h1>Hola, {data.publicName}.</h1><p>¿Qué necesitas hacer?</p></div><div className="store-status"><span className={data.publishedCount?"live":"draft"}>{data.publishedCount?"Publicada":"Borrador"}</span><b>{data.publishedCount} productos</b></div></section>
   <section className="home-actions" aria-label="Acciones principales">
    <a className="home-action primary" href="/impulsa/buscar"><small>PARA UN CLIENTE</small><strong>Encontrar un producto</strong><span>Sube una foto o escribe lo que está buscando.</span><b>Buscar →</b></a>
    <a className="home-action" href="/impulsa/tienda"><small>MI TIENDA</small><strong>Administrar catálogo</strong><span>{data.publishedCount} visibles · {data.margin}</span><b>Abrir →</b></a>
    <a className="home-action compact" href="/impulsa/pedidos"><small>PEDIDOS</small><strong>{data.ordersCount?`${data.ordersCount} movimientos`:"Sin pedidos nuevos"}</strong><b>Ver →</b></a>
    <a className="home-action compact" href="/impulsa/pedidos"><small>GANANCIAS</small><strong>{data.available}</strong><b>Ver →</b></a>
   </section>
   <section className="share-strip"><div><small>COMPARTIR</small><strong>Envía tu tienda a un cliente</strong></div><button type="button" onClick={share}>Compartir tienda</button></section>
  </div>
  <nav className="mobile-nav" aria-label="Navegación"><a href="/impulsa">Inicio</a><a href="/impulsa/tienda">Tienda</a><a className="nav-search" href="/impulsa/buscar">Buscar</a><a href="/impulsa/pedidos">Pedidos</a><a href="/impulsa/cuenta">Cuenta</a></nav>
 </main>
}
