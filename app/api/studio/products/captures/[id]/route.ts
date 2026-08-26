import { NextResponse } from "next/server";import { getCapture } from "../../../../../../lib/commerce/db";
export const dynamic="force-dynamic";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const capture=await getCapture(id);return capture?NextResponse.json({capture},{headers:{"Cache-Control":"no-store"}}):NextResponse.json({error:"Captura no encontrada."},{status:404});}
