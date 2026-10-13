// Fotos y fichas de la bolsa de Digital Store (crm_market_items) a escala, para que Ernesto apruebe por hojas.
// NO publica nada, NO cambia el estado (status) y NO envía mensajes. Solo rellena photos_clean, photos_quality,
// photos_ok, title y description de artículos en estado «nuevo». Publicar = APRUEBA en el chat «Tú» (catalog.js).
//
// Corre en el VPS:  cd /root/vivabot && node scripts/fotos-bolsa/fotos-bolsa.mjs <fase> [--limite N] [--ids 1,2]
// Fases (en orden; cada una se puede repetir, guarda su progreso por artículo y sigue donde se quedó):
//   preparar   filas «nuevo» de Digital Store + catálogo del proveedor → items.json (con prioridad)
//   bajar      fotos del proveedor → <id>/orig/, descarta < 400 px y repetidas → <id>/fotos.json
//   auditar    1 consulta de visión (gpt-4.1-mini) por artículo con todas sus fotos → <id>/audit.json
//   normalizar elige 1–4 fotos (nota >= 7 y reglas), 1200×1200 blanco, 8 % margen, aviso de borde → <id>/norm.json
//   textos     título y descripción SEO en español (solo datos del proveedor) → <id>/texto.json
//   subir      sube a Storage (mercado/<biz>/<id>/limpia-N.jpg) y rellena la fila (sin tocar status) → <id>/subido.json
//   bloquear   en los que no pasan, photos_quality = {bloqueado: "falta foto real" | "falta foto buena", …} (solo si estaba vacío)
//   minis      miniaturas para las hojas de aprobación + hojas-datos.json (las hojas se dibujan en Windows)
//   web-candidatos   artículos con marca y modelo sin foto buena → web-candidatos.json
//   web-bajar <fuentes.json>   baja imágenes de páginas oficiales/tiendas grandes → <id>/web/
//   auditar --web · normalizar (usa web si el proveedor no sirve)
//   estado     resumen y gasto de OpenAI
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

sharp.concurrency(1);
const BIZ = '8771c6ed-9dbf-497d-b3df-be6697ba2693';
const BUCKET = 'mercado';
const BASE = process.env.FB_BASE || '/root/archivos/fotos-bolsa';
const CATALOGO = process.env.FB_CATALOGO || '/root/archivos/digital-store-catalogo-2026-10-12.json';
const SELLER = 'Digital Store (Kevin)';
const MODEL = 'gpt-4.1-mini';
const PRICE = { in: 0.40 / 1e6, cached: 0.10 / 1e6, out: 1.60 / 1e6 }; // gpt-4.1-mini, USD por token
const BUDGET_USD = Number(process.env.FB_BUDGET || 7.5);
const MAX_FOTOS = 8, MIN_LADO = 400, MIN_LADO_WEB = 500;
const LADO = 1200, MARGEN = 0.08, CAJA = Math.round(LADO * (1 - 2 * MARGEN));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const SENSIBLES = /juguetes sexuales/i; // no van a la web de Casa Viva sin que Ernesto lo diga

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const [cmd, ...args] = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes('--' + k);
const LIMITE = Number(opt('limite', 0)) || Infinity;
const SOLO = opt('ids', '') ? new Set(opt('ids').split(',').map(Number)) : null;
const CONC = Number(opt('conc', 4));

// ---------- utilidades ----------
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const P = (...a) => path.join(BASE, ...a.map(String));
const leer = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const guardar = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f + '.tmp', JSON.stringify(o, null, 1)); fs.renameSync(f + '.tmp', f); };
const sinEmojis = (s = '') => String(s).replace(/\p{Extended_Pictographic}|\u{FE0F}|\u{200D}|[\u{1F1E6}-\u{1F1FF}]/gu, '').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
const norm = (s = '') => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();
const tapar = (s = '') => String(s).replace(/sk-[A-Za-z0-9_\-*]{6,}/g, 'sk-***');
async function pool(lista, n, fn) {
  let i = 0; const res = [];
  await Promise.all(Array.from({ length: Math.min(n, lista.length) }, async () => { while (i < lista.length) { const k = i++; res[k] = await fn(lista[k], k); } }));
  return res;
}
function items() {
  let l = leer(P('items.json'), []);
  if (SOLO) l = l.filter((x) => SOLO.has(x.id));
  return l.slice(0, LIMITE);
}

// ---------- gasto de OpenAI ----------
let gastoCache = null;
function gasto() {
  if (gastoCache) return gastoCache;
  gastoCache = { usd: 0, in: 0, cached: 0, out: 0, llamadas: 0 };
  if (fs.existsSync(P('uso.jsonl'))) for (const l of fs.readFileSync(P('uso.jsonl'), 'utf8').split('\n').filter(Boolean)) {
    const u = JSON.parse(l); gastoCache.usd += u.usd; gastoCache.in += u.in; gastoCache.cached += u.cached; gastoCache.out += u.out; gastoCache.llamadas++;
  }
  return gastoCache;
}
class Parar extends Error {}
async function openai(body, etiqueta) {
  for (let intento = 1; intento <= 6; intento++) {
    if (gasto().usd >= BUDGET_USD) throw new Parar(`presupuesto de ${BUDGET_USD} USD alcanzado`);
    let res, d;
    try {
      res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: AbortSignal.timeout(150e3),
      });
      d = await res.json().catch(() => ({}));
    } catch (e) { if (intento === 6) throw new Error('OpenAI red: ' + e.message); await sleep(3000 * intento); continue; }
    if (res.status === 429) {
      const m = `${d?.error?.code || ''} ${d?.error?.type || ''} ${d?.error?.message || ''}`;
      if (/insufficient_quota|billing|exceeded your current quota/i.test(m)) throw new Parar('OpenAI 429 sin saldo (insufficient_quota): ' + tapar(m).slice(0, 160));
      const espera = Number(res.headers.get('retry-after-ms')) || Number(res.headers.get('retry-after')) * 1000 || 4000 * intento;
      await sleep(Math.min(Math.max(espera, 1000), 60e3)); continue;
    }
    if (res.status >= 500) { await sleep(3000 * intento); continue; }
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}: ${tapar(d?.error?.message || '').slice(0, 200)}`);
    const u = d.usage || {};
    const cached = u.prompt_tokens_details?.cached_tokens || 0;
    const reg = { t: new Date().toISOString(), etiqueta, in: u.prompt_tokens || 0, cached, out: u.completion_tokens || 0 };
    reg.usd = +(((reg.in - cached) * PRICE.in) + cached * PRICE.cached + reg.out * PRICE.out).toFixed(6);
    fs.appendFileSync(P('uso.jsonl'), JSON.stringify(reg) + '\n');
    const g = gasto(); g.usd += reg.usd; g.in += reg.in; g.cached += cached; g.out += reg.out; g.llamadas++;
    return d;
  }
  throw new Error('OpenAI: demasiados reintentos');
}

// ---------- prioridad (atractivo para el comprador cubano) ----------
function prioridad(p, precio) {
  const sub = norm(p.subcategoria || ''), cat = norm(p.categoria || ''), n = norm(p.nombre || '');
  const acc = !/cargadores portatiles/.test(sub) && /\b(cable|cables|cargador|forro|funda|mica|soporte|adaptador|estuche|correa|lapiz|protector de pantalla|tripode|conector)\b/.test(n);
  let s = 0;
  if (/estacion de energia|power station|ecoflow|bluetti|anker solix|panel solar|inversor|lifepo4|planta electrica|generador/.test(n)) s = 100;
  else if (/\b(nevera|refrigerador|frigorifico|freezer|congelador|split|aire acondicionado|lavadora|microondas|freidora|olla|arrocera|cafetera|licuadora|batidora|ventilador|cocina|hornilla|horno|plancha|exprimidor|tostadora|sandwichera|hervidor)\b/.test(n)) s = 96;
  else if (/celulares y tablets/.test(sub)) s = 94;
  else if (/protector de voltaje|\bups\b|power bank|bateria|lampara recargable|bombillo recargable|luz solar|reflector solar/.test(n)) s = 90;
  const subs = [
    [/generadores electricos|protectores de voltaje/, 95], [/electrodomesticos|frigorificos|neveras de exhibicion|refrigeracion/, 93],
    [/celulares y tablets/, 92], [/batidoras y licuadoras/, 92], [/cargadores portatiles y baterias/, 85], [/^hogar$|utiles del hogar/, 80],
    [/iluminacion y luces|luminarias/, 78], [/laptops nuevas|laptop grado a/, 84], [/^gaming$/, 82], [/pc y perifericos/, 70],
    [/smartwatch/, 68], [/audifonos bluetooth|bocinas/, 67], [/herramientas|^vehiculos$/, 66], [/impresoras/, 60],
    [/discos|memorias usb|red y conectividad/, 55], [/belleza|higiene|relojeria|mochilas/, 52], [/accesorios|adaptadores|cables|hub y regletas|audifonos de cable/, 45],
    [/juguetes|coleccionables|deportiv|entrenamiento|creacion de contenido|instrumentos/, 45], [/insumos desechables|estantes comerciales|muebles/, 35],
  ];
  let t = 40;
  for (const [re, v] of subs) if (re.test(sub)) { t = v; break; }
  if (/electrodomesticos y hogar/.test(cat) && t < 80) t = 80;
  const tier = acc ? Math.min(Math.max(s, t), 60) : Math.max(s, t);
  return tier * 10000 + Math.min(9999, Math.round(Number(precio) || 0));
}

// ---------- fase preparar ----------
async function preparar() {
  const cat = JSON.parse(fs.readFileSync(CATALOGO, 'utf8'));
  const porId = new Map(cat.productos.map((p) => [p.id, p]));
  const filas = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('crm_market_items').select('id,status,norm_key,title,description,category,my_price,supplier_price,currency')
      .eq('business_id', BIZ).eq('seller_name', SELLER).eq('status', 'nuevo').order('id').range(from, from + 999);
    if (error) throw new Error(error.message);
    filas.push(...data); if (data.length < 1000) break;
  }
  const out = [], fuera = {};
  for (const r of filas) {
    const p = porId.get(String(r.norm_key || '').replace(/^ds:/, ''));
    const motivo = !p ? 'no está en el catálogo' : p.categoria === 'PRODUCTOS AGOTADOS' ? 'agotado' : p.disponible === false || !p.activo ? 'no disponible'
      : SENSIBLES.test(p.subcategoria || '') ? 'categoría sensible' : !(p.imagenes?.length || p.imagenUrl) ? 'sin fotos' : null;
    if (motivo) { (fuera[motivo] ||= []).push(r.id); continue; }
    out.push({
      id: r.id, ds_id: p.id, nombre: sinEmojis(p.nombre), categoria: p.categoria, subcategoria: p.subcategoria || '', calidad: p.calidad || 'nuevo',
      descripcion: sinEmojis(p.descripcion || ''), imagenes: (p.imagenes?.length ? p.imagenes : [p.imagenUrl]).filter(Boolean).slice(0, MAX_FOTOS),
      my_price: r.my_price, supplier_price: r.supplier_price, currency: r.currency, title: r.title, description: r.description, category: r.category,
      prioridad: prioridad(p, r.my_price),
    });
  }
  out.sort((a, b) => b.prioridad - a.prioridad);
  guardar(P('items.json'), out);
  guardar(P('fuera.json'), fuera);
  console.log(JSON.stringify({ filas: filas.length, elegibles: out.length, fuera: Object.fromEntries(Object.entries(fuera).map(([k, v]) => [k, v.length])) }));
}

// ---------- fase bajar ----------
async function bajarUrl(url, headers = {}) {
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA, ...headers }, signal: AbortSignal.timeout(45e3), redirect: 'follow' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) { if (i === 3) throw e; await sleep(1500 * i); }
  }
}
async function dhash(buf) {
  const px = await sharp(buf).rotate().flatten({ background: '#ffffff' }).greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  let bits = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += px[y * 9 + x] > px[y * 9 + x + 1] ? '1' : '0';
  return bits;
}
const hamming = (a, b) => { let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++; return d; };

async function medirYFiltrar(lista, minLado) {
  // lista: [{archivo, buf, url}] → marca estado ok / pequeña / repetida
  const vistos = [];
  for (const f of lista) {
    if (f.estado) continue;
    try {
      const m = await sharp(f.buf).metadata();
      const girada = (m.orientation || 1) >= 5;
      const w = girada ? m.height : m.width, h = girada ? m.width : m.height;
      Object.assign(f, { w, h, formato: m.format, kb: Math.round(f.buf.length / 1024), md5: crypto.createHash('md5').update(f.buf).digest('hex') });
      if (Math.min(w, h) < minLado) { f.estado = 'pequeña'; f.motivo = `lado corto ${Math.min(w, h)} px`; continue; }
      f.dh = await dhash(f.buf);
      const igual = vistos.find((v) => v.md5 === f.md5 || hamming(v.dh, f.dh) <= 5);
      if (igual) {
        // se queda la más grande
        if (w * h > igual.w * igual.h) { igual.estado = 'repetida'; igual.motivo = `igual que ${f.archivo}`; vistos.splice(vistos.indexOf(igual), 1, f); f.estado = 'ok'; }
        else { f.estado = 'repetida'; f.motivo = `igual que ${igual.archivo}`; }
        continue;
      }
      f.estado = 'ok'; vistos.push(f);
    } catch (e) { f.estado = 'error'; f.motivo = 'no es imagen: ' + e.message.slice(0, 60); }
  }
  return lista.map(({ buf, ...r }) => r);
}

async function bajar() {
  const l = items();
  let hechos = 0, fotos = 0, ok = 0;
  await pool(l, CONC + 2, async (it) => {
    if (fs.existsSync(P(it.id, 'fotos.json')) && !flag('otra')) { hechos++; return; }
    const dir = P(it.id, 'orig'); fs.mkdirSync(dir, { recursive: true });
    const lista = [];
    for (const [i, url] of it.imagenes.entries()) {
      const ext = ((url.split('?')[0].split('.').pop() || 'jpg').toLowerCase().replace('jpeg', 'jpg')).slice(0, 4);
      const archivo = `${String(i + 1).padStart(2, '0')}.${/^(jpg|png|webp|avif|gif)$/.test(ext) ? ext : 'jpg'}`;
      const f = path.join(dir, archivo);
      try {
        const buf = fs.existsSync(f) ? fs.readFileSync(f) : await bajarUrl(url);
        if (!fs.existsSync(f)) fs.writeFileSync(f, buf);
        lista.push({ archivo: 'orig/' + archivo, url, buf });
      } catch (e) { lista.push({ archivo: 'orig/' + archivo, url, estado: 'error', motivo: e.message.slice(0, 80) }); }
    }
    const res = await medirYFiltrar(lista, MIN_LADO);
    guardar(P(it.id, 'fotos.json'), res);
    hechos++; fotos += res.length; ok += res.filter((x) => x.estado === 'ok').length;
    if (hechos % 50 === 0) console.log(`bajar ${hechos}/${l.length}`);
  });
  console.log(JSON.stringify({ articulos: hechos, fotos, utiles: ok }));
}

// ---------- fase auditar (visión) ----------
const SISTEMA_AUDIT = `Eres el revisor de fotos de producto de una tienda online cubana (Casa Viva). Recibes el NOMBRE, la CATEGORÍA y la DESCRIPCIÓN
de un producto y sus fotos numeradas (1..N). Para cada foto decide:
- si muestra ESTE producto (mismo modelo, color y versión que el nombre/descripción),
- si tiene texto añadido encima (títulos, frases publicitarias, flechas, medidas, insignias, precio, teléfono), logo de tienda, marca de agua, o es un collage/infografía.
  La marca o el modelo impresos en el PROPIO producto o en su pantalla NO cuentan como texto ni logo.
- si el fondo es blanco liso, si el producto sale entero (no cortado por el borde) y nítido,
- si enseña cosas que la descripción no dice que vienen (caja, juego, funda, auriculares, otros productos, personas).
Nota 0-10: 9-10 foto de catálogo perfecta; 7-8 buena con un fallo menor que se arregla recortando;
5-6 se entiende pero no sirve de principal; 0-4 no sirve. Producto equivocado = 0. Foto de ambiente, con personas o fondo de color = 6 como máximo.
uso: "principal" (solo una, la mejor con nota >= 7), "galeria" (nota >= 7, ángulo distinto de la principal, máx. 3),
"descartar" (resto). Si ninguna llega a 7, necesita_web = true salvo que el producto sea genérico sin marca.
es_generico = true si el producto no tiene marca y modelo concretos que permitan encontrar la foto oficial.
marca y modelo: solo si salen en el nombre/descripción o impresos claramente en el producto; si no, null.
busqueda: texto para buscar la foto oficial (marca + modelo + variante), o null.
avisos: problemas para el dueño (fotos de otro producto/color/versión, la descripción no cuadra con las fotos, etc.).
Responde solo con el JSON pedido. Motivos en español sencillo, máximo 15 palabras.`;

const ESQUEMA_AUDIT = {
  type: 'json_schema',
  json_schema: {
    name: 'auditoria_fotos', strict: true,
    schema: {
      type: 'object', additionalProperties: false,
      required: ['fotos', 'foto_principal', 'necesita_web', 'es_generico', 'marca', 'modelo', 'busqueda', 'avisos'],
      properties: {
        fotos: { type: 'array', items: { type: 'object', additionalProperties: false,
          required: ['n', 'es_el_producto', 'color_ok', 'fondo', 'texto_encima', 'logo_o_marca_de_agua', 'collage', 'cortado', 'borrosa', 'extras_no_incluidos', 'nota', 'uso', 'motivo'],
          properties: {
            n: { type: 'integer' }, es_el_producto: { type: 'string', enum: ['si', 'no', 'dudoso'] }, color_ok: { type: 'string', enum: ['si', 'no', 'no_se_sabe'] },
            fondo: { type: 'string', enum: ['blanco', 'claro_liso', 'color', 'negro', 'escena'] }, texto_encima: { type: 'boolean' }, logo_o_marca_de_agua: { type: 'boolean' },
            collage: { type: 'boolean' }, cortado: { type: 'boolean' }, borrosa: { type: 'boolean' }, extras_no_incluidos: { type: 'boolean' },
            nota: { type: 'integer' }, uso: { type: 'string', enum: ['principal', 'galeria', 'descartar'] }, motivo: { type: 'string' },
          } } },
        foto_principal: { type: ['integer', 'null'] }, necesita_web: { type: 'boolean' }, es_generico: { type: 'boolean' },
        marca: { type: ['string', 'null'] }, modelo: { type: ['string', 'null'] }, busqueda: { type: ['string', 'null'] },
        avisos: { type: 'array', items: { type: 'string' } },
      },
    },
  },
};

// Segunda vuelta (v2) para los que no pasaron teniendo alguna foto de 7 o más: la IA tiene que DECIR qué texto añadido
// y qué cosas de más ve. Si no lo puede decir, no cuenta (en la v1 marcaba «extras» hasta cuando faltaba el mouse).
const SISTEMA_AUDIT2 = SISTEMA_AUDIT + `
ATENCIÓN, definiciones exactas:
- texto_que_se_ve: copia el texto AÑADIDO a la foto (rótulos, frases, cifras de anuncio, insignias tipo "Designed for", "Best seller", flechas con medidas).
  Deja "" si solo se ve texto impreso en el propio producto, su pantalla o display encendido, sus botones o su etiqueta de fábrica. Si es "", texto_encima = false.
- extras_que_se_ven: nombra los objetos que se ven y que NO son parte del producto ni la descripción dice que vienen (ej. "un móvil", "una mano", "auriculares", "caja de un juego").
  Si la descripción dice que incluye algo (mouse, receptor USB, cable, baquetas, mando), verlo NO es extra. Que FALTE algo en la foto NO es extra.
  La caja original del producto es extra solo si la descripción no la menciona. Si no hay extras, deja "" y extras_no_incluidos = false.`;
const ESQUEMA_AUDIT2 = JSON.parse(JSON.stringify(ESQUEMA_AUDIT));
{
  const it = ESQUEMA_AUDIT2.json_schema.schema.properties.fotos.items;
  it.required.push('texto_que_se_ve', 'extras_que_se_ven');
  it.properties.texto_que_se_ve = { type: 'string' };
  it.properties.extras_que_se_ven = { type: 'string' };
  ESQUEMA_AUDIT2.json_schema.name = 'auditoria_fotos_v2';
}
const auditDe = (id) => leer(P(id, 'audit-v2.json')) || leer(P(id, 'audit.json'));

async function paraIA(file) {
  return (await sharp(file).rotate().flatten({ background: '#ffffff' }).resize(768, 768, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer()).toString('base64');
}

async function auditarUno(it, web, v2 = false) {
  const destino = P(it.id, web ? 'audit-web.json' : v2 ? 'audit-v2.json' : 'audit.json');
  if (fs.existsSync(destino) && !flag('otra')) return 'hecho';
  const fotos = (leer(P(it.id, web ? 'web/fuentes.json' : 'fotos.json'), []) || []).filter((f) => f.estado === 'ok');
  if (!fotos.length) { guardar(destino, { sin_fotos: true, fecha: new Date().toISOString() }); return 'sin_fotos'; }
  const content = [{ type: 'text', text: `NOMBRE: ${it.nombre}\nCATEGORÍA: ${it.categoria} / ${it.subcategoria}\nESTADO: ${it.calidad}\nDESCRIPCIÓN: ${it.descripcion.slice(0, 700)}\nFOTOS: ${fotos.length} (${fotos.map((f, i) => `${i + 1}: ${f.w}x${f.h}`).join(', ')})` }];
  // fotos de internet: la mejor foto del proveedor va antes como REFERENCIA (mismo modelo y color), sin puntuarla
  if (web) {
    const ref = (leer(P(it.id, 'norm.json'))?.evaluadas || []).filter((e) => e.archivo && fs.existsSync(P(it.id, e.archivo))).sort((a, b) => b.nota - a.nota)[0];
    if (ref) {
      content.push({ type: 'text', text: 'REFERENCIA: esta primera imagen es una foto del PROVEEDOR (lo que de verdad se vende). NO la puntúes ni la cuentes. Úsala para comprobar que las fotos de internet que vienen después (numeradas desde 1) son el MISMO modelo, versión y color.' });
      content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${await paraIA(P(it.id, ref.archivo))}`, detail: 'low' } });
      content.push({ type: 'text', text: `FOTOS DE INTERNET A REVISAR: ${fotos.length}` });
    }
  }
  for (const f of fotos) content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${await paraIA(P(it.id, f.archivo))}`, detail: 'high' } });
  const usarV2 = v2 || web;
  const d = await openai({ model: MODEL, temperature: 0, max_tokens: 2200, response_format: usarV2 ? ESQUEMA_AUDIT2 : ESQUEMA_AUDIT, messages: [{ role: 'system', content: usarV2 ? SISTEMA_AUDIT2 : SISTEMA_AUDIT }, { role: 'user', content }] }, `audit${web ? '-web' : v2 ? '-v2' : ''}:${it.id}`);
  const r = JSON.parse(d.choices[0].message.content);
  for (const f of r.fotos) {
    f.nota = Math.max(0, Math.min(10, Number(f.nota) || 0));
    // la regla manda sobre la IA: sin texto o extras concretos, no hay fallo
    if (usarV2) { if (!String(f.texto_que_se_ve || '').trim()) f.texto_encima = false; if (!String(f.extras_que_se_ven || '').trim()) f.extras_no_incluidos = false; }
  }
  guardar(destino, { modelo: MODEL, fecha: new Date().toISOString(), enviadas: fotos.map((f) => f.archivo), respuesta: r, usage: d.usage });
  return 'ok';
}

async function auditar() {
  const web = flag('web'), v2 = flag('v2');
  let l = items();
  if (web) l = l.filter((it) => fs.existsSync(P(it.id, 'web/fuentes.json')));
  if (v2) l = l.filter((it) => { const n = leer(P(it.id, 'norm.json')); return n && n.estado !== 'listo' && n.evaluadas.some((e) => e.nota >= 7); });
  console.log(`auditar${web ? ' web' : ''}${v2 ? ' v2' : ''}: ${l.length} artículos`);
  const cuenta = {}; let parar = null;
  await pool(l, CONC, async (it, k) => {
    if (parar) return;
    try { const r = await auditarUno(it, web, v2); cuenta[r] = (cuenta[r] || 0) + 1; }
    catch (e) { if (e instanceof Parar) { parar = e.message; return; } cuenta.error = (cuenta.error || 0) + 1; console.log('error audit', it.id, tapar(e.message).slice(0, 160)); }
    if ((k + 1) % 25 === 0) console.log(`auditar ${k + 1}/${l.length} · ${gasto().usd.toFixed(3)} USD`);
  });
  console.log(JSON.stringify({ ...cuenta, gasto_usd: +gasto().usd.toFixed(4), parar }));
  if (parar) process.exitCode = 3;
}

// ---------- fase normalizar ----------
async function esquinas(buf, w, h) {
  const p = Math.max(6, Math.round(Math.min(w, h) * 0.02));
  const out = [];
  // OJO: sharp.stats() ignora extract(); se calculan a mano sobre los píxeles del parche.
  for (const [left, top] of [[0, 0], [w - p, 0], [0, h - p], [w - p, h - p]]) {
    const { data, info } = await sharp(buf).extract({ left, top, width: p, height: p }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const c = info.channels, n = data.length / c;
    const m = [0, 0, 0], q = [0, 0, 0];
    for (let i = 0; i < data.length; i += c) for (let k = 0; k < 3; k++) { const v = data[i + Math.min(k, c - 1)]; m[k] += v; q[k] += v * v; }
    const media = m.map((x) => x / n), desv = q.map((x, k) => Math.sqrt(Math.max(0, x / n - media[k] ** 2)));
    out.push({ media: (media[0] + media[1] + media[2]) / 3, desv: Math.max(...desv), sat: Math.max(...media) - Math.min(...media) });
  }
  return out;
}

// Fondo a blanco puro: relleno desde los bordes por los píxeles casi blancos (degradados y sombras suaves del estudio),
// sin tocar el producto. Devuelve también qué parte del borde de la foto era fondo (0–1).
async function limpiarFondo(png) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H, C = info.channels;
  // rayas finas de marco en el borde de la foto: se pintan de blanco si justo dentro hay fondo
  const d = Math.max(2, Math.round(Math.min(W, H) * 0.006));
  const cand = (i) => { const r = data[i * C], g = data[i * C + 1], b = data[i * C + 2]; const lo = Math.min(r, g, b); return lo >= 226 && Math.max(r, g, b) - lo <= 16; };
  const pinta = (i) => { data[i * C] = data[i * C + 1] = data[i * C + 2] = 255; };
  for (let x = 0; x < W; x++) {
    if (cand(d * W + x)) for (let y = 0; y < d; y++) pinta(y * W + x);
    if (cand((H - 1 - d) * W + x)) for (let y = H - d; y < H; y++) pinta(y * W + x);
  }
  for (let y = 0; y < H; y++) {
    if (cand(y * W + d)) for (let x = 0; x < d; x++) pinta(y * W + x);
    if (cand(y * W + W - 1 - d)) for (let x = W - d; x < W; x++) pinta(y * W + x);
  }
  const mn = new Uint8Array(N), sat = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const r = data[i * C], g = data[i * C + 1], b = data[i * C + 2];
    const lo = Math.min(r, g, b), hi = Math.max(r, g, b); mn[i] = lo; sat[i] = hi - lo;
  }
  const fondo = (i) => mn[i] >= 226 && sat[i] <= 16;
  const mask = new Uint8Array(N), q = new Int32Array(N);
  let h = 0, t = 0;
  // el relleno solo avanza por cambios suaves (degradado del estudio); en el contorno de un producto blanco
  // hay un salto de luz y ahí se para, para no «comerse» neveras, ollas o calentadores blancos
  const push = (i, j) => { if (!mask[i] && fondo(i) && (j < 0 || Math.abs(mn[i] - mn[j]) <= 6)) { mask[i] = 1; q[t++] = i; } };
  for (let x = 0; x < W; x++) { push(x, -1); push((H - 1) * W + x, -1); }
  for (let y = 0; y < H; y++) { push(y * W, -1); push(y * W + W - 1, -1); }
  while (h < t) {
    const i = q[h++], x = i % W;
    if (x > 0) push(i - 1, i); if (x < W - 1) push(i + 1, i); if (i >= W) push(i - W, i); if (i < N - W) push(i + W, i);
  }
  let nb = 0;
  const lado = { arriba: 0, abajo: 0, izquierda: 0, derecha: 0 };
  // el contacto se mide a 2 px del borde (las rayas finas del marco ya se pintaron de blanco arriba):
  // así un marco blanco de 1 px no esconde un producto recortado al ras
  const e = 2;
  for (let x = 0; x < W; x++) {
    nb += Math.max(mask[x], mask[d * W + x]) + Math.max(mask[(H - 1) * W + x], mask[(H - 1 - d) * W + x]);
    lado.arriba += 1 - mask[e * W + x]; lado.abajo += 1 - mask[(H - 1 - e) * W + x];
  }
  for (let y = 0; y < H; y++) {
    nb += Math.max(mask[y * W], mask[y * W + d]) + Math.max(mask[y * W + W - 1], mask[y * W + W - 1 - d]);
    lado.izquierda += 1 - mask[y * W + e]; lado.derecha += 1 - mask[y * W + W - 1 - e];
  }
  // qué parte de cada lado de la foto ocupa el producto (si es mucha, está cortado)
  const contacto = {};
  for (const k of Object.keys(lado)) contacto[k] = lado[k] / (k === 'arriba' || k === 'abajo' ? W : H);
  // recorte al producto: caja de lo que NO es fondo (filas/columnas con al menos 2 píxeles de producto)
  const filas = new Int32Array(H), cols = new Int32Array(W);
  for (let i = 0; i < N; i++) if (!mask[i]) { filas[(i / W) | 0]++; cols[i % W]++; }
  let y0 = 0, y1 = H - 1, x0 = 0, x1 = W - 1;
  while (y0 < H && filas[y0] < 2) y0++;
  while (y1 > y0 && filas[y1] < 2) y1--;
  while (x0 < W && cols[x0] < 2) x0++;
  while (x1 > x0 && cols[x1] < 2) x1--;
  if (y0 >= H || x0 >= W) return { vacio: true, bordeFondo: nb / (2 * W + 2 * H), contacto };
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const out = Buffer.alloc(cw * ch * 3);
  // aclarado continuo (sin escalones): el fondo casi blanco pasa a blanco poco a poco según lo claro que es,
  // y cerca del borde del recorte pasa a blanco del todo (para que no se vea un rectángulo sobre el blanco puro)
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * W + x, o = ((y - y0) * cw + (x - x0)) * 3;
    let w = 0;
    if (mask[i]) {
      w = Math.min(1, Math.max(0, (mn[i] - 222) / 22));
      const dist = Math.min(x - x0, x1 - x, y - y0, y1 - y);
      w = Math.max(w, Math.min(1, Math.max(0, 1 - dist / 12)));
    } else if (mn[i] >= 205 && sat[i] <= 20) {
      const junto = (x > 0 && mask[i - 1]) || (x < W - 1 && mask[i + 1]) || (y > 0 && mask[i - W]) || (y < H - 1 && mask[i + W]);
      if (junto) w = mn[i] >= 236 ? 0.5 : 0.25;
    }
    for (let k = 0; k < 3; k++) { const v = data[i * C + k]; out[o + k] = Math.round(v + (255 - v) * w); }
  }
  return {
    buf: await sharp(out, { raw: { width: cw, height: ch, channels: 3 } }).png().toBuffer(),
    bordeFondo: nb / (2 * W + 2 * H), contacto, caja: { x0, y0, x1, y1, w: cw, h: ch },
  };
}

async function normalizarFoto(src, dst) {
  let buf = await sharp(src).rotate().flatten({ background: '#ffffff' }).toColourspace('srgb').png().toBuffer();
  const meta = await sharp(buf).metadata();
  const W = meta.width, H = meta.height;
  const esq = await esquinas(buf, W, H);
  const medias = esq.map((e) => e.media).sort((a, b) => a - b);
  const bg = (medias[1] + medias[2]) / 2;
  let a = 1;
  if (bg >= 225 && bg < 254.5) { a = 255 / bg; buf = await sharp(buf).linear([a, a, a], [0, 0, 0]).png().toBuffer(); }
  const blancas = esq.filter((e) => e.media * a >= 245 && e.desv < 8 && e.sat < 10).length;
  const limpio = await limpiarFondo(buf);
  if (blancas < 2 && limpio.bordeFondo < 0.5) return { ok: false, motivo: 'fondo no blanco', origen: `${W}x${H}`, fondo: Math.round(bg) };
  if (limpio.bordeFondo < 0.3) return { ok: false, motivo: `fondo no blanco (solo ${Math.round(limpio.bordeFondo * 100)} % del borde es fondo)`, origen: `${W}x${H}`, fondo: Math.round(bg) };
  const [ladoMax, contactoMax] = Object.entries(limpio.contacto).sort((x, y) => y[1] - x[1])[0];
  if (contactoMax >= 0.12) return { ok: false, motivo: `producto cortado por el borde (${ladoMax}, ${Math.round(contactoMax * 100)} % del lado)`, origen: `${W}x${H}` };
  if (limpio.vacio) return { ok: false, motivo: 'no se encuentra el producto', origen: `${W}x${H}` };
  const recorte = limpio.buf, cj = limpio.caja;
  const info = { width: cj.w, height: cj.h };
  const tocaBorde = contactoMax > 0.004 || cj.x0 <= 1 || cj.y0 <= 1 || cj.x1 >= W - 2 || cj.y1 >= H - 2;
  if (info.width < 60 || info.height < 60) return { ok: false, motivo: 'no se encuentra el producto', origen: `${W}x${H}` };
  const escala = Math.min(CAJA / info.width, CAJA / info.height);
  if (escala > 2.0) return { ok: false, motivo: `muy pequeña (habría que ampliar ${escala.toFixed(1)}×)`, origen: `${W}x${H}`, escala: +escala.toFixed(2) };
  let r = sharp(recorte).resize(Math.round(info.width * escala), Math.round(info.height * escala), { kernel: 'lanczos3' });
  if (escala > 1.1) r = r.sharpen({ sigma: Math.min(1.2, 0.5 + 0.35 * (escala - 1)) });
  const prod = await r.png().toBuffer();
  const pm = await sharp(prod).metadata();
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  await sharp({ create: { width: LADO, height: LADO, channels: 3, background: '#ffffff' } })
    .composite([{ input: prod, left: Math.round((LADO - pm.width) / 2), top: Math.round((LADO - pm.height) / 2) }])
    .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(dst);
  return { ok: true, origen: `${W}x${H}`, fondo: Math.round(bg), esquinas_blancas: blancas, producto: `${info.width}x${info.height}`, escala: +escala.toFixed(2), tocaBorde, contacto: +contactoMax.toFixed(3), lado: tocaBorde ? ladoMax : undefined, ampliada: escala > 1.8 };
}

function reglas(f) {
  const m = [];
  if (f.nota < 7) m.push(`nota ${f.nota}`);
  if (f.es_el_producto !== 'si') m.push(f.es_el_producto === 'no' ? 'otro producto' : 'producto dudoso');
  if (f.color_ok === 'no') m.push('otro color');
  if (f.texto_encima) m.push('texto encima');
  if (f.logo_o_marca_de_agua) m.push('logo o marca de agua');
  if (f.collage) m.push('collage');
  if (f.cortado) m.push('cortado');
  if (f.borrosa) m.push('borrosa');
  if (f.extras_no_incluidos) m.push('enseña cosas que no vienen');
  if (!['blanco', 'claro_liso'].includes(f.fondo)) m.push('fondo ' + f.fondo);
  return m;
}

async function elegir(it, fuente) {
  const audit = fuente === 'web' ? leer(P(it.id, 'audit-web.json')) : auditDe(it.id);
  if (!audit?.respuesta) return { fotos: [], evaluadas: [], audit };
  const r = audit.respuesta;
  const lista = r.fotos.map((f) => ({ ...f, archivo: audit.enviadas[f.n - 1] })).filter((f) => f.archivo);
  const meta = leer(P(it.id, fuente === 'web' ? 'web/fuentes.json' : 'fotos.json'), []);
  const cand = lista.filter((f) => !reglas(f).length).sort((a, b) => (b.n === r.foto_principal) - (a.n === r.foto_principal) || (b.uso === 'principal') - (a.uso === 'principal') || b.nota - a.nota);
  const evaluadas = lista.map((f) => ({ n: f.n, archivo: f.archivo, url: meta.find((m) => m.archivo === f.archivo)?.url, pagina: meta.find((m) => m.archivo === f.archivo)?.pagina, nota: f.nota, motivo: f.motivo, fallos: reglas(f) }));
  const fotos = [];
  const dir = P(it.id, fuente === 'web' ? 'final-web' : 'final');
  fs.rmSync(dir, { recursive: true, force: true });
  for (const f of cand) {
    if (fotos.length >= 4) break;
    const dst = path.join(dir, `tmp-${f.n}.jpg`);
    let res;
    try { res = await normalizarFoto(P(it.id, f.archivo), dst); } catch (e) { res = { ok: false, motivo: 'no se pudo arreglar: ' + e.message.slice(0, 60) }; }
    const ev = evaluadas.find((e) => e.n === f.n);
    if (!res.ok) { ev.fallos.push(res.motivo); continue; }
    fotos.push({ ...ev, ...res, tmp: dst });
  }
  // principal: la primera que no toca el borde ni está muy ampliada
  const iP = fotos.findIndex((f) => !f.tocaBorde && !f.ampliada);
  if (iP > 0) fotos.unshift(...fotos.splice(iP, 1));
  // galería: fuera las que tocan el borde (la principal se queda y sale en ámbar en la hoja) y, con fotos de internet,
  // las que vienen de otra página que la principal (otra variante de color de la misma tienda)
  for (let i = fotos.length - 1; i >= 1; i--) if (fotos[i].tocaBorde || (fuente === 'web' && fotos[i].pagina !== fotos[0].pagina)) {
    const ev = evaluadas.find((e) => e.n === fotos[i].n); if (ev) ev.fallos.push(fotos[i].tocaBorde ? 'toca el borde (galería)' : 'otra variante de la tienda (galería)');
    fs.rmSync(fotos[i].tmp, { force: true }); fotos.splice(i, 1);
  }
  fotos.forEach((f, i) => { const fin = path.join(dir, `limpia-${i + 1}.jpg`); fs.renameSync(f.tmp, fin); f.salida = fin; delete f.tmp; });
  return { fotos, evaluadas, audit };
}

async function normalizar() {
  const l = items();
  const cuenta = {};
  await pool(l, 2, async (it, k) => {
    const prev = leer(P(it.id, 'norm.json'));
    if (prev && !flag('otra') && !(prev.estado === 'sin_foto_buena' && fs.existsSync(P(it.id, 'audit-web.json')) && !prev.web_revisada)) { cuenta[prev.estado] = (cuenta[prev.estado] || 0) + 1; return; }
    const audit = auditDe(it.id);
    if (!audit) { cuenta.sin_auditar = (cuenta.sin_auditar || 0) + 1; return; }
    let fuente = 'proveedor';
    let el = audit.sin_fotos ? { fotos: [], evaluadas: [], audit } : await elegir(it, 'proveedor');
    let web = null;
    if (!el.fotos.length && fs.existsSync(P(it.id, 'audit-web.json'))) { web = await elegir(it, 'web'); if (web.fotos.length) { el = web; fuente = 'web'; } }
    const r = audit.respuesta || {};
    const marca = r.marca || null, modelo = r.modelo || null;
    let estado = 'listo';
    if (!el.fotos.length) estado = (!r.es_generico && marca && modelo) ? 'sin_foto_buena' : 'bloqueado';
    const avisos = [...(r.avisos || []), ...(web?.audit?.respuesta?.avisos || []).map((a) => 'web: ' + a)];
    if (el.fotos[0]?.tocaBorde) avisos.push('la foto principal toca el borde (mirar si está cortado)');
    if (el.fotos[0]?.ampliada) avisos.push(`foto principal ampliada ${el.fotos[0].escala}×`);
    const n = {
      estado, fuente: estado === 'listo' ? fuente : null, marca, modelo, es_generico: r.es_generico ?? null, busqueda: r.busqueda || null,
      necesita_web: r.necesita_web ?? null, foto_principal_ia: r.foto_principal ?? null, avisos, fotos: el.fotos,
      evaluadas: (audit.respuesta ? (fuente === 'web' ? [...(await elegirSoloLeer(it)), ...el.evaluadas] : el.evaluadas) : []),
      evaluadas_web: web ? web.evaluadas : undefined,
      web_revisada: Boolean(web), bloqueo: estado === 'bloqueado' ? (audit.sin_fotos ? 'falta foto real (ninguna foto del proveedor sirve: pequeñas o repetidas)' : 'falta foto real') : null,
      fecha: new Date().toISOString(),
    };
    guardar(P(it.id, 'norm.json'), n);
    cuenta[estado] = (cuenta[estado] || 0) + 1;
    if ((k + 1) % 50 === 0) console.log(`normalizar ${k + 1}/${l.length}`);
  });
  console.log(JSON.stringify(cuenta));
}
async function elegirSoloLeer(it) {
  const audit = auditDe(it.id);
  if (!audit?.respuesta) return [];
  const meta = leer(P(it.id, 'fotos.json'), []);
  return audit.respuesta.fotos.map((f) => { const archivo = audit.enviadas[f.n - 1]; return { n: f.n, archivo, url: meta.find((m) => m.archivo === archivo)?.url, nota: f.nota, motivo: f.motivo, fallos: reglas(f) }; });
}

// ---------- fase textos ----------
const SISTEMA_TEXTO = `Escribes fichas de producto para Casa Viva, una tienda online de Cuba. Español sencillo y natural de Cuba, frases cortas, sin exagerar.
Te paso los DATOS DEL PROVEEDOR (nombre, categoría, estado y descripción). Devuelve:
- titulo: sin emojis, máximo 75 caracteres. Tipo de producto + marca + modelo + 1 o 2 datos clave (capacidad, potencia, memoria, tamaño).
  Conserva las palabras con las que la gente lo busca (ej. "Estación de energía", "Freidora de aire", "Power bank", "Celular"). Si no hay marca, no la inventes.
- descripcion: entre 60 y 110 palabras, en texto plano con este orden:
  1) un párrafo corto: qué es y para qué sirve;
  2) la línea "Características:" y debajo de 3 a 5 líneas que empiecen por "- " con los datos más importantes;
  3) una frase final: para quién es o en qué situaciones ayuda (ej. apagones, la cocina de casa, el trabajo, los estudios).
REGLAS QUE NO SE ROMPEN:
- Usa SOLO datos que estén escritos en los DATOS DEL PROVEEDOR. No inventes especificaciones, medidas, potencias, colores, materiales, compatibilidades,
  accesorios incluidos ni certificaciones. Si hay pocos datos, pon menos características (mínimo las que haya) y no rellenes con datos inventados.
- Copia los números y unidades tal como vienen (no conviertas unidades ni redondees).
- Nada de precios ni monedas, nombres de tiendas o proveedores, teléfonos, enlaces, "envío gratis", domicilio, entrega, garantía, stock ni plazos.
- Nada de emojis, ni "¡", ni mayúsculas sostenidas, ni frases como "el mejor del mercado" u "oferta".
- Si el ESTADO no es "nuevo" (por ejemplo "gradoA" o "gradoAPlus"), dilo claro en el texto: "Estado: Grado A (reacondicionado, en muy buen estado)".`;

const ESQUEMA_TEXTO = { type: 'json_schema', json_schema: { name: 'ficha', strict: true, schema: { type: 'object', additionalProperties: false, required: ['titulo', 'descripcion'], properties: { titulo: { type: 'string' }, descripcion: { type: 'string' } } } } };
const PROHIBIDO = /\b(usd|cup|mlc|precio|precios|env[ií]o|gratis|domicilio|garant[ií]a|digital store|kevin|whatsapp|tel[eé]fono|ll[aá]manos|escr[ií]benos|oferta|stock)\b|\$|¡|https?:|wa\.me/i;
const EMOJI = /\p{Extended_Pictographic}/u;
const contactos = (t = '') => String(t).replace(/(\+?53)?[\s-]*\d[\d\s-]{6,}\d/g, '');
const numeros = (s) => (String(s).match(/\d+(?:[.,]\d+)?/g) || []).map((x) => x.replace(',', '.'));

function revisarTexto(t, it) {
  const problemas = [];
  const fuente = (it.nombre + ' ' + it.descripcion).replace(/,/g, '.');
  const fuenteNums = new Set(numeros(fuente));
  const palabras = t.descripcion.split(/\s+/).filter((w) => /\p{L}|\d/u.test(w)).length;
  // con pocos datos del proveedor vale un texto algo más corto (mejor corto que inventado)
  const minimo = it.descripcion.length < 300 ? 42 : 55;
  if (palabras < minimo || palabras > 125) problemas.push(`la descripción tiene ${palabras} palabras (deben ser 60-110)`);
  if (t.titulo.length > 90) problemas.push('el título es muy largo');
  for (const [k, v] of Object.entries({ titulo: t.titulo, descripcion: t.descripcion })) {
    if (EMOJI.test(v)) problemas.push(`el ${k} tiene emojis`);
    const m = v.match(PROHIBIDO); if (m) problemas.push(`el ${k} dice "${m[0]}" (prohibido)`);
  }
  // publishItem (catalog.js) borra de la DESCRIPCIÓN las cifras largas que parecen teléfonos; el título no se toca
  if (contactos(t.descripcion) !== t.descripcion) problemas.push('la descripción tiene una cifra larga que la web borraría');
  const inventados = [...new Set(numeros(t.titulo + ' ' + t.descripcion))].filter((n) => !fuenteNums.has(n) && !fuente.includes(n));
  if (inventados.length) problemas.push(`estos números no están en los datos del proveedor: ${inventados.join(', ')}`);
  return { problemas, palabras };
}

async function textoUno(it) {
  const destino = P(it.id, 'texto.json');
  const prev = leer(destino);
  if (prev && !flag('otra')) return prev.ok ? 'ok' : 'dudoso';
  const datos = `NOMBRE: ${it.nombre}\nCATEGORÍA: ${it.categoria} / ${it.subcategoria}\nESTADO: ${it.calidad}\nDESCRIPCIÓN DEL PROVEEDOR:\n${it.descripcion.slice(0, 1500)}`;
  const messages = [{ role: 'system', content: SISTEMA_TEXTO }, { role: 'user', content: datos }];
  let t = null, rev = null;
  for (let intento = 1; intento <= 2; intento++) {
    const d = await openai({ model: MODEL, temperature: 0.3, max_tokens: 700, response_format: ESQUEMA_TEXTO, messages }, `texto:${it.id}`);
    t = JSON.parse(d.choices[0].message.content);
    t.titulo = sinEmojis(t.titulo).replace(/\s+/g, ' ').trim(); t.descripcion = sinEmojis(t.descripcion).replace(/\s*Características:\s*/, '\n\nCaracterísticas:\n').trim();
    rev = revisarTexto(t, it);
    if (!rev.problemas.length) break;
    messages.push({ role: 'assistant', content: JSON.stringify(t) }, { role: 'user', content: `Corrige esto y devuelve el JSON completo otra vez: ${rev.problemas.join('; ')}.` });
  }
  const ok = !rev.problemas.length;
  guardar(destino, { ok, ...t, palabras: rev.palabras, problemas: rev.problemas, fecha: new Date().toISOString() });
  return ok ? 'ok' : 'dudoso';
}

async function textos() {
  const l = items().filter((it) => leer(P(it.id, 'norm.json'))?.estado === 'listo');
  const cuenta = {}; let parar = null;
  await pool(l, CONC, async (it, k) => {
    if (parar) return;
    try { const r = await textoUno(it); cuenta[r] = (cuenta[r] || 0) + 1; }
    catch (e) { if (e instanceof Parar) { parar = e.message; return; } cuenta.error = (cuenta.error || 0) + 1; console.log('error texto', it.id, tapar(e.message).slice(0, 160)); }
    if ((k + 1) % 50 === 0) console.log(`textos ${k + 1}/${l.length} · ${gasto().usd.toFixed(3)} USD`);
  });
  console.log(JSON.stringify({ ...cuenta, gasto_usd: +gasto().usd.toFixed(4), parar }));
  if (parar) process.exitCode = 3;
}

// ---------- fase subir (Storage + fila; sin tocar status) ----------
async function subir() {
  const l = items();
  const cuenta = {};
  await pool(l, 3, async (it) => {
    const n = leer(P(it.id, 'norm.json'));
    // si se subió en una vuelta anterior y ahora ya no pasa: se deja la fila como estaba antes (sin fotos limpias)
    if (n && n.estado !== 'listo' && fs.existsSync(P(it.id, 'subido.json'))) {
      const { data, error } = await db.from('crm_market_items')
        .update({ photos_clean: [], photos_ok: false, photos_quality: null, title: it.title, description: it.description })
        .eq('business_id', BIZ).eq('id', it.id).eq('status', 'nuevo').select('id');
      if (!error && data?.length) { fs.rmSync(P(it.id, 'subido.json')); cuenta.revertidos = (cuenta.revertidos || 0) + 1; }
      else { console.log('error revertir', it.id, error?.message); cuenta.error = (cuenta.error || 0) + 1; }
      return;
    }
    if (!n || n.estado !== 'listo') return;
    const t = leer(P(it.id, 'texto.json'));
    if (!t?.ok) { cuenta.texto_dudoso = (cuenta.texto_dudoso || 0) + 1; return; }
    if (fs.existsSync(P(it.id, 'subido.json')) && !flag('otra')) { cuenta.ya = (cuenta.ya || 0) + 1; return; }
    const rutas = [];
    for (const [i, f] of n.fotos.entries()) {
      const ruta = `${BIZ}/${it.id}/limpia-${i + 1}.jpg`;
      const up = await db.storage.from(BUCKET).upload(ruta, fs.readFileSync(f.salida), { contentType: 'image/jpeg', upsert: true });
      if (up.error) { console.log('error storage', it.id, up.error.message); cuenta.error = (cuenta.error || 0) + 1; return; }
      rutas.push(ruta);
    }
    const calidad = {
      v: 'escala-2026-10-12', revisor: MODEL, fuente: n.fuente, nota_principal: n.fotos[0].nota,
      fotos: n.fotos.map((f, i) => ({ i: i + 1, ruta: rutas[i], desde: f.url, pagina: f.pagina || undefined, nota: f.nota, motivo: f.motivo, toca_borde: f.tocaBorde || undefined, escala: f.escala })),
      descartadas: n.evaluadas.filter((e) => !n.fotos.some((f) => f.archivo === e.archivo && (f.url === e.url))).map((e) => ({ n: e.n, nota: e.nota, motivo: e.motivo, fallos: e.fallos })),
      principal: 1, necesita_web: n.necesita_web, marca_modelo: [n.marca, n.modelo].filter(Boolean).join(' ') || null,
      avisos: n.avisos.length ? n.avisos : undefined, original_title: it.title, original_description: it.description,
    };
    const { data, error } = await db.from('crm_market_items')
      .update({ photos_clean: rutas, photos_quality: JSON.stringify(calidad), photos_ok: true, title: t.titulo, description: t.descripcion })
      .eq('business_id', BIZ).eq('id', it.id).eq('status', 'nuevo').select('id,status');
    if (error || !data?.length) { console.log('error fila', it.id, error?.message || 'no está en nuevo'); cuenta.error = (cuenta.error || 0) + 1; return; }
    guardar(P(it.id, 'subido.json'), { rutas, titulo: t.titulo, fecha: new Date().toISOString() });
    cuenta.subidos = (cuenta.subidos || 0) + 1;
  });
  console.log(JSON.stringify(cuenta));
}

// ---------- fase bloquear: apunta en la fila por qué no hay foto (sin tocar status, photos_clean ni photos_ok) ----------
async function bloquear() {
  const l = items();
  const cuenta = {};
  const actual = new Map();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('crm_market_items').select('id,photos_quality,photos_clean').eq('business_id', BIZ).eq('seller_name', SELLER).range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const r of data) actual.set(r.id, r);
    if (data.length < 1000) break;
  }
  await pool(l, 3, async (it) => {
    const n = leer(P(it.id, 'norm.json'));
    if (!n || n.estado === 'listo') return;
    const fila = actual.get(it.id);
    // solo se escribe si estaba vacío o si ya era un bloqueo nuestro; nunca encima de fotos limpias
    if (!fila || fila.photos_clean?.length || (fila.photos_quality && !String(fila.photos_quality).includes('"bloqueado"'))) { cuenta.no_tocado = (cuenta.no_tocado || 0) + 1; return; }
    const mejores = [...(n.evaluadas || []), ...(n.evaluadas_web || [])].sort((a, b) => b.nota - a.nota).slice(0, 3)
      .map((e) => ({ n: e.n, nota: e.nota, motivo: e.motivo, fallos: e.fallos }));
    const calidad = {
      v: 'escala-2026-10-12', revisor: MODEL,
      bloqueado: n.estado === 'bloqueado' ? 'falta foto real' : 'falta foto buena',
      detalle: n.estado === 'bloqueado' ? 'producto genérico o sin foto del proveedor que sirva: pedir foto real (sobre hoja blanca, luz de día)' : `tiene marca y modelo: buscar la foto oficial (${n.busqueda || [n.marca, n.modelo].filter(Boolean).join(' ')})${n.web_revisada ? '; las fotos de internet probadas tampoco sirvieron' : ''}`,
      marca_modelo: [n.marca, n.modelo].filter(Boolean).join(' ') || null, mejores_fotos: mejores,
    };
    const { data, error } = await db.from('crm_market_items').update({ photos_quality: JSON.stringify(calidad) })
      .eq('business_id', BIZ).eq('id', it.id).eq('status', 'nuevo').select('id');
    if (error) { cuenta.error = (cuenta.error || 0) + 1; return; }
    cuenta[data?.length ? n.estado : 'ya_tenia'] = (cuenta[data?.length ? n.estado : 'ya_tenia'] || 0) + 1;
  });
  console.log(JSON.stringify(cuenta));
}

// ---------- fase minis (datos para las hojas) ----------
async function minis() {
  const l = items();
  const datos = [];
  const vistos = new Map(); // mismo producto repetido en el catálogo del proveedor → solo una vez en las hojas
  for (const it of l) {
    const s = leer(P(it.id, 'subido.json')); if (!s) continue;
    const n = leer(P(it.id, 'norm.json'));
    const clave = norm(it.nombre) + '|' + it.my_price;
    if (vistos.has(clave)) { datos.push({ id: it.id, titulo: s.titulo, precio: it.my_price, duplicado_de: vistos.get(clave) }); continue; }
    vistos.set(clave, it.id);
    const dir = P('minis', it.id); fs.mkdirSync(dir, { recursive: true });
    for (const [i, f] of n.fotos.entries()) {
      await sharp(f.salida).resize(i === 0 ? 440 : 150, i === 0 ? 440 : 150).jpeg({ quality: 82 }).toFile(path.join(dir, `${i + 1}.jpg`));
    }
    datos.push({ id: it.id, titulo: s.titulo, precio: it.my_price, nota: n.fotos[0].nota, notas: n.fotos.map((f) => f.nota), fotos: n.fotos.length, fuente: n.fuente,
      avisos: n.avisos, borde: Boolean(n.fotos[0].tocaBorde), ampliada: Boolean(n.fotos[0].ampliada), categoria: it.subcategoria || it.categoria, prioridad: it.prioridad });
  }
  guardar(P('hojas-datos.json'), datos);
  console.log(JSON.stringify({ productos: datos.length }));
}

// ---------- web ----------
function webCandidatos() {
  const l = items();
  const c = [];
  for (const it of l) {
    const n = leer(P(it.id, 'norm.json'));
    if (n?.estado !== 'sin_foto_buena') continue;
    c.push({ id: it.id, nombre: it.nombre, marca: n.marca, modelo: n.modelo, busqueda: n.busqueda, sub: it.subcategoria, precio: it.my_price, prioridad: it.prioridad });
  }
  c.sort((a, b) => b.prioridad - a.prioridad);
  guardar(P('web-candidatos.json'), c);
  console.log(JSON.stringify({ candidatos: c.length }));
}

async function imagenesDePagina(url) {
  // tiendas Shopify (muchas marcas de energía: BLUETTI, EcoFlow, Anker, AFERIY…): <producto>.json trae todas las fotos oficiales
  if (/\/products\/[^/?#]+/.test(url)) {
    try {
      const base = url.split(/[?#]/)[0].replace(/\/$/, '');
      const j = await fetch(base + '.json', { headers: { 'user-agent': UA, accept: 'application/json' }, signal: AbortSignal.timeout(30e3) });
      if (j.ok) { const d = await j.json(); const ims = (d.product?.images || []).map((x) => x.src).filter(Boolean); if (ims.length) return { final: base, imagenes: ims }; }
    } catch { /* no es Shopify */ }
  }
  const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'es-ES,es;q=0.9,en;q=0.8', accept: 'text/html,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(30e3) });
  const txt = await r.text();
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const found = [];
  const add = (u) => { if (!u) return; u = u.replace(/\\u002F/g, '/').replace(/\\\//g, '/').replace(/&amp;/g, '&'); if (u.startsWith('//')) u = 'https:' + u; if (u.startsWith('/')) u = new URL(u, r.url).href; if (/^https?:/.test(u) && !found.includes(u)) found.push(u); };
  for (const m of txt.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*content=["']([^"']+)/gi)) add(m[1]);
  for (const m of txt.matchAll(/content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)/gi)) add(m[1]);
  for (const m of txt.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (o) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk); if (o.image) { const im = o.image; (Array.isArray(im) ? im : [im]).forEach((x) => add(typeof x === 'string' ? x : x?.url || x?.contentUrl)); } Object.values(o).forEach((v) => typeof v === 'object' && walk(v)); };
      walk(JSON.parse(m[1]));
    } catch { /* json-ld roto */ }
  }
  return { final: r.url, imagenes: found };
}

// fuentes.json local: [{ id, pagina, urls?: [...] }]  (urls directas; si no hay, se sacan de la página)
async function webBajar() {
  const lista = leer(args.find((a) => a.endsWith('.json')), []);
  const cuenta = { ok: 0, fallo: 0 };
  for (const e of lista) {
    const dir = P(e.id, 'web'); fs.mkdirSync(dir, { recursive: true });
    let urls = e.urls || [];
    if (!urls.length && e.pagina) { try { urls = (await imagenesDePagina(e.pagina)).imagenes.slice(0, 6); } catch (err) { console.log('pagina', e.id, err.message); } }
    const prev = leer(path.join(dir, 'fuentes.json'), []);
    const lote = [];
    let k = prev.length;
    for (const u of urls.slice(0, 6)) {
      if (prev.some((p) => p.url === u)) continue;
      try {
        const buf = await bajarUrl(u, e.pagina ? { referer: e.pagina } : {});
        const m = await sharp(buf).metadata();
        k++; const archivo = `web/w${String(k).padStart(2, '0')}.${m.format === 'jpeg' ? 'jpg' : m.format}`;
        fs.writeFileSync(P(e.id, archivo), buf);
        lote.push({ archivo, url: u, pagina: e.pagina || null, buf });
      } catch (err) { console.log('img', e.id, u.slice(0, 90), err.message); }
    }
    const res = await medirYFiltrar([...prev.map((p) => ({ ...p, estado: p.estado })), ...lote], MIN_LADO_WEB);
    guardar(path.join(dir, 'fuentes.json'), res);
    const ok = res.filter((x) => x.estado === 'ok').length;
    if (ok) cuenta.ok++; else cuenta.fallo++;
    console.log('web', e.id, `${ok} útiles de ${res.length}`);
    fs.rmSync(P(e.id, 'audit-web.json'), { force: true });
  }
  console.log(JSON.stringify(cuenta));
}

// ---------- estado ----------
function estado() {
  const l = leer(P('items.json'), []);
  const c = { elegibles: l.length, bajados: 0, auditados: 0, listo: 0, listo_web: 0, sin_foto_buena: 0, bloqueado: 0, textos_ok: 0, textos_dudosos: 0, subidos: 0 };
  for (const it of l) {
    if (fs.existsSync(P(it.id, 'fotos.json'))) c.bajados++;
    if (fs.existsSync(P(it.id, 'audit.json'))) c.auditados++;
    const n = leer(P(it.id, 'norm.json'));
    if (n) { c[n.estado]++; if (n.estado === 'listo' && n.fuente === 'web') c.listo_web++; }
    const t = leer(P(it.id, 'texto.json')); if (t) t.ok ? c.textos_ok++ : c.textos_dudosos++;
    if (fs.existsSync(P(it.id, 'subido.json'))) c.subidos++;
  }
  const g = gasto();
  console.log(JSON.stringify({ ...c, openai: { llamadas: g.llamadas, tokens_entrada: g.in, tokens_cache: g.cached, tokens_salida: g.out, usd: +g.usd.toFixed(4) } }));
}

const fases = { preparar, bajar, auditar, normalizar, textos, subir, bloquear, minis, 'web-candidatos': webCandidatos, 'web-bajar': webBajar, estado };
if (!fases[cmd]) { console.log('Fases: ' + Object.keys(fases).join(', ')); process.exit(1); }
fs.mkdirSync(BASE, { recursive: true });
const t0 = Date.now();
await fases[cmd]();
console.log(`[${cmd}] ${((Date.now() - t0) / 1000).toFixed(0)} s`);
process.exit(process.exitCode || 0);
