// Monta assets/audio/voz.wav con las tomas POR ESCENA elegidas (assets/audio/tomas/s<k>.wav + s<k>-elegida.json),
// recortando el silencio de los bordes (silencedetect -40 dB) y con pausas entre escenas.
// También arma assets/audio/whisper-final.json (palabras con tiempo absoluto = tiempo en la toma + inicio de la escena).
// Tomas elegidas (Whisper): s0 t2 · s1 t2 · s2 t1 · s3 t1 · s4 t2 · s5 t1 · s6 t2 · s7 t1.
// Uso: node _work/build-voz.mjs   (desde la carpeta del proyecto)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const A = 'assets/audio';
const raw = [ // [inicio, fin] dentro de cada toma (fin = inicio del silencio final, silencedetect -40 dB)
  [0.0, 3.79],   // s0 Esta semana, casi perdemos una bicicleta…
  [0.0, 6.92],   // s1 La clienta escribía desde un número… estafadora.
  [0.0, 11.12],  // s2 Y hoy, Niurka nos avisó… Y desaparece.
  [0.0, 3.30],   // s3 El que pierde… Billete Seguro.
  [0.0, 8.59],   // s4 Eliges el billete… número de serie.
  [0.05, 6.99],  // s5 En un minuto te dice… avisas al equipo.
  [0.0, 9.16],   // s6 Úsala siempre… entregas en la calle.
  [0.0, 5.54],   // s7 Está en casaviva punto company… próxima entrega.
];
const lead = 0.3, gap = 0.6, tail = 4.0;
const gapAfter = { 0: 0.6, 1: 0.6, 2: 0.8, 3: 0.7, 4: 0.6, 5: 0.8, 6: 0.7 }; // respiro tras la historia y antes del cierre
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
