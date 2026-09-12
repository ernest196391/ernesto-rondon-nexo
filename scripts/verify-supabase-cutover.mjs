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

  // Migration certification uses floors, not frozen exact counts: production can legitimately grow after cutover.
  const floors={gestoras:15,storefront:300,rules:34,snapshots:8,ledger:7,knowledge:24,studio:1};
  const belowFloor=Object.entries(floors).filter(([k,v])=>checks[k]<v);

  const integrity=await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM nexo_gestora_credentials c LEFT JOIN nexo_gestora_profiles g ON g.id=c.gestora_id WHERE g.id IS NULL) AS orphan_credentials,
      (SELECT COUNT(*)::int FROM nexo_storefront_products p LEFT JOIN nexo_gestora_profiles g ON g.id=p.gestora_id WHERE g.id IS NULL) AS orphan_storefront_products,
      (SELECT COUNT(*)::int FROM nexo_commission_ledger l LEFT JOIN nexo_gestora_profiles g ON g.id=l.gestora_id WHERE g.id IS NULL) AS orphan_ledger,
      (SELECT COUNT(*)::int FROM nexo_product_knowledge_sources s LEFT JOIN nexo_product_knowledge k ON k.id=s.product_knowledge_id WHERE k.id IS NULL) AS orphan_knowledge_sources,
      (SELECT COUNT(*)::int FROM nexo_product_knowledge_gaps x LEFT JOIN nexo_product_knowledge k ON k.id=x.product_knowledge_id WHERE k.id IS NULL) AS orphan_knowledge_gaps
  `);
  const integrityRow=integrity.rows[0]||{};
  const orphanCounts=Object.fromEntries(Object.entries(integrityRow).map(([k,v])=>[k,Number(v||0)]));
  const integrityFailures=Object.entries(orphanCounts).filter(([,v])=>v!==0);

  const meta=await pool.query("SELECT current_user, current_database(), inet_server_port() AS port");
  const hostPart=(url.includes('@')?url.slice(url.lastIndexOf('@')+1):'').split('/')[0].split('?')[0];
  const isSupabase=hostPart.includes('pooler.supabase.com')||hostPart.includes('.supabase.co');
  const status=isSupabase&&belowFloor.length===0&&integrityFailures.length===0?'passed':'failed';
  console.log('NEXO_SUPABASE_CUTOVER_RESULT '+JSON.stringify({
    status,
    hostClass:isSupabase?'supabase':'other',
    checks,
    floors,
    belowFloor,
    orphanCounts,
    integrityFailures,
    dbUser:meta.rows[0]?.current_user||null,
    dbName:meta.rows[0]?.current_database||null,
    port:Number(meta.rows[0]?.port||0)
  }));
  if(status!=='passed') process.exitCode=1;
}catch(error){console.error('NEXO_SUPABASE_CUTOVER_RESULT '+JSON.stringify({status:'failed',error:error instanceof Error?error.message:'unknown'}));process.exitCode=1}
finally{await pool.end()}
