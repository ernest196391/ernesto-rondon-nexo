import Image from "next/image";
import Link from "next/link";
import "./commerce-header.css";

export default function CommerceHeader({ referral = "" }: { referral?: string }) {
  const query = referral ? `?ref=${encodeURIComponent(referral)}` : "";
  return <header className="commerce-header">
    <Link className="commerce-brand" href={`/${query}`} aria-label="NEXO — Inicio">
      <Image className="commerce-logo" src="/brand/nexo-logo-001g.png" width={380} height={140} alt="NEXO" priority />
      <Image className="commerce-symbol" src="/brand/nexo-symbol.png" width={512} height={512} alt="" aria-hidden="true" priority />
    </Link>
    <Link href={`/marketplace${query}`}>← Seguir comprando</Link>
  </header>;
}
