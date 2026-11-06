#!/usr/bin/env node
// PDF «Precios de mensajería» de Casa Viva, hecho SIEMPRE con la tabla de la web (una sola fuente: la web manda).
//
// De dónde salen los precios: la MISMA función que pinta la tabla de casaviva.company/tarifas-mensajeria/
// (CVD_Datos_A_Mano::rates_by_municipality(), que lee CVD_Shipping_Rates::rates() = opción cvd_shipping_rates,
// la que usa el checkout). Solo las filas activas; mismo orden, mismos repartos y mismo «Otro reparto» que la web.
// Se lee por SSH con wp-cli (solo lectura). Este script NUNCA cambia precios.
//
// Uso (Windows, desde la carpeta del repo ernesto-rondon-nexo, o en el VPS):
//   node docs/nexo-business/tarifas/generar-pdf-tarifas.mjs              → hace el PDF aquí al lado
//   node docs/nexo-business/tarifas/generar-pdf-tarifas.mjs --subir      → y lo pone en la web (misma URL de siempre)
//   node docs/nexo-business/tarifas/generar-pdf-tarifas.mjs --si-cambia --subir   → solo si las tarifas cambiaron (para cron)
// Opciones:
//   --json archivo.json   usar datos ya bajados ({grupos, filas, hash}) en vez de leer la web
//   --salida carpeta      dónde dejar el PDF y tarifas-web.json (por defecto, esta carpeta)
//   --html archivo.html   guardar también el HTML (para revisarlo)
//   --llave ruta          llave SSH de Hostinger (por defecto ~/.ssh/casa-viva-github-actions o ~/.ssh/casa-viva-web)
//
// URL fija que usan las gestoras (Herramientas → «Ver PDF», con «Actualizado: <fecha del archivo>»):
//   https://casaviva.company/wp-content/uploads/casa-viva/precios-mensajeria.pdf
// Antes de pisarlo guarda una copia en ~/bak-tarifas-pdf/ del servidor web (se quedan las 20 últimas).
// En el VPS corre solo cada 10 min (crontab, copia en /root/supervisor/tareas/tarifas-pdf/, log en /root/supervisor/logs/tarifas-pdf.log)
// con --si-cambia --subir: si cambian las tarifas de la web, rehace el PDF y lo sube. Si cambias este script o la plantilla,
// cópialos también allí (scp). Ojo: el reloj de este PC va 1 h adelantado; la fecha buena la pone el VPS.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir, tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

const AQUI = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };

const WEB = 'u824654880@88.223.85.72';
const WP = '~/domains/casaviva.company/public_html';
const PDF_REMOTO = `${WP}/wp-content/uploads/casa-viva/precios-mensajeria.pdf`;
const PDF_URL = 'https://casaviva.company/wp-content/uploads/casa-viva/precios-mensajeria.pdf';

function llave() {
  const posibles = [opt('llave'), join(homedir(), '.ssh', 'casa-viva-github-actions'), join(homedir(), '.ssh', 'casa-viva-web')];
  const k = posibles.find((p) => p && existsSync(p));
  if (!k) throw new Error('No encuentro la llave SSH de la web (usa --llave).');
  return k;
}
const ssh = (cmd, input) => execFileSync('ssh', ['-i', llave(), '-p', '65002', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=20', WEB, cmd],
  { encoding: input ? undefined : 'utf8', input, maxBuffer: 64 * 1024 * 1024 });

// ---------- 1. Tarifas de la web ----------
function leerWeb() {
  if (opt('json')) return JSON.parse(readFileSync(resolve(opt('json')), 'utf8'));
  const php = 'if(!class_exists("CVD_Datos_A_Mano")||!method_exists("CVD_Datos_A_Mano","rates_by_municipality")){echo "@@ERR@@sin CVD_Datos_A_Mano::rates_by_municipality";return;}'
    + '$f=CVD_Shipping_Rates::rates();'
    + 'echo "@@JSON@@".wp_json_encode(array("grupos"=>(object)CVD_Datos_A_Mano::rates_by_municipality(),"filas"=>$f,"hash"=>md5(wp_json_encode($f))));';
  const out = String(ssh(`cd ${WP} && wp eval '${php}'`));
  if (out.includes('@@ERR@@')) throw new Error(`La web no tiene la tabla: ${out.split('@@ERR@@')[1].trim()}`);
  return JSON.parse(out.slice(out.indexOf('@@JSON@@') + 8));
}

// ---------- 2. HTML ----------
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const miles = (n) => String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // 1800 → 1.800, como la web
const precio = (n) => `<span class="cifra">${miles(n)}</span><span class="cup">CUP</span>`;
const ancla = (s) => 'm-' + s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
const rango = (zonas) => {
  const v = Object.values(zonas).map(Number); const a = Math.min(...v), b = Math.max(...v);
  return a === b ? `${miles(a)} CUP` : `${miles(a)}–${miles(b)} CUP`; // igual que la web
};
function bloque(nombre, m) {
  const filas = Object.entries(m.zones).map(([z, fee]) => `<tr><td class="zona">${esc(z)}</td><td class="precio">${precio(fee)}</td></tr>`);
  if (Number(m.reference) > 0) filas.push(`<tr class="otro"><td class="zona">Otro reparto de ${esc(nombre)}</td><td class="precio">se confirma (unos ${miles(m.reference)} CUP)</td></tr>`);
  return `<section class="municipio" id="${ancla(nombre)}"><h2><span>${esc(nombre)}</span><small>${esc(rango(m.zones))}</small></h2><table>${filas.join('\n')}</table></section>`;
}
const b64 = (f) => readFileSync(join(AQUI, 'recursos', f)).toString('base64');
function fuentes() {
  const out = [];
  for (const p of [400, 600, 700, 800]) {
    out.push(`@font-face{font-family:'Figtree';font-weight:${p};font-display:block;src:url(data:font/woff2;base64,${b64(`figtree-latin-${p}-normal.woff2`)}) format('woff2');}`);
    out.push(`@font-face{font-family:'Figtree';font-weight:${p};font-display:block;src:url(data:font/woff2;base64,${b64(`figtree-latin-ext-${p}-normal.woff2`)}) format('woff2');unicode-range:U+0100-024F;}`);
  }
  out.push(`@font-face{font-family:'Cinzel';font-weight:700;font-display:block;src:url(data:font/woff2;base64,${b64('cinzel-latin-700-normal.woff2')}) format('woff2');}`);
  return out.join('\n');
}

// ---------- 3. Chrome sin interfaz ----------
function chrome() {
  const posibles = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const pup = join(homedir(), '.cache', 'puppeteer', 'chrome'); // VPS: Chrome de puppeteer
  if (existsSync(pup)) for (const v of readdirSync(pup).sort().reverse()) posibles.push(join(pup, v, 'chrome-linux64', 'chrome'));
  const c = posibles.find((p) => p && existsSync(p));
  if (!c) throw new Error('No encuentro Chrome. Pon su ruta en la variable CHROME.');
  return c;
}

// ---------- Main ----------
const salida = resolve(opt('salida') || AQUI);
mkdirSync(salida, { recursive: true });
const estadoPath = join(salida, 'estado.json');
const ahora = new Date();
const hora = (o) => new Intl.DateTimeFormat('es-ES', { timeZone: 'America/Havana', ...o }).format(ahora);
const fecha = `${hora({ day: 'numeric', month: 'long', year: 'numeric' })}, ${hora({ hour: '2-digit', minute: '2-digit', hour12: false })}`;

const datos = leerWeb();
const grupos = datos.grupos || {};
const nombres = Object.keys(grupos);
if (!nombres.length) throw new Error('La web no devolvió tarifas: no toco el PDF.');
const estado = existsSync(estadoPath) ? JSON.parse(readFileSync(estadoPath, 'utf8')) : {};
if (flag('si-cambia') && estado.hash_subido === datos.hash) { console.log(`Sin cambios en las tarifas (${datos.hash}); no hago nada.`); process.exit(0); }

const total = nombres.reduce((n, k) => n + Object.keys(grupos[k].zones).length, 0);
const indice = nombres.map((n) => `<a href="#${ancla(n)}"><span>${esc(n)}</span><small>${esc(rango(grupos[n].zones).replace(' CUP', ''))}</small></a>`).join('\n');
const html = readFileSync(join(AQUI, 'plantilla.html'), 'utf8')
  .replace('{{FUENTES}}', fuentes())
  .replace('{{LOGO}}', `data:image/svg+xml;base64,${b64('logo-marron.svg')}`)
  .replaceAll('{{FECHA}}', esc(fecha))
  .replace('{{TOTAL}}', String(total))
  .replace('{{MUNICIPIOS}}', String(nombres.length))
  .replace('{{INDICE}}', indice)
  .replace('{{CONTENIDO}}', nombres.map((n) => bloque(n, grupos[n])).join('\n'));

const tmp = mkdtempSync(join(tmpdir(), 'cv-tarifas-'));
const htmlPath = join(tmp, 'precios-mensajeria.html');
writeFileSync(htmlPath, html);
if (opt('html')) writeFileSync(resolve(opt('html')), html); // para revisar cómo se ve
const pdfPath = join(salida, 'precios-mensajeria-casa-viva.pdf');
const chromeArgs = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${join(tmp, 'perfil')}`,
  '--no-pdf-header-footer', '--run-all-compositor-stages-before-draw', '--virtual-time-budget=5000', `--print-to-pdf=${pdfPath}`];
if (process.platform === 'linux' && process.getuid?.() === 0) chromeArgs.push('--no-sandbox');
execFileSync(chrome(), [...chromeArgs, pathToFileURL(htmlPath).href], { stdio: 'ignore' });
rmSync(tmp, { recursive: true, force: true });

const pdf = readFileSync(pdfPath);
if (pdf.length < 20000 || pdf.subarray(0, 5).toString() !== '%PDF-') throw new Error('El PDF salió vacío o roto: no lo subo.');
const md5 = createHash('md5').update(pdf).digest('hex');
writeFileSync(join(salida, 'tarifas-web.json'), JSON.stringify({ leido: ahora.toISOString(), fuente: 'https://casaviva.company/tarifas-mensajeria/', hash: datos.hash, grupos }, null, 1));
console.log(`PDF: ${pdfPath} (${Math.round(pdf.length / 1024)} KB) · ${total} repartos en ${nombres.length} municipios · web ${fecha}`);

if (flag('subir')) {
  const remoto = `set -e; f=${PDF_REMOTO}; mkdir -p ~/bak-tarifas-pdf; `
    + `if [ -f "$f" ]; then cp -p "$f" ~/bak-tarifas-pdf/precios-mensajeria-$(date +%Y%m%d-%H%M%S).pdf; fi; `
    + `ls -t ~/bak-tarifas-pdf/*.pdf 2>/dev/null | tail -n +21 | xargs -r rm; `
    + `cat > "$f.tmp"; mv "$f.tmp" "$f"; md5sum "$f" | cut -d" " -f1`;
  const r = String(ssh(remoto, pdf)).trim();
  if (r !== md5) throw new Error(`Subido pero el md5 no coincide (${r} ≠ ${md5}).`);
  console.log(`Subido: ${PDF_URL} (md5 ${md5}; copia del anterior en ~/bak-tarifas-pdf/)`);
}
writeFileSync(estadoPath, JSON.stringify(flag('subir')
  ? { hash_subido: datos.hash, pdf_md5: md5, subido: ahora.toISOString() }
  : { ...estado, ultimo_local: ahora.toISOString() }, null, 1));
