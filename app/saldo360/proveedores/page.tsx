import Link from "next/link";
import { loadOffers } from "../../../lib/saldo360/market-source";
import { formatCup, reputationLabel, type MarketOffer } from "../../../lib/saldo360/market";
import { Avatar, Top } from "../ui";
import "../saldo360.css";

export const dynamic = "force-dynamic";

export default async function Tiendas() {
  const { offers, error } = await loadOffers();
  // Una tarjeta por tienda, con su mejor precio vigente.
  const shops = new Map<string, MarketOffer>();
  for (const o of offers) {
    const best = shops.get(o.shopSlug);
    if (!best || o.pricePer100Cup < best.pricePer100Cup) shops.set(o.shopSlug, o);
  }
  return <main className="s360"><div className="s360-shell">
    <Top right={<Link className="s360-header-link" href="/saldo360/ofertas">Busco saldo</Link>}/>
    <section className="s360-content">
      <div className="s360-intro"><h1>Tiendas</h1><p>Proveedores verificados con ofertas vigentes.</p></div>
      {error ? <div className="s360-empty"><strong>No pudimos cargar las tiendas.</strong><p>Vuelve a intentarlo en un momento.</p></div>
        : shops.size === 0 ? <div className="s360-empty"><strong>Aún no hay tiendas con ofertas vigentes.</strong><p>Solo publicamos proveedores verificados.</p></div>
        : [...shops.values()].map((o) => <Link href={`/saldo360/proveedores/${encodeURIComponent(o.shopSlug)}`} className="s360-seller-card" key={o.shopSlug}>
          <Avatar offer={o}/>
          <span><strong>{o.shopName}</strong><small>{o.locality || "Cuba"} · desde {formatCup(o.pricePer100Cup)} por 100</small><small>{reputationLabel(o)}</small></span>
          <span aria-hidden="true">→</span>
        </Link>)}
    </section>
  </div></main>;
}
