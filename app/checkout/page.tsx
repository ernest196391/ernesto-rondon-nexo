import type { Metadata } from "next";
import { cookies } from "next/headers";
import CommerceHeader from "../CommerceHeader";
import { REFERRAL_COOKIE } from "../../lib/commerce/store-api";
import CheckoutClient from "./CheckoutClient";
import "./checkout.css";

export const metadata: Metadata = { title: "Finalizar pedido" };
export default async function CheckoutPage() {
  const jar = await cookies(); const referral = jar.get(REFERRAL_COOKIE)?.value || "";
  return <main className="checkout-page"><CommerceHeader referral={referral} /><CheckoutClient initialReferral={referral} /></main>;
}
