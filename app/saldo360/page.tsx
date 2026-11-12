import Link from "next/link";
import "./saldo360.css";

export default function SaldoHome() {
  return <main className="s360 s360-home"><div className="s360-shell">
    <section className="s360-entry">
      <img className="s360-home-logo" src="/saldo360/wordmark.svg" alt="Saldo 360" width="236" height="59"/>
      <h1>¿Qué necesitas?</h1>
      <div className="s360-entry-grid">
        <Link className="s360-entry-card buyer" href="/saldo360/ofertas"><strong>Busco saldo</strong><small>Compara precios y escribe al vendedor</small></Link>
        <Link className="s360-entry-card seller" href="/saldo360/publicar"><strong>Tengo saldo</strong><small>Publica tu oferta gratis</small></Link>
      </div>
    </section>
    <footer className="s360-footer"><span>Saldo 360 no cobra ni transfiere saldo.</span><Link href="/saldo360/proveedores">Tiendas</Link></footer>
  </div></main>;
}
