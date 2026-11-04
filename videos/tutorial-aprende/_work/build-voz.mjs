// Monta assets/audio/voz.wav a partir de la toma 1 (cortes en silencios), con pausas entre escenas.
// Uso: node _work/build-voz.mjs   (desde la carpeta del proyecto)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const A = 'assets/audio';
const raw = [ // [toma, inicio, fin] en la toma (toma 1: Whisper la oyó entera bien y con la pregunta «¿No está tu duda?»)
  [1, 0.0, 4.05],    // s0 ¿Te perdiste algún video? … en: Aprende.
  [1, 4.33, 8.95],   // s1 Abre el menú, y toca: Aprende … cuántos llevas.
  [1, 8.97, 17.85],  // s2 Ahí están los videos … No gasta datos hasta que lo tocas.
  [1, 18.32, 25.55], // s3 Cuando terminas un video … sube tu avance.
  [1, 25.88, 32.88], // s4 Abajo del todo … por WhatsApp.
  [1, 32.88, 36.10], // s5 Mensajeros: … la pestaña Aprende.
  [1, 36.45, 37.76], // s6 ¿Dudas? Escríbeme.
];
const lead = 0.8, gap = 0.6, beforeClose = 3.0, tail = 2.6;
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
