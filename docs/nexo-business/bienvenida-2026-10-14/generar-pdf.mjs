#!/usr/bin/env node
// OBSOLETO (4-nov): usa docs/nexo-business/tarifas/generar-pdf-tarifas.mjs (lee la tabla de la web y se rehace solo en el VPS).
// PDF «Precios de mensajería» de Casa Viva, hecho con las tarifas VIVAS de la web (no con un PDF viejo).
//
// Cómo rehacerlo cuando cambien las tarifas (en Windows, desde la carpeta del repo ernesto-rondon-nexo):
//   node docs/nexo-business/bienvenida-2026-10-14/generar-pdf.mjs
// Opciones:
//   --json archivo.json     usar un JSON ya descargado en vez de leer la web por SSH
//   --fecha "14 de octubre de 2026"   fecha del PDF (por defecto, hoy en La Habana)
//   --perfil carpeta        perfil temporal de Chrome (por defecto, una carpeta en %TEMP%)
//   --salida carpeta        dónde dejar el PDF (por defecto, esta misma carpeta)
//
// Qué hace: 1) lee CVD_Shipping_Rates::rates() por SSH con wp-cli (solo lectura); 2) se queda con las filas
// activas; 3) agrupa por municipio (La Habana primero, luego los de fuera) y reparto; 4) rellena
// plantilla-precios.html (fuentes Figtree/Cinzel y logo incrustados); 5) imprime el PDF con Chrome sin interfaz.
// Guarda al lado: tarifas-AAAA-MM-DD.json (los datos usados) y precios-mensajeria-AAAA-MM-DD.html.
// Fila con zona vacía = precio de referencia del municipio («por confirmar» en la web, no precio oficial).

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir, tmpdir } from 'node:os';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(AQUI, '../../..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));

// ---------- 1. Tarifas ----------
function leerTarifas() {
  if (args.json) return JSON.parse(readFileSync(resolve(args.json), 'utf8'));
  const key = join(homedir(), '.ssh', 'casa-viva-github-actions');
  const out = execFileSync('ssh', ['-i', key, '-p', '65002', '-o', 'BatchMode=yes', 'u824654880@88.223.85.72',
    'cd ~/domains/casaviva.company/public_html && wp eval "echo wp_json_encode(CVD_Shipping_Rates::rates());"'], { encoding: 'utf8' });
  return JSON.parse(out.slice(out.indexOf('[')));
}

// ---------- 2. Agrupar ----------
const HABANA = ['Arroyo Naranjo', 'Boyeros', 'Centro Habana', 'Cerro', 'Cotorro', 'Diez de Octubre', 'Guanabacoa', 'Habana del Este',
  'Habana Vieja', 'La Lisa', 'Marianao', 'Playa', 'Plaza de la Revolución', 'Regla', 'San Miguel del Padrón'];
const es = (a, b) => a.localeCompare(b, 'es', { sensitivity: 'base', numeric: true });
const num = (n) => Number(n).toLocaleString('es-ES', { useGrouping: true, minimumFractionDigits: 0 }).replace(/^(\d)(\d{3})$/, '$1.$2');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function agrupar(filas) {
  const activas = filas.filter((f) => f.active && Number(f.fee) > 0);
  const porMun = new Map();
  for (const f of activas) {
    if (!porMun.has(f.municipality)) porMun.set(f.municipality, { ref: 0, zonas: [] });
    const m = porMun.get(f.municipality);
    if (!String(f.zone || '').trim()) m.ref = Number(f.fee);
    else m.zonas.push({ zona: f.zone, precio: Number(f.fee) });
  }
  for (const m of porMun.values()) m.zonas.sort((a, b) => es(a.zona, b.zona));
  const nombres = [...porMun.keys()];
  return {
    habana: nombres.filter((n) => HABANA.includes(n)).sort(es).map((n) => [n, porMun.get(n)]),
    fuera: nombres.filter((n) => !HABANA.includes(n)).sort(es).map((n) => [n, porMun.get(n)]),
    total: activas.filter((f) => String(f.zone || '').trim()).length,
    municipios: nombres.length,
    activas,
  };
}

const precio = (n) => `<span class="cifra">${num(n)}</span><span class="cup">CUP</span>`;
function bloque([nombre, m]) {
  const ref = m.ref ? `<p class="ref">Otro reparto de ${esc(nombre)}: unos ${precio(m.ref)} (lo confirma la tienda)</p>` : '';
  const filas = m.zonas.map((z) => `<tr><td class="zona">${esc(z.zona)}</td><td class="precio">${precio(z.precio)}</td></tr>`).join('\n');
  return `<section class="municipio"><h2>${esc(nombre)}</h2>${ref}<table>${filas}</table></section>`;
}

// ---------- 3. Fuentes y logo incrustados ----------
const FS = join(REPO, 'apps/business-pos/node_modules/@fontsource');
const fuente = (familia, archivo, peso) => {
  const b64 = readFileSync(join(FS, familia, 'files', archivo)).toString('base64');
  const nombre = familia === 'cinzel' ? 'Cinzel' : 'Figtree';
  return `@font-face{font-family:'${nombre}';font-style:normal;font-weight:${peso};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
};
function fuentes() {
  const out = [];
  for (const p of [400, 600, 700, 800]) {
    out.push(fuente('figtree', `figtree-latin-${p}-normal.woff2`, p));
    const ext = `figtree-latin-ext-${p}-normal.woff2`;
    if (existsSync(join(FS, 'figtree', 'files', ext))) out.push(fuente('figtree', ext, p).replace('format(\'woff2\');}', 'format(\'woff2\');unicode-range:U+0100-024F;}'));
  }
  out.push(fuente('cinzel', 'cinzel-latin-700-normal.woff2', 700));
  return out.join('\n');
}
const logo = () => {
  const svg = readFileSync(join(REPO, 'docs/sistemas-de-diseno/casa-viva/logo/casa-viva-horizontal-marron.svg'), 'utf8')
    .replace(/<metadata>[\s\S]*?<\/metadata>/, ''); // quita el manifiesto C2PA (pesa y no se ve)
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

// ---------- 4. Chrome ----------
function chrome() {
  const posibles = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  const c = posibles.find((p) => p && existsSync(p));
  if (!c) throw new Error('No encuentro Chrome. Pon su ruta en la variable CHROME.');
  return c;
}

// ---------- Main ----------
const hoyISO = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Havana' }).format(new Date());
const fecha = args.fecha || new Intl.DateTimeFormat('es-ES', { timeZone: 'America/Havana', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
const salida = resolve(args.salida || AQUI);
mkdirSync(salida, { recursive: true });

const filas = leerTarifas();
if (!Array.isArray(filas) || !filas.length) throw new Error('La web no devolvió tarifas.');
const g = agrupar(filas);
writeFileSync(join(salida, `tarifas-${hoyISO}.json`), JSON.stringify(filas, null, 1));

let contenido = `<div class="bloque-titulo">La Habana</div>\n${g.habana.map(bloque).join('\n')}`;
if (g.fuera.length) contenido += `\n<div class="bloque-titulo">Fuera de La Habana</div>\n${g.fuera.map(bloque).join('\n')}`;

const html = readFileSync(join(AQUI, 'plantilla-precios.html'), 'utf8')
  .replace('{{FUENTES}}', fuentes())
  .replace('{{LOGO}}', logo())
  .replaceAll('{{FECHA}}', esc(fecha))
  .replace('{{TOTAL}}', String(g.total))
  .replace('{{MUNICIPIOS}}', String(g.municipios))
  .replace('{{CONTENIDO}}', contenido);
const htmlPath = join(salida, `precios-mensajeria-${hoyISO}.html`);
writeFileSync(htmlPath, html);

const pdfPath = join(salida, `precios-mensajeria-casa-viva-${hoyISO}.pdf`);
const perfil = resolve(args.perfil || join(tmpdir(), 'cv-pdf-perfil'));
execFileSync(chrome(), ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${perfil}`,
  '--no-pdf-header-footer', '--run-all-compositor-stages-before-draw', '--virtual-time-budget=5000',
  `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href], { stdio: 'inherit' });

console.log(`Listo: ${pdfPath}\n${g.total} repartos activos en ${g.municipios} municipios (${g.activas.length} filas activas con las de referencia).`);
