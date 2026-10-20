// Descarga (solo lectura) las fotos del cubo «mercado» de los productos vigentes a publicar. Una a una, con pausa.
import fs from 'fs';
import { createRequire } from 'module';
const DIR = '/root/archivos/electro-2026-10-20';
const require = createRequire('/root/vivabot/package.json');
require('dotenv').config({ path: '/root/vivabot/.env', quiet: true });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const prods = JSON.parse(fs.readFileSync(`${DIR}/productos.json`, 'utf8')).filter((p) => !p.antiguo && !p.en_web.length);
let ok = 0, bad = 0;
for (const p of prods) {
  const dir = `${DIR}/fotos/${p.market_id}`;
  fs.mkdirSync(dir, { recursive: true });
  for (const [i, f] of p.fotos.slice(0, 4).entries()) {
    const out = `${dir}/${i + 1}.jpg`;
    if (fs.existsSync(out) && fs.statSync(out).size > 1000) { ok++; continue; }
    let done = false;
    for (let t = 1; t <= 3 && !done; t++) {
      const { data, error } = await db.storage.from('mercado').download(f.replace(/^mercado\//, ''));
      if (!error && data) { fs.writeFileSync(out, Buffer.from(await data.arrayBuffer())); done = true; ok++; }
      else { console.error(p.sku, f, t, error?.message); await sleep(2000 * t); }
    }
    if (!done) bad++;
    await sleep(150);
  }
}
console.log('ok', ok, 'fallos', bad);
