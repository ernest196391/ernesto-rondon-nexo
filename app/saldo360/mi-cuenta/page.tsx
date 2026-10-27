import Link from "next/link";
import { Top } from "../ui";
import "../saldo360.css";

// Sin cuentas todavía: esta pantalla lo dice claro y ofrece lo que sí funciona hoy.
export default function Cuenta() {
  return <main className="s360"><div className="s360-shell">
    <Top/>
    <section className="s360-content">
      <div className="s360-intro"><h1>Mi cuenta</h1><p>Las cuentas llegan pronto. Hoy no hace falta registrarse.</p></div>
      <div className="s360-card"><h2>¿Buscas saldo?</h2><p>Compara precios y escribe directo al vendedor.</p>
        <Link className="s360-primary" href="/saldo360/ofertas">Busco saldo</Link></div>
      <div className="s360-card"><h2>¿Vendes saldo?</h2><p>Envíanos tu oferta; la verificamos y la publicamos.</p>
        <Link className="s360-primary" href="/saldo360/publicar">Tengo saldo</Link></div>
    </section>
  </div></main>;
}
