const sharp = require('C:/Users/Ernesto/vivabot/node_modules/sharp');
const fs = require('fs');
const colors = ['morado','gris','carmelita','beige','salmon'];
(async () => {
  fs.mkdirSync('web', { recursive: true });
  for (const c of colors) {
    const src = c === 'morado' ? 'sobrecama-118-original-morado.jpg' : `sobrecama-118-${c}.jpg`;
    await sharp(src).resize(1200, 1200, { fit: 'contain', background: '#ffffff' }).jpeg({ quality: 86, mozjpeg: true }).toFile(`web/sobrecama-lisa-full-${c}.jpg`);
  }
  const T = 300, P = 44;
  const tiles = await Promise.all(colors.map(async (c, i) => {
    const img = await sharp(`web/sobrecama-lisa-full-${c}.jpg`).resize(T, T).toBuffer();
    const label = Buffer.from(`<svg width="${T}" height="${P}"><rect width="100%" height="100%" fill="#F6F1E6"/><text x="50%" y="30" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle" fill="#2B2420">${c}</text></svg>`);
    const tile = await sharp({ create: { width: T, height: T + P, channels: 3, background: '#F6F1E6' } }).composite([{ input: img, top: 0, left: 0 }, { input: label, top: T, left: 0 }]).png().toBuffer();
    return { input: tile, left: i * (T + 10), top: 0 };
  }));
  await sharp({ create: { width: 5 * T + 40, height: T + P, channels: 3, background: '#ffffff' } }).composite(tiles).jpeg({ quality: 85 }).toFile('hoja-sobrecama-lisa-full.jpg');
  console.log('ok');
})();
