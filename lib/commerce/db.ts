import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { CaptureStatus, PriceCalculation, PriceRule, ProductAnalysis, ProductCopy, ProductResearch } from "./types";

let pool: Pool | undefined;
let schemaReady: Promise<void> | undefined;
function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  pool ??= new Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000 });
  return pool;
}

async function ensureSchema() {
  schemaReady ??= getPool().query(`
    CREATE TABLE IF NOT EXISTS nexo_product_captures (
      id TEXT PRIMARY KEY, commerce_id TEXT NOT NULL, captured_by TEXT NOT NULL, status TEXT NOT NULL,
      analysis JSONB, research JSONB, product_copy JSONB, price_calculation JSONB,
      woocommerce_product_id BIGINT, error_message TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), verified_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS nexo_product_capture_files (
      id TEXT PRIMARY KEY, capture_id TEXT NOT NULL REFERENCES nexo_product_captures(id) ON DELETE CASCADE,
      filename TEXT NOT NULL, mime_type TEXT NOT NULL, sha256 TEXT NOT NULL, bytes BYTEA NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS nexo_product_capture_files_capture_idx ON nexo_product_capture_files(capture_id);
    CREATE TABLE IF NOT EXISTS nexo_price_rules (
      id TEXT PRIMARY KEY, commerce_id TEXT NOT NULL, payload JSONB NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS nexo_product_audit (
      id TEXT PRIMARY KEY, commerce_id TEXT NOT NULL, capture_id TEXT, actor TEXT NOT NULL,
      action TEXT NOT NULL, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).then(() => undefined);
  return schemaReady;
}

export async function createCapture(input: { commerceId: string; capturedBy: string; files: Array<{ id: string; filename: string; mimeType: string; sha256: string; bytes: Buffer }> }) {
  await ensureSchema(); const id = `cap_${randomUUID()}`; const client = await getPool().connect();
  try { await client.query("BEGIN");
    await client.query("INSERT INTO nexo_product_captures(id,commerce_id,captured_by,status) VALUES($1,$2,$3,'uploaded')", [id,input.commerceId,input.capturedBy]);
    for (const file of input.files) await client.query("INSERT INTO nexo_product_capture_files(id,capture_id,filename,mime_type,sha256,bytes) VALUES($1,$2,$3,$4,$5,$6)", [file.id,id,file.filename,file.mimeType,file.sha256,file.bytes]);
    await client.query("INSERT INTO nexo_product_audit(id,commerce_id,capture_id,actor,action,payload) VALUES($1,$2,$3,$4,'capture.created',$5::jsonb)", [`aud_${randomUUID()}`,input.commerceId,id,input.capturedBy,JSON.stringify({fileIds:input.files.map(f=>f.id)})]);
    await client.query("COMMIT"); return id;
  } catch(error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function getCaptureFiles(captureId: string) { await ensureSchema(); const result=await getPool().query("SELECT id,filename,mime_type,sha256,bytes FROM nexo_product_capture_files WHERE capture_id=$1 ORDER BY created_at",[captureId]); return result.rows as Array<{id:string;filename:string;mime_type:string;sha256:string;bytes:Buffer}>; }
export async function addCaptureFile(captureId:string,file:{id:string;filename:string;mimeType:string;sha256:string;bytes:Buffer}){await ensureSchema();await getPool().query("INSERT INTO nexo_product_capture_files(id,capture_id,filename,mime_type,sha256,bytes) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO NOTHING",[file.id,captureId,file.filename,file.mimeType,file.sha256,file.bytes]);}
export async function updateCapture(captureId: string, patch: { status?:CaptureStatus; analysis?:ProductAnalysis; research?:ProductResearch; productCopy?:ProductCopy; priceCalculation?:PriceCalculation; errorMessage?:string|null; woocommerceProductId?:number; verified?:boolean }, actor="nexo-system") {
  await ensureSchema(); const existing=await getPool().query("SELECT commerce_id FROM nexo_product_captures WHERE id=$1",[captureId]); if(!existing.rowCount) return false;
  await getPool().query(`UPDATE nexo_product_captures SET status=COALESCE($2,status),analysis=COALESCE($3::jsonb,analysis),research=COALESCE($4::jsonb,research),product_copy=COALESCE($5::jsonb,product_copy),price_calculation=COALESCE($6::jsonb,price_calculation),error_message=$7,woocommerce_product_id=COALESCE($8,woocommerce_product_id),verified_at=CASE WHEN $9 THEN NOW() ELSE verified_at END,updated_at=NOW() WHERE id=$1`,[captureId,patch.status??null,patch.analysis?JSON.stringify(patch.analysis):null,patch.research?JSON.stringify(patch.research):null,patch.productCopy?JSON.stringify(patch.productCopy):null,patch.priceCalculation?JSON.stringify(patch.priceCalculation):null,patch.errorMessage??null,patch.woocommerceProductId??null,Boolean(patch.verified)]);
  await getPool().query("INSERT INTO nexo_product_audit(id,commerce_id,capture_id,actor,action,payload) VALUES($1,$2,$3,$4,$5,$6::jsonb)",[ `aud_${randomUUID()}`,existing.rows[0].commerce_id,captureId,actor,`capture.${patch.status??"updated"}`,JSON.stringify(patch)]); return true;
}
export async function getCapture(captureId:string){await ensureSchema();const r=await getPool().query("SELECT id,commerce_id,captured_by,status,analysis,research,product_copy,price_calculation,woocommerce_product_id,error_message,created_at,updated_at,verified_at FROM nexo_product_captures WHERE id=$1",[captureId]);return r.rows[0]??null;}
export async function listCaptures(limit=30){await ensureSchema();const r=await getPool().query("SELECT id,commerce_id,captured_by,status,analysis,research,product_copy,price_calculation,woocommerce_product_id,error_message,created_at,updated_at,verified_at FROM nexo_product_captures ORDER BY updated_at DESC LIMIT $1",[Math.min(100,Math.max(1,limit))]);return r.rows;}
export async function listPriceRules(commerceId:string):Promise<PriceRule[]>{await ensureSchema();const r=await getPool().query<{payload:PriceRule}>("SELECT payload FROM nexo_price_rules WHERE commerce_id=$1 AND active=TRUE ORDER BY updated_at DESC",[commerceId]);return r.rows.map(x=>x.payload);}
export async function savePriceRule(rule:PriceRule,actor:string){await ensureSchema();await getPool().query("INSERT INTO nexo_price_rules(id,commerce_id,payload,active) VALUES($1,$2,$3::jsonb,$4) ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload,active=EXCLUDED.active,updated_at=NOW()",[rule.id,rule.commerceId,JSON.stringify(rule),rule.active]);await getPool().query("INSERT INTO nexo_product_audit(id,commerce_id,actor,action,payload) VALUES($1,$2,$3,'price_rule.saved',$4::jsonb)",[ `aud_${randomUUID()}`,rule.commerceId,actor,JSON.stringify(rule)]);}
