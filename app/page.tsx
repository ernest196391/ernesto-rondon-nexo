import MarketplaceClient from "./marketplace/MarketplaceClient";
import "./marketplace/marketplace.css";
import NexoHomeFilm from "./NexoHomeFilm";
import {activeMarketingCampaign} from "../lib/commercial/admin-control";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (process.env.NEXO_MARKETPLACE_ENABLED === "true") {
    const campaign=await activeMarketingCampaign().catch(()=>null);
    return <>{campaign&&<aside style={{background:"#174431",color:"white",padding:"12px 16px",textAlign:"center",fontFamily:"Inter,system-ui,sans-serif"}}><strong>{campaign.title}</strong>{campaign.subtitle&&<span style={{marginLeft:8,opacity:.9}}>{campaign.subtitle}</span>}{campaign.ctaLabel&&campaign.ctaUrl&&<a href={campaign.ctaUrl} style={{marginLeft:12,color:"white",fontWeight:800,textDecoration:"underline"}}>{campaign.ctaLabel}</a>}</aside>}<MarketplaceClient /></>;
  }
  return <NexoHomeFilm />;
}
