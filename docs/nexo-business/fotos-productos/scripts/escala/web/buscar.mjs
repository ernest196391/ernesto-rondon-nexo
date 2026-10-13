// Busca en internet fotos del MISMO producto con la herramienta web_search de OpenAI (Responses API, búsqueda de imágenes).
// Uso: node buscar.mjs --ids 577,542 [--modelo gpt-4.1-mini] [--max 10] [--otra]
// Guarda <id>/busqueda-web.json. Solo lee; no escribe nada en Supabase.
import fs from 'fs';
import { sharp, leer, guardar, P, PW, tapar } from './comun.mjs';
import { gastoPiloto, TOPE } from './gasto.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const MODELO = opt('modelo', 'gpt-4.1-mini');
const MAX = Number(opt('max', 10));
const IDS = String(opt('ids', '')).split(',').map(Number).filter(Boolean);
const SIN_FOTO_REF = args.includes('--sin-ref');
// USD por millón de tokens (docs oficiales de OpenAI, 13-oct-2026) y por llamada de búsqueda (10 USD / 1 000 llamadas).
// gpt-4.1-mini: el contenido de la búsqueda se cobra como un bloque fijo de 8 000 tokens de entrada por llamada.
const PRECIO = {
  'gpt-4.1-mini': { in: 0.40, cached: 0.10, out: 1.60, bloque: 8000 },
  'gpt-4.1': { in: 2.0, cached: 0.5, out: 8.0, bloque: 8000 },
  'gpt-5-mini': { in: 0.25, cached: 0.025, out: 2.0, bloque: 0 },
  'gpt-5-nano': { in: 0.05, cached: 0.005, out: 0.40, bloque: 0 },
  'gpt-6-luna': { in: 0.10, cached: 0.01, out: 0.50, bloque: 0 },
  'gpt-5.6-luna': { in: 0.20, cached: 0.02, out: 1.20, bloque: 0 },
  'gpt-5.4-mini': { in: 0.75, cached: 0.075, out: 4.50, bloque: 0 },
  'gpt-5.4-nano': { in: 0.20, cached: 0.02, out: 1.25, bloque: 0 },
};
const POR_LLAMADA = 0.01;
const items = new Map(leer(P('items.json'), []).map((x) => [x.id, x]));

const SISTEMA = `Buscas en internet la FOTO DE CATÁLOGO de un producto que vende una tienda de Cuba.
Te doy el nombre, la descripción, la marca y el modelo si se conocen, y una FOTO DE REFERENCIA del proveedor (lo que de verdad se vende).
Busca imágenes del MISMO producto: mismo modelo, misma versión y mismo color que la foto de referencia.
Prefiere: 1) la web oficial del fabricante; 2) tiendas grandes (Amazon, Walmart, Best Buy, Target, Home Depot, eBay, AliExpress, Temu, Alibaba, Newegg, B&H).
Si el producto no tiene marca (genérico), busca el anuncio original en Amazon, AliExpress, Temu o Alibaba con el mismo diseño y color: la foto del proveedor suele salir de ahí.
Queremos la foto principal: el producto solo, entero, sobre fondo blanco, sin texto añadido, sin logos de tienda ni marcas de agua, sin collage.
Haz varias búsquedas de imágenes si hace falta (en inglés y en español). Responde solo con el JSON pedido.`;

const ESQUEMA = {
  type: 'json_schema', name: 'busqueda_fotos', strict: true,
  schema: {
    type: 'object', additionalProperties: false, required: ['identificado', 'paginas', 'imagenes', 'nota'],
    properties: {
      identificado: { type: 'string' },
      paginas: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['url', 'tienda', 'mismo_modelo'], properties: { url: { type: 'string' }, tienda: { type: 'string' }, mismo_modelo: { type: 'string', enum: ['si', 'probable', 'dudoso'] } } } },
      imagenes: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['url', 'pagina', 'por_que'], properties: { url: { type: 'string' }, pagina: { type: 'string' }, por_que: { type: 'string' } } } },
      nota: { type: 'string' },
    },
  },
};

async function referencia(id) {
  const n = leer(P(id, 'norm.json')) || {};
  const ev = (n.evaluadas || []).filter((e) => e.archivo && fs.existsSync(P(id, e.archivo))).sort((a, b) => b.nota - a.nota)[0];
  const f = ev ? P(id, ev.archivo) : (leer(P(id, 'fotos.json'), []) || []).map((x) => P(id, x.archivo)).find((x) => fs.existsSync(x));
  if (!f) return null;
  return (await sharp(f).rotate().flatten({ background: '#ffffff' }).resize(768, 768, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer()).toString('base64');
}

async function buscarUno(id) {
  const destino = P(id, 'busqueda-web.json');
  if (fs.existsSync(destino) && !args.includes('--otra')) return leer(destino);
  const g = gastoPiloto();
  if (g.total_usd >= TOPE - 0.15) throw new Error(`tope del piloto casi alcanzado (${g.total_usd} USD)`);
  const it = items.get(id); if (!it) throw new Error('no está en items.json');
  const n = leer(P(id, 'norm.json')) || {};
  const ref = SIN_FOTO_REF ? null : await referencia(id);
  const texto = `NOMBRE: ${it.nombre}\nCATEGORÍA: ${it.categoria} / ${it.subcategoria}\nMARCA: ${n.marca || 'desconocida'}\nMODELO: ${n.modelo || 'desconocido'}\nDESCRIPCIÓN: ${String(it.descripcion || '').slice(0, 700)}`;
  const content = [{ type: 'input_text', text: texto }];
  if (ref) content.push({ type: 'input_text', text: 'FOTO DE REFERENCIA DEL PROVEEDOR:' }, { type: 'input_image', image_url: `data:image/jpeg;base64,${ref}`, detail: 'low' });
  const body = {
    model: MODELO, input: [{ role: 'system', content: SISTEMA }, { role: 'user', content }],
    tools: [{ type: 'web_search', search_content_types: ['image', 'text'], image_settings: { max_results: MAX, caption: true } }],
    include: ['web_search_call.results', 'web_search_call.action.sources'], text: { format: ESQUEMA }, max_output_tokens: 4000,
  };
  if (/^gpt-[56]/.test(MODELO)) body.reasoning = { effort: 'low' }; else body.temperature = 0;
  const t0 = Date.now();
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(300e3),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}: ${tapar(d?.error?.message || '').slice(0, 400)}`);
  const llamadas = (d.output || []).filter((o) => o.type === 'web_search_call');
  const u = d.usage || {}; const pr = PRECIO[MODELO] || PRECIO['gpt-4.1-mini'];
  const cached = u.input_tokens_details?.cached_tokens || 0;
  const usd = ((u.input_tokens - cached) * pr.in + cached * pr.cached + u.output_tokens * pr.out + llamadas.length * pr.bloque * pr.in) / 1e6 + llamadas.length * POR_LLAMADA;
  fs.appendFileSync(PW + '/uso-piloto.jsonl', JSON.stringify({ t: new Date().toISOString(), id, modelo: MODELO, in: u.input_tokens, cached, out: u.output_tokens, llamadas_web: llamadas.length, usd: +usd.toFixed(5), s: Math.round((Date.now() - t0) / 1000) }) + '\n');
  const imagenesWeb = llamadas.flatMap((c) => (c.results || []).filter((r) => r.type === 'image_result' || r.image_url))
    .map((r) => ({ url: r.image_url, pagina: r.source_website_url, mini: r.thumbnail_url, caption: r.caption }));
  const fuentes = llamadas.flatMap((c) => c.action?.sources || []).map((s) => s.url).filter(Boolean);
  const consultas = llamadas.map((c) => c.action?.query || c.action?.queries || null).filter(Boolean);
  const msg = (d.output || []).find((o) => o.type === 'message');
  let r = null;
  try { r = JSON.parse(msg?.content?.find((c) => c.type === 'output_text')?.text || 'null'); } catch { r = { crudo: String(msg?.content?.[0]?.text || '').slice(0, 2000) }; }
  const out = { id, modelo: MODELO, fecha: new Date().toISOString(), segundos: Math.round((Date.now() - t0) / 1000), llamadas_web: llamadas.length, consultas, usd: +usd.toFixed(5), usage: u, respuesta: r, imagenes_web: imagenesWeb, fuentes };
  guardar(destino, out);
  fs.mkdirSync(PW + '/crudo', { recursive: true });
  fs.writeFileSync(PW + `/crudo/${id}-${MODELO}.json`, JSON.stringify(d, null, 1));
  return out;
}

const resumen = [];
for (const id of IDS) {
  try {
    const o = await buscarUno(id);
    resumen.push({ id, llamadas: o.llamadas_web, img_web: o.imagenes_web.length, img_ia: o.respuesta?.imagenes?.length, paginas: o.respuesta?.paginas?.length, usd: o.usd, s: o.segundos, ident: String(o.respuesta?.identificado || '').slice(0, 90) });
  } catch (e) { resumen.push({ id, error: tapar(e.message).slice(0, 400) }); if (/tope/.test(e.message)) { console.log(JSON.stringify(resumen.at(-1))); break; } }
  console.log(JSON.stringify(resumen.at(-1)));
}
console.log(JSON.stringify(gastoPiloto()));
