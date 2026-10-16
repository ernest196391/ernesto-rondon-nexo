// Reel del topper (15-oct): pone encima de la base limpia los PNG de textos y logo (tiempos.json) con ffmpeg,
// sin HyperFrames. Salida: piezas/video-capas.mp4 (la usa mezcla.mjs). Uso: node capas.mjs
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

process.chdir(path.dirname(fileURLToPath(import.meta.url)));
const FFMPEG = 'C:/Users/Ernesto/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe';
const T = JSON.parse(fs.readFileSync('tiempos.json', 'utf8'));
const entradas = ['-i', 'piezas/base-limpia.mp4', ...T.capas.flatMap((c) => ['-loop', '1', '-framerate', '30', '-t', String(T.DUR), '-i', `piezas/${c.file}`])];
let fc = '', prev = '[0:v]';
T.capas.forEach((c, i) => {
  const out = i === T.capas.length - 1 ? '[v]' : `[v${i}]`;
  // aparición suave de 0,12 s para que los textos no salten (el gancho del fotograma 0 sale entero, sin fundido)
  fc += `[${i + 1}:v]format=rgba${c.de > 0.01 ? `,fade=t=in:st=${c.de}:d=0.12:alpha=1` : ''}[c${i}];\n`;
  fc += `${prev}[c${i}]overlay=x=${c.x}:y=${c.y}:enable='between(t,${c.de},${c.a})':eof_action=pass${out};\n`;
  prev = out;
});
fs.writeFileSync('piezas/capas.fc', fc.trim());
const r = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', '-y', ...entradas, '-/filter_complex', 'piezas/capas.fc', '-map', '[v]',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-r', '30', '-t', String(T.DUR), 'piezas/video-capas.mp4'], { encoding: 'utf8', maxBuffer: 1 << 30 });
if (r.status !== 0) { console.error(r.stderr.slice(-3000)); process.exit(1); }
console.log(`piezas/video-capas.mp4 (${T.capas.length} capas, ${T.DUR} s)`);
