// Foto de catálogo para la web: fondo BLANCO puro, 1200×1200, producto centrado con 8 % de margen,
// sin logo (regla de docs/nexo-business/fotos-productos/PROCESO.md). Prototipo: no sube nada.
//
//   node foto-web.mjs <foto.jpg> [<foto2.jpg> ...]     → escribe salida/<nombre>-web.jpg
//
// 1) Si el borde de la foto ya es blanco (foto de catálogo): solo recorta y centra (sharp, gratis).
// 2) Si hay fondo (tienda, suelo, pared): quita el fondo con @imgly/background-removal-node, el mismo
//    modelo abierto que ya usa VivaBot en src/studio.js (corre en el servidor, sin pagar por foto).
//    Aquí se carga desde node_modules de la copia local de VivaBot, SOLO leyendo (variable IMGLY_FROM).
// 3) Devuelve avisos para la hoja de aprobación: foto pequeña, producto cortado, ampliada de más,
//    no se pudo separar del fondo.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename, extname, join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const S = 1200;
const MARGEN = 0.08;
const IMGLY_FROM = process.env.IMGLY_FROM || 'C:/Users/Ernesto/vivabot/node_modules/@imgly/background-removal-node/dist/index.mjs';
// sharp tiene que ser EL MISMO que usa el modelo de fondo: dos copias de libvips en un proceso chocan
// («colourspace: parameter space not set»). En el bot ya es así (un solo node_modules).
const sharp = createRequire(IMGLY_FROM)('sharp');

// ¿El borde de la foto es blanco? (≥ 90 % de los píxeles del marco claros y sin color)
async function bordeBlanco(buf) {
  const { data, info } = await sharp(buf).resize(200, 200, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let claros = 0;
  let total = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (x > 4 && x < info.width - 5 && y > 4 && y < info.height - 5) continue;
      const i = (y * info.width + x) * 3;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      if (Math.min(r, g, b) > 232 && Math.max(r, g, b) - Math.min(r, g, b) < 18) claros++;
      total++;
    }
  }
  return claros / total >= 0.9;
}

// Recorte con el modelo abierto (igual que studio.js `cutout`, pero devolviendo también la caja).
async function recortar(jpeg) {
  const { removeBackground } = await import(pathToFileURL(IMGLY_FROM).href);
  const blob = await removeBackground(new Blob([jpeg], { type: 'image/jpeg' }), { model: 'medium', publicPath: pathToFileURL(dirname(IMGLY_FROM)).href + '/', output: { format: 'image/png' } });
  const { data, info } = await sharp(Buffer.from(await blob.arrayBuffer())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let solidos = 0;
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let p = 0, i = 3; i < data.length; i += 4, p++) {
    const a = data[i];
    data[i] = a < 140 ? 0 : a < 200 ? Math.round(((a - 140) * 255) / 60) : 255;
    if (data[i] > 0) {
      const x = p % info.width;
      const y = (p / info.width) | 0;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    if (data[i] === 255) solidos++;
  }
  const parte = solidos / (info.width * info.height);
  if (parte < 0.04 || parte > 0.97) return null;
  const tocaBorde = minX <= 2 || minY <= 2 || maxX >= info.width - 3 || maxY >= info.height - 3;
  const png = await sharp(data, { raw: info }).png().trim().toBuffer();
  return { png, tocaBorde, parte };
}

export async function fotoWeb(input) {
  const avisos = [];
  const meta0 = await sharp(input).metadata();
  if (Math.min(meta0.width, meta0.height) < 400) avisos.push('Foto pequeña (lado corto < 400 px): pedir otra.');
  const base = await sharp(input).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 92 }).toBuffer();

  let producto;
  let metodo;
  if (await bordeBlanco(base)) {
    metodo = 'fondo-blanco';
    producto = await sharp(base).trim({ background: '#ffffff', threshold: 18 }).toBuffer();
  } else {
    metodo = 'quitar-fondo';
    let r = null;
    try { r = await recortar(base); } catch (e) { avisos.push(`El modelo de fondo falló: ${e.message}`); }
    if (!r) {
      avisos.push('No se pudo separar el producto del fondo: pedir una foto sobre pared o sábana blanca, con luz de día.');
      return { buffer: null, metodo, avisos };
    }
    if (r.tocaBorde) avisos.push('El producto toca el borde de la foto: puede salir cortado.');
    producto = r.png;
  }

  const caja = Math.round(S * (1 - 2 * MARGEN));
  const m = await sharp(producto).metadata();
  const escala = Math.min(caja / m.width, caja / m.height);
  if (escala > 1.8) avisos.push(`Se amplió ${escala.toFixed(1)}×: puede verse borrosa.`);
  const ajustado = await sharp(producto).resize(caja, caja, { fit: 'inside' }).sharpen({ sigma: escala > 1.2 ? 0.8 : 0.4 }).toBuffer();
  const am = await sharp(ajustado).metadata();
  const buffer = await sharp({ create: { width: S, height: S, channels: 3, background: '#ffffff' } })
    .composite([{ input: ajustado, left: Math.round((S - am.width) / 2), top: Math.round((S - am.height) / 2) }])
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  return { buffer, metodo, avisos };
}

// Uso por línea de órdenes.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const salida = join(dirname(fileURLToPath(import.meta.url)), 'salida');
  await mkdir(salida, { recursive: true });
  for (const f of process.argv.slice(2)) {
    const t0 = Date.now();
    const r = await fotoWeb(await readFile(f));
    const nombre = `${basename(f, extname(f)).slice(-12)}-web.jpg`;
    if (r.buffer) await writeFile(join(salida, nombre), r.buffer);
    console.log(JSON.stringify({ foto: basename(f), salida: r.buffer ? nombre : null, metodo: r.metodo, segundos: ((Date.now() - t0) / 1000).toFixed(1), avisos: r.avisos }));
  }
}
