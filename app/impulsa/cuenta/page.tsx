import {redirect} from "next/navigation";
import {currentCommercialActor} from "../../../lib/commercial/auth";
import {getGestoraDashboard} from "../../../lib/commercial/db";
import CuentaClient from "./CuentaClient";
import "../impulsa.css";
import "../impulsa-enhancements.css";
export const dynamic="force-dynamic";
export default async function Page(){const actor=await currentCommercialActor();if(!actor)redirect("/impulsa/login");if(actor.role==="admin")redirect("/impulsa");const data=await getGestoraDashboard(actor.gestoraId);if(!data)redirect("/impulsa/login");return <CuentaClient name={data.profile.publicName} slug={data.profile.slug}/>}
