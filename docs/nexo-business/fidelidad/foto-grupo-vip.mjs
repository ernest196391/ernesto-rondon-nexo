// Foto del grupo «Casa Viva · Clientes VIP» (22-oct). Mismo sistema que las fotos de la comunidad (../comunidad/avatares.mjs):
// petróleo, aro ámbar fino, isotipo CV en crema; debajo «CLIENTES» pequeño y «VIP» grande en ámbar.
// Todo dentro del aro (WhatsApp recorta en círculo). Herramientas gratis: resvg + sharp de la carpeta de VivaBot.
// Las fuentes son variables y resvg las pinta en peso normal: un trazo del mismo color las engorda para que se lean pequeñas.
// Uso: node foto-grupo-vip.mjs <carpeta con Cinzel.ttf, Figtree.ttf y logo.svg (de /root/archivos/marca/)> [salida.jpg]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/Ernesto/vivabot/package.json');
const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');

const MARCA = process.argv[2];
const OUT = process.argv[3] || path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), 'foto-grupo-vip.jpg');
const logo = fs.readFileSync(path.join(MARCA, 'logo.svg'), 'utf8').match(/<path[^>]*d="([^"]+)"/)[1];
const C = { petroleo: '#0D3B45', petroleoClaro: '#14525E', crema: '#F6F1E6', ambar: '#E0A05F' };
const S = 640;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <radialGradient id="g" cx="50%" cy="42%" r="65%"><stop offset="0" stop-color="${C.petroleoClaro}"/><stop offset="1" stop-color="${C.petroleo}"/></radialGradient>
    <clipPath id="iso"><rect x="0" y="0" width="1000" height="1000"/></clipPath>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#g)"/>
  <circle cx="320" cy="320" r="268" fill="none" stroke="${C.ambar}" stroke-width="10" opacity=".9"/>
  <g transform="translate(205 118) scale(0.23)"><path clip-path="url(#iso)" fill="${C.crema}" d="${logo}"/></g>
  <line x1="166" y1="392" x2="210" y2="392" stroke="${C.ambar}" stroke-width="3" stroke-linecap="round"/>
  <line x1="430" y1="392" x2="474" y2="392" stroke="${C.ambar}" stroke-width="3" stroke-linecap="round"/>
  <text x="320" y="403" text-anchor="middle" font-family="Figtree" font-weight="700" font-size="30" letter-spacing="6" fill="${C.crema}" stroke="${C.crema}" stroke-width="1.2">CLIENTES</text>
  <text x="320" y="512" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="116" letter-spacing="4" fill="${C.ambar}" stroke="${C.ambar}" stroke-width="4" stroke-linejoin="round">VIP</text>
</svg>`;

const png = new Resvg(svg, {
  font: { fontFiles: [path.join(MARCA, 'Cinzel.ttf'), path.join(MARCA, 'Figtree.ttf')], loadSystemFonts: false, defaultFontFamily: 'Cinzel' },
  fitTo: { mode: 'width', value: S },
}).render().asPng();
await sharp(png).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(OUT);
console.log('listo', OUT);
