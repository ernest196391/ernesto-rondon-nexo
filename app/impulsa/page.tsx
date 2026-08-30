import { redirect } from "next/navigation";
import { currentCommercialActor } from "../../lib/commercial/auth";
import { getGestoraDashboard } from "../../lib/commercial/db";
import { listWooProducts } from "../../lib/commerce/woocommerce";
import { applyEditorial } from "../../lib/commerce/product-editorial";
import ImpulsaClient from "./ImpulsaClient";
import "./impulsa.css";
import "./impulsa-enhancements.css";
export const dynamic="force-dynamic";
export default async function Page(){const actor=await currentCommercialActor();if(!actor)redirect("/impulsa/login");if(actor.role==="admin")return <main className="impulsa-shell"><section className="impulsa-hero"><span>NEXO IMPULSA</span><h1>Administración activa</h1><p>El Foundation está conectado. La consola administrativa completa se construirá en el siguiente bloque visual.</p></section></main>;const [data,raw]=await Promise.all([getGestoraDashboard(actor.gestoraId),listWooProducts({perPage:50})]);if(!data)redirect("/impulsa/login");const catalog=(raw||[]).map((value:any)=>{const p=applyEditorial(value);return{id:Number(p.id),name:p.name,price:String(p.price),currency:"USD",image:p.images?.[0]?.src||"",stockStatus:p.stock_status};});return <ImpulsaClient initial={{...data,catalog}}/>;}
