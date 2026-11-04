// Genera los iconos de la app de Casa Viva desde los SVG oficiales del manual (sin redibujar: se usa el mismo trazado).
// Uso: node genera.cjs <carpeta-salida>
const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/Ernesto/ernesto-rondon-nexo/node_modules/sharp');
const LOGO = 'C:/Users/Ernesto/ernesto-rondon-nexo/docs/sistemas-de-diseno/casa-viva/logo/';
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });

const MARRON = '#2B2420', CREMA = '#F6F1E6';
function body(file) {
  const s = fs.readFileSync(LOGO + file, 'utf8');
  const vb = s.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const paths = s.replace(/[\s\S]*<\/metadata>/, '').replace(/<\/svg>\s*$/, '');
  return { w: +vb[1], h: +vb[2], paths };
}
const iso = body('casa-viva-isotipo-crema.svg');           // isotipo (perfiles, app)
const compacto = body('casa-viva-isotipo-compacto-crema.svg'); // compacto (16-48 px)

// Lienzo cuadrado S, fondo opcional, marca centrada con altura = frac*S.
function svg(S, mark, frac, { bg = MARRON, rx = 0, color = CREMA } = {}) {
  const h = S * frac, k = h / mark.h, w = mark.w * k;
  const x = (S - w) / 2, y = (S - h) / 2;
  const paths = mark.paths.replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${color}"`);
  const rect = bg ? `<rect width="${S}" height="${S}" rx="${rx}" fill="${bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">${rect}<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${k.toFixed(5)})">${paths}</g></svg>`;
}
async function png(name, svgText, S) {
  await sharp(Buffer.from(svgText), { density: 72 * 4 }).resize(S, S).png({ compressionLevel: 9 }).toFile(path.join(out, name));
  console.log('ok', name);
}
(async () => {
  // Icono «any»: cuadrado marrón a sangre (Android/iOS lo redondean), isotipo crema al 56 %.
  await png('cv-icon-512.png', svg(512, iso, 0.56), 512);
  await png('cv-icon-192.png', svg(512, iso, 0.56), 192);
  // Maskable: el isotipo dentro del círculo seguro (80 %): altura 46 %.
  await png('cv-icon-maskable-512.png', svg(512, iso, 0.46), 512);
  // Apple (180): iOS pone las esquinas.
  await png('cv-apple-touch-180.png', svg(512, iso, 0.56), 180);
  // Insignia de notificación (Android la usa como silueta): compacto en blanco sobre transparente.
  const badge = svg(96, compacto, 0.74, { bg: null, color: '#FFFFFF' });
  await png('cv-badge-96.png', badge, 96);
  fs.writeFileSync(path.join(out, 'cv-badge.svg'), badge);
  // Icono de la pantalla de entrar (SVG nítido): cuadrado redondeado marrón con el isotipo crema.
  const app = svg(512, iso, 0.56, { rx: 112 });
  fs.writeFileSync(path.join(out, 'cv-icono-app.svg'), app);
  await png('cv-icono-app-preview.png', app, 256);
})();
