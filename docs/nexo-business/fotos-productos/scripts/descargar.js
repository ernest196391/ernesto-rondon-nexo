// Descarga las fotos del proveedor del piloto y mide cada una.
// Uso: node descargar.js <carpeta-piloto>
const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/Ernesto/ernesto-rondon-nexo/node_modules/sharp');

const base = process.argv[2];
const productos = JSON.parse(fs.readFileSync(path.join(base, 'piloto.json'), 'utf8'));

async function bajar(url, destino) {
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(destino, buf);
      return buf;
    } catch (e) {
      if (i === 3) throw e;
      await new Promise((ok) => setTimeout(ok, 1500 * i));
    }
  }
}

(async () => {
  const medidas = {};
  for (const p of productos) {
    const dir = path.join(base, p.short, 'original');
    fs.mkdirSync(dir, { recursive: true });
    medidas[p.short] = [];
    for (let i = 0; i < p.imagenes.length; i++) {
      const url = p.imagenes[i];
      const ext = (url.split('.').pop() || 'jpg').toLowerCase().slice(0, 4);
      const nombre = String(i + 1).padStart(2, '0') + '.' + ext;
      const destino = path.join(dir, nombre);
      try {
        const buf = fs.existsSync(destino) ? fs.readFileSync(destino) : await bajar(url, destino);
        const m = await sharp(buf).metadata();
        medidas[p.short].push({ archivo: nombre, url, w: m.width, h: m.height, formato: m.format, kb: Math.round(buf.length / 1024) });
      } catch (e) {
        medidas[p.short].push({ archivo: nombre, url, error: String(e.message || e) });
      }
    }
  }
  fs.writeFileSync(path.join(base, 'medidas-originales.json'), JSON.stringify(medidas, null, 1));
  for (const [k, v] of Object.entries(medidas)) {
    console.log(k, v.map((x) => x.error ? x.archivo + ' ERROR ' + x.error : `${x.archivo} ${x.w}x${x.h} ${x.kb}KB`).join(' | '));
  }
})();
