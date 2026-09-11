import pg from 'pg';
const {Pool}=pg;

const source=process.env.DATABASE_URL;
const key=process.env.NEXO_MIGRATION_KEY;
const target='https://viwwlriwlwodrfukbgbj.supabase.co/functions/v1/nexo-migration-import';
const tables=[
'nexo_gestora_profiles','nexo_gestora_credentials','nexo_storefront_products','nexo_commercial_price_rules',
'nexo_customer_attributions','nexo_attribution_overrides','nexo_attribution_events','nexo_order_commercial_snapshots',
'nexo_commission_ledger','nexo_payouts','nexo_payout_items','nexo_commercial_audit','nexo_checkout_idempotency',
'nexo_commercial_reconciliation','nexo_admin_settings','nexo_marketing_campaigns','nexo_admin_accounts',
'nexo_product_captures','nexo_product_capture_files','nexo_price_rules','nexo_product_audit','nexo_product_knowledge',
'nexo_product_knowledge_sources','nexo_product_knowledge_gaps','nexo_assistant_knowledge_backlog','nexo_studio_projects','nexo_e2e_runs'
];

function portable(v){
 if(Buffer.isBuffer(v)) return `\\x${v.toString('hex')}`;
 if(Array.isArray(v)) return v.map(portable);
 if(v instanceof Date) return v.toISOString();
 if(v&&typeof v==='object') return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,portable(x)]));
 return v;
}

async function main(){
 if(!source||!key){console.log('NEXO_DB_COPY_SKIP '+JSON.stringify({reason:'migration_env_missing'}));return;}
 const pool=new Pool({connectionString:source,max:1,idleTimeoutMillis:5000});
 const summary={status:'running',counts:{},unknownTables:[]};
 try{
  const presentRes=await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'nexo_%' ORDER BY tablename");
  const present=presentRes.rows.map(r=>String(r.tablename));
  summary.unknownTables=present.filter(t=>!tables.includes(t));
  if(summary.unknownTables.length) throw new Error(`unknown_nexo_tables:${summary.unknownTables.join(',')}`);
  for(const table of tables){
   if(!present.includes(table)){summary.counts[table]=0;continue;}
   const countRes=await pool.query(`SELECT COUNT(*)::int count FROM ${table}`);
   const count=Number(countRes.rows[0]?.count||0);summary.counts[table]=count;
   for(let offset=0;offset<count;offset+=100){
    const rowsRes=await pool.query(`SELECT * FROM ${table} OFFSET $1 LIMIT 100`,[offset]);
    const rows=portable(rowsRes.rows);
    const response=await fetch(target,{method:'POST',headers:{'content-type':'application/json','x-nexo-migration-key':key},body:JSON.stringify({table,rows})});
    const body=await response.json().catch(()=>({}));
    if(!response.ok||!body?.ok) throw new Error(`target_import_failed:${table}:${response.status}:${body?.error||'unknown'}`);
   }
  }
  summary.status='passed';
  console.log('NEXO_DB_COPY_RESULT '+JSON.stringify(summary));
 }catch(error){
  summary.status='failed';
  summary.error=error instanceof Error?error.message:'unknown';
  console.error('NEXO_DB_COPY_RESULT '+JSON.stringify(summary));
  process.exitCode=1;
 }finally{await pool.end();}
}
await main();
