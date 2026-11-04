// Monta assets/audio/voz.wav con las tomas POR ESCENA (assets/audio/tomas/s<k>.wav, toma 1, Whisper las oyó bien),
// recortando el silencio de los bordes (silencedetect -40 dB) y con pausas entre escenas.
// También arma assets/audio/whisper-final.json (palabras con tiempo absoluto = tiempo en la toma + inicio de la escena).
// Uso: node _work/build-voz.mjs   (desde la carpeta del proyecto)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const A = 'assets/audio';
const raw = [ // [inicio, fin] dentro de cada toma
  [0.1, 2.45],   // s0 ¿Tu cliente te pide algo que no tenemos en Casa Viva?
  [0.0, 12.9],   // s1 Hoy mismo nos lo pidieron … Las escuchamos.
  [0.0, 5.0],    // s2 Ahora lo puedes vender …
  [0.0, 4.21],   // s3 Está en tu área …
  [0.0, 5.28],   // s4 Sube la foto …
  [0.0, 4.05],   // s5 En segundos salen los vendedores …
  [0.0, 8.59],   // s6 Ahora define tu precio …
  [0.07, 7.44],  // s7 Pregúntale al proveedor …
  [0.08, 7.42],  // s8 ¿Prefieres venderlo por Casa Viva? …
  [0.0, 2.34],   // s9 Veinte búsquedas al día, gratis. ¿Dudas? Escríbeme.
];
const lead = 0.3, gap = 0.5, tail = 3.2;
const gapAfter = { 0: 0.6, 1: 0.6, 8: 0.7 }; // respiro tras el gancho, tras «Las escuchamos» y antes del cierre
let t = lead; const segs = []; const parts = []; const words = [];
raw.forEach(([a, b], k) => {
  if (k > 0) t += gapAfter[k - 1] ?? gap;
  const d = +(b - a).toFixed(3);
  segs.push({ k, rawStart: a, rawEnd: b, start: +t.toFixed(3), end: +(t + d).toFixed(3) });
  parts.push(`[${k}:a]atrim=${a}:${b},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${(d - 0.03).toFixed(3)}:d=0.03,adelay=${Math.round(t * 1000)}:all=1[s${k}]`);
  const w = JSON.parse(fs.readFileSync(`${A}/tomas/s${k}-t1.json`, 'utf8')).words || [];
  w.forEach((x) => words.push({ word: x.word, start: +(t + x.start - a).toFixed(3), end: +(t + x.end - a).toFixed(3) }));
  t += d;
});
const total = +(t + tail).toFixed(2);
const fc = parts.join(';\n') + `;\n${segs.map((s) => `[s${s.k}]`).join('')}amix=inputs=${segs.length}:normalize=0:dropout_transition=0,apad=whole_dur=${total},atrim=0:${total},volume=-1.5dB[out]`;
fs.writeFileSync(`${A}/fc.txt`, fc);
fs.writeFileSync(`${A}/voz-segmentos.json`, JSON.stringify({ lead, gap, tail, total, segs }, null, 1));
fs.writeFileSync(`${A}/whisper-final.json`, JSON.stringify({ text: words.map((w) => w.word).join(' '), words }, null, 1));
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...raw.flatMap((_, k) => ['-i', `${A}/tomas/s${k}.wav`]), '-/filter_complex', `${A}/fc.txt`, '-map', '[out]', '-ar', '48000', '-ac', '1', `${A}/voz.wav`]);
console.log('voz.wav total', total, segs.map((s) => `${s.k}:${s.start}-${s.end}`).join(' '));
