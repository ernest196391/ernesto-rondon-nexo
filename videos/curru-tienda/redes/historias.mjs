// Historias de Casa Viva con el MANUAL DE MARCA: foto entera, banda petróleo abajo (las caras quedan libres),
// título en Cinzel (mayúsculas, separado), frase en Figtree y el logo horizontal oficial en crema.
// Uso: node historias.mjs  → ../historias/historia-N.jpg (1080×1920)
import sharp from 'sharp';
import fs from 'fs';
import { createRequire } from 'module';
// El texto se dibuja con resvg (lee las fuentes del manual de la carpeta fuentes/); libass/ffmpeg ponía Arial.
const { Resvg } = createRequire('C:/Users/Ernesto/vivabot/')('@resvg/resvg-js');
const FONTS = ['fuentes/Cinzel[wght].ttf', 'fuentes/Figtree[wght].ttf'];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const W = 1080, H = 1920, BAND = 430;          // banda de abajo: de 1490 a 1920
const PETROLEO = '#0D3B45';
const HISTORIAS = [
  ['T1-capa-mostrador', 'UN DÍA NORMAL', 'Mami vende. Él vuela.'],
  ['T2-carrito-pasillo', 'PASEO POR LA TIENDA', 'Cuando descubre los carritos…'],
  ['T3-flor-sombrero', 'LA FLOR TIENE DUEÑO', 'Y no es para la cama.'],
  ['T4-fuerte-sabanas', 'MISIÓN: SÁBANAS', 'Ella busca. Él construye un fuerte.'],
  ['T5-portero-entrada', 'BIENVENIDOS', 'El portero más serio de La Habana.'],
];
const logo = await sharp(Buffer.from(fs.readFileSync('logo-horizontal-crema.svg'))).resize({ width: 330 }).png().toBuffer();
const lm = await sharp(logo).metadata();
// Banda petróleo con el título (Cinzel, separado; trazo fino ≈ SemiBold 600 porque la fuente variable da el 400)
// y la frase (Figtree, trazo mínimo ≈ Medium 500), en crema.
const band = (title, line) => new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${BAND}">
  <rect width="${W}" height="${BAND}" fill="${PETROLEO}"/>
  <text x="${W / 2}" y="125" text-anchor="middle" font-family="Cinzel" font-size="70" letter-spacing="9" fill="#F6F1E6" stroke="#F6F1E6" stroke-width="1.6">${esc(title)}</text>
  <text x="${W / 2}" y="210" text-anchor="middle" font-family="Figtree" font-size="46" fill="#F6F1E6" stroke="#F6F1E6" stroke-width="0.6">${esc(line)}</text>
</svg>`, { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Figtree' } }).render().asPng();
fs.mkdirSync('../historias', { recursive: true });
for (const [i, [src, title, line]] of HISTORIAS.entries()) {
  const base = await sharp(`../tomas/${src}.png`).resize({ width: W, height: H, fit: 'cover' }).toBuffer();
  await sharp(base)
    .composite([
      { input: band(title, line), left: 0, top: H - BAND },
      { input: logo, left: Math.round((W - lm.width) / 2), top: H - 120 - Math.round(lm.height / 2) },
    ])
    .jpeg({ quality: 92 }).toFile(`../historias/historia-${i + 1}.jpg`);
}
console.log(`${HISTORIAS.length} historias listas en ../historias/`);
