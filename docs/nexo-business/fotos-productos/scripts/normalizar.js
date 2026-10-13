// Normaliza las fotos elegidas: cuadrado 1200x1200, fondo blanco puro, producto centrado con 8 % de margen.
// Uso: node normalizar.js <carpeta-piloto>
const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/Ernesto/ernesto-rondon-nexo/node_modules/sharp');

const base = process.argv[2];
const LADO = 1200;
const MARGEN = 0.08;
const CAJA = Math.round(LADO * (1 - 2 * MARGEN)); // 1008

// Zonas a tapar con blanco (fracciones del ancho/alto) por logos o textos legales sobre fondo blanco.
const LENOVO = [{ x: 0.82, y: 0.9, w: 0.18, h: 0.1 }, { x: 0, y: 0.975, w: 1, h: 0.025 }];
const SONY = [{ x: 0, y: 0.86, w: 1, h: 0.14 }];
const MASCARAS = {
  '750aa656/original/01.jpg': LENOVO, '750aa656/original/02.jpg': LENOVO,
  '750aa656/original/03.jpg': LENOVO, '750aa656/original/05.jpg': LENOVO,
  '4b9725f0/web/w01.jpg': SONY, '4b9725f0/web/w02.jpg': SONY,
};
// Productos bloqueados: se hace una version provisional solo para mostrar como queda (no se publica).
const PROVISIONAL = { '7cc8a1c0': ['original/01.jpg'] };

async function fondo(buf, w, h) {
  // Brillo medio de las 4 esquinas (parches 12x12).
  const p = 12, vals = [];
  for (const [left, top] of [[0, 0], [w - p, 0], [0, h - p], [w - p, h - p]]) {
    const parche = await sharp(buf).extract({ left, top, width: p, height: p }).png().toBuffer();
    const s = await sharp(parche).stats();
    vals.push((s.channels[0].mean + s.channels[1].mean + s.channels[2].mean) / 3);
  }
  vals.sort((a, b) => a - b);
  return (vals[1] + vals[2]) / 2;
}

async function normalizar(src, dst, mascaras) {
  let img = sharp(src).rotate().flatten({ background: '#ffffff' }).toColourspace('srgb');
  let buf = await img.png().toBuffer();
  const meta = await sharp(buf).metadata();
  const W = meta.width, H = meta.height;
  // 1) Blanquear el fondo casi blanco (p. ej. 248) para que no se vea un recuadro sobre el blanco puro.
  const bg = await fondo(buf, W, H);
  if (bg >= 225 && bg < 254.5) {
    const a = 255 / bg;
    buf = await sharp(buf).linear([a, a, a], [0, 0, 0]).png().toBuffer();
  }
  // 2) Tapar logos/textos.
  if (mascaras && mascaras.length) {
    const comps = mascaras.map((m) => ({
      input: { create: { width: Math.max(1, Math.round(m.w * W)), height: Math.max(1, Math.round(m.h * H)), channels: 3, background: '#ffffff' } },
      left: Math.round(m.x * W), top: Math.round(m.y * H),
    }));
    buf = await sharp(buf).composite(comps).png().toBuffer();
  }
  // 3) Recortar al producto.
  const { data: recorte, info } = await sharp(buf).trim({ background: '#ffffff', threshold: 12 }).png().toBuffer({ resolveWithObject: true });
  const offL = -(info.trimOffsetLeft || 0), offT = -(info.trimOffsetTop || 0);
  const tocaBorde = offL <= 1 || offT <= 1 || offL + info.width >= W - 1 || offT + info.height >= H - 1;
  // 4) Escalar a la caja de 1008 px y enfocar si se amplio.
  const escala = Math.min(CAJA / info.width, CAJA / info.height);
  let r = sharp(recorte).resize(Math.round(info.width * escala), Math.round(info.height * escala), { kernel: 'lanczos3' });
  if (escala > 1.1) r = r.sharpen({ sigma: Math.min(1.2, 0.5 + 0.35 * (escala - 1)) });
  const prod = await r.png().toBuffer();
  const pm = await sharp(prod).metadata();
  // 5) Centrar en 1200x1200 blanco puro.
  await sharp({ create: { width: LADO, height: LADO, channels: 3, background: '#ffffff' } })
    .composite([{ input: prod, left: Math.round((LADO - pm.width) / 2), top: Math.round((LADO - pm.height) / 2) }])
    .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(dst);
  return { origen: `${W}x${H}`, fondo: Math.round(bg), producto: `${info.width}x${info.height}`, escala: +escala.toFixed(2), enfoque: escala > 1.1, tocaBorde };
}

(async () => {
  const audit = JSON.parse(fs.readFileSync(path.join(base, 'auditoria.json'), 'utf8'));
  const resumen = {};
  for (const [id, prod] of Object.entries(audit)) {
    if (id.startsWith('_')) continue;
    const elegidas = [
      ...prod.fotos.filter((f) => f.decision === 'principal'),
      ...prod.fotos.filter((f) => f.decision === 'galeria'),
    ].slice(0, 4);
    const lista = elegidas.length ? elegidas.map((f) => f.archivo) : (PROVISIONAL[id] || []);
    const carpeta = elegidas.length ? 'final' : 'provisional';
    if (!lista.length) { resumen[id] = []; continue; }
    const outDir = path.join(base, id, carpeta);
    fs.mkdirSync(outDir, { recursive: true });
    for (const f of fs.readdirSync(outDir)) fs.unlinkSync(path.join(outDir, f));
    resumen[id] = [];
    for (let i = 0; i < lista.length; i++) {
      const rel = lista[i];
      const dst = path.join(outDir, `${id}-${String(i + 1).padStart(2, '0')}.jpg`);
      const r = await normalizar(path.join(base, id, rel), dst, MASCARAS[`${id}/${rel}`]);
      resumen[id].push({ carpeta, salida: path.basename(dst), desde: rel, ...r });
      console.log(id, carpeta, path.basename(dst), '<-', rel, JSON.stringify(r));
    }
  }
  fs.writeFileSync(path.join(base, 'normalizacion.json'), JSON.stringify(resumen, null, 1));
})();
