// Quita fotos repetidas dentro de cada producto (dHash 9x8) → unicas.txt
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire('/root/vivabot/package.json');
const sharp = require('sharp');
const files = fs.readFileSync('lista-fotos.txt', 'utf8').trim().split('\n');
async function dhash(f) {
  const px = await sharp(f).rotate().greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  let bits = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += px[y * 9 + x] > px[y * 9 + x + 1] ? '1' : '0';
  return bits;
}
const ham = (a, b) => [...a].reduce((n, c, i) => n + (c !== b[i]), 0);
const by = {}; const keep = []; let drop = 0;
for (const f of files) {
  const id = f.split('/')[1]; const h = await dhash(f);
  by[id] ||= [];
  if (by[id].some((x) => ham(x, h) <= 6)) { drop++; continue; }
  by[id].push(h); keep.push(f);
}
fs.writeFileSync('unicas.txt', keep.join('\n'));
console.log('unicas', keep.length, 'repetidas', drop);
