// Fotos de grupo de Casa Viva (23-oct, D101): el mismo estilo que la del grupo VIP (../fidelidad/foto-grupo-vip.mjs):
// petróleo con degradado, aro ámbar fino, isotipo CV en crema; debajo una palabra pequeña en crema y una grande en ámbar.
// Todo dentro del aro (WhatsApp recorta en círculo). La palabra grande se encoge sola hasta caber dentro del círculo.
// Herramientas gratis: resvg + sharp de la carpeta de VivaBot. 640×640 JPG.
// Uso: node fotos-grupos-24h.mjs <carpeta con Cinzel.ttf, Figtree.ttf y logo.svg (de /root/archivos/marca/: Cinzel[wght].ttf,
//      Figtree[wght].ttf, logo-horizontal-crema.svg)> [carpeta de salida]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/Ernesto/vivabot/package.json');
const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');

const MARCA = process.argv[2];
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const OUT = process.argv[3] || path.join(HERE, 'grupos-20261023');
const logo = fs.readFileSync(path.join(MARCA, 'logo.svg'), 'utf8').match(/<path[^>]*d="([^"]+)"/)[1];
const C = { petroleo: '#0D3B45', petroleoClaro: '#14525E', crema: '#F6F1E6', ambar: '#E0A05F' };
const S = 640;
// Medidas: el isotipo como en la foto VIP (escala 0.23) un poco más arriba, para que la palabra grande quepa en el círculo.
const LOGO_Y = 106, SMALL_Y = 382, BIG_Y = 484, RING_IN = 250; // RING_IN = radio útil dentro del aro (268 − trazo − margen)
const MAX_W = Math.floor(2 * Math.sqrt(RING_IN ** 2 - (BIG_Y - 320) ** 2)); // ancho que cabe a la altura de la base del texto
const FONTS = { fontFiles: [path.join(MARCA, 'Cinzel.ttf'), path.join(MARCA, 'Figtree.ttf')], loadSystemFonts: false, defaultFontFamily: 'Cinzel' };

// Lo que dice cada foto. small = arriba, en crema; big = grande, en ámbar.
const GRUPOS = {
  comunidad: { small: 'COMUNIDAD', big: 'CASA VIVA', jid: '120363302056147831@g.us', nombre: 'CASA VIVA (comunidad)' },
  '24h': { small: 'BAJO PEDIDO', big: '24 H', jid: '120363425123846351@g.us', nombre: 'Actualización productos 24h⏲️' },
  recogida: { small: 'RECOGIDA EN', big: 'TIENDA', jid: '120363394650616711@g.us', nombre: 'Recogida en tienda' },
  actualizacion: { small: 'PRODUCTOS', big: 'NUEVOS', jid: '120363283827702479@g.us', nombre: 'Actualización de productos' },
};

const bigText = (txt, size) => `<text x="320" y="${BIG_Y}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="${size}" letter-spacing="${Math.round(size / 30)}" fill="${C.ambar}" stroke="${C.ambar}" stroke-width="${(size / 29).toFixed(1)}" stroke-linejoin="round">${txt}</text>`;
/** Ancho real del texto grande (resvg mide la caja del dibujo). */
function width(txt, size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${bigText(txt, size)}</svg>`;
  const b = new Resvg(svg, { font: FONTS }).getBBox();
  return b ? b.width : 0;
}
/** El tamaño más grande (hasta 116, como «VIP») que cabe dentro del círculo a esa altura (MAX_W). */
function fit(txt) {
  for (let size = 116; size >= 48; size -= 2) if (width(txt, size) <= MAX_W) return size;
  return 48;
}

function svg({ small, big }) {
  const size = fit(big);
  // Las rayas ámbar a los lados de la palabra pequeña: más separadas si la palabra es larga.
  const half = Math.min(150, 20 + small.length * 11);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <radialGradient id="g" cx="50%" cy="42%" r="65%"><stop offset="0" stop-color="${C.petroleoClaro}"/><stop offset="1" stop-color="${C.petroleo}"/></radialGradient>
    <clipPath id="iso"><rect x="0" y="0" width="1000" height="1000"/></clipPath>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#g)"/>
  <circle cx="320" cy="320" r="268" fill="none" stroke="${C.ambar}" stroke-width="10" opacity=".9"/>
  <g transform="translate(205 ${LOGO_Y}) scale(0.23)"><path clip-path="url(#iso)" fill="${C.crema}" d="${logo}"/></g>
  <line x1="${320 - half - 54}" y1="${SMALL_Y - 11}" x2="${320 - half - 10}" y2="${SMALL_Y - 11}" stroke="${C.ambar}" stroke-width="3" stroke-linecap="round"/>
  <line x1="${320 + half + 10}" y1="${SMALL_Y - 11}" x2="${320 + half + 54}" y2="${SMALL_Y - 11}" stroke="${C.ambar}" stroke-width="3" stroke-linecap="round"/>
  <text x="320" y="${SMALL_Y}" text-anchor="middle" font-family="Figtree" font-weight="700" font-size="30" letter-spacing="6" fill="${C.crema}" stroke="${C.crema}" stroke-width="1.2">${small}</text>
  ${bigText(big, size)}
</svg>`;
}

fs.mkdirSync(OUT, { recursive: true });
for (const [k, g] of Object.entries(GRUPOS)) {
  const png = new Resvg(svg(g), { font: FONTS, fitTo: { mode: 'width', value: S } }).render().asPng();
  const file = path.join(OUT, `${k}.jpg`);
  await sharp(png).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(file);
  console.log(`${k}.jpg · «${g.small} / ${g.big}» (letra ${fit(g.big)}) → ${g.nombre} ${g.jid}`);
}
