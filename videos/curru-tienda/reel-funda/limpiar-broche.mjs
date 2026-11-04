// Quita el broche oscuro con letras que Seedance le puso a Cúrru en la blusa (regla: ningún texto legible salvo
// Casa Viva). Busca en cada fotograma un círculo oscuro rodeado de blusa clara (cerca de donde estaba en el anterior),
// lo rellena con el color de la blusa de alrededor (borde suave) y escribe 10-escena-v1-limpia.mp4 con el mismo audio.
// El plano medio empieza en ~4,5 s (antes, primer plano de las manos: allí no hay broche y daba falsos positivos).
// Uso: node limpiar-broche.mjs [--depurar]   (--depurar: marca en rojo lo que encontró, para revisar)
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';

const FFMPEG = 'C:/Users/Ernesto/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe';
const ENTRADA = '10-escena-v1.mp4', SALIDA = process.argv.includes('--depurar') ? 'piezas/broche-depurar.mp4' : '10-escena-v1-limpia.mp4';
const DEPURAR = process.argv.includes('--depurar');
const W = 720, H = 1280, FPS = 24, FB = W * H * 3;
// Tramos donde se ve el broche, con la zona donde buscarlo [x0, x1, y0, y1] (720×1280):
//  - 2,45–3,6 s: primer plano de las manos, el broche arriba a la izquierda;
//  - 4,45–9,6 s: plano medio y plano de dos.
const TRAMOS = [
  { desde: Math.round(2.45 * FPS), hasta: Math.round(3.6 * FPS), zona: [40, 330, 40, 420], ri: 12, rr: 34, rfill: 30 },   // aquí el broche es el doble de grande
  { desde: Math.round(4.45 * FPS), hasta: Math.round(9.6 * FPS), zona: [80, 640, 300, 1000], ri: 10, rr: 22, rfill: 21 },
];
const tramo = (k) => TRAMOS.find((t) => k >= t.desde && k <= t.hasta);
let RI = 10, RR = 22, RFILL = 21;   // el broche mide hasta ~36 px: con 16 quedaba una media luna
fs.mkdirSync('piezas', { recursive: true });

const lum = (d, x, y) => { const i = (y * W + x) * 3; return 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; };
const puntua = (d, x, y) => {
  let s = 0, c = 0;
  for (let dy = -RI; dy <= RI; dy += 2) for (let dx = -RI; dx <= RI; dx += 2) if (dx * dx + dy * dy <= RI * RI) { s += lum(d, x + dx, y + dy); c++; }
  let r = 0, mn = 255;
  for (let a = 0; a < 24; a++) {
    const v = lum(d, Math.round(x + RR * Math.cos(a * Math.PI / 12)), Math.round(y + RR * Math.sin(a * Math.PI / 12)));
    r += v; mn = Math.min(mn, v);
  }
  return { inner: s / c, ring: r / 24, ringMin: mn, score: r / 24 - s / c };
};
const busca = (d, x0, x1, y0, y1, paso) => {
  let best = null;
  for (let y = y0; y <= y1; y += paso) for (let x = x0; x <= x1; x += paso) {
    if (x < RR + 2 || y < RR + 2 || x > W - RR - 3 || y > H - RR - 3) continue;
    const p = puntua(d, x, y);
    if (!best || p.score > best.score) best = { x, y, ...p };
  }
  return best;
};
// Broche = centro muy oscuro y anillo de blusa clara y pareja (el pelo o la cara del niño no pasan el filtro).
const esBroche = (b) => b && b.inner < 120 && b.ring > 165 && b.ringMin > 110 && b.score > 70;

// Relleno: cada píxel del círculo = media de la interpolación horizontal (entre los bordes izquierdo y derecho de su
// fila) y vertical (arriba/abajo de su columna), tomando los bordes 3 px fuera del círculo. Así conserva la sombra
// de la blusa (con un color plano quedaba un disco gris). Borde suave de 3 px.
// parcial = parche guardado del último fotograma bueno (la blusa casi no cambia en 8 fotogramas): se pone en todo el
// círculo menos en los píxeles de piel (la mano que pasa por delante se queda).
const esPiel = (r, g, b) => r - b > 38 && r > g && r > 70 && r < 250;
const rellena = (d, cx, cy, parcial = null) => {
  const R = RFILL, RB = RFILL + 3;
  const px = (x, y) => { x = Math.min(Math.max(x, 0), W - 1); y = Math.min(Math.max(y, 0), H - 1); const i = (y * W + x) * 3; return [d[i], d[i + 1], d[i + 2]]; };
  const out = [];
  for (let dy = -RB; dy <= RB; dy++) for (let dx = -RB; dx <= RB; dx++) {
    const dd = Math.hypot(dx, dy); if (dd > R + 3) continue;
    const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const hx = Math.sqrt(Math.max(RB * RB - dy * dy, 0)), hy = Math.sqrt(Math.max(RB * RB - dx * dx, 0));
    const L = px(Math.round(cx - hx), y), Rr = px(Math.round(cx + hx), y), T = px(x, Math.round(cy - hy)), B = px(x, Math.round(cy + hy));
    const th = hx > 0 ? (dx + hx) / (2 * hx) : 0.5, tv = hy > 0 ? (dy + hy) / (2 * hy) : 0.5;
    const clave = `${dx},${dy}`;
    const v = parcial ? parcial.get(clave) : [0, 1, 2].map((c) => 0.5 * (L[c] * (1 - th) + Rr[c] * th) + 0.5 * (T[c] * (1 - tv) + B[c] * tv));
    if (!v) continue;
    let a = dd <= R ? 1 : 1 - (dd - R) / 3;
    if (parcial) { const i = (y * W + x) * 3; if (esPiel(d[i], d[i + 1], d[i + 2])) a = 0; }
    if (a > 0) out.push([x, y, v, a, clave]);
  }
  const parche = new Map(out.map((o) => [o[4], o[2]]));
  for (const [x, y, v, a] of out) {
    const i = (y * W + x) * 3;
    if (DEPURAR) { d[i] = 255; d[i + 1] = 0; d[i + 2] = 0; continue; }
    for (let c = 0; c < 3; c++) d[i + c] = d[i + c] * (1 - a) + v[c] * a;
  }
  return parche;
};

// Dos pasadas: 1) buscar el broche en cada fotograma; 2) los huecos cortos (≤ 12 fotogramas, la mano lo tapa a
// medias) se rellenan con la posición interpolada, pero solo en los píxeles oscuros (no se borran los dedos).
const leer = (alFotograma) => new Promise((ok) => {
  const dec = spawn(FFMPEG, ['-hide_banner', '-nostdin', '-v', 'error', '-i', ENTRADA, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  let buf = Buffer.alloc(0), k = 0, cadena = Promise.resolve();
  dec.stdout.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= FB) {
      const f = Buffer.from(buf.subarray(0, FB)); buf = buf.subarray(FB);
      const kk = k++; cadena = cadena.then(() => alFotograma(f, kk));
    }
  });
  dec.stdout.on('end', () => cadena.then(() => ok(k)));
});

const pos = [];
let prev = null;
const total = await leer(async (frame, k) => {
  const t = tramo(k);
  if (!t) { prev = null; return; }
  RI = t.ri; RR = t.rr; RFILL = t.rfill;
  let b = prev ? busca(frame, prev.x - 30, prev.x + 30, prev.y - 30, prev.y + 30, 2) : null;
  if (!esBroche(b)) b = busca(frame, ...t.zona, 4);
  if (esBroche(b)) { const fino = busca(frame, b.x - 4, b.x + 4, b.y - 4, b.y + 4, 1); pos[k] = { x: fino.x, y: fino.y, inner: fino.inner, ring: fino.ring }; prev = fino; }
  else prev = null;
});
// huecos cortos dentro de un tramo → posición interpolada, modo parcial
for (const t of TRAMOS) {
  let ult = null;
  for (let k = t.desde; k <= t.hasta; k++) {
    if (!pos[k]) continue;
    if (ult !== null && k - ult > 1 && k - ult - 1 <= 12) {
      for (let j = ult + 1; j < k; j++) {
        const a = (j - ult) / (k - ult);
        pos[j] = { x: Math.round(pos[ult].x * (1 - a) + pos[k].x * a), y: Math.round(pos[ult].y * (1 - a) + pos[k].y * a), parcial: true };
      }
    }
    ult = k;
  }
}
const enc = spawn(FFMPEG, ['-hide_banner', '-nostdin', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
  '-i', ENTRADA, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '10', '-pix_fmt', 'yuv420p', '-c:a', 'copy', SALIDA]);
enc.stderr.on('data', (x) => process.stderr.write(x));
let hechos = 0, parciales = 0, ultimoParche = null;
await leer(async (frame, k) => {
  const p = pos[k], t = tramo(k);
  if (p && t) {
    RI = t.ri; RR = t.rr; RFILL = t.rfill;
    if (p.parcial) { if (ultimoParche) { rellena(frame, p.x, p.y, ultimoParche); parciales++; } }
    else { ultimoParche = rellena(frame, p.x, p.y); hechos++; }
  }
  if (!enc.stdin.write(frame)) await new Promise((r) => enc.stdin.once('drain', r));
});
enc.stdin.end();
enc.on('close', (code) => {
  const log = [];
  for (const t of TRAMOS) for (let k = t.desde; k <= t.hasta; k++) { const p = pos[k]; log.push(`${k} ${(k / FPS).toFixed(2)}s ${p ? `(${p.x},${p.y})${p.parcial ? ' interpolado' : ` dentro ${p.inner.toFixed(0)} anillo ${p.ring.toFixed(0)}`}` : '—'}`); }
  fs.writeFileSync('piezas/broche.log', log.join('\n'));
  console.log(`${total} fotogramas; broche tapado en ${hechos} (+${parciales} interpolados, solo píxeles oscuros); salida ${SALIDA} (código ${code})`);
});
