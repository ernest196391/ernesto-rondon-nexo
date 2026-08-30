import { redirect } from "next/navigation";
import { currentCommercialActor } from "../../lib/commercial/auth";
import { getGestoraDashboard } from "../../lib/commercial/db";
import ImpulsaClient from "./ImpulsaClient";
import "./impulsa.css";
export const dynamic="force-dynamic";
export default async function Page(){const actor=await currentCommercialActor();if(!actor)redirect("/impulsa/login");if(actor.role==="admin")return <main className="impulsa-shell"><section className="impulsa-hero"><span>NEXO IMPULSA</span><h1>Administración activa</h1><p>El Foundation está conectado. La consola administrativa completa se construirá en el siguiente bloque visual.</p></section></main>;const data=await getGestoraDashboard(actor.gestoraId);if(!data)redirect("/impulsa/login");return <ImpulsaClient initial={data}/>;}
