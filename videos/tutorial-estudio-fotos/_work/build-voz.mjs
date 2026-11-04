// Monta assets/audio/voz.wav con las tomas POR ESCENA (assets/audio/tomas/s<k>.wav, toma 1, Whisper las oyó bien),
// recortando el silencio de los bordes (silencedetect -40 dB) y con pausas entre escenas.
// También arma assets/audio/whisper-final.json (palabras con tiempo absoluto = tiempo en la toma + inicio de la escena).
// Uso: node _work/build-voz.mjs   (desde la carpeta del proyecto)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const A = 'assets/audio';
const raw = [ // [inicio, fin] dentro de cada toma
  [0.1, 2.72],   // s0 ¿Tu foto sale oscura, o el producto sale en su caja?
  [0.05, 9.53],  // s1 Nos lo dijeron … Las escuchamos.
  [0.0, 5.49],   // s2 Ahora tienes tu estudio de fotos … la hizo Dany.
  [0.0, 4.76],   // s3 Está en tu área …
  [0.0, 3.82],   // s4 Busca tu producto …
  [0.05, 9.39],  // s5 Copia la instrucción … y envía.
  [0.04, 3.96],  // s6 Descarga la foto … Subir mi foto de Gemini.
  [0.0, 3.82],   // s7 Ya está en tu galería …
  [0.0, 1.52],   // s8 Es gratis. ¿Dudas? Escríbeme.
];
const lead = 0.3, gap = 0.5, tail = 3.2;
const gapAfter = { 0: 0.6, 1: 0.6, 2: 2.6, 7: 0.7 }; // respiro tras el gancho y «Las escuchamos»; 2,6 s para ver el antes y el después grande; antes del cierre
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
