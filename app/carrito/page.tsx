import CartClient from "./CartClient";
import CommerceHeader from "../CommerceHeader";
import "./cart.css";

export const metadata = { title: "Carrito | NEXO" };
export default async function CartPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return <main className="cart-page"><CommerceHeader referral={ref || ""} /><CartClient initialReferral={ref || ""} /></main>;
}
