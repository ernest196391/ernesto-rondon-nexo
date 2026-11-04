// Publicación automática de los «Bajo pedido» de la bolsa (Digital Store) con doble revisión — 13-oct-2026.
// Se apoya en lo que dejan las fases de fotos-bolsa.mjs (norm.json, texto.json, subido.json) y en la fila de crm_market_items.
//
//   node auto-bolsa.mjs prueba [--modelo gpt-6-sol] [--muestra 40]
//        verificación ESTRICTA contra los 13 rechazados a mano el 12-oct, las 7 dudas y una muestra de aprobados.
//   node auto-bolsa.mjs marca [--ids 1,2]
//        regla de Ernesto (13-oct, 12:35) para los bloqueados «falta foto buena» (con marca y modelo): se usan las fotos de
//        Kevin aunque lleven texto del FABRICANTE. Elige las de nota >= 7 (primero fondo blanco), las arregla a 1200×1200
//        → <id>/norm-marca.json + <id>/final-marca/. No busca en internet. No toca norm.json.
//   node auto-bolsa.mjs verificar [--ids] [--marca] [--modelo gpt-6-sol] [--otra]
//        2.ª revisión de las FOTOS FINALES con el título. Modo estricto (por defecto): fuera todo texto añadido.
//        Modo marca (--marca, sobre norm-marca.json): vale el texto del fabricante; fuera logos de otras tiendas,
//        teléfonos/@/precios, collage de varios productos, otro producto o color, cortada, borrosa, solo caja, etiqueta.
//        Si el texto de la foto contradice la ficha («5G» y el título no lo dice) → «contradice» (a dudosos, no se publica).
//   node auto-bolsa.mjs promover [--ids]
//        los de modo marca que pasaron (ok o contradice) → norm.json (copia del anterior en norm-antes-marca.json),
//        para que fotos-bolsa.mjs haga «textos» y «subir --ids».
//   node auto-bolsa.mjs auto [--ids] [--publicar] [--avisar] [--max 100]
//        decide cada artículo «nuevo» con fotos limpias en la fila: PUBLICAR (solo con --publicar) o DUDOSO (hoja de Claude).
//        Sin --publicar es una prueba en seco: no publica nada. --avisar manda la línea de resumen con «cv enviar» a AVISO_DEST.
//   node auto-bolsa.mjs etiquetar         después de «subir»: apunta la regla de marca en photos_quality
//   node auto-bolsa.mjs presupuesto       FB_BUDGET para fotos-bolsa.mjs con el tope diario (AUTO_TOPE_DIA, 1 USD)
//
// Nunca publica artículos bloqueados (sin foto buena). Solo cambia status al publicar (igual que publicar-hoja.mjs).
// APAGAR: crear el archivo <FB_BASE>/auto/APAGADO (o quitar la línea del crontab).
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execFileSync } from 'child_process';

const require = createRequire('/root/vivabot/package.json');
for (const l of fs.readFileSync('/root/vivabot/.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const sharp = require('sharp');
sharp.concurrency(1);
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const { gestoraShare, myPrice } = await import('/root/vivabot/src/market-price.js');

const BIZ = '8771c6ed-9dbf-497d-b3df-be6697ba2693';
const BUCKET = 'mercado';
const BASE = process.env.FB_BASE || '/root/archivos/fotos-bolsa';
const AUTO = path.join(BASE, 'auto');
const SELLER = 'Digital Store (Kevin)';
const TOPE_DIA = Number(process.env.AUTO_TOPE_DIA || 1.0);   // USD de OpenAI al día (todo: revisar, textos y verificar)
const MAX_DIA = Number(process.env.AUTO_MAX_DIA || 100);     // publicaciones al día
const NOTA_MIN = 8, NOTA_MIN_MARCA = 7;                      // regla del coordinador (8) y de Ernesto para los de marca (7)
const MODELO_V = 'gpt-6-sol';
const REGLA_MARCA = 'marca-13oct';
const PRECIO = { 'gpt-6-sol': { in: 2.0, cached: 0.2, out: 10.0 }, 'gpt-4.1-mini': { in: 0.40, cached: 0.10, out: 1.60 }, 'gpt-6-luna': { in: 0.10, cached: 0.01, out: 0.50 } };
// categorías que no se publican solas (van a la hoja de dudosos): adultos, armas o réplicas, tabaco, alcohol, medicinas
const SENSIBLE = /juguetes? sexual|sexual|er[oó]tic|lencer[ií]a|\barma\b|pistola|rev[oó]lver|rifle|escopeta|airsoft|balin|cuchillo|navaja|machete|tabaco|cigarr|vape|vaper|hookah|cachimba|alcohol|\bron\b|whisky|vodka|cerveza|medicament|pastilla|antibi[oó]tic/i;
const LADO = 1200, MARGEN = 0.08, CAJA = Math.round(LADO * (1 - 2 * MARGEN));

const args = process.argv.slice(2);
const [cmd] = args;
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes('--' + k);
const P = (...a) => path.join(BASE, ...a.map(String));
const leer = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const guardar = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f + '.tmp', JSON.stringify(o, null, 1)); fs.renameSync(f + '.tmp', f); };
const tapar = (s = '') => String(s).replace(/sk-[A-Za-z0-9_\-*]{6,}/g, 'sk-***');
const norm = (s = '') => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();
const cuba = (t) => new Date(Date.parse(t) - 4 * 3600e3).toISOString().slice(0, 10);
const hoy = () => cuba(new Date().toISOString()); // día de Cuba (UTC-4)
const ids = () => String(opt('ids', '')).split(',').map(Number).filter(Boolean);
const itemsMap = () => new Map((leer(P('items.json'), []) || []).map((x) => [x.id, x]));
fs.mkdirSync(AUTO, { recursive: true });

// ---------- gasto del día ----------
const USO = () => path.join(AUTO, `uso-${hoy()}.jsonl`);
function gastoHoy() {
  let usd = 0;
  if (fs.existsSync(USO())) for (const l of fs.readFileSync(USO(), 'utf8').split('\n').filter(Boolean)) usd += JSON.parse(l).usd;
  if (fs.existsSync(P('uso.jsonl'))) for (const l of fs.readFileSync(P('uso.jsonl'), 'utf8').split('\n').filter(Boolean)) { const u = JSON.parse(l); if (cuba(u.t) === hoy()) usd += u.usd; }
  return +usd.toFixed(4);
}
function totalUsoFotosBolsa() {
  let usd = 0;
  if (fs.existsSync(P('uso.jsonl'))) for (const l of fs.readFileSync(P('uso.jsonl'), 'utf8').split('\n').filter(Boolean)) usd += JSON.parse(l).usd;
  return usd;
}

// ---------- arreglo de la foto (igual que fotos-bolsa.mjs: 1200×1200, blanco puro, 8 % de margen, se rechaza si está cortada) ----------
async function esquinas(buf, w, h) {
  const p = Math.max(6, Math.round(Math.min(w, h) * 0.02)); const out = [];
  for (const [left, top] of [[0, 0], [w - p, 0], [0, h - p], [w - p, h - p]]) {
    const { data, info } = await sharp(buf).extract({ left, top, width: p, height: p }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const c = info.channels, n = data.length / c; const m = [0, 0, 0], q = [0, 0, 0];
    for (let i = 0; i < data.length; i += c) for (let k = 0; k < 3; k++) { const v = data[i + Math.min(k, c - 1)]; m[k] += v; q[k] += v * v; }
    const media = m.map((x) => x / n), desv = q.map((x, k) => Math.sqrt(Math.max(0, x / n - media[k] ** 2)));
    out.push({ media: (media[0] + media[1] + media[2]) / 3, desv: Math.max(...desv), sat: Math.max(...media) - Math.min(...media) });
  }
  return out;
}
async function limpiarFondo(png) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H, C = info.channels;
  const d = Math.max(2, Math.round(Math.min(W, H) * 0.006));
  const cand = (i) => { const r = data[i * C], g = data[i * C + 1], b = data[i * C + 2]; const lo = Math.min(r, g, b); return lo >= 226 && Math.max(r, g, b) - lo <= 16; };
  const pinta = (i) => { data[i * C] = data[i * C + 1] = data[i * C + 2] = 255; };
  for (let x = 0; x < W; x++) { if (cand(d * W + x)) for (let y = 0; y < d; y++) pinta(y * W + x); if (cand((H - 1 - d) * W + x)) for (let y = H - d; y < H; y++) pinta(y * W + x); }
  for (let y = 0; y < H; y++) { if (cand(y * W + d)) for (let x = 0; x < d; x++) pinta(y * W + x); if (cand(y * W + W - 1 - d)) for (let x = W - d; x < W; x++) pinta(y * W + x); }
  const mn = new Uint8Array(N), sat = new Uint8Array(N);
  for (let i = 0; i < N; i++) { const r = data[i * C], g = data[i * C + 1], b = data[i * C + 2]; const lo = Math.min(r, g, b), hi = Math.max(r, g, b); mn[i] = lo; sat[i] = hi - lo; }
  const fondo = (i) => mn[i] >= 226 && sat[i] <= 16;
  const mask = new Uint8Array(N), q = new Int32Array(N); let h = 0, t = 0;
  const push = (i, j) => { if (!mask[i] && fondo(i) && (j < 0 || Math.abs(mn[i] - mn[j]) <= 6)) { mask[i] = 1; q[t++] = i; } };
  for (let x = 0; x < W; x++) { push(x, -1); push((H - 1) * W + x, -1); }
  for (let y = 0; y < H; y++) { push(y * W, -1); push(y * W + W - 1, -1); }
  while (h < t) { const i = q[h++], x = i % W; if (x > 0) push(i - 1, i); if (x < W - 1) push(i + 1, i); if (i >= W) push(i - W, i); if (i < N - W) push(i + W, i); }
  let nb = 0; const lado = { arriba: 0, abajo: 0, izquierda: 0, derecha: 0 }; const e = 2;
  for (let x = 0; x < W; x++) { nb += Math.max(mask[x], mask[d * W + x]) + Math.max(mask[(H - 1) * W + x], mask[(H - 1 - d) * W + x]); lado.arriba += 1 - mask[e * W + x]; lado.abajo += 1 - mask[(H - 1 - e) * W + x]; }
  for (let y = 0; y < H; y++) { nb += Math.max(mask[y * W], mask[y * W + d]) + Math.max(mask[y * W + W - 1], mask[y * W + W - 1 - d]); lado.izquierda += 1 - mask[y * W + e]; lado.derecha += 1 - mask[y * W + W - 1 - e]; }
  const contacto = {}; for (const k of Object.keys(lado)) contacto[k] = lado[k] / (k === 'arriba' || k === 'abajo' ? W : H);
  const filas = new Int32Array(H), cols = new Int32Array(W);
  for (let i = 0; i < N; i++) if (!mask[i]) { filas[(i / W) | 0]++; cols[i % W]++; }
  let y0 = 0, y1 = H - 1, x0 = 0, x1 = W - 1;
  while (y0 < H && filas[y0] < 2) y0++; while (y1 > y0 && filas[y1] < 2) y1--; while (x0 < W && cols[x0] < 2) x0++; while (x1 > x0 && cols[x1] < 2) x1--;
  if (y0 >= H || x0 >= W) return { vacio: true, bordeFondo: nb / (2 * W + 2 * H), contacto };
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1; const out = Buffer.alloc(cw * ch * 3);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * W + x, o = ((y - y0) * cw + (x - x0)) * 3; let w = 0;
    if (mask[i]) { w = Math.min(1, Math.max(0, (mn[i] - 222) / 22)); const dist = Math.min(x - x0, x1 - x, y - y0, y1 - y); w = Math.max(w, Math.min(1, Math.max(0, 1 - dist / 12))); }
    else if (mn[i] >= 205 && sat[i] <= 20) { const junto = (x > 0 && mask[i - 1]) || (x < W - 1 && mask[i + 1]) || (y > 0 && mask[i - W]) || (y < H - 1 && mask[i + W]); if (junto) w = mn[i] >= 236 ? 0.5 : 0.25; }
    for (let k = 0; k < 3; k++) { const v = data[i * C + k]; out[o + k] = Math.round(v + (255 - v) * w); }
  }
  return { buf: await sharp(out, { raw: { width: cw, height: ch, channels: 3 } }).png().toBuffer(), bordeFondo: nb / (2 * W + 2 * H), contacto, caja: { x0, y0, x1, y1, w: cw, h: ch } };
}
async function normalizarFoto(src, dst) {
  let buf = await sharp(src).rotate().flatten({ background: '#ffffff' }).toColourspace('srgb').png().toBuffer();
  const meta = await sharp(buf).metadata(); const W = meta.width, H = meta.height;
  const esq = await esquinas(buf, W, H); const medias = esq.map((e) => e.media).sort((a, b) => a - b); const bg = (medias[1] + medias[2]) / 2;
  let a = 1; if (bg >= 225 && bg < 254.5) { a = 255 / bg; buf = await sharp(buf).linear([a, a, a], [0, 0, 0]).png().toBuffer(); }
  const blancas = esq.filter((e) => e.media * a >= 245 && e.desv < 8 && e.sat < 10).length;
  const limpio = await limpiarFondo(buf);
  if (blancas < 2 && limpio.bordeFondo < 0.5) return { ok: false, motivo: 'fondo no blanco' };
  if (limpio.bordeFondo < 0.3) return { ok: false, motivo: `fondo no blanco (solo ${Math.round(limpio.bordeFondo * 100)} % del borde es fondo)` };
  const [ladoMax, contactoMax] = Object.entries(limpio.contacto).sort((x, y) => y[1] - x[1])[0];
  if (contactoMax >= 0.12) return { ok: false, motivo: `producto cortado por el borde (${ladoMax}, ${Math.round(contactoMax * 100)} % del lado)` };
  if (limpio.vacio) return { ok: false, motivo: 'no se encuentra el producto' };
  const cj = limpio.caja;
  const tocaBorde = contactoMax > 0.004 || cj.x0 <= 1 || cj.y0 <= 1 || cj.x1 >= W - 2 || cj.y1 >= H - 2;
  if (cj.w < 60 || cj.h < 60) return { ok: false, motivo: 'no se encuentra el producto' };
  const escala = Math.min(CAJA / cj.w, CAJA / cj.h);
  if (escala > 2.0) return { ok: false, motivo: `muy pequeña (habría que ampliar ${escala.toFixed(1)}×)` };
  let r = sharp(limpio.buf).resize(Math.round(cj.w * escala), Math.round(cj.h * escala), { kernel: 'lanczos3' });
  if (escala > 1.1) r = r.sharpen({ sigma: Math.min(1.2, 0.5 + 0.35 * (escala - 1)) });
  const prod = await r.png().toBuffer(); const pm = await sharp(prod).metadata();
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  await sharp({ create: { width: LADO, height: LADO, channels: 3, background: '#ffffff' } }).composite([{ input: prod, left: Math.round((LADO - pm.width) / 2), top: Math.round((LADO - pm.height) / 2) }])
    .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(dst);
  return { ok: true, origen: `${W}x${H}`, fondo: Math.round(bg), escala: +escala.toFixed(2), tocaBorde, contacto: +contactoMax.toFixed(3), ampliada: escala > 1.8 };
}

// ---------- fase marca: fotos de Kevin con texto del fabricante (regla de Ernesto, 13-oct 12:35) ----------
// 1) se vuelven a puntuar TODAS las fotos útiles del proveedor con la regla nueva (gpt-4.1-mini, barato) → <id>/audit-marca.json
// 2) se elige la mejor con nota >= 7 (primero fondo blanco) y se arregla igual que siempre → <id>/norm-marca.json + final-marca/
// 3) después «verificar --marca» (gpt-6-sol) revisa las fotos finales con el título. No se busca nada en internet.
const SISTEMA_MARCA = `Eres el revisor de fotos de producto de una tienda online cubana. Recibes el NOMBRE, la CATEGORÍA y la DESCRIPCIÓN de un producto
de marca y sus fotos numeradas (1..N), que manda el proveedor. REGLA NUEVA DE LA TIENDA: el texto y los logos del FABRICANTE (la marca, el nombre
del modelo o sus características, como en las fotos oficiales de Samsung, JBL o EcoFlow) SÍ valen y no bajan la nota.
Para cada foto decide:
- es_el_producto: "si" (este producto, mismo modelo y versión), "no" (otro producto o modelo) o "dudoso".
- color_ok: "si", "no" o "no_se_sabe" (frente al nombre y la descripción).
- fondo: "blanco", "claro_liso", "color", "negro" o "escena".
- texto_que_se_ve: copia el texto añadido a la foto ("" si no hay). tipo_texto: "ninguno", "fabricante", "tienda" (logo o marca de agua de una tienda
  o vendedor), "contacto" (teléfono, @usuario, web o precio) o "mixto".
- collage: "no", "mismo_producto" (varias vistas del mismo producto) o "varios_productos".
- cortado, borrosa: true o false. solo_caja: true si solo se ve la caja o el embalaje. etiqueta: true si es una etiqueta o tabla de datos.
- extras_que_se_ven: objetos que NO son el producto ni lo que la descripción dice que viene (personas, manos, otros productos, comida). "" si no hay.
  Que FALTE algo no es extra. La caja original es extra solo si la descripción no la menciona.
- nota 0-10 CON LA REGLA NUEVA: 9-10 foto de catálogo perfecta; 7-8 buena; 5-6 se entiende pero no sirve de principal; 0-4 no sirve. Otro producto = 0.
  Fondo de ambiente, escena o color fuerte: 6 como máximo.
- motivo: español sencillo, máximo 15 palabras.
Responde solo con el JSON pedido.`;
const ESQUEMA_MARCA = { type: 'json_schema', name: 'auditoria_marca', strict: true, schema: { type: 'object', additionalProperties: false, required: ['fotos'], properties: { fotos: { type: 'array', items: {
  type: 'object', additionalProperties: false,
  required: ['n', 'es_el_producto', 'color_ok', 'fondo', 'texto_que_se_ve', 'tipo_texto', 'collage', 'cortado', 'borrosa', 'solo_caja', 'etiqueta', 'extras_que_se_ven', 'nota', 'motivo'],
  properties: {
    n: { type: 'integer' }, es_el_producto: { type: 'string', enum: ['si', 'no', 'dudoso'] }, color_ok: { type: 'string', enum: ['si', 'no', 'no_se_sabe'] },
    fondo: { type: 'string', enum: ['blanco', 'claro_liso', 'color', 'negro', 'escena'] }, texto_que_se_ve: { type: 'string' },
    tipo_texto: { type: 'string', enum: ['ninguno', 'fabricante', 'tienda', 'contacto', 'mixto'] }, collage: { type: 'string', enum: ['no', 'mismo_producto', 'varios_productos'] },
    cortado: { type: 'boolean' }, borrosa: { type: 'boolean' }, solo_caja: { type: 'boolean' }, etiqueta: { type: 'boolean' }, extras_que_se_ven: { type: 'string' },
    nota: { type: 'integer' }, motivo: { type: 'string' },
  } } } } } };

async function llamar(body, id, tipo, modelo) {
  if (gastoHoy() >= TOPE_DIA) throw new Error(`tope diario de ${TOPE_DIA} USD alcanzado`);
  let d;
  for (let intento = 1; intento <= 4; intento++) {
    const res = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(200e3) })
      .catch((e) => ({ ok: false, status: 0, json: async () => ({ error: { message: e.message } }) }));
    d = await res.json().catch(() => ({}));
    if (res.ok) break;
    if (/insufficient_quota|billing/i.test(d?.error?.message || '')) throw new Error('OpenAI sin saldo');
    if (intento === 4 || (res.status && res.status < 500 && res.status !== 429)) throw new Error(`OpenAI ${res.status}: ${tapar(d?.error?.message || '').slice(0, 200)}`);
    await new Promise((ok) => setTimeout(ok, 4000 * intento));
  }
  const u = d.usage || {}; const pr = PRECIO[modelo] || PRECIO[MODELO_V]; const cached = u.input_tokens_details?.cached_tokens || 0;
  const usd = ((u.input_tokens - cached) * pr.in + cached * pr.cached + u.output_tokens * pr.out) / 1e6;
  fs.appendFileSync(USO(), JSON.stringify({ t: new Date().toISOString(), id, tipo, modelo, in: u.input_tokens, out: u.output_tokens, usd: +usd.toFixed(5) }) + '\n');
  const msg = (d.output || []).find((o) => o.type === 'message');
  return { r: JSON.parse(msg.content.find((c) => c.type === 'output_text').text), usd };
}

async function auditarMarca(id, it) {
  const destino = P(id, 'audit-marca.json');
  if (fs.existsSync(destino) && !flag('otra')) return leer(destino);
  const fotos = (leer(P(id, 'fotos.json'), []) || []).filter((f) => f.estado === 'ok' && fs.existsSync(P(id, f.archivo)));
  if (!fotos.length) { const o = { sin_fotos: true }; guardar(destino, o); return o; }
  const content = [{ type: 'input_text', text: `NOMBRE: ${it.nombre}\nCATEGORÍA: ${it.categoria} / ${it.subcategoria}\nESTADO: ${it.calidad}\nDESCRIPCIÓN: ${String(it.descripcion || '').slice(0, 700)}\nFOTOS: ${fotos.length}` }];
  for (const f of fotos) content.push({ type: 'input_image', image_url: `data:image/jpeg;base64,${await b64(P(id, f.archivo))}`, detail: 'high' });
  const modelo = 'gpt-4.1-mini';
  const { r, usd } = await llamar({ model: modelo, temperature: 0, input: [{ role: 'system', content: SISTEMA_MARCA }, { role: 'user', content }], text: { format: ESQUEMA_MARCA }, max_output_tokens: 2500 }, id, 'auditar-marca', modelo);
  for (const f of r.fotos) f.nota = Math.max(0, Math.min(10, Number(f.nota) || 0));
  const o = { modelo, fecha: new Date().toISOString(), enviadas: fotos.map((f) => f.archivo), respuesta: r, usd: +usd.toFixed(5) };
  guardar(destino, o);
  return o;
}

async function marca() {
  const filasDb = await filas();
  const bloqueo = (r) => { try { return JSON.parse(r.photos_quality || 'null')?.bloqueado || null; } catch { return null; } };
  const bloq = filasDb.filter((r) => r.status === 'nuevo' && r.seller_name === SELLER && bloqueo(r) === 'falta foto buena');
  let lista = bloq.map((r) => r.id); if (ids().length) lista = lista.filter((id) => ids().includes(id));
  const items = itemsMap();
  const c = {};
  for (const id of lista) {
    const it = items.get(id); if (!it) { c.no_en_items = (c.no_en_items || 0) + 1; continue; }
    let audit;
    try { audit = await auditarMarca(id, it); } catch (e) { console.log(id, 'error', tapar(e.message).slice(0, 140)); if (/tope|saldo/.test(e.message)) break; continue; }
    if (!audit?.respuesta) { c.sin_fotos = (c.sin_fotos || 0) + 1; continue; }
    const meta = leer(P(id, 'fotos.json'), []) || [];
    const fotos = audit.respuesta.fotos.map((f) => ({ ...f, archivo: audit.enviadas[f.n - 1] })).filter((f) => f.archivo);
    const motivo = (f) => [f.nota < NOTA_MIN_MARCA && `nota ${f.nota}`, f.es_el_producto !== 'si' && 'otro producto o dudoso', f.color_ok === 'no' && 'otro color',
      ['tienda', 'contacto', 'mixto'].includes(f.tipo_texto) && `texto de ${f.tipo_texto}`, f.collage === 'varios_productos' && 'collage de varios productos',
      f.cortado && 'cortada', f.borrosa && 'borrosa', f.solo_caja && 'solo la caja', f.etiqueta && 'etiqueta', !vacio(f.extras_que_se_ven) && `cosas de más: ${f.extras_que_se_ven}`].filter(Boolean);
    const orden = { blanco: 0, claro_liso: 1 };
    const cand = fotos.filter((f) => !motivo(f).length).sort((a, b) => (orden[a.fondo] ?? 2) - (orden[b.fondo] ?? 2) || b.nota - a.nota);
    const dir = P(id, 'final-marca'); fs.rmSync(dir, { recursive: true, force: true });
    const elegidas = [], descartadas = fotos.filter((f) => motivo(f).length).map((f) => ({ n: f.n, archivo: f.archivo, nota: f.nota, fallos: motivo(f) }));
    for (const f of cand) {
      if (elegidas.length >= 4) break;
      const dst = path.join(dir, `tmp-${f.n}.jpg`);
      let res; try { res = await normalizarFoto(P(id, f.archivo), dst); } catch (e) { res = { ok: false, motivo: 'no se pudo arreglar: ' + e.message.slice(0, 60) }; }
      if (!res.ok) { descartadas.push({ n: f.n, archivo: f.archivo, nota: f.nota, fallos: [res.motivo] }); continue; }
      elegidas.push({ n: f.n, archivo: f.archivo, url: meta.find((m) => m.archivo === f.archivo)?.url, nota: f.nota, motivo: f.motivo, texto_que_se_ve: f.texto_que_se_ve || '', tipo_texto: f.tipo_texto, fondo_ia: f.fondo, ...res, tmp: dst });
    }
    // principal: la primera que no toca el borde ni está muy ampliada; en la galería no entra ninguna que toque el borde
    const iP = elegidas.findIndex((f) => !f.tocaBorde && !f.ampliada); if (iP > 0) elegidas.unshift(...elegidas.splice(iP, 1));
    for (let i = elegidas.length - 1; i >= 1; i--) if (elegidas[i].tocaBorde) { descartadas.push({ n: elegidas[i].n, archivo: elegidas[i].archivo, nota: elegidas[i].nota, fallos: ['toca el borde (galería)'] }); fs.rmSync(elegidas[i].tmp, { force: true }); elegidas.splice(i, 1); }
    elegidas.forEach((f, i) => { const fin = path.join(dir, `limpia-${i + 1}.jpg`); fs.renameSync(f.tmp, fin); f.salida = fin; delete f.tmp; });
    const n0 = leer(P(id, 'norm.json')) || {};
    guardar(P(id, 'norm-marca.json'), { estado: elegidas.length ? 'listo' : 'sin_foto_buena', fuente: elegidas.length ? 'proveedor' : null, regla: REGLA_MARCA, marca: n0.marca, modelo: n0.modelo,
      es_generico: n0.es_generico, avisos: [...(elegidas[0]?.tocaBorde ? ['la foto principal toca el borde (mirar si está cortado)'] : []), ...(elegidas[0]?.ampliada ? [`foto principal ampliada ${elegidas[0].escala}×`] : [])],
      fotos: elegidas, descartadas, fecha: new Date().toISOString() });
    const k = elegidas.length ? 'con_fotos' : 'sin_fotos'; c[k] = (c[k] || 0) + 1;
  }
  console.log(JSON.stringify({ bloqueados_falta_foto_buena: bloq.length, ...c, gasto_hoy: gastoHoy() }));
}

// ---------- verificación de las fotos finales ----------
const SISTEMA = `Eres el control de calidad FINAL de las fotos de una tienda online antes de publicar un producto. Recibes el TÍTULO con el que se va a vender,
la categoría, la descripción y las FOTOS FINALES numeradas (1 = la principal). Para cada foto:
- que_se_ve: qué objeto u objetos se ven, en pocas palabras.
- es_el_producto: "si" si se ve el producto del título entero y reconocible; "parte" si solo se ve una pieza, accesorio, base o dock, cargador
  o detalle; "no" si es otro producto.
- solo_caja: true si se ve la caja o el embalaje en vez del producto. etiqueta: true si es una etiqueta, tabla de ingredientes o de datos.
- vista: "frontal", "tres_cuartos", "lateral", "trasera", "superior", "inferior", "detalle", "interior" o "varios".
- vista_mala: true si así un comprador no reconoce bien el producto: visto por debajo, de canto o de perfil muy fino, solo la parte de atrás
  sin que se vea qué es, primer plano de un detalle, dibujo técnico o despiece, o el producto muy pequeño en la foto.
- cortada: true si el producto sale cortado por el borde. borrosa: true si no está nítida.
- texto_anadido: copia todo texto, rótulo, cifra, medida, flecha, sello, insignia, logo o marca de agua AÑADIDO encima de la foto o fuera del producto.
  La marca y el modelo impresos en el propio producto, en su pantalla encendida o en su etiqueta de fábrica NO cuentan. "" si no hay.
- tipo_texto: "ninguno"; "fabricante" (marca, nombre del modelo o características puestas por el fabricante, como en sus fotos oficiales);
  "tienda" (logo o marca de agua de una tienda, vendedor o web que no es el fabricante); "contacto" (teléfono, @usuario, web o precio); "mixto".
- collage: "no"; "mismo_producto" (varias vistas o colores del mismo producto juntas, o infografía); "varios_productos" (productos distintos juntos).
- objetos_de_mas: personas, manos, comida, decoración u otros productos que no vienen según la descripción. "" si no hay.
- color_cuadra: "si", "no" o "no_se_sabe" (el color de la foto frente al del título o la descripción).
- titulo_correcto: "no" si el título dice un tipo de producto distinto del que se ve (por ejemplo dice "Celular" y son gafas de realidad virtual,
  o dice "Consola" y solo se ve la base); "si" en otro caso.
- contradice_ficha: si un dato escrito en la foto (5G, capacidad, memoria, potencia, modelo, número de piezas) falta o es distinto en el título y la
  descripción, di cuál ("la foto dice 5G y el título no"); "" si no hay contradicción.
- motivo: frase corta en español sencillo.
Sé estricto con la foto 1. Responde solo con el JSON pedido.`;
const ESQUEMA = { type: 'json_schema', name: 'control_final_v2', strict: true, schema: { type: 'object', additionalProperties: false, required: ['fotos'], properties: { fotos: { type: 'array', items: {
  type: 'object', additionalProperties: false,
  required: ['n', 'que_se_ve', 'es_el_producto', 'solo_caja', 'etiqueta', 'vista', 'vista_mala', 'cortada', 'borrosa', 'texto_anadido', 'tipo_texto', 'collage', 'objetos_de_mas', 'color_cuadra', 'titulo_correcto', 'contradice_ficha', 'motivo'],
  properties: {
    n: { type: 'integer' }, que_se_ve: { type: 'string' }, es_el_producto: { type: 'string', enum: ['si', 'parte', 'no'] }, solo_caja: { type: 'boolean' }, etiqueta: { type: 'boolean' },
    vista: { type: 'string', enum: ['frontal', 'tres_cuartos', 'lateral', 'trasera', 'superior', 'inferior', 'detalle', 'interior', 'varios'] },
    vista_mala: { type: 'boolean' }, cortada: { type: 'boolean' }, borrosa: { type: 'boolean' }, texto_anadido: { type: 'string' },
    tipo_texto: { type: 'string', enum: ['ninguno', 'fabricante', 'tienda', 'contacto', 'mixto'] }, collage: { type: 'string', enum: ['no', 'mismo_producto', 'varios_productos'] },
    objetos_de_mas: { type: 'string' }, color_cuadra: { type: 'string', enum: ['si', 'no', 'no_se_sabe'] }, titulo_correcto: { type: 'string', enum: ['si', 'no'] },
    contradice_ficha: { type: 'string' }, motivo: { type: 'string' },
  } } } } } };
const vacio = (s) => !String(s || '').trim() || /^(ninguno|ninguna|no|nada|-|n\/a)$/i.test(String(s).trim());
// modo «estricto»: fuera todo texto añadido y todo collage. Modo «marca» (Ernesto, 13-oct): vale el texto del fabricante y el collage del mismo producto.
const ACCESORIO = /\b(funda|case|carcasa|forro|protector|mica|correa|soporte|estuche|bumper|skin)\b/i;
const APARATO = /m[oó]vil|celular|tel[eé]fono|iphone|samsung|galaxy|smartphone|reloj|watch|tablet|ipad|airpods|aud[ií]fonos/i;
function fallosDe(f, principal, modo, titulo = '') {
  const m = [];
  if (f.es_el_producto === 'no') m.push('otro producto');
  else if (f.es_el_producto === 'parte' && principal) m.push(`solo una parte (${f.que_se_ve})`);
  if (f.solo_caja) m.push('solo la caja');
  if (f.etiqueta) m.push('etiqueta o tabla de datos');
  if (principal && f.vista_mala) m.push(`vista mala (${f.vista})`);
  if (f.cortada) m.push('cortada'); if (f.borrosa) m.push('borrosa');
  const hayTexto = !vacio(f.texto_anadido) || f.tipo_texto !== 'ninguno';
  if (modo === 'marca') { if (['tienda', 'contacto', 'mixto'].includes(f.tipo_texto)) m.push(`texto de ${f.tipo_texto}: ${String(f.texto_anadido).slice(0, 60)}`); }
  else if (hayTexto) m.push(`texto o logo añadido: ${String(f.texto_anadido).slice(0, 60)}`);
  if (f.collage === 'varios_productos' || (modo !== 'marca' && f.collage !== 'no')) m.push('collage');
  if (!vacio(f.objetos_de_mas) && !(ACCESORIO.test(titulo) && APARATO.test(f.objetos_de_mas) && !/mano|persona|comida/i.test(f.objetos_de_mas))) m.push(`cosas de más: ${String(f.objetos_de_mas).slice(0, 60)}`);
  if (f.color_cuadra === 'no') m.push('otro color');
  if (f.titulo_correcto === 'no') m.push(`el título no cuadra con la foto (se ve: ${f.que_se_ve})`);
  return m;
}
const b64 = async (f) => (await sharp(f).rotate().flatten({ background: '#ffffff' }).resize(768, 768, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer()).toString('base64');

async function verificarUno(id, { modo = 'estricto', modelo = MODELO_V, it = null, normFile = 'norm.json' } = {}) {
  const n = leer(P(id, normFile));
  if (!n || n.estado !== 'listo' || !n.fotos?.length) return { veredicto: 'sin_fotos_listas', motivos: ['sin fotos listas'] };
  const destino = P(id, 'verificacion-final.json');
  const prev = leer(destino, {}) || {};
  const clave = `${modo}:${modelo}`;
  const archivos = n.fotos.map((f) => f.salida);
  if (prev[clave] && !flag('otra') && JSON.stringify(prev[clave].archivos) === JSON.stringify(archivos)) return { ...prev[clave], ...veredictoDe(prev[clave].fotos, modo, prev[clave].titulo) };
  if (gastoHoy() >= TOPE_DIA) throw new Error(`tope diario de ${TOPE_DIA} USD alcanzado`);
  const t = leer(P(id, 'texto.json')) || {};
  it = it || itemsMap().get(id) || {};
  const titulo = t.titulo || it.title || it.nombre || '';
  const content = [{ type: 'input_text', text: `TÍTULO: ${titulo}\nCATEGORÍA: ${it.categoria || ''} / ${it.subcategoria || it.category || ''}\nDESCRIPCIÓN: ${String(t.descripcion || it.descripcion || '').slice(0, 600)}\nFOTOS FINALES: ${archivos.length}` }];
  for (const [k, f] of archivos.entries()) {
    if (!fs.existsSync(f)) return { veredicto: 'falta_archivo', motivos: ['falta ' + f] };
    content.push({ type: 'input_text', text: `Foto ${k + 1}:` }, { type: 'input_image', image_url: `data:image/jpeg;base64,${await b64(f)}`, detail: 'high' });
  }
  const body = { model: modelo, input: [{ role: 'system', content: SISTEMA }, { role: 'user', content }], text: { format: ESQUEMA }, max_output_tokens: 3500 };
  if (/^gpt-[56]/.test(modelo)) body.reasoning = { effort: 'low' }; else body.temperature = 0;
  let d;
  for (let intento = 1; intento <= 4; intento++) {
    const res = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(200e3) })
      .catch((e) => ({ ok: false, status: 0, json: async () => ({ error: { message: e.message } }) }));
    d = await res.json().catch(() => ({}));
    if (res.ok) break;
    if (/insufficient_quota|billing/i.test(d?.error?.message || '')) throw new Error('OpenAI sin saldo');
    if (intento === 4 || (res.status && res.status < 500 && res.status !== 429)) throw new Error(`OpenAI ${res.status}: ${tapar(d?.error?.message || '').slice(0, 200)}`);
    await new Promise((ok) => setTimeout(ok, 4000 * intento));
  }
  const u = d.usage || {}; const pr = PRECIO[modelo] || PRECIO[MODELO_V]; const cached = u.input_tokens_details?.cached_tokens || 0;
  const usd = ((u.input_tokens - cached) * pr.in + cached * pr.cached + u.output_tokens * pr.out) / 1e6;
  fs.appendFileSync(USO(), JSON.stringify({ t: new Date().toISOString(), id, tipo: cmd, modo, modelo, in: u.input_tokens, out: u.output_tokens, usd: +usd.toFixed(5) }) + '\n');
  const msg = (d.output || []).find((o) => o.type === 'message');
  const r = JSON.parse(msg.content.find((c) => c.type === 'output_text').text);
  const fotos = r.fotos.map((f) => ({ ...f, archivo: archivos[f.n - 1] }));
  const v = { modo, modelo, fecha: new Date().toISOString(), titulo, archivos, fotos, usd: +usd.toFixed(5), ...veredictoDe(fotos, modo, titulo) };
  prev[clave] = v; guardar(destino, prev);
  return v;
}
// veredicto con las reglas del código (manda sobre la IA): «contradice» solo si hay texto escrito en la foto
function veredictoDe(fotos, modo, titulo) {
  const con = fotos.map((f) => ({ ...f, fallos: fallosDe(f, f.n === 1, modo, titulo) }));
  const p = con.find((f) => f.n === 1);
  const galeria_mal = con.filter((f) => f.n !== 1 && f.fallos.length).map((f) => f.n);
  const contradice = con.filter((f) => !vacio(f.contradice_ficha) && !vacio(f.texto_anadido)).map((f) => f.contradice_ficha);
  const veredicto = !p || p.fallos.length ? 'mal' : galeria_mal.length ? 'galeria_mal' : contradice.length ? 'contradice' : 'ok';
  const motivos = !p ? ['sin respuesta para la foto 1'] : p.fallos.length ? p.fallos : contradice.length ? contradice.map((x) => 'contradice la ficha: ' + x) : [];
  return { fotos: con, veredicto, motivos, galeria_mal };
}

async function verificar() {
  const modo = flag('marca') ? 'marca' : 'estricto';
  const normFile = modo === 'marca' ? 'norm-marca.json' : 'norm.json';
  const lista = ids().length ? ids() : (leer(P('items.json'), []) || []).map((x) => x.id).filter((id) => leer(P(id, normFile))?.estado === 'listo');
  const modelo = opt('modelo', MODELO_V);
  const c = {}; const it = itemsMap();
  for (const id of lista) {
    if (leer(P(id, normFile))?.estado !== 'listo') continue;
    try { const v = await verificarUno(id, { modo, modelo, it: it.get(id), normFile }); c[v.veredicto] = (c[v.veredicto] || 0) + 1; console.log(id, v.veredicto, (v.motivos || []).join(' · ').slice(0, 150)); }
    catch (e) { console.log(id, 'error', tapar(e.message).slice(0, 160)); if (/tope|saldo/.test(e.message)) break; }
  }
  console.log(JSON.stringify({ modo, ...c, gasto_hoy: gastoHoy() }));
}

// ---------- prueba contra la revisión a mano del 12-oct ----------
async function prueba() {
  const rev = leer(P('hojas', 'revision.json'));
  const rechazados = Object.keys(rev.fuera).map(Number);
  const dudas = Object.keys(rev.dudas).map(Number);
  const ok = [...new Set(rev.hojas.flatMap((h) => h.ok))].filter((id) => !dudas.includes(id)).sort((a, b) => a - b);
  const N = Math.min(Number(opt('muestra', 40)), ok.length);
  const muestra = Array.from({ length: N }, (_, k) => ok[Math.floor(k * ok.length / N)]);
  const modelo = opt('modelo', MODELO_V);
  const it = itemsMap(); const filasP = [];
  for (const [grupo, lista] of [['rechazado a mano', rechazados], ['duda (se publicó)', dudas], ['aprobado a mano', muestra]]) {
    for (const id of lista) {
      try { const v = await verificarUno(id, { modo: 'estricto', modelo, it: it.get(id) }); filasP.push({ id, grupo, veredicto: v.veredicto, motivos: v.motivos, galeria_mal: v.galeria_mal, a_mano: rev.fuera[id] || rev.dudas[id] || '' }); }
      catch (e) { filasP.push({ id, grupo, veredicto: 'error', motivos: [tapar(e.message).slice(0, 120)] }); if (/tope|saldo/.test(e.message)) break; }
    }
  }
  const tabla = {};
  for (const f of filasP) { const t = (tabla[f.grupo] ||= { total: 0, para: 0, pasa: 0, solo_galeria: 0, contradice: 0, error: 0 }); t.total++; if (f.veredicto === 'mal') t.para++; else if (f.veredicto === 'ok') t.pasa++; else if (f.veredicto === 'galeria_mal') t.solo_galeria++; else if (f.veredicto === 'contradice') t.contradice++; else t.error++; }
  const usd = (fs.existsSync(USO()) ? fs.readFileSync(USO(), 'utf8').split('\n').filter(Boolean).map(JSON.parse) : []).filter((x) => x.tipo === 'prueba' && x.modelo === modelo).reduce((s, x) => s + x.usd, 0);
  guardar(path.join(AUTO, `prueba-verificar-${modelo}.json`), { fecha: new Date().toISOString(), modelo, tabla, usd: +usd.toFixed(4), filas: filasP });
  console.log(JSON.stringify(tabla, null, 1));
  for (const f of filasP) if ((f.grupo === 'rechazado a mano') !== (f.veredicto === 'mal')) console.log(`${f.grupo} #${f.id}: ${f.veredicto} · ${(f.motivos || []).join(' · ').slice(0, 150)}${f.galeria_mal?.length ? ' · galería mal: ' + f.galeria_mal.join(',') : ''}${f.a_mano ? ' | a mano: ' + f.a_mano : ''}`);
  console.log(`gasto de la prueba (${modelo}): ${usd.toFixed(4)} USD`);
}

// ---------- promover: los de marca que pasaron → norm.json (para textos y subir) ----------
// excluir.json (en auto/): { "id": "motivo" } → no se promueven ni se publican; salen en la hoja de dudosos con ese motivo.
const excluidos = () => leer(path.join(AUTO, 'excluir.json'), {}) || {};
function promover() {
  const c = {};
  const exc = excluidos();
  const lista = ids().length ? ids() : (leer(P('items.json'), []) || []).map((x) => x.id);
  for (const id of lista) {
    const nm = leer(P(id, 'norm-marca.json')); if (!nm || nm.estado !== 'listo') continue;
    if (exc[id]) { c.excluido = (c.excluido || 0) + 1; continue; }
    const vf = leer(P(id, 'verificacion-final.json'), {}) || {};
    let v = vf[`marca:${MODELO_V}`];
    if (!v || JSON.stringify(v.archivos) !== JSON.stringify(nm.fotos.map((f) => f.salida))) { c.sin_verificar = (c.sin_verificar || 0) + 1; continue; }
    v = { ...v, ...veredictoDe(v.fotos, 'marca', v.titulo) };
    // galería mal: se quitan esas fotos y se queda la principal (que sí pasó)
    if (v.veredicto === 'galeria_mal') {
      const quedan = v.fotos.filter((f) => !v.galeria_mal.includes(f.n));
      nm.fotos = nm.fotos.filter((f) => quedan.some((q) => q.archivo === f.salida));
      const v2 = { ...v, archivos: nm.fotos.map((f) => f.salida), fotos: quedan, nota: 'galería recortada: ' + v.galeria_mal.join(',') };
      Object.assign(v2, veredictoDe(quedan, 'marca', v.titulo));
      vf[`marca:${MODELO_V}`] = v2; guardar(P(id, 'verificacion-final.json'), vf); guardar(P(id, 'norm-marca.json'), nm); v = v2;
    }
    if (!['ok', 'contradice'].includes(v.veredicto)) { c[v.veredicto] = (c[v.veredicto] || 0) + 1; continue; }
    if (!fs.existsSync(P(id, 'norm-antes-marca.json')) && fs.existsSync(P(id, 'norm.json'))) fs.copyFileSync(P(id, 'norm.json'), P(id, 'norm-antes-marca.json'));
    const n = leer(P(id, 'norm.json')) || {};
    guardar(P(id, 'norm.json'), { ...n, ...nm, evaluadas: n.evaluadas || [], estado: 'listo', fuente: 'proveedor', regla: REGLA_MARCA, verificacion: v.veredicto, contradice: v.veredicto === 'contradice' ? v.motivos : undefined, fecha: new Date().toISOString() });
    c[v.veredicto] = (c[v.veredicto] || 0) + 1;
  }
  console.log(JSON.stringify(c));
}

// ---------- etiquetar: apunta en photos_quality que la foto entró por la regla de marca (después de «subir») ----------
async function etiquetar() {
  const c = {};
  const lista = ids().length ? ids() : (leer(P('items.json'), []) || []).map((x) => x.id);
  for (const id of lista) {
    const n = leer(P(id, 'norm.json'));
    if (n?.regla !== REGLA_MARCA || !fs.existsSync(P(id, 'subido.json'))) continue;
    const { data: r } = await db.from('crm_market_items').select('id,status,photos_quality').eq('business_id', BIZ).eq('id', id).maybeSingle();
    if (!r || r.status !== 'nuevo') continue;
    let q = {}; try { q = JSON.parse(r.photos_quality || '{}') || {}; } catch { q = {}; }
    if (q.regla === REGLA_MARCA) { c.ya = (c.ya || 0) + 1; continue; }
    q.regla = REGLA_MARCA; q.verificacion = n.verificacion || null; q.texto_fabricante = n.fotos?.[0]?.texto_que_se_ve || undefined; if (n.contradice) q.contradice = n.contradice;
    const { error } = await db.from('crm_market_items').update({ photos_quality: JSON.stringify(q) }).eq('business_id', BIZ).eq('id', id).eq('status', 'nuevo');
    c[error ? 'error' : 'hecho'] = (c[error ? 'error' : 'hecho'] || 0) + 1;
  }
  console.log(JSON.stringify(c));
}

// ---------- decisión y publicación ----------
const noContacts = (t = '') => String(t).replace(/(\+?53)?[\s-]*\d[\d\s-]{6,}\d/g, '').replace(/@\w+/g, '').replace(/wa\.me\/\S+/gi, '').trim();
async function web(ruta, body) {
  const WEB = (process.env.WOO_URL || '').replace(/\/$/, ''), KEY = process.env.CURRU_KEY || '';
  if (!WEB || !KEY) throw new Error('falta WOO_URL o CURRU_KEY en el .env');
  const res = await fetch(`${WEB}/wp-json/casa-viva/v1${ruta}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-VivaBot-Key': KEY }, body: JSON.stringify(body || {}), signal: AbortSignal.timeout(90e3) });
  const d = await res.json().catch(() => ({}));
  if (!res.ok || !d.ok) throw new Error(d.error || d.message || `HTTP ${res.status}`);
  return d;
}
async function filas() {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('crm_market_items').select('id,status,title,description,category,my_price,supplier_price,currency,price_locked,photos_ok,photos_clean,photos_quality,seller_name,norm_key')
      .eq('business_id', BIZ).order('id').range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...data); if (data.length < 1000) break;
  }
  return out;
}
function publicadosHoy() {
  const f = P('publicados.jsonl'); if (!fs.existsSync(f)) return 0;
  return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(JSON.parse).filter((x) => x.auto && cuba(x.at) === hoy()).length;
}

async function decidir(r, todas, items) {
  const m = [];
  const it = items.get(r.id) || {};
  const n = leer(P(r.id, 'norm.json'));
  const t = leer(P(r.id, 'texto.json'));
  if (!n || n.estado !== 'listo' || !n.fotos?.length) return { motivos: ['sin fotos listas en los archivos'], it, n, t };
  const esMarca = n.regla === REGLA_MARCA;
  const pr = n.fotos[0];
  const min = esMarca ? NOTA_MIN_MARCA : NOTA_MIN;
  if (pr.nota < min) m.push(`nota ${pr.nota} (mínimo ${min})`);
  if (pr.tocaBorde) m.push('la foto principal toca el borde');
  if (pr.ampliada) m.push(`foto principal ampliada ${pr.escala}×`);
  if ((r.photos_clean || []).length !== n.fotos.length) m.push('las fotos de la fila no son las revisadas');
  if (!t?.ok) m.push('texto sin validar');
  else if (r.title !== t.titulo || String(r.description || '').trim() !== String(t.descripcion || '').trim()) m.push('el texto de la fila no es el revisado');
  if (r.currency !== 'USD' || !(Number(r.my_price) > 0)) m.push('sin precio en USD');
  else {
    if (!(gestoraShare(r.my_price, r.supplier_price) > 0)) m.push('el precio no deja comisión');
    if (!r.price_locked && Number(r.supplier_price) > 0 && Number(myPrice(Number(r.supplier_price), 'USD')) !== Number(r.my_price)) m.push(`precio ${r.my_price} distinto de la regla (${myPrice(Number(r.supplier_price), 'USD')})`);
  }
  const clave = norm(it.nombre || r.title) + '|' + r.my_price;
  const otro = todas.find((x) => x.id !== r.id && x.status !== 'descartado' && norm((items.get(x.id) || {}).nombre || x.title) + '|' + x.my_price === clave);
  if (otro) m.push(`posible repetido de #${otro.id} (${otro.status})`);
  if (SENSIBLE.test(`${it.categoria || ''} ${it.subcategoria || ''} ${r.category || ''} ${r.title || ''}`)) m.push('categoría sensible');
  if (n.fuente === 'web') {
    const vw = (leer(P(r.id, 'verificacion.json'), {}) || {})[MODELO_V];
    if (!(vw && n.fotos.every((f) => vw.candidatas.some((c) => c.archivo === f.archivo && c.veredicto === 'ok')))) m.push('foto de internet sin comparar con la del proveedor');
  }
  let v = null;
  if (!m.length) {
    v = await verificarUno(r.id, { modo: esMarca ? 'marca' : 'estricto', it });
    if (v.veredicto !== 'ok') m.push(...(v.veredicto === 'galeria_mal' ? [`foto de galería mal: ${v.galeria_mal.join(',')}`] : (v.motivos.length ? v.motivos : [v.veredicto]).map((x) => 'verificación: ' + x)));
  }
  return { motivos: m, it, n, t, v };
}

async function auto() {
  if (fs.existsSync(path.join(AUTO, 'APAGADO'))) { console.log('apagado (existe auto/APAGADO)'); return; }
  const PUBLICAR = flag('publicar');
  const MAX = Math.min(Number(opt('max', MAX_DIA)), MAX_DIA);
  const todas = await filas();
  const items = itemsMap();
  let cand = todas.filter((r) => r.status === 'nuevo' && r.seller_name === SELLER && r.photos_ok && (r.photos_clean || []).length && !/"bloqueado"/.test(r.photos_quality || ''));
  if (ids().length) cand = cand.filter((r) => ids().includes(r.id));
  const listos = [], dudosos = [];
  const exc = excluidos();
  for (const [k, motivo] of Object.entries(exc)) {
    const r = todas.find((x) => x.id === Number(k) && x.status === 'nuevo'); if (!r || (ids().length && !ids().includes(r.id))) continue;
    const n = [leer(P(r.id, 'norm.json')), leer(P(r.id, 'norm-marca.json'))].find((x) => x?.estado === 'listo' && x.fotos?.length) || null;
    dudosos.push({ r, motivos: ['a mano: ' + motivo], n, it: items.get(r.id) });
  }
  cand = cand.filter((r) => !exc[r.id]);
  for (const r of cand) {
    try { const d = await decidir(r, todas, items); (d.motivos.length ? dudosos : listos).push({ r, ...d }); }
    catch (e) { dudosos.push({ r, motivos: ['error: ' + tapar(e.message).slice(0, 120)], n: leer(P(r.id, 'norm.json')), it: items.get(r.id) }); if (/tope|saldo/.test(e.message)) break; }
  }
  let ya = publicadosHoy(), hechos = 0, fallos = 0;
  const resultado = [];
  for (const x of listos) {
    const r = x.r;
    if (!PUBLICAR) { resultado.push({ id: r.id, accion: 'se publicaría', titulo: r.title, precio: r.my_price }); continue; }
    if (ya >= MAX) { resultado.push({ id: r.id, accion: 'espera (tope diario)' }); continue; }
    try {
      const images = [];
      for (const p of r.photos_clean.slice(0, 4)) { const { data: s } = await db.storage.from(BUCKET).createSignedUrl(p, 3600); if (s?.signedUrl) images.push(s.signedUrl); }
      if (!images.length) throw new Error('no tiene fotos');
      const d = await web('/bot/market/publish', { item_id: r.id, title: r.title, description: noContacts(r.description || ''), price: Number(r.my_price),
        commission: gestoraShare(r.my_price, r.supplier_price), images, replace_images: false, version: Date.now(), supplier_category: r.category || '' });
      await db.from('crm_market_items').update({ status: 'publicado', published_url: d.url }).eq('id', r.id).eq('status', 'nuevo');
      fs.appendFileSync(P('publicados.jsonl'), JSON.stringify({ id: r.id, url: d.url, at: new Date().toISOString(), auto: true }) + '\n');
      resultado.push({ id: r.id, accion: 'PUBLICADO', url: d.url }); hechos++; ya++;
    } catch (e) { resultado.push({ id: r.id, accion: 'fallo', error: e.message.slice(0, 160) }); fallos++; }
  }
  // dudosos: datos y miniaturas para la hoja de Claude (se dibuja en Windows con hojas-web.mjs; el VPS no tiene fuentes)
  const dia = hoy();
  const dir = path.join(AUTO, `dudosos-${dia}`);
  fs.rmSync(dir, { recursive: true, force: true });
  const hd = [];
  for (const x of dudosos) {
    const n = x.n; if (!n?.fotos?.length) continue;
    const md = path.join(dir, 'minis', String(x.r.id)); fs.mkdirSync(md, { recursive: true });
    for (const [i, f] of n.fotos.entries()) if (fs.existsSync(f.salida)) await sharp(f.salida).resize(i === 0 ? 440 : 150, i === 0 ? 440 : 150).jpeg({ quality: 82 }).toFile(path.join(md, `${i + 1}.jpg`));
    hd.push({ id: x.r.id, titulo: x.r.title, precio: x.r.my_price, nota: n.fotos[0].nota, notas: n.fotos.map((f) => f.nota), fotos: n.fotos.length, fuente: n.fuente,
      avisos: x.motivos, borde: Boolean(n.fotos[0].tocaBorde), ampliada: Boolean(n.fotos[0].ampliada), categoria: (x.it || {}).subcategoria || x.r.category, prioridad: (x.it || {}).prioridad || 0,
      dominio: n.fuente === 'web' ? (() => { try { return new URL(n.fotos[0].pagina || n.fotos[0].url).host.replace(/^www\./, ''); } catch { return null; } })() : null, regla: n.regla || null });
  }
  hd.sort((a, b) => b.prioridad - a.prioridad);
  guardar(path.join(dir, 'hojas-datos.json'), hd);
  const resumen = { fecha: new Date().toISOString(), seco: !PUBLICAR, candidatos: cand.length, publicables: listos.length, publicados: hechos, fallos, dudosos: dudosos.length,
    gasto_hoy: gastoHoy(), resultado, dudosos_detalle: dudosos.map((x) => ({ id: x.r.id, titulo: x.r.title, motivos: x.motivos })) };
  guardar(path.join(AUTO, `auto-${dia}${PUBLICAR ? '' : '-seco'}.json`), resumen);
  const linea = `Publiqué ${hechos} bajo pedido nuevos · ${dudosos.length} dudosos esperan revisión`;
  console.log(JSON.stringify({ candidatos: cand.length, publicables: listos.length, publicados: hechos, fallos, dudosos: dudosos.length, gasto_hoy: resumen.gasto_hoy }));
  console.log(PUBLICAR ? linea : `(en seco) ${listos.length} se publicarían · ${dudosos.length} dudosos`);
  if (flag('avisar') && PUBLICAR && (hechos || dudosos.length)) {
    const dest = process.env.AVISO_DEST;
    if (!dest) console.log('sin AVISO_DEST: no se manda el aviso');
    else { try { execFileSync('/usr/local/bin/cv', ['enviar', dest, linea], { stdio: 'inherit', timeout: 60e3 }); } catch (e) { console.log('aviso no enviado:', e.message.slice(0, 120)); } }
  }
}

function presupuesto() { console.log((totalUsoFotosBolsa() + Math.max(0, TOPE_DIA - gastoHoy())).toFixed(4)); }

const fases = { prueba, marca, verificar, promover, etiquetar, auto, presupuesto };
if (!fases[cmd]) { console.log('Fases: ' + Object.keys(fases).join(', ')); process.exit(1); }
await fases[cmd]();
process.exit(0);
