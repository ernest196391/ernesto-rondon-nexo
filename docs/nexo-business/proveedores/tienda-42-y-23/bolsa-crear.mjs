// VPS: mete los productos de la Tienda 42 y 23 en la bolsa del bot (crm_market_items) y, después de crearlos en la web,
// los marca «publicado» con su enlace (como MK-1192 y el lote electro). 20-oct-2026.
// Vendedor = ficha «TRD 42 y 23» de crm_suppliers (id 103, jid sin-whatsapp:trd-42-y-23): así el bajo pedido sabe que se
// recoge allí y que paga Ernesto (le pregunta a Ernesto: HAY #N / NO HAY #N).
// Uso (en /root/archivos/42y23-2026-10-20, con publicar.json y fotos/<n>.jpg):
//   node bolsa-crear.mjs                 → prueba en seco (no escribe nada)
//   node bolsa-crear.mjs hacer           → crea los artículos (status «aprobado»), sube la foto a Storage «mercado»,
//                                          deja bolsa-ids.json { "<n>": id } y bak-bolsa-creados.json
//   node bolsa-crear.mjs marcar bak-20261020-42y23-creados.json [hacer]  → status «publicado» + published_url
// Idempotente: si ya existe (mismo vendedor + norm_key) reutiliza el id y no lo duplica.
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire('/root/vivabot/package.json');
require('dotenv').config({ path: '/root/vivabot/.env', quiet: true });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const BIZ = '8771c6ed-9dbf-497d-b3df-be6697ba2693';
const SELLER = { seller_jid: 'sin-whatsapp:trd-42-y-23', seller_phone: null, seller_name: 'TRD 42 y 23', group_jid: 'a-mano:trd-42-y-23', group_name: 'TRD 42 y 23 (fotos de Ernesto en la tienda)' };
const args = process.argv.slice(2);
const HACER = args.includes('hacer');
const must = (r) => { if (r.error) throw new Error(r.error.message); return r.data; };
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const sup = must(await db.from('crm_suppliers').select('id,name,jid').eq('business_id', BIZ).eq('id', 103).maybeSingle());
if (!sup || sup.jid !== SELLER.seller_jid) throw new Error('No encuentro la ficha 103 «TRD 42 y 23» con ese jid');

if (args[0] === 'marcar') {
  const c = JSON.parse(fs.readFileSync(args[1], 'utf8'));
  const ids = c.map((x) => x.market_id);
  const antes = must(await db.from('crm_market_items').select('id,status,published_url,seller_jid').eq('business_id', BIZ).in('id', ids));
  const ajenos = antes.filter((b) => b.seller_jid !== SELLER.seller_jid);
  if (ajenos.length) throw new Error('Hay ids que no son de la 42 y 23: ' + ajenos.map((b) => b.id).join(','));
  console.log((HACER ? 'MARCANDO' : 'PRUEBA EN SECO') + ` · ${c.length} artículos`);
  if (!HACER) { c.forEach((x) => console.log(`  #${x.market_id} → publicado · ${x.url}`)); process.exit(0); }
  fs.writeFileSync('bak-bolsa-antes-de-marcar.json', JSON.stringify(antes, null, 1));
  let ok = 0; const err = [];
  for (const x of c) {
    const { error } = await db.from('crm_market_items').update({ status: 'publicado', published_url: x.url }).eq('business_id', BIZ).eq('id', x.market_id);
    if (error) err.push([x.market_id, error.message]); else ok++;
    await sleep(80);
  }
  console.log(JSON.stringify({ ok, err }));
  process.exit(err.length ? 1 : 0);
}

const pub = JSON.parse(fs.readFileSync('publicar.json', 'utf8')).productos;
const idsOut = fs.existsSync('bolsa-ids.json') ? JSON.parse(fs.readFileSync('bolsa-ids.json', 'utf8')) : {};
const creados = fs.existsSync('bak-bolsa-creados.json') ? JSON.parse(fs.readFileSync('bak-bolsa-creados.json', 'utf8')) : [];
console.log((HACER ? 'CREANDO DE VERDAD' : 'PRUEBA EN SECO (para crear añade «hacer»)') + ` · ${pub.length} artículos · vendedor ${sup.name} (ficha ${sup.id})`);
for (const p of pub) {
  const key = norm(p.nombre).slice(0, 80);
  const foto = `fotos/${p.n}.jpg`;
  if (!fs.existsSync(foto)) throw new Error(`falta ${foto}`);
  const ex = must(await db.from('crm_market_items').select('id,status').eq('business_id', BIZ).eq('seller_jid', SELLER.seller_jid).eq('norm_key', key).maybeSingle());
  if (ex) { idsOut[p.n] = ex.id; console.log(`  #${p.n} ya existe: id ${ex.id} (${ex.status}) · ${p.nombre}`); continue; }
  console.log(`  #${p.n} nuevo · ${p.nombre} · costo ${p.precio_proveedor} → ${p.precio} USD · ${p.categoria_bolsa}`);
  if (!HACER) continue;
  const now = new Date().toISOString();
  const row = must(await db.from('crm_market_items').insert({
    business_id: BIZ, title: p.nombre, description: p.descripcion, category: p.categoria_bolsa, size: p.tamano,
    supplier_price: p.precio_proveedor, currency: 'USD', my_price: p.precio, price_locked: false, status: 'aprobado', ...SELLER,
    raw_text: `[TRD 42 y 23 · foto de Ernesto en la tienda, 20-oct-2026] ${p.etiqueta}${p.n === 22 ? ' · versiones 18 V y 36 V (mismo precio)' : ''}`,
    photos: [], photos_ok: true, times_seen: 1, first_seen: now, last_seen: now, norm_key: key,
  }).select('id').single());
  const path = `${BIZ}/${row.id}/limpia-1.jpg`;
  const up = await db.storage.from('mercado').upload(path, fs.readFileSync(foto), { contentType: 'image/jpeg', upsert: true });
  if (up.error) console.log(`    ⚠️ foto no subida a Storage: ${up.error.message}`);
  else must(await db.from('crm_market_items').update({ photos: [path], photos_clean: [path], photos_quality: JSON.stringify({ v: 'a-mano-2026-10-20', fuente: 'foto de Ernesto en la tienda, mejorada (fondo blanco, sin etiqueta de precio)', principal: 1 }) }).eq('id', row.id));
  idsOut[p.n] = row.id;
  creados.push({ n: p.n, id: row.id, nombre: p.nombre, creado: now });
  fs.writeFileSync('bolsa-ids.json', JSON.stringify(idsOut, null, 1));
  fs.writeFileSync('bak-bolsa-creados.json', JSON.stringify(creados, null, 1));
  console.log(`    ✅ id ${row.id}`);
  await sleep(150);
}
if (HACER) fs.writeFileSync('bolsa-ids.json', JSON.stringify(idsOut, null, 1));
console.log(HACER ? `Hecho. bolsa-ids.json: ${Object.keys(idsOut).length}` : 'Nada cambiado.');
