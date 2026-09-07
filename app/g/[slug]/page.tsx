import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { commercialStorefront } from "../../../lib/commercial/storefront";
import { currentCommercialActor } from "../../../lib/commercial/auth";
import { getGestora } from "../../../lib/commercial/db";
import GestoraStoreClient from "./GestoraStoreClient";
import "./gestora-store.css";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const store=await commercialStorefront(slug);return{title:store?`Tienda de ${store.gestora.publicName}`:"Tienda no disponible",description:store?`Compra los productos disponibles en la tienda de ${store.gestora.publicName}.`:"Esta tienda no está disponible."};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const store=await commercialStorefront(slug);if(!store)notFound();const actor=await currentCommercialActor().catch(()=>null);let isOwner=false;if(actor?.role==="gestora"){const profile=await getGestora(actor.gestoraId).catch(()=>null);isOwner=Boolean(profile&&profile.slug===slug)}return <GestoraStoreClient store={store} isOwner={isOwner}/>;}
