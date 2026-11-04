// Tarjetas del RESUMEN DEL DÍA con el manual de marca de Casa Viva (una por público: Ernesto, Lennys, dependientas,
// gestoras, mensajeros). Cabecera petróleo con el logo oficial en crema, cuerpo crema, títulos en Cinzel ámbar,
// texto en Figtree marrón. El texto lo dibuja resvg (ffmpeg/libass no usa las fuentes del manual).
// Uso: node resumen-dia.mjs <carpeta con contenido.json>  → <carpeta>/<archivo>.png (1080 de ancho)
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const { Resvg } = createRequire('C:/Users/Ernesto/vivabot/')('@resvg/resvg-js');
const FONTS = [path.join(here, 'fuentes/Cinzel[wght].ttf'), path.join(here, 'fuentes/Figtree[wght].ttf')];
const C = { crema: '#F6F1E6', marron: '#2B2420', petroleo: '#0D3B45', ambar: '#A35A1F' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const W = 1080, PAD = 72, HEAD = 330, FOOT = 90;
const ITEM = 34, LINE = 46, MAXCH = 50;

// Corta por palabras a MAXCH caracteres (resvg no parte líneas solo).
function wrap(text, max = MAXCH) {
  const out = []; let cur = '';
  for (const w of String(text).split(/\s+/)) {
    if ((cur + ' ' + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) out.push(cur);
  return out;
}

async function card(dir, fecha, t, logo, lm) {
  // Cuerpo: título de sección (Cinzel ámbar) + viñetas (Figtree marrón, sangría colgante).
  let y = HEAD + 70; const parts = [];
  for (const s of t.secciones) {
    parts.push(`<text x="${PAD}" y="${y}" font-family="Cinzel" font-size="36" letter-spacing="5" fill="${C.ambar}" stroke="${C.ambar}" stroke-width="0.9">${esc(s.titulo.toUpperCase())}</text>`);
    parts.push(`<rect x="${PAD}" y="${y + 14}" width="70" height="3" fill="${C.ambar}"/>`);
    y += 66;
    for (const it of s.items) {
      const lines = wrap(it);
      parts.push(`<circle cx="${PAD + 9}" cy="${y - 11}" r="6" fill="${C.petroleo}"/>`);
      lines.forEach((l, i) => parts.push(`<text x="${PAD + 34}" y="${y + i * LINE}" font-family="Figtree" font-size="${ITEM}" fill="${C.marron}" stroke="${C.marron}" stroke-width="0.35">${esc(l)}</text>`));
      y += lines.length * LINE + 16;
    }
    y += 30;
  }
  const H = Math.max(1350, y + FOOT + 10);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${C.crema}"/>
  <rect width="${W}" height="${HEAD}" fill="${C.petroleo}"/>
  <text x="${W / 2}" y="215" text-anchor="middle" font-family="Cinzel" font-size="58" letter-spacing="8" fill="${C.crema}" stroke="${C.crema}" stroke-width="1.4">RESUMEN DEL DÍA</text>
  <text x="${W / 2}" y="275" text-anchor="middle" font-family="Figtree" font-size="32" fill="${C.crema}">${esc(fecha)} · ${esc(t.para)}</text>
  ${parts.join('\n  ')}
  <rect y="${H - FOOT}" width="${W}" height="${FOOT}" fill="${C.petroleo}"/>
  <text x="${W / 2}" y="${H - FOOT + 56}" text-anchor="middle" font-family="Figtree" font-size="28" letter-spacing="2" fill="${C.crema}">casaviva.company</text>
</svg>`;
  const png = new Resvg(svg, { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Figtree' } }).render().asPng();
  await sharp(png).composite([{ input: logo, left: Math.round((W - lm.width) / 2), top: 52 }]).png().toFile(path.join(dir, t.archivo));
  return { archivo: t.archivo, alto: H };
}

const dir = path.resolve(process.argv[2] || '.');
const data = JSON.parse(fs.readFileSync(path.join(dir, process.argv[3] || 'contenido.json'), 'utf8'));
const logo = await sharp(Buffer.from(fs.readFileSync(path.join(here, 'logo-horizontal-crema.svg')))).resize({ width: 380 }).png().toBuffer();
const lm = await sharp(logo).metadata();
for (const t of data.tarjetas) console.log(await card(dir, data.fecha, t, logo, lm));
