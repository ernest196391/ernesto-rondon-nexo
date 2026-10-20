// Fotos para la web y el anuncio: sin repetidas, sin las equivocadas y sin marcas/nombres de otros negocios.
// Revisión a ojo (hojas de contactos) el 20-oct; aquí solo se aplica lo decidido. Salida: limpias/<market_id>/<n>.jpg
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire('/root/vivabot/package.json');
const sharp = require('sharp');
const QUITAR = new Set(['380/3', '1252/2', '1334/2', '1338/1', '1709/2', '1708/2', '1294/2', '1251/2', '1750/3', '1752/2', '1754/2', '1755/2', '1753/2', '1751/2']);
// Zonas en fracción de la imagen [x0,y0,x1,y1]
const NIKA = [[0, 0, 0.29, 0.26, 'blur'], [0.66, 0.635, 0.85, 0.89, 'blur']];
const EDIT = {
  '1764/1': { zonas: NIKA }, '1765/1': { zonas: NIKA }, '1677/1': { zonas: NIKA }, '1678/1': { zonas: NIKA },
  '1766/1': { zonas: [[0, 0, 0.35, 0.28, 'blur']], recorte: [0, 0, 1, 0.952] },
  '292/1': { zonas: [[0.70, 0.015, 0.98, 0.118, 'tapar', '#ffffff']] },
  '169/1': { zonas: [[0.675, 0.715, 0.955, 0.875, 'tapar']] },
  '110/1': { zonas: [[0.675, 0.715, 0.955, 0.875, 'tapar']] },
  '406/1': { recorte: [0, 0, 1, 0.875] },
  '1448/1': { recorte: [0, 0, 1, 0.885] },
  '1457/1': { recorte: [0, 0, 1, 0.925] }, '1679/1': { recorte: [0, 0, 1, 0.925] }, '1365/1': { recorte: [0, 0, 1, 0.925] },
  '1672/1': { recorte: [0, 0.255, 1, 0.72] },
};
async function procesa(src, e) {
  let buf = await sharp(src).rotate().toBuffer();
  const { width: W, height: H } = await sharp(buf).metadata();
  if (e?.zonas) {
    const comp = [];
    for (const [x0, y0, x1, y1, modo, color] of e.zonas) {
      const r = { left: Math.round(x0 * W), top: Math.round(y0 * H), width: Math.round((x1 - x0) * W), height: Math.round((y1 - y0) * H) };
      const parche = modo === 'tapar'
        ? await sharp({ create: { width: r.width, height: r.height, channels: 3, background: color || '#151515' } }).png().toBuffer()
        : await sharp(buf).extract(r).resize(Math.max(4, Math.round(r.width / 24)), Math.max(4, Math.round(r.height / 24))).resize(r.width, r.height, { kernel: 'cubic' }).blur(12).toBuffer();
      comp.push({ input: parche, left: r.left, top: r.top });
    }
    buf = await sharp(buf).composite(comp).toBuffer();
  }
  if (e?.recorte) {
    const [x0, y0, x1, y1] = e.recorte;
    buf = await sharp(buf).extract({ left: Math.round(x0 * W), top: Math.round(y0 * H), width: Math.round((x1 - x0) * W), height: Math.round((y1 - y0) * H) }).toBuffer();
  }
  return sharp(buf).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
}
const lista = fs.readFileSync('unicas.txt', 'utf8').trim().split('\n');
const n = {}; let hechas = 0, quitadas = 0, editadas = 0;
for (const f of lista) {
  const [, id, file] = f.split('/'); const key = `${id}/${file.replace('.jpg', '')}`;
  if (QUITAR.has(key)) { quitadas++; continue; }
  n[id] = (n[id] || 0) + 1; if (n[id] > 4) continue;
  fs.mkdirSync(`limpias/${id}`, { recursive: true });
  fs.writeFileSync(`limpias/${id}/${n[id]}.jpg`, await procesa(f, EDIT[key]));
  hechas++; if (EDIT[key]) editadas++;
}
console.log('fotos', hechas, 'editadas', editadas, 'quitadas', quitadas, 'productos', Object.keys(n).length);
