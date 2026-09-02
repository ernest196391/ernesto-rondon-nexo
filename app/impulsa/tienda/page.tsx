import {redirect} from "next/navigation";
import {currentCommercialActor} from "../../../lib/commercial/auth";
import {getGestoraDashboard} from "../../../lib/commercial/db";
import {commercialStorefront} from "../../../lib/commercial/storefront";
import {listWooProducts} from "../../../lib/commerce/woocommerce";
import {applyEditorial} from "../../../lib/commerce/product-editorial";
import TiendaClient from "./TiendaClient";
import "../impulsa.css";
import "../impulsa-enhancements.css";
export const dynamic="force-dynamic";
export default async function Page(){const actor=await currentCommercialActor();if(!actor)redirect("/impulsa/login");if(actor.role==="admin")redirect("/impulsa");const [data,raw]=await Promise.all([getGestoraDashboard(actor.gestoraId),listWooProducts({perPage:50})]);if(!data)redirect("/impulsa/login");const storefront=await commercialStorefront(data.profile.slug);const catalog=(raw||[]).map((value:any)=>{const p=applyEditorial(value);return{id:Number(p.id),name:p.name,price:String(p.price),currency:"USD",image:p.images?.[0]?.src||""}});return <TiendaClient initial={{profile:{publicName:data.profile.publicName,slug:data.profile.slug},productIds:data.productIds,rules:data.rules,catalog}} publishedCount={storefront?.products.length??0}/>}
