import Link from "next/link";
import "./saldo360.css";
export default function SaldoHome(){
 return <main className="s360 s360-home"><div className="s360-shell">
 <header className="s360-top"><Link className="s360-logo" href="/saldo360"><img src="/saldo360/logo.svg" alt="" width="42" height="42"/><span>saldo<strong>360</strong></span></Link><Link href="/saldo360/proveedores" className="s360-header-link">Ver tiendas →</Link></header>
 <section className="s360-entry">
 <span className="s360-eyebrow">EL MERCADO DE SALDO EN CUBA</span>
 <h1>Saldo, sin vueltas.</h1>
 <p>¿Qué necesitas hacer?</p>
 <div className="s360-entry-grid">
 <Link className="s360-entry-card buyer" href="/saldo360/ofertas"><span className="s360-entry-emoji" aria-hidden="true">↗</span><strong>Busco saldo</strong><small>Ver precios y proveedores</small><span aria-hidden="true" className="s360-entry-arrow">→</span></Link>
 <Link className="s360-entry-card seller" href="/saldo360/publicar"><span className="s360-entry-emoji" aria-hidden="true">＋</span><strong>Tengo saldo</strong><small>Preparar mi oferta</small><span aria-hidden="true" className="s360-entry-arrow">→</span></Link>
 </div>
 </section>
 <div className="s360-entry-bottom"><Link href="/saldo360/proveedores">Explorar tiendas</Link><Link href="/saldo360/mi-cuenta">Mi cuenta</Link></div>
 <footer className="s360-footer"><span>Saldo 360 conecta compradores y proveedores.</span><span>Confirma precios antes de pagar.</span></footer>
 </div></main>;
}