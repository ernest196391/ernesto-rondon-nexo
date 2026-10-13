// Crea una hoja por producto con todas sus fotos (para revisarlas a ojo).
// Uso: node hoja-auditoria.js <carpeta-piloto> <subcarpeta: original|web> [ids...]
const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/Ernesto/ernesto-rondon-nexo/node_modules/sharp');

const [base, sub, ...soloIds] = process.argv.slice(2);
const TILE = 520;
const COLS = 3;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

(async () => {
  const productos = JSON.parse(fs.readFileSync(path.join(base, 'piloto.json'), 'utf8'));
  const outDir = path.join(process.argv[1], '..', 'auditoria');
  fs.mkdirSync(outDir, { recursive: true });
  for (const p of productos) {
    if (soloIds.length && !soloIds.includes(p.short)) continue;
    const dir = path.join(base, p.short, sub);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f)).sort();
    if (!files.length) continue;
    const rows = Math.ceil(files.length / COLS);
    const W = COLS * TILE, H = rows * (TILE + 30) + 40;
    const comps = [];
    for (let i = 0; i < files.length; i++) {
      const f = path.join(dir, files[i]);
      const m = await sharp(f).metadata();
      const img = await sharp(f).flatten({ background: '#ff00ff' }).resize(TILE - 10, TILE - 10, { fit: 'contain', background: '#cccccc' }).png().toBuffer();
      const x = (i % COLS) * TILE, y = 40 + Math.floor(i / COLS) * (TILE + 30);
      comps.push({ input: img, left: x + 5, top: y + 30 });
      const label = Buffer.from(`<svg width="${TILE}" height="30"><text x="6" y="22" font-family="Arial" font-size="20" fill="#000">${esc(files[i])}  ${m.width}x${m.height}</text></svg>`);
      comps.push({ input: label, left: x, top: y });
    }
    const title = Buffer.from(`<svg width="${W}" height="40"><text x="8" y="28" font-family="Arial" font-size="24" font-weight="bold" fill="#000">${esc(p.short + ' · ' + p.nombre.replace(/[^\p{L}\p{N}\s.,()/+–\-"']/gu, '').trim())}</text></svg>`);
    comps.push({ input: title, left: 0, top: 0 });
    await sharp({ create: { width: W, height: H, channels: 3, background: '#bbbbbb' } }).composite(comps).jpeg({ quality: 85 }).toFile(path.join(outDir, `${p.short}-${sub}.jpg`));
    console.log('ok', p.short, files.length);
  }
})();
