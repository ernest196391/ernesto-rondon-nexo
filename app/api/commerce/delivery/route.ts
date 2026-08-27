import { NextResponse } from "next/server";
import { deliveryCatalog,quoteShipping } from "../../../../lib/commerce/delivery";
export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json(deliveryCatalog(),{headers:{"Cache-Control":"public, max-age=300"}});}
export async function POST(request:Request){try{const body=await request.json();const municipality=String(body.municipality||"").slice(0,90),locality=String(body.locality||"").slice(0,120);return NextResponse.json(quoteShipping(municipality,locality,Boolean(body.manual)),{headers:{"Cache-Control":"no-store"}});}catch{return NextResponse.json({error:"No pudimos calcular la mensajería."},{status:400});}}
