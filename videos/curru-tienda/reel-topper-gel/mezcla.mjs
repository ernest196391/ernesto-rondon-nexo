// Audio del reel «Súper Prosko» (14-oct) y unión con el video de HyperFrames. Igual que mezcla-v2 de ayer, pero el
// diálogo se arma aquí con los mismos planos de montaje.mjs (tiempos.json):
//  - voz/sonido de cada escena en su tramo (el plano en cámara lenta: atempo 0,6, más bajito);
//  - coro dramático en el gancho congelado (efectos.mjs), música propia desde «10 segundos antes» (musica.mjs,
//    −9 dB y se aparta cuando hablan), whoosh antes de cada corte, pop en los punch-in, «clac» al abrir la cama,
//    «puff» al caer, brillito en el guiño. Todo a −14 LUFS. Saca el mp4 final, la copia -fb (< 9,5 MB) y hojas.
// Uso: node mezcla.mjs
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

process.chdir(path.dirname(fileURLToPath(import.meta.url)));
const FFMPEG = 'C:/Users/Ernesto/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe';
const SFX = 'C:/Users/Ernesto/.claude/skills/media-use/audio/assets/sfx';
const CFG = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const T = JSON.parse(fs.readFileSync('tiempos.json', 'utf8'));
const DUR = T.DUR;
const VIDEO_HF = 'piezas/video-capas.mp4'; // reel del topper: textos puestos con capas.mjs
const SALIDA = CFG.salida, SALIDA_FB = SALIDA.replace(/\.mp4$/, '-fb.mp4');
const ff = (args, et) => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', '-y', ...args], { encoding: 'utf8', maxBuffer: 1 << 30 });
  if (r.status !== 0) { console.error(r.stderr.slice(-3000)); throw new Error(`ffmpeg falló: ${et}`); }
  return r;
};
const n = (v) => Number(v.toFixed(4));
const aSalida = (src, s) => {
  const p = T.planos.find((q) => q.src === src && s >= q.de - 1e-6 && s <= q.a + 1e-6);
  return n(p.out + (s - p.de) / p.vel);
};
const fmt = 'aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo';

// 1) Pista de escena: un trozo por plano, cada uno exactamente de lo que dura su plano.
const fuentes = Object.entries(CFG.fuentes).filter(([k]) => k !== 'B');
const idx = Object.fromEntries(fuentes.map(([k], i) => [k, i]));
let fc = '';
const trozos = [];
T.planos.forEach((p, i) => {
  const d = n(p.frames / T.FPS);
  if (p.src === 'B') { fc += `anullsrc=r=48000:cl=stereo,atrim=0:${d}[d${i}];\n`; trozos.push(`[d${i}]`); return; }
  const lento = p.vel !== 1 ? `,atempo=${p.vel},volume=-7dB` : '';
  fc += `[${idx[p.src]}:a]${fmt},atrim=${p.de}:${n(p.de + d * p.vel + 0.05)},asetpts=PTS-STARTPTS${lento},atrim=0:${d},apad=whole_dur=${d},` +
    `afade=t=in:d=0.012,afade=t=out:st=${n(d - 0.015)}:d=0.015[d${i}];\n`;
  trozos.push(`[d${i}]`);
});
fc += `${trozos.join('')}concat=n=${trozos.length}:v=0:a=1[escena]`;
fs.writeFileSync('piezas/escena.fc', fc);
ff([...fuentes.flatMap(([, f]) => ['-i', f]), '-/filter_complex', 'piezas/escena.fc', '-map', '[escena]', '-c:a', 'pcm_s16le', 'piezas/escena.wav'], 'pista de escena');

// 2) Mezcla.
// Reel del topper (15-oct): música desde el principio y un whoosh suave en cada corte; nada más.
const MUSICA_DB = -11, MUSICA_DESDE = 0;
const EFECTOS = [
  ...T.punch.map((t) => [`${SFX}/pop.mp3`, t, 0.3]),
  ...T.cortes.map((t) => [`${SFX}/whoosh-short.mp3`, Math.max(0, t - 0.2), 0.2]),
];
const entradas = ['-i', 'piezas/escena.wav', '-i', 'piezas/musica.wav', ...EFECTOS.flatMap(([f]) => ['-i', f])];
const ms = (t) => Math.max(0, Math.round(t * 1000));
let mx = `[0:a]${fmt},asplit=2[voz][llave];\n`;
mx += `[1:a]${fmt},volume=${MUSICA_DB}dB,afade=t=in:d=0.25,adelay=${ms(MUSICA_DESDE)}|${ms(MUSICA_DESDE)}[m0];\n`;
mx += `[m0][llave]sidechaincompress=threshold=0.015:ratio=5:attack=25:release=380:makeup=1[mus];\n`;
const nombres = ['[voz]', '[mus]'];
EFECTOS.forEach(([, t, v, rec], i) => {
  const recorte = rec ? `atrim=0:${rec},afade=t=out:st=${rec - 0.35}:d=0.35,` : '';
  mx += `[${i + 2}:a]${fmt},${recorte}volume=${v},adelay=${ms(t)}|${ms(t)}[e${i}];\n`;
  nombres.push(`[e${i}]`);
});
mx += `${nombres.join('')}amix=inputs=${nombres.length}:normalize=0:duration=longest,atrim=0:${DUR},afade=t=out:st=${n(DUR - 0.12)}:d=0.12[mix]`;
fs.writeFileSync('piezas/mezcla.fc', mx);
ff([...entradas, '-/filter_complex', 'piezas/mezcla.fc', '-map', '[mix]', '-c:a', 'pcm_s16le', 'piezas/mezcla-cruda.wav'], 'mezcla');
const LN = 'loudnorm=I=-14:TP=-1.5:LRA=11';
const med = JSON.parse(ff(['-i', 'piezas/mezcla-cruda.wav', '-af', `${LN}:print_format=json`, '-f', 'null', '-'], 'ln1').stderr.match(/\{[\s\S]*?\}/g).at(-1));
ff(['-i', 'piezas/mezcla-cruda.wav', '-af', `${LN}:measured_I=${med.input_i}:measured_TP=${med.input_tp}:measured_LRA=${med.input_lra}:measured_thresh=${med.input_thresh}:offset=${med.target_offset}:linear=true,aresample=48000`,
  '-c:a', 'pcm_s16le', 'piezas/mezcla.wav'], 'ln2');
console.log(`mezcla: ${med.input_i} LUFS → −14 LUFS`);

// 3) Video de HyperFrames + mezcla; copia -fb; hojas de revisión.
ff(['-i', VIDEO_HF, '-i', 'piezas/mezcla.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
  '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', String(DUR), '-movflags', '+faststart', SALIDA], 'unir');
console.log(`${SALIDA}: ${(fs.statSync(SALIDA).size / 1e6).toFixed(2)} MB`);
const fbV = ['-c:v', 'libx264', '-preset', 'slow', '-b:v', '2300k', '-maxrate', '2900k', '-bufsize', '10000k', '-pix_fmt', 'yuv420p', '-r', '30', '-passlogfile', 'piezas/x264-fb'];
ff(['-i', SALIDA, ...fbV, '-pass', '1', '-an', '-f', 'null', '-'], 'fb1');
ff(['-i', SALIDA, ...fbV, '-pass', '2', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', SALIDA_FB], 'fb2');
for (const f of fs.readdirSync('piezas')) if (f.startsWith('x264-fb')) fs.rmSync(`piezas/${f}`);
const mb = fs.statSync(SALIDA_FB).size / 1e6;
console.log(`${SALIDA_FB}: ${mb.toFixed(2)} MB`);
if (mb >= 9.5) throw new Error('la copia -fb pasa de 9,5 MB');
// Fotogramas cada 1,5 s (la revisión obligatoria) y los 3 primeros segundos.
ff(['-i', SALIDA, '-vf', 'fps=fps=2/3:round=up,scale=270:-1,tile=10x1', '-frames:v', '1', '-q:v', '3', 'contacto.jpg'], 'contacto');
ff(['-i', SALIDA, '-vf', "select='between(t\\,0\\,3)*not(mod(n\\,6))',scale=216:-1,tile=8x2", '-frames:v', '1', '-fps_mode', 'passthrough', '-q:v', '3', 'arranque-v2.jpg'], 'arranque');
console.log('contacto.jpg y arranque-v2.jpg listos');
