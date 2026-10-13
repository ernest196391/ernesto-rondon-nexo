// Utilidades del piloto «fotos de internet» (no toca el repo del bot; usa sus módulos con createRequire)
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
export const require = createRequire('/root/vivabot/package.json');
// .env del bot sin imprimir nada
for (const l of fs.readFileSync('/root/vivabot/.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
export const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
export const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
export const BIZ = '8771c6ed-9dbf-497d-b3df-be6697ba2693';
export const SELLER = 'Digital Store (Kevin)';
export const BASE = '/root/archivos/fotos-bolsa';
export const PW = path.join(BASE, 'piloto-web');
export const P = (...a) => path.join(BASE, ...a.map(String));
export const leer = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
export const guardar = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f + '.tmp', JSON.stringify(o, null, 1)); fs.renameSync(f + '.tmp', f); };
export const tapar = (s = '') => String(s).replace(/sk-[A-Za-z0-9_\-*]{6,}/g, 'sk-***');
export async function filasDS(cols = 'id,status,title,photos_ok,photos_quality,photos_clean,my_price') {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('crm_market_items').select(cols).eq('business_id', BIZ).eq('seller_name', SELLER).order('id').range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...data); if (data.length < 1000) break;
  }
  return out;
}
