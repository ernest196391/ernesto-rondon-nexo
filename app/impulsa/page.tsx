import { redirect } from "next/navigation";
import { currentCommercialActor } from "../../lib/commercial/auth";
import { getGestoraDashboard } from "../../lib/commercial/db";
import { commercialStorefront } from "../../lib/commercial/storefront";
import ImpulsaHomeClient from "./ImpulsaHomeClient";
import "./impulsa.css";
import "./impulsa-enhancements.css";
export const dynamic="force-dynamic";
export default async function Page(){
 const actor=await currentCommercialActor();
 if(!actor)redirect("/impulsa/login");
 if(actor.role==="admin")return <main className="impulsa-shell"><section className="impulsa-hero"><span>ADMINISTRACIÓN</span><h1>Centro de control</h1><p>La consola administrativa se construirá como un espacio separado de la oficina de gestoras.</p></section></main>;
 const data=await getGestoraDashboard(actor.gestoraId);if(!data)redirect("/impulsa/login");
 const storefront=await commercialStorefront(data.profile.slug);
 const publishedCount=storefront?.products.length??0;
 const active=data.rules.find((x:any)=>x.scope==="global");
 const margin=active?.mode==="fixed"?`+${active.value} USD`:active?.mode==="percent"?`+${active.value}%`:"Sin aumento";
 const available=Object.entries(data.available).map(([c,v])=>`${Number(v).toFixed(2)} ${c}`).join(" · ")||"0.00 USD";
 return <ImpulsaHomeClient data={{publicName:data.profile.publicName,slug:data.profile.slug,publishedCount,ordersCount:data.ledger.length,available,margin}}/>;
}
