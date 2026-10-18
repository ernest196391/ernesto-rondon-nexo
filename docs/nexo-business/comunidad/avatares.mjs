// Fotos de la comunidad Casa Viva en WhatsApp (18-oct): un solo sistema para todos los grupos.
// WhatsApp las enseña en un círculo diminuto: nada de texto pequeño ni marcos; un icono grande en crema sobre petróleo,
// con un aro ámbar fino dentro del círculo visible. La comunidad lleva el isotipo CV.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/Ernesto/vivabot/package.json');
const { Resvg } = require('@resvg/resvg-js');

const T = process.env.TEMP;
const OUT = process.argv[2];
const ICONS = path.join(T, 'lucide/package/icons');
const logo = fs.readFileSync(path.join(T, 'logo.svg'), 'utf8').match(/<path[^>]*d="([^"]+)"/)[1];
const C = { petroleo: '#0D3B45', petroleoClaro: '#14525E', crema: '#F6F1E6', ambar: '#E0A05F' };
const S = 640;

function icon(name) {
  const svg = fs.readFileSync(path.join(ICONS, `${name}.svg`), 'utf8');
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}
function base(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs><radialGradient id="g" cx="50%" cy="42%" r="65%"><stop offset="0" stop-color="${C.petroleoClaro}"/><stop offset="1" stop-color="${C.petroleo}"/></radialGradient></defs>
  <rect width="${S}" height="${S}" fill="url(#g)"/>
  <circle cx="320" cy="320" r="268" fill="none" stroke="${C.ambar}" stroke-width="10" opacity=".9"/>
  ${inner}</svg>`;
}
// Icono Lucide (24×24, trazo) escalado al centro.
const conIcono = (name, size = 320) => {
  const k = size / 24, o = 320 - size / 2;
  return base(`<g transform="translate(${o} ${o}) scale(${k})" fill="none" stroke="${C.crema}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${icon(name)}</g>`);
};
const conTexto = (txt, size) => base(`<text x="320" y="${320 + size * 0.35}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="${size}" fill="${C.crema}">${txt}</text>`);
const isotipo = () => base(`<defs><clipPath id="iso"><rect x="0" y="0" width="1000" height="1000"/></clipPath></defs><g transform="translate(165 165) scale(0.31)"><path clip-path="url(#iso)" fill="${C.crema}" d="${logo}"/></g>`);

const GRUPOS = {
  comunidad: isotipo(),
  general: conIcono('messages-square'),
  mensajerias: conIcono('truck'),
  recogida: conIcono('store'),
  actualizacion: conIcono('package-plus'),
  '48h': conTexto('48h', 210),
  subida: conIcono('trending-up'),
};
fs.mkdirSync(OUT, { recursive: true });
for (const [k, svg] of Object.entries(GRUPOS)) {
  const png = new Resvg(svg, { font: { fontFiles: [path.join(T, 'Cinzel.ttf')], loadSystemFonts: false, defaultFontFamily: 'Cinzel' }, fitTo: { mode: 'width', value: S } }).render().asPng();
  fs.writeFileSync(path.join(OUT, `${k}.png`), png);
}
console.log('listo', Object.keys(GRUPOS).join(', '));
