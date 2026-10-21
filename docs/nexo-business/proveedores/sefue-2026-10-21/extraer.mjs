// SeFué (www.sefue.app, tienda Odoo) → catalogo.json + resumen.md. PRUEBA EN SECO: solo lee su web pública.
// No crea cuentas, no compra, no escribe en la bolsa (crm_market_items) ni en casaviva.company.
// 21-oct-2026, Ernesto: «ya tenemos las fotos y descripciones de sus productos… solo poner nuestros precios».
//
// OJO: su robots.txt dice «Disallow: /» (no quieren robots). Por eso este script hace POCAS peticiones, despacio
// (3 s entre una y otra, guarda copia local y no repite) y por defecto solo abre 10 fichas para la descripción.
// Antes de bajar las ~150 fichas o de usar sus fotos, pedirle permiso a SeFué (o que nos mande su Excel de Odoo).
//
// Uso:
//   node extraer.mjs                         → listado + categorías + 10 fichas de muestra (unas 23 peticiones)
//   node extraer.mjs --detalles 0            → solo listado y categorías (unas 13 peticiones)
//   node extraer.mjs --detalles todos        → todas las fichas (≈150 peticiones; SOLO con permiso de SeFué)
//   node extraer.mjs --web web.json          → marca parecidos con lo que ya hay en casaviva.company
//                                              (web.json = `wp post list --post_type=product --post_status=publish,private,draft,pending --fields=ID,post_title,post_status --format=json`)
//   --cache <carpeta>  copia de las páginas (por defecto en la carpeta temporal del sistema; NO en el repo)
//   --sin-red          usa solo la copia local
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const BASE = 'https://www.sefue.app';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const PAUSA_MS = 3000;
const CACHE = arg('--cache', path.join(os.tmpdir(), 'sefue-cache'));
const SIN_RED = args.includes('--sin-red');
const DET = arg('--detalles', '10');
const WEB = arg('--web', null);
const PRICE_JS = arg('--precio', path.resolve(DIR, '../../../../../vivabot/src/market-price.js'));
const { myPrice, gestoraShare } = await import(pathToFileURL(PRICE_JS).href);

fs.mkdirSync(CACHE, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let peticiones = 0;
async function get(url) {
  const file = path.join(CACHE, url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_').slice(0, 180) + '.html');
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  if (SIN_RED) return null;
  for (let intento = 1; intento <= 3; intento++) {
    if (peticiones++) await sleep(PAUSA_MS);
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9' }, signal: AbortSignal.timeout(20000) });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const h = await r.text();
      fs.writeFileSync(file, h);
      return h;
    } catch (e) {
      console.error(`  ⚠️ ${url}: ${e.message} (intento ${intento}/3)`);
      if (intento === 3) return null;
      await sleep(PAUSA_MS * intento);
    }
  }
}

const ent = (s) => String(s || '').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
const texto = (h) => ent(String(h || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>|<\/(p|li|div|h\d)>/gi, '\n').replace(/<[^>]+>/g, ' '))
  .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
const num = (s) => Number(String(s).replace(/\./g, '').replace(',', '.'));
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const abs = (u) => (u ? new URL(ent(u), BASE).href : null);

// ---------- 1. Moneda: Odoo publica sus monedas; el «$» delante del número es USD (el CUP lo pone detrás).
function monedaDe(h) {
  const m = h.match(/"currencies":\s*(\{.*?\}\})/);
  if (!m) return { moneda: '?', nota: 'no encuentro la lista de monedas' };
  const cur = JSON.parse(m[1]);
  const delante = Object.values(cur).filter((c) => c.position === 'before').map((c) => c.name);
  return { moneda: delante.length === 1 ? delante[0] : '?', monedas: Object.values(cur).map((c) => `${c.name} (${c.symbol} ${c.position === 'before' ? 'delante' : 'detrás'})`) };
}

// ---------- 2. Tarjetas del listado.
function tarjetas(h) {
  const out = [];
  for (const blk of h.split('<form role="article" class="oe_product_cart').slice(1)) {
    const b = blk.slice(0, blk.indexOf('</form>'));
    const href = b.match(/href="(\/shop\/[^"#?]+)"/)?.[1];
    const tpl = b.match(/name="product_template_id"[^>]*value="(\d+)"/)?.[1] || href?.match(/-(\d+)$/)?.[1];
    const precios = [...b.matchAll(/<span([^>]*)>\s*(?:\$|US\$)?\s*(?:&nbsp;| |\s)*<span class="oe_currency_value">([\d.,]+)<\/span>/g)]
      .map((m) => ({ venta: /price_reduce|Precio de venta/.test(m[1]), v: num(m[2]) }));
    const venta = precios.find((p) => p.venta) || precios[0];
    const tachado = precios.find((p) => p !== venta && p.v > (venta?.v || 0));
    const imgs = [...b.matchAll(/<img src="([^"]+)"[^>]*alt="([^"]*)"/g)].map((m) => ({ url: abs(m[1]).replace(/\/image_\d+\//, '/image_1920/'), alt: ent(m[2]) }));
    out.push({
      id: tpl ? +tpl : null,
      variante_id: +(b.match(/name="product_id"[^>]*value="(\d+)"/)?.[1] || 0) || null,
      nombre: ent(b.match(/aria-label="([^"]+)"/)?.[1] || '').trim(),
      url: href ? BASE + href : null,
      precio: venta ? venta.v : null,
      precio_tachado: tachado ? tachado.v : null,
      cinta: texto(b.match(/<span class="o_ribbons[^"]*"[^>]*>([\s\S]*?)<\/span>/)?.[1] || '') || null,
      publicado: /data-publish="on"/.test(blk.slice(0, 300)),
      imagenes_listado: imgs,
    });
  }
  return out;
}
const paginas = (h) => Math.max(1, ...[...h.matchAll(/href="\/shop\/(?:category\/[a-z0-9-]+\/)?page\/(\d+)/g)].map((m) => +m[1]));
const categoriasDe = (h) => {
  const seen = new Map();
  for (const m of h.matchAll(/href="\/shop\/category\/([a-z0-9-]+-(\d+))"[^>]*>([\s\S]*?)<\/a>/g)) {
    const nombre = texto(m[3]).split('\n')[0];
    if (nombre && !seen.has(m[1])) seen.set(m[1], { slug: m[1], id: +m[2], nombre });
  }
  // Los enlaces del menú lateral a veces llevan el nombre en un <span>/<label> aparte: rellenar con el slug.
  for (const m of h.matchAll(/\/shop\/category\/([a-z0-9-]+-(\d+))/g)) if (!seen.has(m[1])) seen.set(m[1], { slug: m[1], id: +m[2], nombre: m[1].replace(/-\d+$/, '').replace(/-/g, ' ') });
  return [...seen.values()];
};

async function listado(urlBase) {
  // Odoo acepta ?ppg= (productos por página): una sola petición si deja; si no, página a página.
  const h1 = await get(`${urlBase}?ppg=200`);
  if (!h1) return { productos: [], html: null };
  let prods = tarjetas(h1);
  const pags = paginas(h1);
  if (pags > 1) for (let p = 2; p <= pags; p++) { const h = await get(`${urlBase}/page/${p}?ppg=200`); if (h) prods = prods.concat(tarjetas(h)); }
  return { productos: prods, html: h1 };
}

// ---------- 3. Ficha: descripción, fotos, categoría, variantes.
function ficha(h) {
  const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => { try { const j = JSON.parse(m[1]); return Array.isArray(j) ? j : [j]; } catch { return []; } });
  const prod = ld.find((x) => x['@type'] === 'Product');
  const migas = ld.find((x) => x['@type'] === 'BreadcrumbList')?.itemListElement?.map((x) => x.name) || [];
  const ini = h.indexOf('</h1>');
  // Cortar antes de las variantes / del botón de compra, y al principio de esa etiqueta (no a mitad).
  const marcas = ['js_add_cart_variants', 'o_wsale_product_details_content_section_cta', 'product_price'].map((k) => h.indexOf(k, ini)).filter((i) => i > ini);
  let fin = marcas.length ? Math.min(...marcas) : ini + 20000;
  fin = h.lastIndexOf('<', fin);
  let desc = ini > 0 ? texto(h.slice(ini + 5, fin)) : '';
  desc = desc.split('\n').filter((l) => !/^\(\d+ rese|^\$$|^[\d.,]+$|^Lista de precios|^Default$|^A[nñ]adir|^Comprar ahora/i.test(l)).join('\n');
  const varUl = h.match(/<ul[^>]*js_add_cart_variants[^>]*>([\s\S]*?)<\/ul>\s*<\/div>/)?.[1] || '';
  const fotos = [...new Set([...h.matchAll(/src="(\/web\/image\/product\.(?:image|product|template)\/\d+\/image_1024\/[^"]+)"/g)].map((m) => abs(m[1]).replace('/image_1024/', '/image_1920/')))];
  return {
    descripcion: desc,
    moneda_ficha: prod?.offers?.priceCurrency || null,
    precio_ficha: prod?.offers?.price ?? null,
    foto_principal: prod?.image || null,
    fotos,
    categoria_ficha: migas.length >= 3 ? migas[migas.length - 2] : null,
    variantes: texto(varUl) || null,
    categoria_id: +(h.match(/name="product_category_id" value="(\d+)"/)?.[1] || 0) || null,
  };
}

// ---------- 4. Limpieza para nuestra web (sin teléfonos, enlaces, marca ni precios de ellos).
const limpiar = (s) => String(s || '').split('\n')
  .filter((l) => !/(\+?53\s?)?\b\d{8}\b|wa\.me|whatsapp|https?:|www\.|se ?fu[eé]|odoo|\$|\busd\b|\bcup\b|\bmlc\b|precio|domicilio|env[ií]o|mensajer[ií]a|gratis|pedido|compra m[ií]nima/i.test(l))
  .join('\n').trim();
const avisosFoto = (urls) => {
  const n = urls.map((u) => decodeURIComponent(u).toLowerCase());
  const a = [];
  if (n.some((u) => u.includes('generated image') || u.includes('gemini') || u.includes('chatgpt'))) a.push('alguna foto parece hecha con IA (nombre «Generated Image»)');
  if (n.some((u) => u.includes('whatsapp image'))) a.push('foto sacada de WhatsApp');
  if (n.some((u) => u.includes('photoroom') || u.includes('removebg'))) a.push('fondo quitado (Photoroom/remove.bg)');
  return a;
};

// Sus categorías → nuestros departamentos de la web (wp term list product_cat, 21-oct). «revisar» = no hay uno claro.
const DEP = {
  'pintura': ['ferreteria'], 'ferreteria': ['ferreteria'], 'cables': ['ferreteria'],
  'productos de refrigeracion y clima': ['ferreteria'], 'electrodomesticos': ['electrodomesticos'],
  'hogar y muebles': ['sala-y-muebles'], 'bicicletas y accesorios': ['movilidad'],
  'aseo y limpieza': ['revisar'], 'insecticidas': ['revisar'], 'material de oficina y utiles escolares': ['revisar'], 'humidores': ['revisar'],
};

// ---------- 5. Parecidos con casaviva.company (solo lectura de un web.json que se pasa).
const web = WEB && fs.existsSync(WEB) ? JSON.parse(fs.readFileSync(WEB, 'utf8')) : null;
const PALABRAS_VACIAS = new Set('de del la el los las con y para en x u ml l lt kg lb w v mm cm color negro blanco 1 2 3 4 5 6 sin por a'.split(' '));
const fichas = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 2 && !PALABRAS_VACIAS.has(w)));
function parecidos(nombre) {
  if (!web) return [];
  const a = fichas(nombre);
  return web.map((w) => { const b = fichas(w.post_title); const c = [...a].filter((x) => b.has(x)).length; return { w, s: c / Math.max(1, Math.min(a.size, b.size)), c }; })
    .filter((x) => x.c >= 2 && x.s >= 0.75).sort((x, y) => y.s - x.s).slice(0, 3)
    .map((x) => `web ${x.w.ID} (${x.w.post_status}) «${x.w.post_title}»`);
}

// ================= Ejecución =================
console.log(`SeFué · prueba en seco · caché ${CACHE}${SIN_RED ? ' (sin red)' : ''}`);
const robots = await get(`${BASE}/robots.txt`);
const robotsBloquea = /User-agent:\s*\*[\s\S]*?Disallow:\s*\/\s*$/im.test(robots || '');
const { productos: base, html: shopHtml } = await listado(`${BASE}/shop`);
if (!shopHtml) { console.error('No pude leer la tienda.'); process.exit(1); }
const moneda = monedaDe(shopHtml);
const cats = categoriasDe(shopHtml).filter((c) => !/^todos/i.test(c.nombre));
console.log(`  listado: ${base.length} productos · ${cats.length} categorías · moneda «$» = ${moneda.moneda}`);

const porId = new Map();
for (const p of base) if (p.id && !porId.has(p.id)) porId.set(p.id, { ...p, categorias: [] });
for (const c of cats) {
  const { productos } = await listado(`${BASE}/shop/category/${c.slug}`);
  c.total = productos.length;
  for (const p of productos) {
    if (!porId.has(p.id)) porId.set(p.id, { ...p, categorias: [] });
    const x = porId.get(p.id);
    if (!x.categorias.includes(c.nombre)) x.categorias.push(c.nombre);
  }
}

const lista = [...porId.values()];
const nDet = DET === 'todos' ? lista.length : Math.max(0, parseInt(DET, 10) || 0);
// Muestra variada: uno de cada categoría primero, luego el resto.
const orden = [...lista].sort((a, b) => (a.categorias[0] || '').localeCompare(b.categorias[0] || '') || a.id - b.id);
const muestra = new Set();
for (const c of cats) { const p = orden.find((x) => x.categorias.includes(c.nombre) && !muestra.has(x.id)); if (p && muestra.size < nDet) muestra.add(p.id); }
for (const p of orden) { if (muestra.size >= nDet) break; muestra.add(p.id); }
for (const p of lista) if (muestra.has(p.id) && p.url) { const h = await get(p.url); if (h) p.ficha = ficha(h); }

// Nombres repetidos dentro de SeFué.
const vistos = new Map();
for (const p of lista) { const k = norm(p.nombre); vistos.set(k, (vistos.get(k) || []).concat(p.id)); }

const hoy = new Date().toISOString().slice(0, 10);
const catalogo = lista.sort((a, b) => a.id - b.id).map((p, i) => {
  const cost = p.precio;
  const mon = p.ficha?.moneda_ficha || moneda.moneda;
  const venta = cost > 0 ? myPrice(cost, mon) : null;
  const fotos = p.ficha?.fotos?.length ? p.ficha.fotos : p.imagenes_listado.map((x) => x.url);
  const catPrincipal = p.categorias.find((c) => !/^ofertas$/i.test(c)) || p.ficha?.categoria_ficha || p.categorias[0] || null;
  const notas = [];
  if (!cost) notas.push('sin precio');
  if (!fotos.length) notas.push('sin foto');
  if (p.cinta) notas.push(`cinta en su web: «${p.cinta}»`);
  if (p.precio_tachado) notas.push(`precio tachado ${p.precio_tachado} → ${cost}`);
  if (/x caja|\d+\s*u\b/i.test(p.nombre)) notas.push('se vende por caja/lote: confirmar si venden por unidad');
  if (vistos.get(norm(p.nombre)).length > 1) notas.push('nombre repetido en su tienda: ' + vistos.get(norm(p.nombre)).join(', '));
  if (p.ficha?.variantes) notas.push('tiene variantes (color/tamaño…)');
  const txt = p.ficha?.descripcion || '';
  if (/precio por metro|venta por metros/i.test(txt)) notas.push('precio POR METRO (venden de 5 en 5 m): fijar nuestro precio por tramo o por rollo');
  const minima = txt.match(/compra m[ií]nima[^\n.]*/i)?.[0];
  if (minima) notas.push(`ojo: «${minima.trim()}»`);
  if (cost > 0 && cost < 5) notas.push(`muy barato: la regla lo pone a ${venta} USD (${Math.round(venta / cost)} veces el costo)`);
  notas.push(...avisosFoto(fotos));
  const dep = DEP[norm(catPrincipal)] || ['revisar'];
  const par = parecidos(p.nombre);
  return {
    proveedor: 'SeFué (www.sefue.app)', clave_proveedor: 'SF',
    tipo: norm(catPrincipal).replace(/ /g, '-') || null, tipo_nombre: catPrincipal,
    nombre: p.nombre, market_id: null, ids: [], sku: null,
    id_proveedor: `SF-${p.id}`, variante_proveedor: p.variante_id, url_proveedor: p.url,
    precio_proveedor: cost, moneda: mon, precio_venta: venta, precio_formula: venta, precio_bloqueado: false,
    comision_gestora: venta ? gestoraShare(venta, cost) : null,
    ganancia_casa_viva: venta ? Math.round((venta - cost - gestoraShare(venta, cost)) * 100) / 100 : null,
    precios_vistos: cost ? [`${cost} ${mon}`] : [], historial: cost ? [{ id: `SF-${p.id}`, precio: cost, moneda: mon, visto: hoy }] : [],
    ultima_vez: hoy, veces_visto: 1, antiguo: false,
    fotos, fotos_de: `SF-${p.id}`, fotos_limpias: false, calidad_fotos: null,
    en_web: [], parecido_en_web: par.length ? par.join(' · ') : null,
    departamentos: dep, categorias_proveedor: p.categorias,
    texto_proveedor: p.ficha?.descripcion ?? null,
    descripcion_limpia: p.ficha ? limpiar(p.ficha.descripcion) : null,
    variantes: p.ficha?.variantes || null,
    vendedor_original: 'SeFué', nota: notas.join(' · ') || null, n: i + 1,
  };
});

fs.writeFileSync(path.join(DIR, 'catalogo.json'), JSON.stringify(catalogo, null, 1) + '\n');

// ---------- resumen.md
const precios = catalogo.filter((x) => x.precio_proveedor);
const r = (xs) => xs.length ? `${Math.min(...xs)}–${Math.max(...xs)}` : '—';
const porCat = new Map();
for (const x of catalogo) { const k = x.tipo_nombre || '(sin categoría)'; porCat.set(k, (porCat.get(k) || []).concat(x)); }
const fmt = (v) => (v == null ? '—' : String(Math.round(v * 100) / 100).replace('.', ','));
const L = [];
L.push(`# SeFué (www.sefue.app) — catálogo en seco, ${hoy}`, '');
L.push('> Generado por `extraer.mjs`. **Nada publicado, nada escrito en la bolsa ni en la web.** Precio = `myPrice()` y comisión = `gestoraShare()` de `vivabot/src/market-price.js` (los mismos del bot).', '');
L.push('## Lo básico', '');
L.push(`- **Plataforma:** Odoo (tienda «Catálogo Virtual», dominio real \`fue.odoo.com\`). Sin API pública abierta; se lee el HTML de la tienda (y su JSON-LD en cada ficha).`);
L.push(`- **robots.txt:** ${robotsBloquea ? '**«Disallow: /» — piden que NO entren robots.** Este script hace pocas peticiones y despacio; el volcado completo, solo con su permiso.' : 'permite rastrear.'}`);
L.push(`- **Moneda:** «$ delante» = **${moneda.moneda}** (monedas configuradas: ${(moneda.monedas || []).join(', ')}). Las fichas confirman \`priceCurrency: USD\`.`);
L.push(`- **Productos:** ${catalogo.length} (únicos por id de Odoo) · **categorías:** ${cats.length}.`);
L.push(`- **Precio del proveedor:** ${r(precios.map((x) => x.precio_proveedor))} USD · **nuestro precio:** ${r(precios.map((x) => x.precio_venta))} USD · **comisión gestora:** ${r(precios.map((x) => x.comision_gestora))} USD.`);
L.push(`- **Fichas abiertas (descripción y todas las fotos):** ${catalogo.filter((x) => x.texto_proveedor != null).length} de ${catalogo.length} (muestra). El resto solo tiene nombre, precio y foto del listado.`);
L.push(`- **Existencias:** su web **no publica stock** (no sale «quedan X» ni «agotado»). Hay que confirmarlo en cada venta.`, '');
L.push('## Por categoría (la suya → nuestro departamento)', '');
L.push('| Categoría SeFué | Productos | Costo USD | Nuestro precio USD | Departamento web |', '|---|---|---|---|---|');
for (const [k, xs] of [...porCat.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const ps = xs.filter((x) => x.precio_proveedor);
  L.push(`| ${k} | ${xs.length} | ${r(ps.map((x) => x.precio_proveedor))} | ${r(ps.map((x) => x.precio_venta))} | ${[...new Set(xs.flatMap((x) => x.departamentos))].join(', ')} |`);
}
const ofertas = cats.find((c) => /^ofertas$/i.test(c.nombre));
if (ofertas) L.push('', `«Ofertas» (${ofertas.total || 0}) son sus *combos* (paquetes de varios productos); solo están en esa categoría.`);
L.push('', '## Ejemplos (costo → nuestro precio → gana la gestora)', '');
L.push('| # | Producto | Costo | Precio CV | Gestora | Casa Viva |', '|---|---|---|---|---|---|');
const ej = [...precios].sort((a, b) => a.precio_proveedor - b.precio_proveedor);
const pick = [...new Set([0, 1, Math.floor(ej.length / 4), Math.floor(ej.length / 2), Math.floor((3 * ej.length) / 4), ej.length - 2, ej.length - 1].filter((i) => i >= 0 && i < ej.length))];
for (const i of pick) { const x = ej[i]; L.push(`| ${x.n} | ${x.nombre} | ${fmt(x.precio_proveedor)} | ${fmt(x.precio_venta)} | ${fmt(x.comision_gestora)} | ${fmt(x.ganancia_casa_viva)} |`); }
const sinPrecio = catalogo.filter((x) => !x.precio_proveedor), sinFoto = catalogo.filter((x) => !x.fotos.length);
L.push('', '## Faltas y avisos', '');
L.push(`- **Sin precio:** ${sinPrecio.length}${sinPrecio.length ? ' — ' + sinPrecio.map((x) => `#${x.n} ${x.nombre}`).join('; ') : ''}`);
L.push(`- **Sin foto:** ${sinFoto.length}${sinFoto.length ? ' — ' + sinFoto.map((x) => `#${x.n} ${x.nombre}`).join('; ') : ''}`);
const conNota = (re) => catalogo.filter((x) => re.test(x.nota || ''));
L.push(`- **Por caja/lote** (confirmar si venden por unidad): ${conNota(/caja\/lote/).map((x) => `#${x.n}`).join(', ') || '—'}`);
L.push(`- **Nombre repetido en su tienda:** ${conNota(/repetido/).map((x) => `#${x.n}`).join(', ') || '—'}`);
L.push(`- **Cinta / precio tachado en su web:** ${conNota(/cinta|tachado/).map((x) => `#${x.n} (${x.nota.match(/cinta[^·]*|precio tachado[^·]*/)[0].trim()})`).join('; ') || '—'}`);
L.push(`- **Fotos que parecen de IA** (en la muestra): ${conNota(/IA/).map((x) => `#${x.n}`).join(', ') || '—'}`);
L.push(`- **Muy baratos (costo < 5 USD):** ${conNota(/muy barato/).length} — con la regla (+5 USD mínimo) salen a 2–17 veces su costo. Propuesta: no publicarlos sueltos (o en packs).`);
L.push(`- **Precio por metro / compra mínima** (en la muestra): ${conNota(/POR METRO|compra m[ií]nima/i).map((x) => `#${x.n}`).join(', ') || '—'}`);
L.push(`- **Departamento sin equivalente claro («revisar»):** ${catalogo.filter((x) => x.departamentos.includes('revisar')).length} productos (aseo y limpieza, insecticidas, oficina, humidores).`);
L.push('', '## Parecidos con lo que ya vendemos (casaviva.company, lectura con wp-cli)', '');
const par = catalogo.filter((x) => x.parecido_en_web);
L.push(web ? (par.length ? par.map((x) => `- #${x.n} ${x.nombre} → ${x.parecido_en_web}`).join('\n') : '- Ninguno con nombre parecido.') : '- (no se pasó `--web`)');
L.push('', `Peticiones a su web en esta pasada: ${peticiones} (el resto salió de la copia local).`, '');
fs.writeFileSync(path.join(DIR, 'resumen.md'), L.join('\n'));
console.log(`  catalogo.json: ${catalogo.length} · fichas abiertas ${catalogo.filter((x) => x.texto_proveedor != null).length} · peticiones ${peticiones}`);
