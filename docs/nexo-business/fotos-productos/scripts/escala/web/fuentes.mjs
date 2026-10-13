// De <id>/busqueda-web.json a la lista para «fotos-bolsa.mjs web-bajar» (una entrada por página) + tipo de fuente.
// Uso: node fuentes.mjs --ids 577,542 → piloto-web/fuentes-piloto.json
import { leer, guardar, P, PW } from './comun.mjs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const IDS = String(opt('ids', '')).split(',').map(Number).filter(Boolean);
const MAX_POR_PRODUCTO = Number(opt('max', 12));

// Tiendas grandes (marketplaces y cadenas nacionales) y webs de fichas técnicas conocidas
const GRANDES = /(^|\.)(amazon\.[a-z.]+|walmart\.[a-z.]+|bestbuy\.[a-z.]+|target\.com|homedepot\.com|lowes\.com|costco\.[a-z.]+|ebay\.[a-z.]+|aliexpress\.[a-z.]+|alibaba\.com|temu\.com|newegg\.com|bhphotovideo\.com|mercadolibre\.[a-z.]+|mercadolivre\.com\.br|shopee\.[a-z.]+|falabella\.[a-z.]+|ripley\.[a-z.]+|kmart\.com\.au|bigw\.com\.au|cdiscount\.com|allegro\.pl|rozetka\.com\.ua|leroymerlin\.[a-z.]+|grainger\.com|made-in-china\.com|globalsources\.com|idealo\.[a-z.]+|geizhals\.[a-z.]+|galaxus\.[a-z.]+|emag\.ro|hepsiburada\.com|mediaworld\.it|fravega\.com|exito\.com|bodegaaurrera\.com\.mx|lacuracao\.pe|gsmarena\.com|daraz\.[a-z.]+|jumbo\.ae|ubuy\.[a-z.]+|ceneo\.pl|joom\.[a-z.]+|yahoo\.co\.jp|tiktok\.com)$/i;
const host = (u) => { try { return new URL(u).host.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
const tipo = (pagina, marca) => {
  const h = host(pagina);
  const m = String(marca || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (m.length >= 3 && h.replace(/[^a-z0-9]/g, '').includes(m)) return 'oficial';
  if (GRANDES.test(h)) return 'tienda grande';
  return 'otra tienda';
};
const mejorar = (u) => {
  // CDN de Alibaba/EcoFlow (x-oss-process): pedir la foto sin reducir
  try { const x = new URL(u); if (x.searchParams.has('x-oss-process')) { x.searchParams.delete('x-oss-process'); return x.href; } } catch { /* nada */ }
  return u;
};
const lista = [], resumen = {};
for (const id of IDS) {
  const b = leer(P(id, 'busqueda-web.json')); if (!b) continue;
  const marca = (leer(P(id, 'norm.json')) || {}).marca;
  const porPagina = new Map();
  const add = (url, pagina) => {
    if (!url || !/^https?:/.test(url) || /images\.openai\.com/.test(url)) return;
    const k = pagina || url;
    if (!porPagina.has(k)) porPagina.set(k, new Set());
    porPagina.get(k).add(mejorar(url));
  };
  for (const im of b.imagenes_web || []) add(im.url, im.pagina);
  // las que la IA eligió, si son enlaces directos a una imagen
  for (const im of b.respuesta?.imagenes || []) if (/\.(jpe?g|png|webp|avif)(\?|$)/i.test(im.url) || /ebayimg|media-amazon|alicdn|kwcdn|cdn\/shop/.test(im.url)) add(im.url, /^https?:/.test(im.pagina) ? im.pagina : null);
  let n = 0;
  for (const [pagina, urls] of porPagina) {
    if (n >= MAX_POR_PRODUCTO) break;
    const u = [...urls].slice(0, Math.max(1, MAX_POR_PRODUCTO - n));
    n += u.length;
    lista.push({ id, pagina: /^https?:/.test(pagina) && !urls.has(pagina) ? pagina : null, urls: u, tipo: tipo(pagina, marca) });
  }
  // páginas de tiendas Shopify (/products/…): «web-bajar» saca toda la galería oficial de <página>.json
  const shop = [...new Set([...(b.imagenes_web || []).map((x) => x.pagina), ...(b.respuesta?.paginas || []).map((x) => x.url)])]
    .filter((p) => /\/products\/[^/?#]+/.test(p || '') && tipo(p, marca) === 'oficial');
  for (const p of shop.slice(0, 1)) lista.push({ id, pagina: p.split(/[?#]/)[0], tipo: 'oficial', shopify: true });
  resumen[id] = { paginas: porPagina.size, imagenes: n, shopify: shop.length > 0 };
}
guardar(opt('salida', PW + '/fuentes-piloto.json'), lista);
console.log(JSON.stringify(resumen));
