// Hojas de aprobación de FOTOS DE INTERNET (copia de hojas.mjs que enseña de qué web sale cada foto).
// Uso: node hojas-web.mjs <carpeta-con-hojas-datos.json-y-minis/> <carpeta-salida/> <prefijo, ej. web o piloto-web>
// Escribe <prefijo>-01.jpg… y <prefijo>-hojas.json en la carpeta de salida (no toca hoja-NN.jpg ni hojas.json).
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sharp = require('C:/Users/Ernesto/ernesto-rondon-nexo/node_modules/sharp');

const [base, salida, PREFIJO = 'web'] = process.argv.slice(2);
const datos = JSON.parse(fs.readFileSync(path.join(base, 'hojas-datos.json'), 'utf8'));
const C = { crema: '#F6F1E6', marron: '#2B2420', petroleo: '#0D3B45', ambar: '#A35A1F', rojo: '#C62828', verde: '#2E7D32', gris: '#8a8178' };
const POR_HOJA = 20, COLS = 4, TW = 600, TH = 650, HEAD = 150, FOOT = 80, W = COLS * TW;
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function partir(texto, max, lineas) {
  const out = []; let l = '';
  for (const w of String(texto).split(/\s+/)) {
    if ((l + ' ' + w).trim().length > max) { out.push(l.trim()); l = w; } else l += ' ' + w;
  }
  if (l.trim()) out.push(l.trim());
  if (out.length > lineas) { out.length = lineas; out[lineas - 1] = out[lineas - 1].replace(/\s*\S*$/, '') + '…'; }
  return out;
}

async function tile(d, n) {
  const dir = path.join(base, 'minis', String(d.id));
  const comps = [];
  const main = await sharp(path.join(dir, '1.jpg')).resize(420, 420).png().toBuffer();
  comps.push({ input: main, left: 15, top: 15 });
  for (let k = 2; k <= Math.min(4, d.fotos); k++) {
    const f = path.join(dir, `${k}.jpg`);
    if (!fs.existsSync(f)) continue;
    comps.push({ input: await sharp(f).resize(136, 136).png().toBuffer(), left: 449, top: 15 + (k - 2) * 142 });
  }
  const notaCol = d.nota >= 9 ? C.verde : C.petroleo;
  const avisos = [];
  if (d.borde) avisos.push('toca el borde: mirar si está cortado');
  if (d.ampliada) avisos.push('foto ampliada');
  if (d.fuente === 'web') avisos.push(`foto de internet: ${d.dominio || '?'} (${d.tipo_fuente || '?'})`);
  const extra = (d.avisos || []).filter((a) => !/toca el borde|ampliada/.test(a)).slice(0, 1).map((a) => 'IA: ' + a);
  const lineasAviso = [...avisos, ...extra].flatMap((a) => partir(a, 52, 1)).slice(0, 2);
  const titulo = partir(d.titulo, 40, 2);
  const svg = `<svg width="${TW}" height="${TH}">
    <rect x="3" y="3" width="${TW - 6}" height="${TH - 6}" fill="none" stroke="${avisos.length && (d.borde || d.ampliada) ? C.ambar : '#d8cfbd'}" stroke-width="${avisos.length && (d.borde || d.ampliada) ? 5 : 2}"/>
    <rect x="15" y="15" width="420" height="420" fill="none" stroke="#e6dfd2" stroke-width="1"/>
    <circle cx="52" cy="52" r="34" fill="${C.petroleo}"/>
    <text x="52" y="64" text-anchor="middle" font-family="Arial" font-size="34" font-weight="bold" fill="#fff">${n}</text>
    ${d.fotos > 1 ? '' : `<text x="517" y="80" text-anchor="middle" font-family="Arial" font-size="18" fill="${C.gris}">1 foto</text>`}
    <text x="20" y="478" font-family="Arial" font-size="30" font-weight="bold" fill="${C.marron}">#${d.id} · ${esc(d.precio)} USD</text>
    <rect x="${TW - 150}" y="450" width="130" height="38" rx="8" fill="${notaCol}"/>
    <text x="${TW - 85}" y="477" text-anchor="middle" font-family="Arial" font-size="24" font-weight="bold" fill="#fff">nota ${d.nota}</text>
    ${titulo.map((l, k) => `<text x="20" y="${518 + k * 31}" font-family="Arial" font-size="26" fill="${C.marron}">${esc(l)}</text>`).join('')}
    <text x="20" y="${583}" font-family="Arial" font-size="19" fill="${C.gris}">${d.fotos} foto${d.fotos > 1 ? 's' : ''} (notas ${esc(d.notas.join(', '))}) · ${esc(String(d.categoria || '').slice(0, 30))}</text>
    ${lineasAviso.map((l, k) => `<text x="20" y="${610 + k * 24}" font-family="Arial" font-size="19" font-style="italic" fill="${C.ambar}">${esc(l)}</text>`).join('')}
  </svg>`;
  comps.push({ input: Buffer.from(svg), left: 0, top: 0 });
  return sharp({ create: { width: TW, height: TH, channels: 3, background: '#ffffff' } }).composite(comps).png().toBuffer();
}

fs.mkdirSync(salida, { recursive: true });
const lista = datos.filter((d) => !d.duplicado_de);
const total = Math.ceil(lista.length / POR_HOJA);
const hojas = [];
for (let h = 0; h < total; h++) {
  const grupo = lista.slice(h * POR_HOJA, (h + 1) * POR_HOJA);
  const filas = Math.ceil(grupo.length / COLS);
  const H = HEAD + filas * TH + FOOT;
  const comps = [{ input: Buffer.from(`<svg width="${W}" height="${HEAD}">
    <rect width="${W}" height="${HEAD}" fill="${C.petroleo}"/>
    <text x="40" y="62" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="${C.crema}">Casa Viva · ${PREFIJO} ${String(h + 1).padStart(2, '0')} de ${total} · FOTOS DE INTERNET para aprobar (Digital Store)</text>
    <text x="40" y="112" font-family="Arial" font-size="27" fill="${C.crema}">${grupo.length} productos · foto encontrada en internet, comparada con la del proveedor · contesta «todo bien» o «mal la 3» · nada está publicado</text>
  </svg>`), left: 0, top: 0 }];
  for (const [k, d] of grupo.entries()) comps.push({ input: await tile(d, k + 1), left: (k % COLS) * TW, top: HEAD + Math.floor(k / COLS) * TH });
  const ids = grupo.map((d) => d.id);
  comps.push({ input: Buffer.from(`<svg width="${W}" height="${FOOT}"><rect width="${W}" height="${FOOT}" fill="${C.marron}"/>
    <text x="40" y="32" font-family="Arial" font-size="22" fill="${C.crema}">Números de la bolsa (en orden 1-${grupo.length}): ${esc(ids.join(', '))}</text>
    <text x="40" y="62" font-family="Arial" font-size="20" fill="${C.crema}">Generado el ${new Date().toISOString().slice(0, 10)} por Claude · precio = precio de venta en USD · nota = calidad de la foto principal (0-10) · borde ámbar = mirar con cuidado</text>
  </svg>`), left: 0, top: H - FOOT });
  const nombre = `${PREFIJO}-${String(h + 1).padStart(2, '0')}.jpg`;
  await sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } }).composite(comps).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(salida, nombre));
  hojas.push({ hoja: h + 1, archivo: nombre, ids, productos: grupo.map((d, k) => ({ n: k + 1, id: d.id, titulo: d.titulo, precio_usd: d.precio, nota: d.nota, fuente: d.fuente, avisos: d.avisos })), ojo: 'NO usar APRUEBA en el «Tú» con estos números hasta que estén subidos (photos_clean): el bot puliría las fotos del proveedor con el método viejo' });
  console.log(nombre, ids.length);
}
const duplicados = datos.filter((d) => d.duplicado_de).map((d) => ({ id: d.id, titulo: d.titulo, duplicado_de: d.duplicado_de }));
fs.writeFileSync(path.join(salida, `${PREFIJO}-hojas.json`), JSON.stringify({ generado: new Date().toISOString(), total_hojas: total, productos: lista.length, hojas, duplicados_fuera_de_las_hojas: duplicados }, null, 1));
console.log(JSON.stringify({ hojas: total, productos: lista.length, duplicados: duplicados.length }));
