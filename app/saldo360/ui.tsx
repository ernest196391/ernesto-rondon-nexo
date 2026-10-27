import Link from "next/link";
import type { MarketOffer } from "../../lib/saldo360/market";

export function Top({ right }: { right?: React.ReactNode }) {
  return <header className="s360-top">
    <Link href="/saldo360" className="s360-logo" aria-label="Saldo 360, inicio"><img src="/saldo360/logo.svg" alt="" width="36" height="36"/><span>saldo<strong>360</strong></span></Link>
    {right}
  </header>;
}

export function Avatar({ offer, large }: { offer: Pick<MarketOffer, "shopName" | "photoUrl">; large?: boolean }) {
  const cls = "s360-avatar" + (large ? " large" : "");
  return offer.photoUrl
    ? <img className={cls} src={offer.photoUrl} alt="" width={large ? 72 : 48} height={large ? 72 : 48} loading="lazy"/>
    : <span className={cls} aria-hidden="true">{offer.shopName.trim()[0]?.toUpperCase()}</span>;
}

export const SAFETY = "Confirma precio y disponibilidad antes de pagar. Saldo 360 no cobra ni transfiere saldo.";
