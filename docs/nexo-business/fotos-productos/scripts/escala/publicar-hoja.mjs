// Publica en casaviva.company (bajo pedido) las hojas de Digital Store que Ernesto aprobó.
// Hace lo mismo que «APRUEBA n,n» en el chat «Tú» (catalog.js → publishItem), pero sin arrancar el bot:
// no manda mensajes, no toca temporizadores. Solo publica artículos que ya tienen fotos limpias y revisadas.
//
// En el VPS:  cd /root/vivabot && node scripts/fotos-bolsa/publicar-hoja.mjs --hoja 1          (solo mira, no publica)
//             cd /root/vivabot && node scripts/fotos-bolsa/publicar-hoja.mjs --hoja 1 --ok     (publica)
//             … --hoja 1 --quitar 562,530 --ok   (publica la hoja sin esos números)
// La lista de cada hoja sale de /root/archivos/fotos-bolsa/hojas/revision.json (ya sin las fotos rechazadas).
import 'dotenv/config';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { gestoraShare } from '../../src/market-price.js';

const BIZ = '8771c6ed-9dbf-497d-b3df-be6697ba2693';
const BUCKET = 'mercado';
const REVISION = '/root/archivos/fotos-bolsa/hojas/revision.json';
const LOG = '/root/archivos/fotos-bolsa/publicados.jsonl';
const WEB = (process.env.WOO_URL || '').replace(/\/$/, '');
const BOT_KEY = process.env.CURRU_KEY || '';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : ''; };
const OK = args.includes('--ok');
const nums = (s) => (String(s).match(/\d+/g) || []).map(Number);

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
// Igual que catalog.js
const noContacts = (t = '') => String(t).replace(/(\+?53)?[\s-]*\d[\d\s-]{6,}\d/g, '').replace(/@\w+/g, '').replace(/wa\.me\/\S+/gi, '').trim();
const commissionOf = (it) => gestoraShare(it.my_price, it.supplier_price);

async function web(path, body) {
  if (!WEB || !BOT_KEY) throw new Error('falta WOO_URL o CURRU_KEY en el .env');
  const res = await fetch(`${WEB}/wp-json/casa-viva/v1${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-VivaBot-Key': BOT_KEY },
    body: JSON.stringify(body || {}), signal: AbortSignal.timeout(90e3),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok || !d.ok) throw new Error(d.error || d.message || `HTTP ${res.status}`);
  return d;
}

// Motivo por el que NO se publica (o '' si se puede)
function noSirve(it, permitidos) {
  if (!permitidos.has(it.id)) return 'no está en las hojas revisadas';
  if (it.status === 'publicado') return 'ya publicado';
  if (!['nuevo', 'aprobado'].includes(it.status)) return `estado «${it.status}»`;
  if (!it.photos_ok || !it.photos_clean?.length) return 'sin fotos limpias revisadas';
  if (/"bloqueado"/.test(it.photos_quality || '')) return 'bloqueado';
  if (it.my_price == null || it.currency !== 'USD') return 'sin precio en USD';
  if (commissionOf(it) <= 0) return 'el precio no deja ganancia';
  return '';
}

const rev = JSON.parse(fs.readFileSync(REVISION, 'utf8'));
const permitidos = new Set(rev.hojas.flatMap((h) => h.ok));
const quitar = new Set(nums(opt('quitar')));
let ids = opt('ids') ? nums(opt('ids')) : nums(opt('hoja')).flatMap((n) => rev.hojas.find((h) => h.hoja === n)?.ok || []);
ids = ids.filter((id) => !quitar.has(id));
if (!ids.length) { console.log('Uso: --hoja N [--quitar a,b] [--ok]  ·  o  --ids a,b [--ok]'); process.exit(1); }

const { data, error } = await db.from('crm_market_items').select('*').eq('business_id', BIZ).in('id', ids);
if (error) { console.log('Supabase:', error.message); process.exit(1); }
const porId = new Map(data.map((it) => [it.id, it]));
let hechos = 0, fallos = 0;
for (const id of ids) {
  const it = porId.get(id);
  if (!it) { console.log(`#${id}: no existe`); continue; }
  const motivo = noSirve(it, permitidos);
  if (motivo) { console.log(`#${id}: no se publica (${motivo})`); continue; }
  if (!OK) { console.log(`#${id}: listo · ${it.title} · ${it.my_price} USD · gestora ${commissionOf(it)} USD · ${it.photos_clean.length} foto(s)`); continue; }
  try {
    const images = [];
    for (const p of it.photos_clean.slice(0, 4)) {
      const { data: s } = await db.storage.from(BUCKET).createSignedUrl(p, 3600);
      if (s?.signedUrl) images.push(s.signedUrl);
    }
    if (!images.length) throw new Error('no tiene fotos');
    const d = await web('/bot/market/publish', {
      item_id: it.id, title: it.title, description: noContacts(it.description || ''), price: Number(it.my_price),
      commission: commissionOf(it), images, replace_images: false, version: Date.now(),
    });
    await db.from('crm_market_items').update({ status: 'publicado', published_url: d.url }).eq('id', it.id);
    fs.appendFileSync(LOG, JSON.stringify({ id, url: d.url, at: new Date().toISOString() }) + '\n');
    console.log(`#${id}: PUBLICADO · ${it.title} · ${it.my_price} USD · ${d.url}`);
    hechos++;
  } catch (e) {
    await db.from('crm_market_items').update({ status: 'aprobado' }).eq('id', id);
    console.log(`#${id}: aprobado pero NO publicado: ${e.message}`);
    fallos++;
  }
}
console.log(OK ? `\nPublicados: ${hechos} · fallos: ${fallos}` : '\n(Solo mirando. Añade --ok para publicar.)');
