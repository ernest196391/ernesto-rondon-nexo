import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedTables = new Set([
  "nexo_gestora_profiles","nexo_gestora_credentials","nexo_storefront_products","nexo_commercial_price_rules",
  "nexo_customer_attributions","nexo_attribution_overrides","nexo_attribution_events","nexo_order_commercial_snapshots",
  "nexo_commission_ledger","nexo_payouts","nexo_payout_items","nexo_commercial_audit","nexo_checkout_idempotency",
  "nexo_commercial_reconciliation","nexo_admin_settings","nexo_marketing_campaigns","nexo_admin_accounts",
  "nexo_product_captures","nexo_product_capture_files","nexo_price_rules","nexo_product_audit","nexo_product_knowledge",
  "nexo_product_knowledge_sources","nexo_product_knowledge_gaps","nexo_assistant_knowledge_backlog","nexo_studio_projects",
  "nexo_e2e_runs"
]);

let pool: Pool | undefined;
function db(){
  const connectionString=process.env.DATABASE_URL;
  if(!connectionString) throw new Error("DATABASE_URL is not configured");
  pool??=new Pool({connectionString,max:2,idleTimeoutMillis:10_000});
  return pool;
}

function authorized(req:NextRequest){
  const expected=process.env.NEXO_MIGRATION_KEY;
  const supplied=req.nextUrl.searchParams.get("key")||"";
  return Boolean(expected && supplied && expected===supplied);
}

function portable(value:unknown):unknown{
  if(Buffer.isBuffer(value)) return {__nexo_bytea_base64:value.toString("base64")};
  if(Array.isArray(value)) return value.map(portable);
  if(value && typeof value==="object"){
    if(value instanceof Date) return value.toISOString();
    return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([k,v])=>[k,portable(v)]));
  }
  return value;
}

export async function GET(req:NextRequest){
  if(!authorized(req)) return NextResponse.json({error:"not_found"},{status:404,headers:{"Cache-Control":"no-store"}});
  try{
    const mode=req.nextUrl.searchParams.get("mode")||"meta";
    if(mode==="meta"){
      const present=await db().query(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'nexo_%' ORDER BY tablename`);
      const tables=[] as Array<{table:string;count:number}>;
      for(const row of present.rows){
        const table=String(row.tablename);
        if(!allowedTables.has(table)) continue;
        const count=await db().query(`SELECT COUNT(*)::int AS count FROM ${table}`);
        tables.push({table,count:Number(count.rows[0]?.count||0)});
      }
      return NextResponse.json({ok:true,tables},{headers:{"Cache-Control":"no-store"}});
    }
    if(mode!=="data") return NextResponse.json({error:"invalid_mode"},{status:400,headers:{"Cache-Control":"no-store"}});
    const table=req.nextUrl.searchParams.get("table")||"";
    if(!allowedTables.has(table)) return NextResponse.json({error:"invalid_table"},{status:400,headers:{"Cache-Control":"no-store"}});
    const offset=Math.max(0,Number(req.nextUrl.searchParams.get("offset")||0)||0);
    const limit=Math.min(200,Math.max(1,Number(req.nextUrl.searchParams.get("limit")||100)||100));
    const result=await db().query(`SELECT * FROM ${table} OFFSET $1 LIMIT $2`,[offset,limit]);
    return NextResponse.json({ok:true,table,offset,limit,rows:portable(result.rows)},{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    return NextResponse.json({error:"migration_export_failed",detail:error instanceof Error?error.message:"unknown"},{status:500,headers:{"Cache-Control":"no-store"}});
  }
}
