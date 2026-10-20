// Arma confirmados.json (lo que lee crear-productos.php) a partir de productos.json + respuestas.json.
// Se ejecuta EN EL VPS (usa las claves de /root/vivabot/.env solo para firmar las fotos del cubo «mercado»; no escribe nada):
//   cd /root/archivos/electro-2026-10-20 && node armar-confirmados.mjs            → escribe confirmados.json y un resumen
//   node armar-confirmados.mjs --sin-fotos                                         → sin enlaces de fotos (para probar)
// Las fotos van como enlaces firmados de Supabase válidos 7 días (como hace VivaBot al publicar): hay que crear los
// productos antes de que caduquen. Si caducan, se vuelve a ejecutar este script.
//
// respuestas.json (lo rellena Claude con lo que contesten Ricardo y LJH; ejemplo en respuestas.ejemplo.json):
// { "S": { "respondio": true, "quien": "Ricardo", "fecha": "2026-10-21 10:15",
//          "todo_ok": true,                       // contestó «todo ok» o solo dio cambios: lo no mencionado = confirmado
//          "cambios": { "7": { "agotado": true }, "12": { "precio": 380 } },   // por N.º del mensaje
//          "antiguos_si": [106, 108],             // de la lista «hace días que no los veo», solo los que dijo que sí
//          "garantia": "…", "recogida": "…", "comision": "…" },
//   "L": { … },
//   "incluir_respaldo": false }                   // true = publicar también el duplicado del otro proveedor
import fs from 'fs';
import { createRequire } from 'module';

const DIR = new URL('.', import.meta.url).pathname;
const prods = JSON.parse(fs.readFileSync(`${DIR}productos.json`, 'utf8'));
const resp = JSON.parse(fs.readFileSync(`${DIR}respuestas.json`, 'utf8'));
const sinFotos = process.argv.includes('--sin-fotos');
const maxArg = process.argv.indexOf('--max');
const MAX = maxArg > 0 ? Number(process.argv[maxArg + 1]) : Infinity; // --max 3 = solo los 3 primeros (para probar)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const myPrice = (c) => (c < 60 ? Math.ceil(c + Math.min(17, Math.max(5, c * 0.4))) : Math.ceil((c + Math.max(17, c > 300 ? c * 0.1 : 0)) / 5) * 5);
const share = (p, c) => Math.max(0, Math.round((p - c) * 0.4 * 100) / 100);
// Descripción para la web: el texto del proveedor SIN precios, transporte, garantía del proveedor ni teléfonos.
const cleanText = (t = '') => String(t)
  .split('\n')
  .filter((l) => !/(usd|cup|mlc|\$|precio|transporte|mensajer|garant|factura|oferta|rebaja|ahora en|responde a)/i.test(l))
  .map((l) => l.replace(/(\+?53)?[\s-]*\d[\d\s-]{6,}\d/g, '').replace(/@\w+|wa\.me\/\S+/gi, '').replace(/[*_~]/g, '').trim())
  .filter(Boolean).join('\n').slice(0, 1500);

function state(p) {
  const r = resp[p.clave_proveedor];
  if (!r?.respondio) return { ok: false, why: 'el proveedor no ha contestado' };
  const c = r.cambios?.[String(p.n)] || {};
  if (c.agotado) return { ok: false, why: 'agotado' };
  if (p.antiguo && !(r.antiguos_si || []).includes(p.n)) return { ok: false, why: 'antiguo sin «sí»' };
  if (!p.antiguo && !r.todo_ok && !c.precio && !c.si) return { ok: false, why: 'no dijo que sí' };
  if (p.moneda !== 'USD' && !c.precio) return { ok: false, why: 'precio en CUP sin precio en USD' };
  if (p.en_web.length) return { ok: false, why: `ya está en la web (${p.en_web.map((w) => w.product_id).join(', ')})` };
  return { ok: true, c, quien: `${r.quien || p.proveedor} ${r.fecha || ''}`.trim(), garantia: r.garantia };
}

const st = new Map(prods.map((p) => [p.sku, state(p)]));
// Duplicados entre proveedores: va el recomendado; si está agotado y el otro sí, va el otro.
const pick = (p) => {
  if (!p.par || resp.incluir_respaldo) return true;
  const other = prods.find((x) => x.sku === p.par.sku);
  if (p.par.recomendado) return true;
  return !st.get(other.sku).ok; // el otro (recomendado) no se puede → entra este
};

let db = null;
if (!sinFotos) {
  const require = createRequire('/root/vivabot/package.json');
  require('dotenv').config({ path: '/root/vivabot/.env' });
  const { createClient } = require('@supabase/supabase-js');
  db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
}

const out = [], fuera = [];
for (const p of prods) {
  const s = st.get(p.sku);
  if (!s.ok) { fuera.push(`${p.clave_proveedor} ${p.n}. ${p.sku} ${p.nombre}: ${s.why}`); continue; }
  if (!pick(p)) { fuera.push(`${p.clave_proveedor} ${p.n}. ${p.sku} ${p.nombre}: duplicado de ${p.par.sku} (respaldo)`); continue; }
  if (out.length >= MAX) break;
  const cost = Number(s.c.precio ?? p.precio_proveedor);
  const precio = s.c.precio_venta != null ? Number(s.c.precio_venta) : myPrice(cost);
  const fotos = [];
  if (db && p.fotos.length) {
    // Una sola llamada por producto, con pausa y 2 reintentos: el 20-oct, firmando foto a foto (~800 llamadas seguidas),
    // Supabase devolvió «Too many connections». No martillear la base que usa el bot.
    const paths = p.fotos.slice(0, 4).map((x) => x.replace(/^mercado\//, ''));
    for (let intento = 1; intento <= 3; intento++) {
      const { data, error } = await db.storage.from('mercado').createSignedUrls(paths, 7 * 24 * 3600);
      if (!error && data) { for (const d of data) if (d.signedUrl) fotos.push(d.signedUrl); break; }
      console.error('foto', p.sku, `intento ${intento}:`, error?.message);
      await sleep(3000 * intento);
    }
    await sleep(300);
  }
  const desc = [cleanText(p.texto_proveedor), s.c.garantia || s.garantia ? `Garantía: ${s.c.garantia || s.garantia}` : ''].filter(Boolean).join('\n\n');
  out.push({
    market_id: p.market_id, ids: p.ids, nombre: p.nombre, proveedor: p.clave_proveedor, n: p.n,
    precio_proveedor: cost, precio, comision: s.c.comision != null ? Number(s.c.comision) : share(precio, cost),
    precio_manual: s.c.precio_venta != null, departamentos: p.departamentos, descripcion: desc, fotos,
    confirmado: true, confirmado_por: s.quien,
  });
}
fs.writeFileSync(`${DIR}confirmados.json`, JSON.stringify({ generado: new Date().toISOString(), estado: 'draft', productos: out }, null, 1));
fs.writeFileSync(`${DIR}fuera.txt`, fuera.join('\n') + '\n');
console.log(`confirmados.json: ${out.length} productos (${out.filter((x) => x.proveedor === 'S').length} Sergio, ${out.filter((x) => x.proveedor === 'L').length} LJH) · fuera: ${fuera.length} (ver fuera.txt)`);
