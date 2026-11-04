// Portada (miniatura) de un reel de Casa Viva, con el MANUAL DE MARCA (lo pidió Ernesto el 13-oct).
// 1080×1920, pero todo lo importante dentro del centro 3:4 (1080×1440, y 240–1680: la cuadrícula del perfil de
// Instagram recorta ahí) y también dentro del 4:5 del feed (y 285–1635).
// Foto: un fotograma limpio (sin subtítulos) con las caras. Arriba, la pregunta en Figtree crema sobre una caja
// petróleo; abajo, el logo horizontal oficial crema sobre una pastilla petróleo (nunca sobre foto recargada).
// Uso: node portada.mjs <fotograma.jpg> <salida.jpg> "<pregunta, | parte la línea>" [zoom] [cx] [cy] [arriba]
//   arriba = y donde empieza la caja de la pregunta (330 por defecto; si la cara está arriba, ponerla debajo, ~1160).
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const { Resvg } = createRequire('C:/Users/Ernesto/vivabot/')('@resvg/resvg-js');
const FONTS = [path.join(AQUI, 'fuentes/Figtree[wght].ttf'), path.join(AQUI, 'fuentes/Cinzel[wght].ttf')];
const opts = { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Figtree' } };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const W = 1080, H = 1920, CREMA = '#F6F1E6', PETROLEO = '#0D3B45';

const [, , entrada, salida, pregunta, zoomArg = '1', cxArg = '0.5', cyArg = '0.5', topArg = '330'] = process.argv;
if (!entrada || !salida || !pregunta) { console.error('uso: node portada.mjs <foto> <salida.jpg> "<pregunta>" [zoom] [cx] [cy]'); process.exit(1); }
const zoom = Number(zoomArg), cx = Number(cxArg), cy = Number(cyArg);

// 1) Foto: recorte con zoom alrededor de (cx, cy) y a 1080×1920.
const meta = await sharp(entrada).metadata();
const cw = Math.round(meta.width / zoom), ch = Math.round(meta.height / zoom);
const left = Math.min(Math.max(Math.round(cx * meta.width - cw / 2), 0), meta.width - cw);
const top = Math.min(Math.max(Math.round(cy * meta.height - ch / 2), 0), meta.height - ch);
const foto = await sharp(entrada).extract({ left, top, width: cw, height: ch })
  .resize(W, H, { kernel: 'lanczos3', fit: 'cover' }).sharpen({ sigma: 0.8 }).toBuffer();

// 2) Pregunta: Figtree grande (trazo del mismo color ≈ SemiBold, la fuente variable sale en 400).
const ancho = (txt, size) => new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="${size * 2}"><text x="0" y="${size * 1.5}" font-family="Figtree" font-size="${size}">${esc(txt)}</text></svg>`, opts).getBBox()?.width ?? 0;
const SIZE = 84, LH = 100, PADX = 50, PADY = 34, TOP = Number(topArg);
const ls = pregunta.split('|');
const bw = Math.min(W - 80, Math.ceil(Math.max(...ls.map((l) => ancho(l, SIZE)))) + 2 * PADX);
const bh = ls.length * LH + 2 * PADY;
for (const l of ls) if (ancho(l, SIZE) > W - 80 - 2 * PADX) throw new Error(`línea demasiado larga: ${l}`);
const caja = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${bh}">
  <rect x="${(W - bw) / 2}" y="0" width="${bw}" height="${bh}" rx="30" fill="${PETROLEO}"/>
  ${ls.map((l, k) => `<text x="${W / 2}" y="${(PADY + LH * k + LH / 2 + SIZE * 0.35).toFixed(1)}" text-anchor="middle" font-family="Figtree" font-size="${SIZE}" fill="${CREMA}" stroke="${CREMA}" stroke-width="2">${esc(l)}</text>`).join('')}
</svg>`, opts).render().asPng();

// 3) Logo horizontal crema sobre pastilla petróleo, abajo dentro del 4:5.
const logo = await sharp(Buffer.from(fs.readFileSync(path.join(AQUI, 'logo-horizontal-crema.svg')))).resize({ width: 300 }).png().toBuffer();
const lm = await sharp(logo).metadata();
const PW = lm.width + 80, PH = lm.height + 44, PY = 1520;
if (TOP + bh > PY - 20) throw new Error('la caja de la pregunta pisa el logo: súbela');
const pastilla = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}"><rect width="${PW}" height="${PH}" rx="${PH / 2}" fill="${PETROLEO}"/></svg>`);

await sharp(foto).composite([
  { input: caja, left: 0, top: TOP },
  { input: pastilla, left: Math.round((W - PW) / 2), top: PY },
  { input: logo, left: Math.round((W - lm.width) / 2), top: PY + 22 },
]).jpeg({ quality: 92, mozjpeg: true }).toFile(salida);
console.log(`${salida}: caja y ${TOP}–${TOP + bh}, logo y ${PY}–${PY + PH} (3:4 = 240–1680, 4:5 = 285–1635)`);
