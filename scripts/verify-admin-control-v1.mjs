import pg from "pg";
const {Pool}=pg;
const url=process.env.DATABASE_URL;
if(!url){console.log('NEXO_ADMIN_V1_QA_SKIP {"reason":"database_not_configured"}');process.exit(0)}
const pool=new Pool({connectionString:url,max:1,idleTimeoutMillis:5000});
try{
 await pool.query(`CREATE TABLE IF NOT EXISTS nexo_admin_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE TABLE IF NOT EXISTS nexo_marketing_campaigns(id TEXT PRIMARY KEY,title TEXT NOT NULL,subtitle TEXT NOT NULL DEFAULT '',cta_label TEXT NOT NULL DEFAULT '',cta_url TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN('draft','active','paused')),created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`);
 const required=['nexo_gestora_profiles','nexo_order_commercial_snapshots','nexo_commission_ledger','nexo_payouts','nexo_commercial_reconciliation','nexo_admin_settings','nexo_marketing_campaigns'];
 const r=await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=ANY($1::text[])`,[required]);
 const found=new Set(r.rows.map(x=>x.table_name)),missing=required.filter(x=>!found.has(x));
 const counts={};for(const table of required){if(found.has(table)){const q=await pool.query(`SELECT COUNT(*)::int AS n FROM ${table}`);counts[table]=q.rows[0].n}}
 const status=missing.length?'failed':'passed';console.log('NEXO_ADMIN_V1_QA_RESULT '+JSON.stringify({status,missing,counts}));if(missing.length)process.exitCode=1;
}catch(e){console.error('NEXO_ADMIN_V1_QA_RESULT '+JSON.stringify({status:'failed',error:e instanceof Error?e.message:String(e)}));process.exitCode=1}finally{await pool.end()}
