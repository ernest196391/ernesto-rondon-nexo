// Para revisar a ojo: a la izquierda la mejor foto del proveedor, a la derecha la(s) foto(s) final(es) de internet.
// Uso: node comparar.mjs --ids 577,542 → piloto-web/comparar/<id>.jpg
import fs from 'fs';
import { sharp, leer, P, PW } from './comun.mjs';
const args = process.argv.slice(2);
const i = args.indexOf('--ids');
const IDS = String(i >= 0 ? args[i + 1] : '').split(',').map(Number).filter(Boolean);
fs.mkdirSync(PW + '/comparar', { recursive: true });
for (const id of IDS) {
  const n = leer(P(id, 'norm.json')); if (!n) continue;
  const viejo = leer(P(id, 'norm-1012.json')) || n;
  const ref = (viejo.evaluadas || []).filter((e) => e.archivo && fs.existsSync(P(id, e.archivo))).sort((a, b) => b.nota - a.nota)[0];
  const paneles = [];
  if (ref) paneles.push(await sharp(P(id, ref.archivo)).rotate().flatten({ background: '#fff' }).resize(500, 500, { fit: 'contain', background: '#dddddd' }).png().toBuffer());
  const finales = (n.fotos || []).map((f) => f.salida).filter((f) => f && fs.existsSync(f));
  // si no pasó, enseña las 3 mejores fotos de internet que se probaron (para ver por qué)
  const extra = finales.length ? [] : (n.evaluadas_web || []).sort((a, b) => b.nota - a.nota).slice(0, 3).map((e) => P(id, e.archivo)).filter((f) => fs.existsSync(f));
  for (const f of [...finales, ...extra].slice(0, 3)) paneles.push(await sharp(f).rotate().flatten({ background: '#fff' }).resize(500, 500, { fit: 'contain', background: finales.length ? '#ffffff' : '#ffe0e0' }).png().toBuffer());
  const W = paneles.length * 510;
  await sharp({ create: { width: W, height: 500, channels: 3, background: '#888888' } })
    .composite(paneles.map((b, k) => ({ input: b, left: k * 510, top: 0 }))).jpeg({ quality: 80 }).toFile(PW + `/comparar/${id}.jpg`);
}
console.log('ok', IDS.length);
