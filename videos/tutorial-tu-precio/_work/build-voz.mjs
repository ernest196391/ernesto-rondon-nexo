// Monta assets/audio/voz.wav a partir de la toma 3 (Whisper la oyó entera bien), cortada en silencios
// (energía cada 50 ms, no tiempos de Whisper), con pausas entre escenas.
// Uso: node _work/build-voz.mjs   (desde la carpeta del proyecto)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const A = 'assets/audio';
const TAKES = [3]; // tomas usadas, en este orden de entradas de ffmpeg
const raw = [ // [toma, inicio, fin] en la toma
  [3, 0.0, 3.17],    // s0 Tú decides tu precio. Lo que subas, es para ti.
  [3, 3.2, 11.32],   // s1 En tu área, toca: Mis precios … Aplicar a mi tienda.
  [3, 11.35, 19.05], // s2 Para un solo producto … toca: Guardar.
  [3, 19.1, 30.15],  // s3 Tus clientes … treinta y cinco con tu enlace.
  [3, 30.3, 36.62],  // s4 ¿El pedido lo haces tú? … Así sale a tu precio.
  [3, 36.65, 41.62], // s5 Y si quitas tu aumento … el precio que tienes guardado.
  [3, 41.64, 42.8],  // s6 ¿Dudas? Escríbeme.
];
const lead = 0.5, gap = 0.45, beforeClose = 0.6, tail = 3.0;
let t = lead; const segs = []; const parts = [];
raw.forEach(([take, a, b], k) => {
  if (k > 0) t += k === raw.length - 1 ? beforeClose : gap;
  const d = +(b - a).toFixed(3);
  segs.push({ k, take, rawStart: a, rawEnd: b, start: +t.toFixed(3), end: +(t + d).toFixed(3) });
  parts.push(`[${TAKES.indexOf(take)}:a]atrim=${a}:${b},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${(d - 0.03).toFixed(3)}:d=0.03,adelay=${Math.round(t * 1000)}:all=1[s${k}]`);
  t += d;
});
const total = +(t + tail).toFixed(2);
// asplit: una toma alimenta varios segmentos
const split = TAKES.map((tk, i) => { const n = raw.filter((r) => r[0] === tk).length; return n > 1 ? `[${i}:a]asplit=${n}${Array.from({ length: n }, (_, j) => `[t${i}_${j}]`).join('')}` : ''; }).filter(Boolean);
const used = {};
const parts2 = parts.map((p, k) => { const i = TAKES.indexOf(raw[k][0]); const n = raw.filter((r) => r[0] === raw[k][0]).length; if (n < 2) return p; used[i] = (used[i] ?? -1) + 1; return p.replace(`[${i}:a]`, `[t${i}_${used[i]}]`); });
const fc = [...split, ...parts2].join(';\n') + `;\n${segs.map((s) => `[s${s.k}]`).join('')}amix=inputs=${segs.length}:normalize=0:dropout_transition=0,apad=whole_dur=${total},atrim=0:${total},volume=-1.5dB[out]`;
fs.writeFileSync(`${A}/fc.txt`, fc);
fs.writeFileSync(`${A}/voz-segmentos.json`, JSON.stringify({ lead, gap, beforeClose, tail, total, segs }, null, 1));
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...TAKES.flatMap((tk) => ['-i', `${A}/take${tk}.wav`]), '-/filter_complex', `${A}/fc.txt`, '-map', '[out]', '-ar', '48000', '-ac', '1', `${A}/voz.wav`]);
console.log('voz.wav total', total, segs.map((s) => `${s.k}:${s.start}-${s.end}`).join(' '));
