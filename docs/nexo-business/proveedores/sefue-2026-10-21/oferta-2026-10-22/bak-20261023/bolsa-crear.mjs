// VPS: mete los productos de SeFué (oferta del 22-oct) en la bolsa del bot (crm_market_items), como
// tienda-42-y-23/bolsa-crear.mjs. SIN «hacer» NO ESCRIBE NADA (prueba en seco). NO SE HA EJECUTADO con «hacer».
// Vendedor = Javier Quota (comercial de SeFué, 5354942950): el bajo pedido le pregunta a él si hay (existencia en cada venta).
// Uso (en /root/archivos/sefue-2026-10-22, con publicar.json al lado):
//   node bolsa-crear.mjs proveedor            → enseña la ficha de crm_suppliers que se crearía
//   node bolsa-crear.mjs proveedor hacer      → la crea (solo si no existe una con ese jid)
//   node bolsa-crear.mjs                      → prueba en seco de los artículos
//   node bolsa-crear.mjs hacer [max=N]        → crea los artículos (status «aprobado»), baja la 1.ª foto de su web
//                                               (autorizada 21-oct 16:56) a fotos/<n>.jpg, la sube a Storage «mercado»,
//                                               deja bolsa-ids.json { "<n>": id } y bak-bolsa-creados.json
//   node bolsa-crear.mjs marcar <creados-web.json> [hacer]   → status «publicado» + published_url (tras crear-productos.php)
// Idempotente: si ya existe (mismo vendedor + norm_key) reutiliza el id.
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire('/root/vivabot/package.json');
require('dotenv').config({ path: '/root/vivabot/.env', quiet: true });
const { createClient } = require('@supabase/supabase-js');
let sharp = null; try { sharp = require('sharp'); } catch { /* sin sharp: se guarda la foto tal cual */ }
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const BIZ = '8771c6ed-9dbf-497d-b3df-be6697ba2693';
const JID = '5354942950@s.whatsapp.net';
const SELLER = { seller_jid: JID, seller_phone: '5354942950', seller_name: 'SeFué (Javier Quota)', group_jid: 'a-mano:sefue', group_name: 'SeFué (lista de precios de Javier, 22-oct)' };
const FICHA = {
  business_id: BIZ, jid: JID, phone: '5354942950', name: 'SeFué', source: 'a_mano', source_ref: 'proveedores/sefue-2026-10-21 (PLAN 21-oct + lista 22-oct)',
  aliases: 'SeFue, Se Fue, Sefué, sefue.app, Javier Quota', pickup: true, delivers: false, collects: 'casaviva',
  pickup_address: 'Dos locales (cada artículo dice cuál): Vedado, calle N e/ 21 y 23 · Cerro, Manglar y Oquendo, junto al parque La Normal',
  terms: 'Precio = su web −3 % (humidores −5 %, colchones de mayorista −3 % salvo el King). Ventas solo con mensajería (no recogidas de clientes ni gestoras en su local). Existencia: preguntar en cada venta. Transporte nuestro salvo colchones y humidores (lo pone SeFué). Herrajes de humidor: se piden, mínimo 500 USD. Fotos de su web autorizadas (21-oct).',
  settlement: 'Por acordar con Javier (quién paga y cuándo).', hours: null,
};
const args = process.argv.slice(2);
const HACER = args.includes('hacer');
const MAX = Number((args.find((a) => /^max=\d+$/.test(a)) || 'max=100000').slice(4));
const must = (r) => { if (r.error) throw new Error(r.error.message); return r.data; };
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const sup = must(await db.from('crm_suppliers').select('id,name,jid').eq('business_id', BIZ).eq('jid', JID).maybeSingle());

if (args[0] === 'proveedor') {
  if (sup) { console.log(`Ya existe la ficha ${sup.id} «${sup.name}» (${sup.jid}). No se toca.`); process.exit(0); }
  console.log((HACER ? 'CREANDO' : 'PRUEBA EN SECO') + ' · ficha de proveedor:\n' + JSON.stringify(FICHA, null, 1));
  if (!HACER) process.exit(0);
  const row = must(await db.from('crm_suppliers').insert(FICHA).select('id').single());
  console.log(`✅ ficha ${row.id}`);
  process.exit(0);
}

if (args[0] === 'marcar') {
  const c = JSON.parse(fs.readFileSync(args[1], 'utf8'));
  const ids = c.map((x) => x.market_id);
  const antes = must(await db.from('crm_market_items').select('id,status,published_url,seller_jid').eq('business_id', BIZ).in('id', ids));
  const ajenos = antes.filter((b) => b.seller_jid !== JID);
  if (ajenos.length) throw new Error('Hay ids que no son de SeFué: ' + ajenos.map((b) => b.id).join(','));
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

if (!sup) {
  console.log('⚠️ No hay ficha de SeFué en crm_suppliers (jid ' + JID + '). Antes de «hacer»: node bolsa-crear.mjs proveedor hacer');
  if (HACER) process.exit(1);
}
const pub = JSON.parse(fs.readFileSync('publicar.json', 'utf8')).productos;
const idsOut = fs.existsSync('bolsa-ids.json') ? JSON.parse(fs.readFileSync('bolsa-ids.json', 'utf8')) : {};
const creados = fs.existsSync('bak-bolsa-creados.json') ? JSON.parse(fs.readFileSync('bak-bolsa-creados.json', 'utf8')) : [];
fs.mkdirSync('fotos', { recursive: true });
console.log((HACER ? 'CREANDO DE VERDAD' : 'PRUEBA EN SECO (para crear añade «hacer»)') + ` · ${pub.length} artículos · vendedor ${SELLER.seller_name}${sup ? ` (ficha ${sup.id})` : ' (SIN ficha)'}`);
let hechos = 0; const sinFoto = [];
for (const p of pub) {
  const key = norm(p.nombre).slice(0, 80);
  const ex = must(await db.from('crm_market_items').select('id,status').eq('business_id', BIZ).eq('seller_jid', JID).eq('norm_key', key).maybeSingle());
  if (ex) { idsOut[p.n] = ex.id; console.log(`  #${p.n} ya existe: id ${ex.id} (${ex.status}) · ${p.nombre}`); continue; }
  console.log(`  #${p.n} nuevo · ${p.nombre} · costo ${p.precio_proveedor} → ${p.precio} USD${p.precio_manual ? ' (precio a mano = su web)' : ''} · gestora ${p.comision} · ${p.categoria_bolsa} · ${p.tamano}${p.foto_url ? '' : ' · ⚠️ SIN FOTO'}`);
  if (!p.foto_url) sinFoto.push(p.n);
  if (!HACER) continue;
  if (hechos >= MAX) { console.log('⏸️ tope max alcanzado'); break; }
  const now = new Date().toISOString();
  const row = must(await db.from('crm_market_items').insert({
    business_id: BIZ, title: p.nombre, description: p.descripcion, category: p.categoria_bolsa, size: p.tamano,
    supplier_price: p.precio_proveedor, currency: 'USD', my_price: p.precio, price_locked: !!p.precio_manual, status: 'aprobado', ...SELLER,
    raw_text: `[SeFué · lista de Javier Quota 22-oct-2026] ${p.etiqueta}`,
    photos: [], photos_ok: true, times_seen: 1, first_seen: now, last_seen: now, norm_key: key,
  }).select('id').single());
  idsOut[p.n] = row.id;
  if (p.foto_url && /^https:\/\/www\.sefue\.app\//.test(p.foto_url)) {
    try {
      const r = await fetch(p.foto_url, { headers: { 'user-agent': 'CasaViva/1.0 (fotos autorizadas por SeFué)' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      let buf = Buffer.from(await r.arrayBuffer());
      if (sharp) buf = await sharp(buf).flatten({ background: '#ffffff' }).jpeg({ quality: 88 }).toBuffer();
      fs.writeFileSync(p.foto_local, buf);
      const spath = `${BIZ}/${row.id}/limpia-1.jpg`;
      const up = await db.storage.from('mercado').upload(spath, buf, { contentType: 'image/jpeg', upsert: true });
      if (up.error) console.log(`    ⚠️ foto no subida a Storage: ${up.error.message}`);
      else must(await db.from('crm_market_items').update({ photos: [spath], photos_clean: [spath], photos_quality: JSON.stringify({ v: 'a-mano-2026-10-22', fuente: 'web de SeFué (autorizado 21-oct)', principal: 1 }) }).eq('id', row.id));
    } catch (e) { console.log(`    ⚠️ foto no bajada: ${e.message}`); }
    await sleep(1200); // despacio: su robots.txt pide no usar robots
  }
  creados.push({ n: p.n, id: row.id, nombre: p.nombre, creado: now });
  fs.writeFileSync('bolsa-ids.json', JSON.stringify(idsOut, null, 1));
  fs.writeFileSync('bak-bolsa-creados.json', JSON.stringify(creados, null, 1));
  console.log(`    ✅ id ${row.id}`);
  hechos++;
  await sleep(150);
}
if (HACER) fs.writeFileSync('bolsa-ids.json', JSON.stringify(idsOut, null, 1));
console.log(HACER ? `Hecho: ${hechos} creados. bolsa-ids.json: ${Object.keys(idsOut).length}` : `Nada cambiado. Sin foto: ${sinFoto.length ? sinFoto.join(', ') : 'ninguno'}. sharp: ${sharp ? 'sí' : 'no'}.`);
