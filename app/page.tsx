import MarketplaceClient from "./marketplace/MarketplaceClient";
import "./marketplace/marketplace.css";
export const metadata={title:"NEXO Marketplace — Lo que buscas, más cerca.",description:"Compra productos seleccionados por NEXO con acompañamiento y disponibilidad verificada."};
export default function Home(){return <MarketplaceClient/>;}
