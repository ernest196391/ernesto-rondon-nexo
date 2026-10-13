// Estado final de las fotos de internet por producto (solo lee archivos).
// Uso: node resultado.mjs --ids 1,2 [--modelo gpt-6-sol] [--pendientes] [--salida archivo.json]
//   --pendientes: imprime solo los números que necesitan otra vuelta (alguna foto «mal» y quedan fotos de internet sin rechazar)
import fs from 'fs';
import { leer, guardar, P, PW } from './comun.mjs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const IDS = String(opt('ids', '')).split(',').map(Number).filter(Boolean);
const MODELO = opt('modelo', 'gpt-6-sol');
const host = (u) => { try { return new URL(u).host.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
// fabricante = la marca está en el dominio; tiendas grandes = marketplaces y cadenas grandes conocidas (revisado a mano)
const GRANDES = /(^|\.)(amazon\.[a-z.]+|walmart\.[a-z.]+|bestbuy\.[a-z.]+|target\.com|homedepot\.[a-z.]+|lowes\.com|costco\.[a-z.]+|ebay\.[a-z.]+|aliexpress\.[a-z.]+|alibaba\.com|temu\.com|newegg\.[a-z.]+|bhphotovideo\.com|mercadolibre\.[a-z.]+|mercadolivre\.com\.br|shopee\.[a-z.]+|falabella\.[a-z.]+|ripley\.[a-z.]+|kmart\.com\.au|bigw\.com\.au|jbhifi\.com\.au|cdiscount\.com|fnac\.[a-z.]+|darty\.com|boulanger\.com|mediamarkt\.[a-z.]+|saturn\.de|otto\.de|allegro\.pl|rozetka\.com\.ua|leroymerlin\.[a-z.]+|grainger\.com|made-in-china\.com|globalsources\.com|idealo\.[a-z.]+|geizhals\.[a-z.]+|galaxus\.[a-z.]+|digitec\.ch|emag\.[a-z.]+|hepsiburada\.com|trendyol\.com|mediaworld\.it|unieuro\.it|fravega\.com|exito\.com|liverpool\.com\.mx|coppel\.com|bodegaaurrera\.com\.mx|elcorteingles\.es|pccomponentes\.com|worten\.[a-z.]+|currys\.co\.uk|argos\.co\.uk|johnlewis\.com|very\.co\.uk|coolblue\.[a-z.]+|bol\.com|pigu\.lt|alza\.[a-z.]+|ceneo\.pl|x-kom\.pl|flipkart\.com|croma\.com|reliancedigital\.in|jumia\.[a-z.]+|noon\.com|jumbo\.ae|sharafdg\.com|lazada\.[a-z.]+|tokopedia\.com|rakuten\.[a-z.]+|yodobashi\.com|kakaku\.com|gsmarena\.com|staples\.com|officedepot\.com|microcenter\.com|adorama\.com|crutchfield\.com|qvc\.com|kohls\.com|macys\.com|wayfair\.com|overstock\.com|samsclub\.com|bjs\.com|dick?s?sportinggoods\.com|gamestop\.com|apple\.com)$/i;
function tipo(pagina, marca) {
  const h = host(pagina);
  const m = String(marca || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (m.length >= 3 && h.replace(/[^a-z0-9]/g, '').includes(m)) return 'oficial';
  if (GRANDES.test(h)) return 'tienda grande';
  return 'otra tienda';
}
const out = [];
for (const id of IDS) {
  const n = leer(P(id, 'norm.json')); if (!n) continue;
  const v = (leer(P(id, 'verificacion.json'), {}) || {})[MODELO];
  const fu = leer(P(id, 'web', 'fuentes.json'), []) || [];
  const restantes = fu.filter((f) => f.estado === 'ok').length;
  const r = { id, estado: n.estado, fuente: n.fuente, marca: n.marca, modelo: n.modelo, fotos: (n.fotos || []).length, restantes };
  if (n.estado === 'listo' && n.fuente === 'web') {
    const vale = v && n.fotos.every((f) => v.candidatas.some((c) => c.archivo === f.archivo));
    r.verificacion = !v ? 'falta' : !vale ? 'vieja (otras fotos)' : v.candidatas.every((c) => c.veredicto === 'ok') ? 'ok' : v.principal === 'ok' ? 'galeria_mal' : 'mal';
    r.pagina = n.fotos[0].pagina || n.fotos[0].url; r.dominio = host(r.pagina); r.tipo_fuente = tipo(r.pagina, n.marca);
    r.borde = Boolean(n.fotos[0].tocaBorde); r.ampliada = Boolean(n.fotos[0].ampliada);
    r.resultado = r.verificacion === 'ok' ? (r.tipo_fuente === 'otra tienda' ? 'duda_fuente' : 'pasa') : r.verificacion === 'galeria_mal' || r.verificacion === 'mal' ? (restantes ? 'otra_vuelta' : 'no_pasa') : 'verificar';
  } else r.resultado = n.estado === 'listo' ? 'listo_proveedor' : 'no_pasa';
  out.push(r);
}
if (args.includes('--pendientes')) { console.log(out.filter((r) => r.resultado === 'otra_vuelta').map((r) => r.id).join(',')); process.exit(0); }
const cuenta = {}; for (const r of out) cuenta[r.resultado] = (cuenta[r.resultado] || 0) + 1;
if (opt('salida')) guardar(opt('salida'), { fecha: new Date().toISOString(), modelo_verificacion: MODELO, cuenta, productos: out });
console.log(JSON.stringify(cuenta));
for (const r of out) console.log(r.id, r.resultado, r.verificacion || '', r.tipo_fuente || '', r.dominio || '', r.borde ? 'BORDE' : '', r.ampliada ? 'AMPL' : '');
