import type { Metadata } from "next";
import MarketplaceClient from "./MarketplaceClient";
import "./marketplace.css";

export const metadata: Metadata = {
  title: "NEXO Marketplace — Lo que buscas, más cerca.",
  description:
    "Explora productos disponibles en NEXO y prepara tu pedido con entrega o recogida.",
};

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
