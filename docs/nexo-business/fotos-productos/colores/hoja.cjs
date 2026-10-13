const sharp = require('C:/Users/Ernesto/vivabot/node_modules/sharp');
const fs = require('fs');
const colors = ['beige','verde','azul','gris','rosado','azul-claro','verde-azul','gris-oscuro','beige-oscuro'];
(async () => {
  fs.mkdirSync('web', { recursive: true });
  for (const c of colors) {
    const src = c === 'beige' ? 'sabanas-2491-original.png' : `sabanas-2491-${c}.jpg`;
    await sharp(src).resize(1200, 1200, { fit: 'cover' }).jpeg({ quality: 86, mozjpeg: true }).toFile(`web/sabanas-majestic-imperial-${c}.jpg`);
  }
  const T = 360, P = 50;
  const tiles = await Promise.all(colors.map(async (c, i) => {
    const img = await sharp(`web/sabanas-majestic-imperial-${c}.jpg`).resize(T, T).toBuffer();
    const label = Buffer.from(`<svg width="${T}" height="${P}"><rect width="100%" height="100%" fill="#F6F1E6"/><text x="50%" y="34" font-family="Arial" font-size="26" font-weight="bold" text-anchor="middle" fill="#2B2420">${c}</text></svg>`);
    const tile = await sharp({ create: { width: T, height: T + P, channels: 3, background: '#F6F1E6' } }).composite([{ input: img, top: 0, left: 0 }, { input: label, top: T, left: 0 }]).png().toBuffer();
    return { input: tile, left: (i % 3) * (T + 10), top: Math.floor(i / 3) * (T + P + 10) };
  }));
  await sharp({ create: { width: 3 * T + 20, height: 3 * (T + P) + 20, channels: 3, background: '#ffffff' } }).composite(tiles).jpeg({ quality: 85 }).toFile('hoja-sabanas-majestic.jpg');
  console.log('ok');
})();
