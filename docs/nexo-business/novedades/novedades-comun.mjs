// Piezas comunes de los anuncios diarios de productos al grupo «Actualización de productos» (Ernesto, 20-oct-2026).
//   seleccion-diaria.mjs (8:40) elige la lista del día; novedades.mjs (cada minuto, 9:02–19:00) la va mandando.
// Copia versionada: docs/nexo-business/novedades/ (repo ernesto-rondon-nexo). En el VPS: /root/supervisor/tareas/.
// Nunca imprime claves. Lee la web por la API de WooCommerce (solo lectura) y Supabase con la clave del bot.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';

const require = createRequire('/root/vivabot/package.json');
require('dotenv').config({ path: '/root/vivabot/.env', quiet: true });
const { createClient } = require('@supabase/supabase-js');
export const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
// Comisión «Ganas» exactamente como el mensaje de las 9:00 del bot (fija o % de la ficha; si no, 10 %).
import { commissionFor, money } from '/root/vivabot/src/grupo-diario-rules.js';
export { commissionFor, money };

export const BIZ = '8771c6ed-9dbf-497d-b3df-be6697ba2693';
export const GRUPO = '120363283827702479@g.us';          // «Actualización de productos»
export const GENERAL = '120363304301144410@g.us';
export const ERNESTO = '5354056173';
export const DIR = process.env.NOVEDADES_DIR || '/root/archivos/novedades';
export const FOTOS = `${DIR}/fotos`;
export const DIAS = `${DIR}/dias`;                        // una lista por día: dias/AAAA-MM-DD.json
export const NOTICIAS = `${DIR}/noticias`;                // titulares y lectura de la IA, por día
export const ENVIADOS = `${DIR}/enviados.jsonl`;          // una línea por anuncio (o salto): nunca se repite en 7 días
export const COLA = `${DIR}/cola.json`;                   // los 267 electrodomésticos del 20-oct: ahora son «recién llegados»
for (const d of [DIR, FOTOS, DIAS, NOTICIAS]) fs.mkdirSync(d, { recursive: true });

export const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

/** Hora de Cuba → { day: 'AAAA-MM-DD', hour, minute, hora (decimal) } */
export function cuba(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Havana', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(now).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: p.hour, minute: p.minute, hora: Number(p.hour) + Number(p.minute) / 60 };
}
export function addDays(day, n) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const say = (s) => { const c = cuba(); console.log(`${new Date().toISOString()} [${c.day} ${c.hour}:${c.minute} Cuba] ${s}`); };

// ---------- ajustes (crm_settings) ----------
export async function setting(key) {
  return (must(await db.from('crm_settings').select('value').eq('business_id', BIZ).eq('key', key).maybeSingle()) || {}).value ?? null;
}
export async function setSetting(key, value) {
  must(await db.from('crm_settings').upsert({ business_id: BIZ, key, value, updated_at: new Date().toISOString() }, { onConflict: 'business_id,key' }).select('key'));
}
export async function ajustes() {
  const [auto, max, cada] = await Promise.all([setting('novedades_auto'), setting('novedades_max_dia'), setting('novedades_cada_min')]);
  const n = Number(max);
  return {
    auto: String(auto || 'no').trim().toLowerCase(),
    maxDia: Number.isFinite(n) && String(max ?? '').trim() !== '' ? Math.max(0, Math.min(60, Math.round(n))) : 30,
    cadaMin: Math.max(1, Number(cada) || 1),
  };
}

// ---------- web (WooCommerce, solo lectura) ----------
const base = (process.env.WOO_URL || '').replace(/\/$/, '');
const auth = 'Basic ' + Buffer.from(`${process.env.WOO_KEY}:${process.env.WOO_SECRET}`).toString('base64');
export async function woo(p) {
  const res = await fetch(`${base}/wp-json/wc/v3/${p}`, { headers: { Authorization: auth }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`WooCommerce ${res.status} en ${p.split('?')[0]}`);
  return res.json();
}
export async function catalogo() {
  const all = [];
  for (let page = 1; page <= 30; page++) {
    const batch = await woo(`products?status=publish&per_page=100&page=${page}`);
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}
export const meta = (p) => Object.fromEntries((p?.meta_data || []).map((m) => [m.key, m.value]));
export const esBajoPedido = (p) => /^MK-\d+$/i.test(String(p.sku || '').trim()) || (p.categories || []).some((c) => /bajo pedido/i.test(c.name || ''));
export const categoria = (p) => (p.categories || []).map((c) => c.name).find((n) => !/bajo pedido|sin categorizar/i.test(n)) || (esBajoPedido(p) ? 'Bajo pedido' : 'Otros');
export const marketId = (p) => Number(meta(p)._cvd_market_item_id) || Number(String(p.sku || '').match(/^MK-(\d+)$/i)?.[1]) || null;
export const limpiaNombre = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/** ¿Se puede anunciar ahora? (publicado, con existencias, precio y foto). Para «Bajo pedido» además mira la bolsa. */
export function vendible(p, mercado = null) {
  if (!p || p.status !== 'publish') return 'no está publicado';
  if (!['simple', 'variable'].includes(p.type)) return `tipo ${p.type}`;
  if (p.stock_status !== 'instock') return 'agotado';
  if (!(Number(p.price) > 0)) return 'sin precio';
  if (!(p.images || []).length) return 'sin foto';
  if (esBajoPedido(p)) {
    if (mercado !== null && mercado !== 'publicado') return `en la bolsa está «${mercado || 'no existe'}»`;
  } else if (p.type === 'simple' && p.manage_stock && !(Number(p.stock_quantity) > 0)) return 'sin unidades';
  return null;
}

// ---------- texto de la foto ----------
// «🆕 *Nombre* / Precio: *X USD* / Ganas: *Y USD* por cada uno / Bajo pedido (24 h)». Nunca proveedor ni costo.
// Una línea de gancho arriba según el motivo (máx. 1 emoji); 🆕 solo para los recién llegados.
export function pie(p, item) {
  const c = commissionFor(p);
  const rango = p.type === 'variable' && /&ndash;|–/.test(String(p.price_html || '').replace(/<[^>]+>/g, ''));
  const desde = rango ? 'desde ' : '';
  const fija = String(meta(p)._cvd_commission_type || '').toLowerCase() === 'fixed';
  const antes = p.on_sale && Number(p.regular_price) > Number(p.price) ? ` (antes ${money(p.regular_price)})` : '';
  const lineas = [];
  if (item?.gancho) lineas.push(item.gancho);
  lineas.push(`${item?.motivo === 'nuevo' ? '🆕 ' : ''}*${limpiaNombre(p.name)}*`);
  lineas.push(`Precio: ${desde}*${money(p.price)} USD*${antes}`);
  if (Number(c.amount) > 0) lineas.push(`Ganas: ${rango && !fija ? 'desde ' : ''}*${money(c.amount)} USD* por cada uno`);
  if (esBajoPedido(p)) lineas.push('Bajo pedido (24 h)');
  else if (p.type === 'simple' && p.manage_stock && Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= 5) lineas.push(`Quedan ${p.stock_quantity} en tienda`);
  else lineas.push('Disponible en tienda');
  return lineas.join('\n');
}

// ---------- fotos ----------
let sharpMod = null;
async function sharp() { sharpMod ??= require('sharp'); return sharpMod; }
/** Foto principal de la web en caché (jpg, máx. 1080 px). null si no hay o es pequeña (< 400 px de lado menor). */
export async function foto(p, { preferida = null } = {}) {
  if (preferida && fs.existsSync(preferida) && fs.statSync(preferida).size > 8000) return preferida;
  const src = p.images?.[0]?.src;
  if (!src) return null;
  const file = path.join(FOTOS, `web-${p.id}-${crypto.createHash('sha1').update(src).digest('hex').slice(0, 8)}.jpg`);
  if (fs.existsSync(file) && fs.statSync(file).size > 8000) return file;
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'Mozilla/5.0 (Casa Viva novedades)' } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 8000) return null;
    const s = await sharp();
    const m = await s(buf).metadata();
    if (Math.min(m.width || 0, m.height || 0) < 400) return null;
    await s(buf).rotate().flatten({ background: '#ffffff' }).resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 84 }).toFile(file);
    return file;
  } catch { return null; }
}

// ---------- registro de anuncios ----------
export function leerEnviados() {
  if (!fs.existsSync(ENVIADOS)) return [];
  return fs.readFileSync(ENVIADOS, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}
/** crm_settings.value puede venir como texto JSON o como objeto. */
export const comoObjeto = (v) => { if (v && typeof v === 'object') return v; try { return JSON.parse(v || '{}') || {}; } catch { return {}; } };
export const apunta = (row) => fs.appendFileSync(ENVIADOS, JSON.stringify(row) + '\n');

/** Un proceso a la vez por archivo de cerrojo (10 min de caducidad). Devuelve la función para soltarlo o null. */
export function cerrojo(file, minutos = 10) {
  let fd;
  try { fd = fs.openSync(file, 'wx'); } catch {
    try { if (Date.now() - fs.statSync(file).mtimeMs < minutos * 60e3) return null; fs.unlinkSync(file); fd = fs.openSync(file, 'wx'); } catch { return null; }
  }
  return () => { try { fs.closeSync(fd); fs.unlinkSync(file); } catch { /* ya no está */ } };
}

/** Aviso privado a Ernesto por el buzón (la forma normal del bot). */
export async function avisaErnesto(body, createdBy = 'novedades') {
  const [row] = must(await db.from('crm_outbox').insert({ business_id: BIZ, to_phone: ERNESTO, kind: 'texto', body, status: 'pendiente', created_by: createdBy }).select('id'));
  return row.id;
}
