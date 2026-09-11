import {Pool} from "pg";
import {ensureCommercialSchema,payPayout,requestPayout,setGestoraStatus} from "./db";

let pool:Pool|undefined;
function db(){const connectionString=process.env.DATABASE_URL;if(!connectionString)throw new Error("DATABASE_URL is not configured");pool??=new Pool({connectionString,max:3,idleTimeoutMillis:30_000});return pool;}
async function ensureAdminSchema(){await ensureCommercialSchema();await db().query(`
CREATE TABLE IF NOT EXISTS nexo_admin_settings(
 key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS nexo_marketing_campaigns(
 id TEXT PRIMARY KEY,title TEXT NOT NULL,subtitle TEXT NOT NULL DEFAULT '',cta_label TEXT NOT NULL DEFAULT '',cta_url TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN('draft','active','paused')),created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
`);}
export async function adminControlData(){await ensureAdminSchema();const [gestoras,ledger,payouts,recon,settings,campaigns,snapshots]=await Promise.all([
 db().query(`SELECT g.id,g.user_id AS "userId",g.public_name AS "publicName",g.slug,g.referral_code AS "referralCode",g.whatsapp,g.status,g.created_at AS "createdAt",COUNT(DISTINCT s.woocommerce_order_id)::int AS sales,COALESCE(SUM(CASE WHEN l.status='available' THEN l.amount ELSE 0 END),0)::float AS "availableCommission" FROM nexo_gestora_profiles g LEFT JOIN nexo_order_commercial_snapshots s ON s.gestora_id=g.id LEFT JOIN nexo_commission_ledger l ON l.gestora_id=g.id GROUP BY g.id ORDER BY g.created_at DESC`),
 db().query(`SELECT l.id,l.gestora_id AS "gestoraId",g.public_name AS "gestoraName",l.woocommerce_order_id AS "orderId",l.entry_type AS type,l.status,l.amount::float,l.currency,l.created_at AS "createdAt" FROM nexo_commission_ledger l JOIN nexo_gestora_profiles g ON g.id=l.gestora_id ORDER BY l.created_at DESC LIMIT 300`),
 db().query(`SELECT p.id,p.gestora_id AS "gestoraId",g.public_name AS "gestoraName",p.status,p.total::float,p.currency,p.method,p.reference,p.created_at AS "createdAt",p.paid_at AS "paidAt" FROM nexo_payouts p JOIN nexo_gestora_profiles g ON g.id=p.gestora_id ORDER BY p.created_at DESC LIMIT 100`),
 db().query(`SELECT id,woocommerce_order_id AS "orderId",error_message AS error,status,attempts,updated_at AS "updatedAt" FROM nexo_commercial_reconciliation ORDER BY updated_at DESC LIMIT 100`),
 db().query(`SELECT key,value,updated_at AS "updatedAt" FROM nexo_admin_settings ORDER BY key`),
 db().query(`SELECT id,title,subtitle,cta_label AS "ctaLabel",cta_url AS "ctaUrl",status,created_at AS "createdAt",updated_at AS "updatedAt" FROM nexo_marketing_campaigns ORDER BY updated_at DESC LIMIT 50`),
 db().query(`SELECT woocommerce_order_id AS "orderId",gestora_id AS "gestoraId",currency,base_amount::float AS "baseAmount",markup_amount::float AS "markupAmount",total_gestora_earning::float AS "earning",created_at AS "createdAt" FROM nexo_order_commercial_snapshots ORDER BY created_at DESC LIMIT 300`)
 ]);
 return{gestoras:gestoras.rows,ledger:ledger.rows,payouts:payouts.rows,reconciliation:recon.rows,settings:Object.fromEntries(settings.rows.map((x:any)=>[x.key,x.value])),campaigns:campaigns.rows,snapshots:snapshots.rows};}
export async function adminSetGestoraStatus(id:string,status:"pending"|"active"|"suspended",actorId:string){await setGestoraStatus(id,status,actorId,crypto.randomUUID());}
export async function adminSaveSetting(key:string,value:string){await ensureAdminSchema();if(!/^[a-z0-9_.-]{2,80}$/i.test(key))throw new Error("Clave inválida");await db().query(`INSERT INTO nexo_admin_settings(key,value,updated_at) VALUES($1,$2,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`,[key,value]);}
export async function adminCreateCampaign(input:{title:string;subtitle:string;ctaLabel:string;ctaUrl:string}){await ensureAdminSchema();if(input.title.trim().length<3)throw new Error("Título demasiado corto");const id=`mkt_${crypto.randomUUID()}`;await db().query(`INSERT INTO nexo_marketing_campaigns(id,title,subtitle,cta_label,cta_url,status) VALUES($1,$2,$3,$4,$5,'draft')`,[id,input.title.trim(),input.subtitle.trim(),input.ctaLabel.trim(),input.ctaUrl.trim()]);return id;}
export async function adminSetCampaignStatus(id:string,status:"draft"|"active"|"paused"){await ensureAdminSchema();if(status==="active")await db().query(`UPDATE nexo_marketing_campaigns SET status='paused',updated_at=NOW() WHERE status='active' AND id<>$1`,[id]);await db().query(`UPDATE nexo_marketing_campaigns SET status=$2,updated_at=NOW() WHERE id=$1`,[id,status]);}
export async function adminResolveIncident(id:string){await ensureAdminSchema();const r=await db().query(`UPDATE nexo_commercial_reconciliation SET status='resolved',updated_at=NOW() WHERE id=$1 RETURNING id`,[id]);if(!r.rowCount)throw new Error("Incidencia no encontrada");}
export async function activeMarketingCampaign(){await ensureAdminSchema();const r=await db().query(`SELECT id,title,subtitle,cta_label AS "ctaLabel",cta_url AS "ctaUrl" FROM nexo_marketing_campaigns WHERE status='active' ORDER BY updated_at DESC LIMIT 1`);return r.rows[0]??null;}
export async function adminRequestPayout(gestoraId:string,currency:string,actorId:string){return requestPayout({gestoraId,currency,actorId,requestId:crypto.randomUUID()});}
export async function adminPayPayout(payoutId:string,method:string,reference:string,evidenceUrl:string,actorId:string){return payPayout({payoutId,method,reference,evidenceUrl,actorId,requestId:crypto.randomUUID()});}
