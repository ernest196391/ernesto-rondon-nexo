// Alta de los productos «Redes y conectividad» bajo pedido (29-oct-2026). Mismo camino que el bot: crm_market_items + POST /bot/market/publish.
// Uso (en el VPS):  node conectividad-alta.mjs --prueba | --crear | --publicar [--solo olax,hex]
// NO escribe a ningún proveedor ni a ningún grupo. Idempotente: si el item ya existe (mismo vendedor y norm_key) lo actualiza.
import fs from 'fs';
import { createRequire } from 'module';
import { BIZ, DEPTS, PRODUCTOS, SIN_FOTO, descripcion, rutaTexto, base, norm } from './conectividad-datos.mjs';

const require = createRequire('/root/vivabot/package.json');
require('dotenv').config({ path: '/root/vivabot/.env', quiet: true });
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const { myPrice, gestoraShare } = await import('/root/vivabot/src/market-price.js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const BUCKET = 'mercado';
const IMG = '/tmp/tc/img';
const args = process.argv.slice(2);
const solo = args.includes('--solo') ? args[args.indexOf('--solo') + 1].split(',') : null;
const lista = [...PRODUCTOS, ...SIN_FOTO].filter((p) => !solo || solo.includes(p.k));
const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

async function fotoWeb(file) {
  let q = 84, buf;
  for (; q >= 50; q -= 8) {
    buf = await sharp(`${IMG}/${file}`).rotate().flatten({ background: '#ffffff' }).resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: q, mozjpeg: true }).toBuffer();
    if (buf.length <= 150 * 1024) break;
  }
  const m = await sharp(buf).metadata();
  return { buf, w: m.width, h: m.height, kb: Math.round(buf.length / 1024) };
}

if (args.includes('--prueba')) {
  for (const p of lista) {
    const my = myPrice(p.costo, 'USD'), d = descripcion(p);
    const f = p.foto ? await fotoWeb(p.foto) : { w: 0, h: 0, kb: 0 };
    console.log(`${p.k.padEnd(9)} ${p.costo}→${my} gestora+${gestoraShare(my, p.costo)} | título ${p.title.length}${p.title.length < 45 || p.title.length > 65 ? ' ⚠️' : ''} | desc ${d.length}${d.length < 400 || d.length > 800 ? ' ⚠️' : ''} | foto ${f.w}x${f.h} ${f.kb}KB | ${p.title}`);
  }
  process.exit(0);
}

if (args.includes('--crear')) {
  for (const p of lista) {
    const my = myPrice(p.costo, 'USD');
    const nk = norm(p.title).slice(0, 80);
    const b = base(p);
    const fields = {
      business_id: BIZ, title: p.title, description: descripcion(p), category: p.categoria, size: 'pequeno',
      supplier_price: p.costo, currency: 'USD', my_price: my, price_locked: false,
      seller_jid: b.seller_jid, seller_phone: b.seller_phone, seller_name: b.seller_name, group_jid: b.group_jid, group_name: b.group_name,
      first_wa_id: b.first_wa_id, last_wa_id: b.last_wa_id, raw_text: rutaTexto(p), norm_key: nk,
      photos_ok: false, last_seen: new Date().toISOString(),
    };
    let ex = must(await db.from('crm_market_items').select('id,status,photos').eq('business_id', BIZ).eq('seller_jid', b.seller_jid).eq('norm_key', nk).maybeSingle());
    let id;
    if (ex) { id = ex.id; must(await db.from('crm_market_items').update(fields).eq('id', id).select('id')); console.log(`${p.k}: actualizo #${id}`); }
    else { const [row] = must(await db.from('crm_market_items').insert({ ...fields, status: 'nuevo', times_seen: 1 }).select('id')); id = row.id; console.log(`${p.k}: creado #${id}`); }
    if (!p.foto) { console.log('   sin foto: queda en la bolsa como «nuevo»'); continue; }
    const f = await fotoWeb(p.foto);
    const path = `${BIZ}/${id}/catalogo-1.jpg`;
    const up = await db.storage.from(BUCKET).upload(path, f.buf, { contentType: 'image/jpeg', upsert: true });
    if (up.error) throw new Error(up.error.message);
    must(await db.from('crm_market_items').update({ photos: [path], photos_clean: [path], photos_quality: JSON.stringify({ v: 'catalogo-2026-10-29', fuente: p.fotoNota, principal: 1 }) }).eq('id', id).select('id'));
    console.log(`   foto ${f.w}x${f.h} ${f.kb} KB → ${path}`);
  }
}

if (args.includes('--publicar')) {
  const WEB = (process.env.WOO_URL || '').replace(/\/$/, '');
  for (const p of lista) {
    const b = base(p);
    const it = must(await db.from('crm_market_items').select('*').eq('business_id', BIZ).eq('seller_jid', b.seller_jid).eq('norm_key', norm(p.title).slice(0, 80)).maybeSingle());
    if (!it) { console.log(`${p.k}: no existe, corre --crear`); continue; }
    if (it.status === 'publicado' && it.published_url && !args.includes('--otra-vez') && !args.includes('--republicar')) { console.log(`${p.k}: ya publicado ${it.published_url}`); continue; }
    if (!(it.photos_clean?.length || it.photos?.length)) { console.log(`${p.k}: sin fotos, no se publica`); continue; }
    const commission = gestoraShare(it.my_price, it.supplier_price);
    const images = [];
    for (const path of (it.photos_clean?.length ? it.photos_clean : it.photos).slice(0, 4)) {
      const { data } = await db.storage.from(BUCKET).createSignedUrl(path, 3600);
      if (data?.signedUrl) images.push(data.signedUrl);
    }
    const noContacts = (t = '') => String(t).replace(/(\+?53)?[\s-]*\d[\d\s-]{6,}\d/g, '').replace(/@\w+/g, '').replace(/wa\.me\/\S+/gi, '').trim();
    const res = await fetch(`${WEB}/wp-json/casa-viva/v1/bot/market/publish`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-VivaBot-Key': process.env.CURRU_KEY || '' },
      body: JSON.stringify({ item_id: it.id, title: it.title, description: noContacts(it.description || ''), price: Number(it.my_price), commission, images, replace_images: !!args.includes('--otra-vez'), version: Date.now(), departments: DEPTS }),
      signal: AbortSignal.timeout(120e3),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || !d.ok) { console.log(`${p.k}: ERROR ${d.error || d.message || res.status}`); continue; }
    must(await db.from('crm_market_items').update({ status: 'publicado', published_url: d.url }).eq('id', it.id).select('id'));
    console.log(`${p.k}: #${it.id} MK-${it.id} woo ${d.product_id} ${it.my_price} USD (gestora +${commission}) ${d.url}`);
  }
}
