import pg from 'pg';
const {Pool}=pg;
const url=process.env.DATABASE_URL;
if(!url){console.error('NEXO_SUPABASE_CUTOVER_RESULT '+JSON.stringify({status:'failed',error:'database_url_missing'}));process.exit(1)}
const pool=new Pool({connectionString:url,max:1,idleTimeoutMillis:5000,connectionTimeoutMillis:10000});
try{
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
  const meta=await pool.query("SELECT current_user, current_database(), inet_server_port() AS port");
  const status=mismatches.length===0?'passed':'failed';
  console.log('NEXO_SUPABASE_CUTOVER_RESULT '+JSON.stringify({status,checks,mismatches,dbUser:meta.rows[0]?.current_user||null,dbName:meta.rows[0]?.current_database||null,port:Number(meta.rows[0]?.port||0)}));
  if(status!=='passed') process.exitCode=1;
}catch(error){console.error('NEXO_SUPABASE_CUTOVER_RESULT '+JSON.stringify({status:'failed',error:error instanceof Error?error.message:'unknown'}));process.exitCode=1}
finally{await pool.end()}
