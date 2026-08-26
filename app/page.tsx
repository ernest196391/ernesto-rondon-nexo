import MarketplaceClient from "./marketplace/MarketplaceClient";
import "./marketplace/marketplace.css";
import NexoHomeFilm from "./NexoHomeFilm";

export default function Home() {
  if (process.env.NEXO_MARKETPLACE_ENABLED === "true") {
    return <MarketplaceClient />;
  }

  return <NexoHomeFilm />;
}
