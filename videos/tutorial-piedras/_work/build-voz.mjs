// Monta assets/audio/voz.wav con las tomas POR ESCENA elegidas (assets/audio/tomas/s<k>.wav + s<k>-elegida.json),
// recortando el silencio de los bordes (silencedetect -40 dB) y con pausas entre escenas.
// También arma assets/audio/whisper-final.json (palabras con tiempo absoluto = tiempo en la toma + inicio de la escena).
// Tomas elegidas (Whisper por trozos, sin contexto): s0 t1 · s1 t2 · s2 t2 · s3 t4 · s4 t3 · s5 t2 · s6 t1 · s7 t3.
// Uso: node _work/build-voz.mjs   (desde la carpeta del proyecto)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const A = 'assets/audio';
const raw = [ // [inicio, fin] dentro de cada toma
  [0.0, 2.39],   // s0 Ahora, vender, y traer a otras gestoras, te da más.
  [0.06, 5.41],  // s1 Cada venta tuya … limpio a la tienda.
  [0.0, 3.57],   // s2 En el menú, toca: Mi piedra …
  [0.07, 14.66], // s3 Con los puntos de tu equipo … hasta Corona.
  [0.085, 4.57], // s4 Para invitar … Mandar por WhatsApp.
  [0.0, 10.45],  // s5 Ganas el uno por ciento … ese mes.
  [0.075, 11.0], // s6 Te lo decimos claro … Pedir mi pago.
  [0.05, 1.68],  // s7 Está en prueba. Dinos qué no entiendes.
];
const lead = 0.3, gap = 0.5, tail = 4.2;
const gapAfter = { 0: 0.7, 1: 0.6, 2: 0.7, 3: 0.8, 4: 1.3, 5: 0.8, 6: 0.9 }; // respiro tras el gancho; 1,3 s para ver el WhatsApp; antes del cierre
let t = lead; const segs = []; const parts = []; const words = [];
raw.forEach(([a, b], k) => {
  if (k > 0) t += gapAfter[k - 1] ?? gap;
  const d = +(b - a).toFixed(3);
  segs.push({ k, rawStart: a, rawEnd: b, start: +t.toFixed(3), end: +(t + d).toFixed(3) });
  parts.push(`[${k}:a]atrim=${a}:${b},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${(d - 0.03).toFixed(3)}:d=0.03,adelay=${Math.round(t * 1000)}:all=1[s${k}]`);
  const w = JSON.parse(fs.readFileSync(`${A}/tomas/s${k}-elegida.json`, 'utf8')).words || [];
  w.forEach((x) => words.push({ word: x.word, start: +(t + Math.max(0, x.start - a)).toFixed(3), end: +(t + x.end - a).toFixed(3) }));
  t += d;
});
const total = +(t + tail).toFixed(2);
const fc = parts.join(';\n') + `;\n${segs.map((s) => `[s${s.k}]`).join('')}amix=inputs=${segs.length}:normalize=0:dropout_transition=0,apad=whole_dur=${total},atrim=0:${total},volume=-1.5dB[out]`;
fs.writeFileSync(`${A}/fc.txt`, fc);
fs.writeFileSync(`${A}/voz-segmentos.json`, JSON.stringify({ lead, gap, tail, total, segs }, null, 1));
fs.writeFileSync(`${A}/whisper-final.json`, JSON.stringify({ text: words.map((w) => w.word).join(' '), words }, null, 1));
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...raw.flatMap((_, k) => ['-i', `${A}/tomas/s${k}.wav`]), '-/filter_complex', `${A}/fc.txt`, '-map', '[out]', '-ar', '48000', '-ac', '1', `${A}/voz.wav`]);
console.log('voz.wav total', total, segs.map((s) => `${s.k}:${s.start}-${s.end}`).join(' '));
