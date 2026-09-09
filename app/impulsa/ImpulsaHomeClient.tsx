"use client";

type HomeData={publicName:string;slug:string;publishedCount:number;ordersCount:number;available:string;margin:string};
export default function ImpulsaHomeClient({data}:{data:HomeData}){
 const storeUrl=typeof window==="undefined"?`/g/${data.slug}`:`${window.location.origin}/g/${data.slug}`;
 async function share(){try{if(navigator.share)await navigator.share({title:`Tienda de ${data.publicName}`,text:"Mira los productos disponibles en mi tienda.",url:storeUrl});else await navigator.clipboard.writeText(storeUrl)}catch{}}
 return <main className="impulsa-shell">
  <header className="office-header"><a href="/impulsa" className="office-brand"><img src="/brand/nexo-logo-001g.png" alt="NEXO"/><span>IMPULSA</span></a><a className="primary-link" href={`/g/${data.slug}`}>Ver mi tienda</a></header>
  <div className="office-wrap focused-wrap home-compact-wrap">
   <section className="impulsa-hero focused-hero home-compact-hero"><div><span>HOY</span><h1>Hola, {data.publicName}.</h1></div><div className="store-status"><span className={data.publishedCount?"live":"draft"}>{data.publishedCount?"Publicada":"Borrador"}</span><b>{data.publishedCount} productos</b></div></section>
   <a className="home-search-primary" href="/impulsa/buscar"><small>PARA UN CLIENTE</small><strong>Buscar producto</strong><span>Foto o descripción →</span></a>
   <section className="home-quick-grid" aria-label="Estado de tu negocio">
    <a href="/impulsa/tienda"><small>MI TIENDA</small><strong>{data.publishedCount}</strong><span>productos · {data.margin}</span></a>
    <a href="/impulsa/pedidos"><small>PEDIDOS</small><strong>{data.ordersCount}</strong><span>{data.ordersCount?"movimientos":"sin nuevos"}</span></a>
    <a href="/impulsa/pedidos"><small>GANANCIAS</small><strong>{data.available}</strong><span>disponible</span></a>
   </section>
   <button className="home-share-button" type="button" onClick={share}>Compartir mi tienda</button>
  </div>
  <nav className="mobile-nav" aria-label="Navegación"><a className="active" href="/impulsa" aria-current="page">Inicio</a><a href="/impulsa/tienda">Tienda</a><a href="/impulsa/buscar">Buscar</a><a href="/impulsa/pedidos">Pedidos</a><a href="/impulsa/cuenta">Cuenta</a></nav>
 </main>
}
