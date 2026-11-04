// Audio de la v2: diálogo (el de la v1, −14 LUFS) + música propia (musica.mjs) BAJITA y que se aparta cuando
// hablan (sidechain) + efectos suaves en los punch-in y en los cortes (Pixabay, licencia libre para uso comercial,
// de la skill media-use). Luego une el audio con el video de HyperFrames y saca la copia -fb (< 9,5 MB).
// Uso: node mezcla-v2.mjs
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

process.chdir(path.dirname(fileURLToPath(import.meta.url)));
const FFMPEG = 'C:/Users/Ernesto/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe';
const SFX = 'C:/Users/Ernesto/.claude/skills/media-use/audio/assets/sfx';
const DUR = 12.0;
const VIDEO_HF = 'hf/renders/v2-video.mp4';
const SALIDA = 'casa-viva-reel-funda-v2.mp4', SALIDA_FB = 'casa-viva-reel-funda-v2-fb.mp4';
const ff = (args, et) => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', '-y', ...args], { encoding: 'utf8', maxBuffer: 1 << 30 });
  if (r.status !== 0) { console.error(r.stderr.slice(-3000)); throw new Error(`ffmpeg falló: ${et}`); }
  return r;
};

// Música: −9 dB (en las pausas queda ~19 dB por debajo de la voz; con −13 quedaba a ~23 dB, casi no se oía) y se aparta ~5 dB más cuando hay voz.
const MUSICA_DB = -9;
// Efectos: [archivo, segundo, volumen, recorte]
const CORTES = [2.458, 4.542, 7.833, 10.75];
const EFECTOS = [
  ['pop.mp3', 0.70, 0.35],                      // punch-in a la cara
  ['click-soft.mp3', 1.50, 0.45],               // vuelve al plano medio
  ...CORTES.map((t) => ['whoosh-short.mp3', t - 0.2, 0.28]),   // el «fuu» llega justo en el corte
  ['pop.mp3', 6.30, 0.22],                      // el jaboncito entra en la funda
  ['sparkle.mp3', 11.30, 0.18, 0.9],            // el guiño final
];

const entradas = ['-i', 'piezas/audio-final.wav', '-i', 'piezas/musica.wav', ...EFECTOS.flatMap(([f]) => ['-i', `${SFX}/${f}`])];
const fmt = 'aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo';
let fc = `[0:a]${fmt},asplit=2[voz][llave];\n`;
fc += `[1:a]${fmt},volume=${MUSICA_DB}dB[m0];\n`;
fc += `[m0][llave]sidechaincompress=threshold=0.015:ratio=5:attack=25:release=380:makeup=1[mus];\n`;
const nombres = ['[voz]', '[mus]'];
EFECTOS.forEach(([, t, v, rec], i) => {
  const ms = Math.round(t * 1000);
  const recorte = rec ? `atrim=0:${rec},afade=t=out:st=${rec - 0.35}:d=0.35,` : '';
  fc += `[${i + 2}:a]${fmt},${recorte}volume=${v},adelay=${ms}|${ms}[e${i}];\n`;
  nombres.push(`[e${i}]`);
});
fc += `${nombres.join('')}amix=inputs=${nombres.length}:normalize=0:duration=longest,atrim=0:${DUR},afade=t=out:st=${DUR - 0.12}:d=0.12[mix]`;
fs.writeFileSync('piezas/mezcla-v2.fc', fc);
ff([...entradas, '-/filter_complex', 'piezas/mezcla-v2.fc', '-map', '[mix]', '-c:a', 'pcm_s16le', 'piezas/mezcla-v2-cruda.wav'], 'mezcla');

const LN = 'loudnorm=I=-14:TP=-1.5:LRA=11';
const med = JSON.parse(ff(['-i', 'piezas/mezcla-v2-cruda.wav', '-af', `${LN}:print_format=json`, '-f', 'null', '-'], 'ln1').stderr.match(/\{[\s\S]*?\}/g).at(-1));
ff(['-i', 'piezas/mezcla-v2-cruda.wav', '-af', `${LN}:measured_I=${med.input_i}:measured_TP=${med.input_tp}:measured_LRA=${med.input_lra}:measured_thresh=${med.input_thresh}:offset=${med.target_offset}:linear=true,aresample=48000`,
  '-c:a', 'pcm_s16le', 'piezas/mezcla-v2.wav'], 'ln2');
console.log(`mezcla: ${med.input_i} LUFS → −14 LUFS`);

// Video de HyperFrames + mezcla. El video se reencoda con los mismos ajustes que la v1 (x264 slow, CRF 18).
ff(['-i', VIDEO_HF, '-i', 'piezas/mezcla-v2.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
  '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', String(DUR), '-movflags', '+faststart', SALIDA], 'unir');
console.log(`${SALIDA}: ${(fs.statSync(SALIDA).size / 1e6).toFixed(2)} MB`);
const fbV = ['-c:v', 'libx264', '-preset', 'slow', '-b:v', '4200k', '-maxrate', '5200k', '-bufsize', '10000k', '-pix_fmt', 'yuv420p', '-r', '30', '-passlogfile', 'piezas/x264-fb2'];
ff(['-i', SALIDA, ...fbV, '-pass', '1', '-an', '-f', 'null', '-'], 'fb1');
ff(['-i', SALIDA, ...fbV, '-pass', '2', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', SALIDA_FB], 'fb2');
const mb = fs.statSync(SALIDA_FB).size / 1e6;
console.log(`${SALIDA_FB}: ${mb.toFixed(2)} MB`);
if (mb >= 9.5) throw new Error('la copia -fb pasa de 9,5 MB');
ff(['-i', SALIDA, '-vf', 'fps=fps=2/3:round=up,scale=270:-1,tile=8x1', '-frames:v', '1', '-q:v', '3', 'contacto-v2.jpg'], 'contacto');
ff(['-i', SALIDA, '-vf', "select='between(t\\,0\\,2.6)*not(mod(n\\,6))',scale=216:-1,tile=7x2", '-frames:v', '1', '-fps_mode', 'passthrough', '-q:v', '3', 'arranque-v2.jpg'], 'arranque');
console.log('contacto-v2.jpg y arranque-v2.jpg listos');
