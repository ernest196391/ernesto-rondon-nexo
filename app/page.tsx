import MarketplaceClient from "./marketplace/MarketplaceClient";
import "./marketplace/marketplace.css";
import NexoHomeFilm from "./NexoHomeFilm";

// The storefront is operational content. Do not let an edge cache pin an old
// campaign or navigation shell after a catalog deployment.
export const dynamic = "force-dynamic";

export default function Home() {
  if (process.env.NEXO_MARKETPLACE_ENABLED === "true") {
    return <MarketplaceClient />;
  }

  return <NexoHomeFilm />;
}
