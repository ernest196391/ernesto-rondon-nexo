import pg from 'pg';
const {Pool}=pg;
const url=process.env.DATABASE_URL;
if(!url){console.error('NEXO_SUPABASE_CUTOVER_RESULT '+JSON.stringify({status:'failed',error:'database_url_missing'}));process.exit(1)}
const pool=new Pool({connectionString:url,max:1,idleTimeoutMillis:5000,connectionTimeoutMillis:10000});
try{
  const host=new URL(url.replace(/^postgresql:/,'http:')).hostname;
  const checks={};
  for(const [name,sql] of Object.entries({
    gestoras:'SELECT COUNT(*)::int c FROM nexo_gestora_profiles',
    storefront:'SELECT COUNT(*)::int c FROM nexo_storefront_products',
    rules:'SELECT COUNT(*)::int c FROM nexo_commercial_price_rules',
    snapshots:'SELECT COUNT(*)::int c FROM nexo_order_commercial_snapshots',
    ledger:'SELECT COUNT(*)::int c FROM nexo_commission_ledger',
    knowledge:'SELECT COUNT(*)::int c FROM nexo_product_knowledge',
    studio:'SELECT COUNT(*)::int c FROM nexo_studio_projects'
  })){
    const r=await pool.query(sql); checks[name]=Number(r.rows[0]?.c||0);
  }
  const expected={gestoras:15,storefront:300,rules:34,snapshots:8,ledger:7,knowledge:24,studio:1};
  const mismatches=Object.entries(expected).filter(([k,v])=>checks[k]!==v);
  const isSupabase=/\.supabase\.(com|co)$/.test(host)||host.includes('pooler.supabase.com');
  const status=isSupabase&&mismatches.length===0?'passed':'failed';
  console.log('NEXO_SUPABASE_CUTOVER_RESULT '+JSON.stringify({status,hostClass:isSupabase?'supabase':'other',checks,mismatches}));
  if(status!=='passed') process.exitCode=1;
}catch(error){console.error('NEXO_SUPABASE_CUTOVER_RESULT '+JSON.stringify({status:'failed',error:error instanceof Error?error.message:'unknown'}));process.exitCode=1}
finally{await pool.end()}
