// Baja imágenes candidatas de la web a <piloto>/<id>/web/ y apunta la fuente.
// Uso: node bajar-web.js <carpeta-piloto> <id> <pagina-fuente> <url1> [url2 ...]
const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/Ernesto/ernesto-rondon-nexo/node_modules/sharp');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const [base, id, pagina, ...urls] = process.argv.slice(2);
(async () => {
  const dir = path.join(base, id, 'web');
  fs.mkdirSync(dir, { recursive: true });
  const fuentesPath = path.join(dir, 'fuentes.json');
  const fuentes = fs.existsSync(fuentesPath) ? JSON.parse(fs.readFileSync(fuentesPath, 'utf8')) : [];
  let n = fuentes.length;
  for (let u of urls) {
    if (!/^https?:/.test(u)) u = 'https://' + u;
    try {
      const r = await fetch(u, { headers: { 'user-agent': UA, referer: pagina } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      const m = await sharp(buf).metadata();
      n++;
      const nombre = 'w' + String(n).padStart(2, '0') + '.' + (m.format === 'jpeg' ? 'jpg' : m.format);
      fs.writeFileSync(path.join(dir, nombre), buf);
      fuentes.push({ archivo: nombre, url: u, pagina, w: m.width, h: m.height, formato: m.format });
      console.log('ok', nombre, m.width + 'x' + m.height, m.format, u);
    } catch (e) {
      console.log('FALLO', u, e.message);
    }
  }
  fs.writeFileSync(fuentesPath, JSON.stringify(fuentes, null, 1));
})();
