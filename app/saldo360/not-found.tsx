import Link from "next/link";
import { Top } from "./ui";
import "./saldo360.css";

export default function NoEncontrado() {
  return <main className="s360"><div className="s360-shell">
    <Top/>
    <section className="s360-content">
      <div className="s360-intro"><h1>No está disponible</h1><p>Esta tienda u oferta ya no está vigente.</p></div>
      <Link className="s360-primary" href="/saldo360/ofertas">Ver ofertas vigentes</Link>
    </section>
  </div></main>;
}
