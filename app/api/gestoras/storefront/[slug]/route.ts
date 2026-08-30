import { NextResponse } from "next/server";
import { commercialStorefront } from "../../../../../lib/commercial/storefront";
export const dynamic="force-dynamic";
export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){try{const {slug}=await params;const store=await commercialStorefront(slug);if(!store)return NextResponse.json({error:"Tienda no disponible."},{status:404});return NextResponse.json(store,{headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"No pudimos cargar la tienda."},{status:503,headers:{"Cache-Control":"no-store"}});}}
