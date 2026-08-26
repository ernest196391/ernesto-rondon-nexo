import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createCapture, listCaptures } from "../../../../../lib/commerce/db";

export const runtime="nodejs"; export const maxDuration=60;
const allowed=new Set(["image/jpeg","image/png","image/webp","image/heic","image/heif"]);const MAX_FILE=12*1024*1024;const MAX_TOTAL=48*1024*1024;
export async function GET(){return NextResponse.json({captures:await listCaptures()},{headers:{"Cache-Control":"no-store"}});}
export async function POST(request:Request){
  const form=await request.formData();const files=form.getAll("images");const commerceId=String(form.get("commerceId")||"nexo").trim();const capturedBy=String(form.get("capturedBy")||"studio-user").trim();
  if(files.length<1||files.length>8||files.some(x=>!(x instanceof File)))return NextResponse.json({error:"Selecciona entre 1 y 8 fotografías del mismo producto."},{status:400});
  let total=0;const normalized=[] as Array<{id:string;filename:string;mimeType:string;sha256:string;bytes:Buffer}>;
  for(const item of files as File[]){if(!allowed.has(item.type)||item.size<=0||item.size>MAX_FILE)return NextResponse.json({error:`${item.name}: usa JPG, PNG, WebP o HEIC y menos de 12 MB.`},{status:400});total+=item.size;if(total>MAX_TOTAL)return NextResponse.json({error:"La captura completa supera 48 MB."},{status:400});const bytes=Buffer.from(await item.arrayBuffer());normalized.push({id:`img_${randomUUID()}`,filename:item.name,mimeType:item.type,sha256:createHash("sha256").update(bytes).digest("hex"),bytes});}
  const captureId=await createCapture({commerceId,capturedBy,files:normalized});return NextResponse.json({captureId,status:"uploaded",fileCount:normalized.length},{status:201});
}
