import { redirect } from "next/navigation";
import { currentCommercialActor } from "../../../lib/commercial/auth";
import NexoBuscaClient from "./NexoBuscaClient";
import "../impulsa.css";
import "./nexo-busca.css";
export const dynamic = "force-dynamic";
export default async function Page() {
  const actor = await currentCommercialActor();
  if (!actor) redirect("/impulsa/login");
  if (actor.role === "admin") redirect("/impulsa");
  return <NexoBuscaClient />;
}
