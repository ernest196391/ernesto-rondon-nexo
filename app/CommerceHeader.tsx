import Image from "next/image";
import Link from "next/link";
import "./commerce-header.css";

export default function CommerceHeader({ referral = "" }: { referral?: string }) {
  const query = referral ? `?ref=${encodeURIComponent(referral)}` : "";
  return <header className="commerce-header">
    <Link href={`/${query}`} aria-label="NEXO — Inicio"><Image src="/brand/nexo-logo.png" width={210} height={75} alt="NEXO" priority /></Link>
    <Link href={`/marketplace${query}`}>← Seguir comprando</Link>
  </header>;
}
