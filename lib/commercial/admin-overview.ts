import {Pool} from "pg";
import {ensureCommercialSchema,transitionOrderEarning} from "./db";

let pool:Pool|undefined;
function db(){const connectionString=process.env.DATABASE_URL;if(!connectionString)throw new Error("DATABASE_URL is not configured");pool??=new Pool({connectionString,max:3,idleTimeoutMillis:30_000});return pool;}
function wooConfig(){const url=process.env.WOOCOMMERCE_URL?.replace(/\/$/,"");const key=process.env.WOOCOMMERCE_CONSUMER_KEY;const secret=process.env.WOOCOMMERCE_CONSUMER_SECRET;if(!url||!key||!secret)throw new Error("WooCommerce REST credentials are not configured");return{url,key,secret};}
async function woo(path:string,init:RequestInit={}){const c=wooConfig(),u=new URL(`${c.url}/wp-json/wc/v3${path}`);u.searchParams.set("consumer_key",c.key);u.searchParams.set("consumer_secret",c.secret);const r=await fetch(u,{...init,headers:{"Content-Type":"application/json",...(init.headers||{})},cache:"no-store",signal:AbortSignal.timeout(60_000)});const b=await r.json().catch(()=>null);if(!r.ok)throw new Error(`WooCommerce ${path} failed (${r.status})`);return b;}
const meta=(order:any,key:string)=>String(order?.meta_data?.find((x:any)=>x?.key===key)?.value||"");
function parseOrder(o:any){
 const billing=o.billing||{},shipping=o.shipping||{};
 const address=[shipping.address_1||billing.address_1,shipping.address_2||billing.address_2,shipping.city||billing.city,shipping.state||billing.state].filter(Boolean).join(", ");
 return{id:Number(o.id),status:String(o.status),total:Number(o.total||0),subtotal:Number(o.line_items?.reduce((s:number,x:any)=>s+Number(x.subtotal||0),0)||0),shippingTotal:Number(o.shipping_total||0),currency:String(o.currency||"USD"),date:String(o.date_created||""),customer:[billing.first_name,billing.last_name].filter(Boolean).join(" ")||billing.phone||"Cliente",phone:String(billing.phone||""),email:String(billing.email||""),address,gestora:meta(o,"_nexo_effective_gestora_name"),gestoraSlug:meta(o,"_nexo_effective_gestora_slug"),origin:meta(o,"_nexo_order_origin")||"nexo_store",refRequested:meta(o,"_nexo_referral_requested"),refEffective:meta(o,"_nexo_referral_effective")||"organic",deliveryMode:meta(o,"_nexo_delivery_mode"),locality:meta(o,"_nexo_delivery_locality"),reference:meta(o,"_nexo_delivery_reference"),deliveryWindow:meta(o,"_nexo_delivery_window"),paymentMethod:String(o.payment_method_title||o.payment_method||""),customerNote:String(o.customer_note||""),items:(o.line_items||[]).map((x:any)=>({productId:Number(x.product_id||0),variationId:Number(x.variation_id||0),name:x.name,quantity:Number(x.quantity||0),subtotal:Number(x.subtotal||0),total:Number(x.total||0)}))};
}
export async function adminOverview(){await ensureCommercialSchema();const [orders,products,gestoras,ledger,payouts,recon]=await Promise.all([
 woo("/orders?per_page=30&orderby=date&order=desc"),woo("/products?per_page=100&status=publish"),
 db().query("SELECT id,public_name AS \"publicName\",slug,status,whatsapp,created_at AS \"createdAt\" FROM nexo_gestora_profiles ORDER BY created_at DESC LIMIT 100"),
 db().query("SELECT l.id,l.woocommerce_order_id AS \"orderId\",l.amount::float,l.currency,l.status,l.entry_type AS type,l.created_at AS \"createdAt\",g.public_name AS \"gestoraName\" FROM nexo_commission_ledger l JOIN nexo_gestora_profiles g ON g.id=l.gestora_id ORDER BY l.created_at DESC LIMIT 100"),
 db().query("SELECT p.id,p.currency,p.status,p.total::float,p.created_at AS \"createdAt\",g.public_name AS \"gestoraName\" FROM nexo_payouts p JOIN nexo_gestora_profiles g ON g.id=p.gestora_id ORDER BY p.created_at DESC LIMIT 50"),
 db().query("SELECT woocommerce_order_id AS \"orderId\",error_message AS error,status,attempts,updated_at AS \"updatedAt\" FROM nexo_commercial_reconciliation WHERE status<>'resolved' ORDER BY updated_at DESC LIMIT 50")]);
 const parsedOrders=(orders as any[]).map(parseOrder);
 const stock=(products as any[]).map(p=>({id:Number(p.id),name:String(p.name),stockStatus:String(p.stock_status),stockQuantity:p.stock_quantity==null?null:Number(p.stock_quantity),manageStock:Boolean(p.manage_stock)}));
 const available=ledger.rows.filter(x=>x.status==="available").reduce((s,x)=>s+Number(x.amount||0),0);
 return{orders:parsedOrders,products:stock,gestoras:gestoras.rows,ledger:ledger.rows,payouts:payouts.rows,reconciliation:recon.rows,kpis:{orders:parsedOrders.length,gestoraOrders:parsedOrders.filter(x=>x.gestora).length,activeGestoras:gestoras.rows.filter(x=>x.status==="active").length,availableCommission:available,stockAlerts:stock.filter(x=>x.stockStatus!=="instock"||(x.stockQuantity!=null&&x.stockQuantity<=2)).length}};
}
export async function adminOrderDetail(orderId:number){await ensureCommercialSchema();const order=parseOrder(await woo(`/orders/${orderId}`));const [ledger,recon]=await Promise.all([
 db().query("SELECT l.id,l.amount::float,l.currency,l.status,l.entry_type AS type,l.created_at AS \"createdAt\",g.public_name AS \"gestoraName\" FROM nexo_commission_ledger l JOIN nexo_gestora_profiles g ON g.id=l.gestora_id WHERE l.woocommerce_order_id=$1 ORDER BY l.created_at ASC",[orderId]),
 db().query("SELECT error_message AS error,status,attempts,updated_at AS \"updatedAt\" FROM nexo_commercial_reconciliation WHERE woocommerce_order_id=$1 ORDER BY updated_at DESC",[orderId])]);
 return{order,ledger:ledger.rows,reconciliation:recon.rows};
}
export async function adminOrderAction(orderId:number,action:"delivered_paid"|"cancelled"|"refunded",actorId:string){const status=action==="delivered_paid"?"completed":action==="cancelled"?"cancelled":"refunded";await woo(`/orders/${orderId}`,{method:"PUT",body:JSON.stringify({status})});await transitionOrderEarning(orderId,action,actorId);return{ok:true,status};}
