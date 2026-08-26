import type { Metadata } from "next";
import MarketplaceClient from "./MarketplaceClient";
import "./marketplace.css";

export const metadata: Metadata = {
  title: "NEXO Marketplace — Lo que buscas, más cerca.",
  description:
    "Compra productos seleccionados por NEXO con acompañamiento y disponibilidad verificada.",
};

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
