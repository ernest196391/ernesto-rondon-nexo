import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { commercialStorefront } from "../../../lib/commercial/storefront";
import GestoraStoreClient from "./GestoraStoreClient";
import "./gestora-store.css";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const store=await commercialStorefront(slug);return{title:store?`${store.gestora.publicName} en NEXO`:"Tienda NEXO",description:"Productos seleccionados y pedidos respaldados por NEXO."};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const store=await commercialStorefront(slug);if(!store)notFound();return <GestoraStoreClient store={store}/>;}
