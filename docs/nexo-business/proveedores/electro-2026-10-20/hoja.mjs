// Hoja de contactos: node hoja.mjs salida.jpg COLS TAM ruta1 ruta2 ... (etiqueta = carpeta/archivo)
import { createRequire } from 'module';
const require = createRequire('/root/vivabot/package.json');
const sharp = require('sharp');
const [out, cols, size, ...files] = process.argv.slice(2);
const C = Number(cols), S = Number(size), rows = Math.ceil(files.length / C);
const tiles = [];
for (const [i, f] of files.entries()) {
  const label = f.split('/').slice(-2).join('/');
  const img = await sharp(f).rotate().resize(S, S, { fit: 'contain', background: '#888' }).toBuffer();
  const svg = Buffer.from(`<svg width="${S}" height="40"><rect width="100%" height="40" fill="#ff0"/><text x="8" y="30" font-size="28" font-family="sans-serif" fill="#000">${label}</text></svg>`);
  tiles.push({ input: img, left: (i % C) * (S + 6), top: Math.floor(i / C) * (S + 46) + 40 });
  tiles.push({ input: svg, left: (i % C) * (S + 6), top: Math.floor(i / C) * (S + 46) });
}
await sharp({ create: { width: C * (S + 6), height: rows * (S + 46), channels: 3, background: '#fff' } }).composite(tiles).jpeg({ quality: 80 }).toFile(out);
console.log(out);
