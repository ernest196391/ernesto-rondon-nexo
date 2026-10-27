import Link from "next/link";
import { notFound } from "next/navigation";
import { loadOffers } from "../../../../lib/saldo360/market-source";
import { formatMoney, methodsText, reputationLabel, whatsAppLink } from "../../../../lib/saldo360/market";
import { Avatar, SAFETY, Top } from "../../ui";
import "../../saldo360.css";

export const dynamic = "force-dynamic";

export default async function Perfil({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { offers } = await loadOffers();
  const mine = offers.filter((o) => o.shopSlug === id).sort((a, b) => a.pricePer100Cup - b.pricePer100Cup);
  if (!mine.length) notFound();
  const shop = mine[0];
  return <main className="s360"><div className="s360-shell">
    <Top right={<Link href="/saldo360/proveedores" className="s360-header-link">← Tiendas</Link>}/>
    <section className="s360-content">
      <div className="s360-seller-hero"><Avatar offer={shop} large/><div><h1>{shop.shopName}</h1><p>{shop.locality || "Cuba"}</p></div></div>
      <div className="s360-card s360-trust"><h2>Reputación</h2><p>{reputationLabel(shop)}</p>
        {shop.confirmedOps <= 0 && <p className="s360-muted">Solo contamos operaciones confirmadas por comprador y vendedor. Un mensaje por WhatsApp no cuenta como venta.</p>}</div>
      <h2 className="s360-heading">Ofertas <span>{mine.length}</span></h2>
      {mine.map((o) => <article className="s360-offer" key={o.id}>
        <div className="s360-price"><div><small>Por cada 100 CUP de saldo</small><strong className="s360-total">{formatMoney(o.pricePer100Cup, o.currency)}</strong></div>
          <div><small>Puedes pedir</small><strong>{o.minCup.toLocaleString("es-CU")}–{o.maxCup.toLocaleString("es-CU")}</strong></div></div>
        <p className="s360-meta">{methodsText(o)}{o.wholesaleMinCup != null && o.wholesalePricePer100 != null ? ` · mayorista desde ${o.wholesaleMinCup.toLocaleString("es-CU")} CUP a ${formatMoney(o.wholesalePricePer100, o.currency)}` : ""} · vigente hasta {new Date(o.expiresAt).toLocaleString("es-CU", { timeZone: "America/Havana", dateStyle: "short", timeStyle: "short" })}</p>
        <a className="s360-chat" href={whatsAppLink(o, o.minCup)} target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>
      </article>)}
      <p className="s360-footnote">{SAFETY}</p>
    </section>
  </div></main>;
}
