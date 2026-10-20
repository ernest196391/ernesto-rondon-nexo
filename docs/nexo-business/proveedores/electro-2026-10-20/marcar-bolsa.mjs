// Marca en la bolsa (crm_market_items) los artículos publicados: status «publicado» + published_url (como MK-1192).
// Guarda antes el estado anterior en bak-bolsa-antes.json.
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire('/root/vivabot/package.json');
require('dotenv').config({ path: '/root/vivabot/.env', quiet: true });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const BIZ = '8771c6ed-9dbf-497d-b3df-be6697ba2693';
const c = JSON.parse(fs.readFileSync('bak-20261020-electro-creados.json', 'utf8'));
const ids = c.map((x) => x.market_id);
const { data: antes, error: e0 } = await db.from('crm_market_items').select('id,status,published_url').eq('business_id', BIZ).in('id', ids);
if (e0) throw e0;
fs.writeFileSync('bak-bolsa-antes.json', JSON.stringify(antes, null, 1));
const st = {}; antes.forEach((b) => { st[b.status] = (st[b.status] || 0) + 1; });
let ok = 0; const err = [];
for (const x of c) {
  const { error } = await db.from('crm_market_items').update({ status: 'publicado', published_url: x.url }).eq('business_id', BIZ).eq('id', x.market_id);
  if (error) err.push([x.market_id, error.message]); else ok++;
  await new Promise((r) => setTimeout(r, 80));
}
console.log(JSON.stringify({ antes: st, encontrados: antes.length, ok, err }));
