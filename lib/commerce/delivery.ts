import { readFileSync } from "node:fs";
import path from "node:path";

export const SHIPPING_RATE_VERSION="2026-08-04-v2";
export type ShippingQuote={status:"zone"|"pending"|"pickup";feeCup:number;amount:number;currency:"CUP";label:string;ruleId:string;source:"shipping-rates"|"manual"|"pickup";referenceCup?:number;version:string};
type Rate={municipality:string;zone:string;fee:number;active:boolean};

function normalizeText(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").trim();}
function parseCsv(){
  const rows=readFileSync(path.join(process.cwd(),"config/shipping-rates.csv"),"utf8").replace(/^\uFEFF/,"").split(/\r?\n/).slice(1);
  return rows.flatMap(line=>{const fields:string[]=[];let value="",quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===","&&!quoted){fields.push(value);value="";}else value+=c;}fields.push(value);const fee=Number(fields[2]);return fields[0]&&Number.isFinite(fee)?[{municipality:fields[0].trim(),zone:fields[1].trim(),fee,active:/^(yes|si|sí|1|active)$/i.test((fields[3]||"yes").trim())}]:[];});
}
const rates:Rate[]=parseCsv();
const localityId=(municipality:string,zone:string)=>`${normalizeText(municipality).replace(/[^a-z0-9]+/g,"-")}:${normalizeText(zone).replace(/[^a-z0-9]+/g,"-")}`;
export function deliveryCatalog(){const localities:Record<string,string[]>={},localityOptions:Record<string,{id:string;label:string}[]>={};for(const row of rates){if(row.active&&row.zone)(localities[row.municipality]??=[]).push(row.zone);}for(const key of Object.keys(localities)){localities[key]=[...new Set(localities[key])];localityOptions[key]=localities[key].map(label=>({id:localityId(key,label),label}));}return {province:{code:"LH",name:"La Habana"},municipalities:Object.keys(localities),localities,localityOptions,rateVersion:SHIPPING_RATE_VERSION,pickup:{name:process.env.NEXO_PICKUP_NAME||"NEXO · punto de recogida",address:process.env.NEXO_PICKUP_ADDRESS||"Nuevo Vedado, La Habana",instructions:process.env.NEXO_PICKUP_INSTRUCTIONS||"Confirmaremos por WhatsApp cuándo tu pedido esté listo para recoger."}};}
export function quoteShipping(municipality:string,zone:string,manual=false):ShippingQuote{if(manual)return {status:"pending",feeCup:0,amount:0,currency:"CUP",label:zone||municipality,ruleId:"manual-review",source:"manual",version:SHIPPING_RATE_VERSION};const m=normalizeText(municipality),z=normalizeText(zone);let reference=0;for(const row of rates){if(!row.active||normalizeText(row.municipality)!==m)continue;if(!row.zone){reference=row.fee;continue;}if(z&&normalizeText(row.zone)===z)return {status:"zone",feeCup:row.fee,amount:row.fee,currency:"CUP",label:row.zone,ruleId:localityId(row.municipality,row.zone),source:"shipping-rates",version:SHIPPING_RATE_VERSION};}return {status:"pending",feeCup:0,amount:0,currency:"CUP",label:zone||municipality,ruleId:"unmatched-review",source:"manual",referenceCup:reference,version:SHIPPING_RATE_VERSION};}
export function validMunicipality(value:string){return deliveryCatalog().municipalities.some(x=>normalizeText(x)===normalizeText(value));}
export function validLocality(municipality:string,value:string){return (deliveryCatalog().localities[municipality]||[]).some(x=>normalizeText(x)===normalizeText(value));}
export { normalizeText };
