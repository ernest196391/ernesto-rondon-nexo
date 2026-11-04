// 5 historias del reel «Súper Prosko» (14-oct) con la plantilla del manual (redes/historias.mjs): foto entera,
// banda petróleo abajo (430 px) con título Cinzel + frase Figtree + logo horizontal crema. Las caras nunca bajo
// el texto (si la foto tiene la cara abajo, se desplaza con «cy»). Sin créditos.
// Uso: node historias.mjs → historias/historia-N.jpg (1080×1920) + historias/hoja.jpg
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

process.chdir(path.dirname(fileURLToPath(import.meta.url)));
const { Resvg } = createRequire('C:/Users/Ernesto/vivabot/')('@resvg/resvg-js');
const FONTS = ['../redes/fuentes/Cinzel[wght].ttf', '../redes/fuentes/Figtree[wght].ttf'];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const W = 1080, H = 1920, BAND = 430, PETROLEO = '#0D3B45';

// [foto, título, frase, cy (0–1: qué parte vertical de la foto queda), zoom]
const HISTORIAS = [
  ['00-arranque-b-gancho.png', '¿Y ESTO?', '¿Tu niño también hace esto?', 0.42, 1.0],
  ['00-arranque-a.png', 'UN DÍA NORMAL', 'Mami al teléfono. Él, en su banquito.', 0.4, 1.0],
  ['revision/h-clac.png', 'SIN MIRAR', 'Un movimiento y la cama está abierta.', 0.5, 1.0],
  ['00-arranque-c.png', 'ATERRIZAJE', 'Súper Prosko, sano y salvo.', 0.42, 1.0],
  ['revision/h-guino.png', 'AQUÍ NO PASA NADA', '¿En tu casa quién salta más?', 0.4, 1.0],
];
const logo = await sharp(Buffer.from(fs.readFileSync('../redes/logo-horizontal-crema.svg'))).resize({ width: 330 }).png().toBuffer();
const lm = await sharp(logo).metadata();
const band = (title, line) => new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${BAND}">
  <rect width="${W}" height="${BAND}" fill="${PETROLEO}"/>
  <text x="${W / 2}" y="125" text-anchor="middle" font-family="Cinzel" font-size="70" letter-spacing="9" fill="#F6F1E6" stroke="#F6F1E6" stroke-width="1.6">${esc(title)}</text>
  <text x="${W / 2}" y="210" text-anchor="middle" font-family="Figtree" font-size="46" fill="#F6F1E6" stroke="#F6F1E6" stroke-width="0.6">${esc(line)}</text>
</svg>`, { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Figtree' } });
fs.mkdirSync('historias', { recursive: true });
const minis = [];
for (const [i, [src, title, line, cy, zoom]] of HISTORIAS.entries()) {
  const m = await sharp(src).metadata();
  // Recorte: la foto ocupa 1080×1490 (lo que queda encima de la banda), centrada en cy.
  const ratio = W / (H - BAND);
  let cw = Math.round(m.width / zoom), ch = Math.round(cw / ratio);
  if (ch > m.height) { ch = m.height; cw = Math.round(ch * ratio); }
  const left = Math.round((m.width - cw) / 2);
  const top = Math.min(Math.max(Math.round(cy * m.height - ch / 2), 0), m.height - ch);
  const foto = await sharp(src).extract({ left, top, width: cw, height: ch }).resize(W, H - BAND, { kernel: 'lanczos3' }).toBuffer();
  const b = band(title, line);
  const ancho = (txt, fam, size, ls) => new Resvg(`<svg xmlns='http://www.w3.org/2000/svg' width='4000' height='200'><text x='0' y='150' font-family='${fam}' font-size='${size}' letter-spacing='${ls}'>${esc(txt)}</text></svg>`, { font: { fontFiles: FONTS, loadSystemFonts: false } }).getBBox()?.width ?? 0;
  if (ancho(title, 'Cinzel', 70, 9) > W - 80 || ancho(line, 'Figtree', 46, 0) > W - 80) throw new Error(`texto ancho: ${title} / ${line}`);
  const out = `historias/historia-${i + 1}.jpg`;
  await sharp({ create: { width: W, height: H, channels: 3, background: PETROLEO } })
    .composite([
      { input: foto, left: 0, top: 0 },
      { input: b.render().asPng(), left: 0, top: H - BAND },
      { input: logo, left: Math.round((W - lm.width) / 2), top: H - 120 - Math.round(lm.height / 2) },
    ]).jpeg({ quality: 92 }).toFile(out);
  minis.push(await sharp(out).resize(216, 384).toBuffer());
}
await sharp({ create: { width: 216 * 5, height: 384, channels: 3, background: '#fff' } })
  .composite(minis.map((input, i) => ({ input, left: i * 216, top: 0 }))).jpeg({ quality: 85 }).toFile('historias/hoja.jpg');
console.log(`${HISTORIAS.length} historias en historias/ (+ hoja.jpg)`);
