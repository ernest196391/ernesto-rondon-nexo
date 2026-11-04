// Monta assets/audio/voz.wav a partir de las tomas 1 y 2 (cortes en silencios), con pausas entre escenas.
// Uso: node _work/build-voz.mjs   (desde la carpeta del proyecto)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const A = 'assets/audio';
const raw = [ // [toma, inicio, fin] en la toma (toma 2: Whisper la oyó entera bien)
  [2, 0.0, 4.10],    // s0 ¿Necesitas fotos…?
  [2, 4.30, 12.55],  // s1 tu área → menú → Fotos para publicar / mi acceso
  [2, 12.95, 21.22], // s2 lo que hay, precio, pesos, quedan / buscar o categoría
  [2, 21.26, 30.95], // s3 Descargar foto, Copiar texto, tu enlace
  [2, 31.40, 36.98], // s4 Descargar todas
  [2, 37.05, 40.91], // s5 Publica hoy… ¿Dudas? Escríbeme.
];
const lead = 0.5, gap = 0.45, beforeClose = 0.6, tail = 2.4;
let t = lead; const segs = []; const parts = [];
raw.forEach(([take, a, b], k) => {
  if (k > 0) t += k === raw.length - 1 ? beforeClose : gap;
  const d = +(b - a).toFixed(3);
  segs.push({ k, take, rawStart: a, rawEnd: b, start: +t.toFixed(3), end: +(t + d).toFixed(3) });
  parts.push(`[${take - 1}:a]atrim=${a}:${b},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${(d - 0.03).toFixed(3)}:d=0.03,adelay=${Math.round(t * 1000)}:all=1[s${k}]`);
  t += d;
});
const total = +(t + tail).toFixed(2);
const fc = parts.join(';\n') + `;\n${segs.map((s) => `[s${s.k}]`).join('')}amix=inputs=${segs.length}:normalize=0:dropout_transition=0,apad=whole_dur=${total},atrim=0:${total},volume=-1.5dB[out]`;
fs.writeFileSync(`${A}/fc.txt`, fc);
fs.writeFileSync(`${A}/voz-segmentos.json`, JSON.stringify({ lead, gap, beforeClose, tail, total, segs }, null, 1));
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', `${A}/take1.wav`, '-i', `${A}/take2.wav`, '-/filter_complex', `${A}/fc.txt`, '-map', '[out]', '-ar', '48000', '-ac', '1', `${A}/voz.wav`]);
console.log('voz.wav total', total, segs.map((s) => `${s.k}:${s.start}-${s.end}`).join(' '));
