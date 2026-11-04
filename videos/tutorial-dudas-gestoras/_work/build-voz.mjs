// Monta assets/audio/voz.wav a partir de las tomas 1 y 2 (cortes en silencios), con pausas entre escenas.
// Uso: node _work/build-voz.mjs   (desde la carpeta del proyecto)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const A = 'assets/audio';
const raw = [ // [toma, inicio, fin] en la toma
  [2, 0.0, 3.70],    // s0 portada
  [2, 4.15, 17.65],  // s1 mi acceso
  [1, 19.59, 30.25], // s2 mi enlace (toma 1: Whisper oyó bien «Clientes»)
  [2, 28.43, 39.36], // s3 pedidos
  [2, 39.64, 54.83], // s4 mensajero + CUP + tasa
  [2, 55.07, 65.80], // s5 recogida
  [2, 65.95, 67.71], // s6 ¿Dudas? Escríbeme.
];
const lead = 0.4, gap = 0.4, beforeClose = 1.0, tail = 2.43;
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
