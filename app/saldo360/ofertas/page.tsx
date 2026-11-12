import Link from "next/link";
import { loadOffers } from "../../../lib/saldo360/market-source";
import { PAYMENT_METHODS, type PaymentMethod } from "../../../lib/saldo360/market";
import { Top } from "../ui";
import Buscador from "./Buscador";
import "../saldo360.css";

// Se renderiza en cada visita: la vigencia de las ofertas se calcula con la hora real.
export const dynamic = "force-dynamic";

export default async function Saldo360Ofertas({ searchParams }: { searchParams: Promise<{ monto?: string; pago?: string }> }) {
  const q = await searchParams;
  const a = Number(q.monto);
  const initialAmount = Number.isInteger(a) && a >= 1 && a <= 100000 ? a : 300;
  const initialMethod = q.pago && q.pago in PAYMENT_METHODS ? (q.pago as PaymentMethod) : "any";
  const { offers, error } = await loadOffers();
  return <main className="s360"><div className="s360-shell">
    <Top right={<Link className="s360-header-link" href="/saldo360/proveedores">Tiendas</Link>}/>
    <Buscador offers={offers} error={error} initialAmount={initialAmount} initialMethod={initialMethod} nowIso={new Date().toISOString()}/>
  </div></main>;
}
