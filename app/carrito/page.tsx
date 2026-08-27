import Image from "next/image";
import Link from "next/link";
import CartClient from "./CartClient";
import "../marketplace/marketplace.css";
import "./cart.css";

export const metadata = { title: "Carrito | NEXO" };
export default async function CartPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams; const query = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  return <main className="cart-page"><header className="market-header"><Link href={`/${query}`} aria-label="NEXO"><Image src="/brand/nexo-logo.png" width={210} height={75} alt="NEXO" priority /></Link><Link href={`/marketplace${query}`}>← Seguir comprando</Link></header><CartClient initialReferral={ref || ""} /></main>;
}
