// Reel «¿Tus sábanas huelen a guardado?» (13-oct-2026): truco de abuela — el juego de sábanas dentro de su propia
// funda con un jaboncito de olor; Proskopellin lo huele: «¡Huele a casa de abuela!».
// Montaje con lo aprendido el 12/13-oct (ver skill reel-casa-viva):
//  - TEXTO GANCHO desde el fotograma 0 (la misma primera frase de Cúrru), caja petróleo + Figtree crema, en zona
//    segura; cuando ella termina la frase, siguen los subtítulos en el mismo sitio.
//  - Subtítulos: PNG por frase con resvg (Figtree crema, borde marrón) desde los tiempos de Whisper.
//  - Cámara: cambio de plano o acercamiento lento cada ~1,5–3 s con zoompan sobre la fuente ampliada.
//  - Final en bucle: sin tarjeta; el logo oficial en una pastilla petróleo encima de los últimos ~1,6 s.
// Uso: node montaje.mjs [--rapido]
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
process.chdir(AQUI);
const { Resvg } = createRequire('C:/Users/Ernesto/vivabot/')('@resvg/resvg-js');
const FFMPEG = 'C:/Users/Ernesto/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe';
const RAPIDO = process.argv.includes('--rapido');
// --limpio: solo la cámara (sin textos ni audio) → piezas/base-limpia.mp4, la base para HyperFrames (v2).
const LIMPIO = process.argv.includes('--limpio');
const UP = RAPIDO ? 2 : 4;

const W = 1080, H = 1920, FPS = 30;
const CREMA = '#F6F1E6', MARRON = '#2B2420', PETROLEO = '#0D3B45';
const FONTS = [path.resolve('../redes/fuentes/Figtree[wght].ttf')];
const PIEZAS = 'piezas';
fs.mkdirSync(PIEZAS, { recursive: true });

const CFG = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const ESCENA = CFG.escena;
const DUR = CFG.duracion;                         // s de la escena que se usan
const FRAMES = Math.round(DUR * FPS);
const SALIDA = CFG.salida, SALIDA_FB = CFG.salida.replace(/\.mp4$/, '-fb.mp4');

// ───────────── 1. Cámara (planos en fotogramas de 30 fps; f = punto de la fuente, o = dónde cae en la salida) ─────────────
const PLANOS = CFG.planos;
const centro = (p, z) => {
  const cl = (v, hi) => Math.min(Math.max(v, 0), hi);
  return [cl(p.f[0] - p.o[0] / z, 1 - 1 / z) + 0.5 / z, cl(p.f[1] - p.o[1] / z, 1 - 1 / z) + 0.5 / z];
};
for (const p of PLANOS) p.c = [centro(p, p.z[0]), centro(p, p.z[1])];
const n = (v) => Number(v.toFixed(5));
const zoompanExpr = () => {
  const tramo = (p, campo) => {
    const P = `clip((on-${p.de})/${Math.max(1, p.a - p.de - 1)},0,1)`;
    const E = `(${P}*${P}*(3-2*${P}))`;
    if (campo === 'z') return `${n(p.z[0])}+${n(p.z[1] - p.z[0])}*${E}`;
    const i = campo === 'x' ? 0 : 1, lado = campo === 'x' ? 'iw' : 'ih';
    return `clip(${lado}*(${n(p.c[0][i])}+${n(p.c[1][i] - p.c[0][i])}*${E}-0.5/zoom),0,${lado}-${lado}/zoom)`;
  };
  const anidar = (campo) => PLANOS.slice(0, -1).reduceRight(
    (resto, p) => `if(lt(on,${p.a}),${tramo(p, campo)},${resto})`, tramo(PLANOS.at(-1), campo));
  return `zoompan=z='${anidar('z')}':x='${anidar('x')}':y='${anidar('y')}':d=1:s=${W}x${H}:fps=${FPS}`;
};
const camara = (entrada, salida) =>
  `${entrada}fps=${FPS},trim=end_frame=${FRAMES},setpts=PTS-STARTPTS,` +
  `scale=${W * UP}:${H * UP}:flags=bicubic,format=yuv444p,${zoompanExpr()},format=yuv420p,setsar=1${salida}`;
const CORTES = PLANOS.slice(1).map((p) => p.de / FPS);

const ff = (args, etiqueta) => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', '-y', ...args], { encoding: 'utf8', maxBuffer: 1 << 30 });
  if (r.status !== 0) { console.error(r.stderr.slice(-3000)); throw new Error(`ffmpeg falló: ${etiqueta}`); }
  return r;
};

// ───────────── 2. Gancho, subtítulos y logo (PNG con resvg) ─────────────
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const opts = { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Figtree' } };
const ancho = (txt, size) =>
  new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="${size * 2}"><text x="0" y="${size * 1.5}" font-family="Figtree" font-size="${size}">${esc(txt)}</text></svg>`, opts).getBBox()?.width ?? 0;
const CORTAS = new Set(['el', 'la', 'lo', 'los', 'las', 'te', 'de', 'del', 'que', 'y', 'se', 'mi', 'tu', 'tus', 'un', 'una', 'en', 'a', 'al', 'con', 'por', 'para', 'tú', 'su']);
const lineas = (texto, size, maxW) => {
  if (texto.includes('|')) return texto.split('|');
  const pal = texto.split(' ');
  if (ancho(texto, size) <= maxW || pal.length < 2) return [texto];
  let mejor = null;
  for (let i = 1; i < pal.length; i++) {
    const l1 = pal.slice(0, i).join(' '), l2 = pal.slice(i).join(' ');
    let nota = Math.max(ancho(l1, size), ancho(l2, size));
    if (/[,:]$/.test(pal[i - 1])) nota -= 150;
    if (CORTAS.has(pal[i - 1].toLowerCase())) nota += 250;
    if (!mejor || nota < mejor.nota) mejor = { nota, ls: [l1, l2] };
  }
  return mejor.ls;
};

const SUB = { size: 76, lh: 92, maxW: 860, centroY: CFG.subY, borde: 14, peso: 2.0, pad: 18 };
const pngSubtitulo = (texto, centroY = SUB.centroY) => {
  const ls = lineas(texto, SUB.size, SUB.maxW);
  const h = ls.length * SUB.lh + 2 * SUB.pad;
  const capa = (fill, stroke, sw) => ls.map((l, k) =>
    `<text x="${W / 2}" y="${(SUB.pad + SUB.lh * k + SUB.lh / 2 + SUB.size * 0.35).toFixed(1)}" text-anchor="middle" font-family="Figtree" font-size="${SUB.size}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round">${esc(l)}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}">${capa(MARRON, MARRON, SUB.borde)}${capa(CREMA, CREMA, SUB.peso)}</svg>`;
  for (const l of ls) if (ancho(l, SUB.size) > W - 160) throw new Error(`línea demasiado larga: ${l}`);
  return { png: new Resvg(svg, opts).render().asPng(), h, y: Math.round(centroY - h / 2), ls };
};

// Gancho: caja petróleo, Figtree crema grande; centrado en el mismo sitio que los subtítulos.
const G = { size: 80, lh: 96, padX: 46, padY: 30 };
const pngGancho = (texto) => {
  const ls = lineas(texto, G.size, 860);
  const bw = Math.ceil(Math.max(...ls.map((l) => ancho(l, G.size)))) + 2 * G.padX;
  const bh = ls.length * G.lh + 2 * G.padY;
  if (bw > W - 140) throw new Error('gancho demasiado ancho');
  const txt = ls.map((l, k) => `<text x="${W / 2}" y="${(G.padY + G.lh * k + G.lh / 2 + G.size * 0.35).toFixed(1)}" text-anchor="middle" font-family="Figtree" font-size="${G.size}" fill="${CREMA}" stroke="${CREMA}" stroke-width="1.8">${esc(l)}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${bh}"><rect x="${(W - bw) / 2}" y="0" width="${bw}" height="${bh}" rx="28" fill="${PETROLEO}"/>${txt}</svg>`;
  return { png: new Resvg(svg, opts).render().asPng(), h: bh, y: Math.round(CFG.ganchoY - bh / 2) };
};

// Frases desde Whisper (hasta . ! ? …; más de 7 palabras → se parte por la coma/dos puntos más cercana al medio).
const whisper = JSON.parse(fs.readFileSync(CFG.whisper, 'utf8'));
const palabras = whisper.words.map((w) => ({ text: String(w.word).trim(), start: w.start, end: w.end })).filter((w) => w.start < DUR);
const frases = [];
let cur = [];
for (const w of palabras) { cur.push(w); if (/[.!?…]$/.test(w.text)) { frases.push(cur); cur = []; } }
if (cur.length) frases.push(cur);
const partir = (s) => {
  if (s.length <= 7) return [s];
  const mid = s.length / 2;
  const comas = s.map((w, i) => (/[,:…]$/.test(w.text) && i < s.length - 1 ? i + 1 : -1)).filter((i) => i > 0);
  const cut = comas.length ? comas.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a)) : Math.ceil(mid);
  return [...partir(s.slice(0, cut)), ...partir(s.slice(cut))];
};
const trozos = frases.flatMap(partir);
// El primer trozo es la frase del gancho: lo enseña la caja del gancho desde 0 hasta que ella termina de decirlo.
const ganchoHasta = CFG.ganchoHasta ?? n(Math.max(CFG.ganchoMin, Math.min(trozos[0].at(-1).end + 0.3, trozos[1]?.[0].start ?? DUR)));
// Whisper no pone tildes ni signos («aguardado»): si config.json trae "subs" (texto del guion con los tiempos de
// Whisper), mandan esos.
const subs = CFG.subs ?? trozos.slice(1).map((c, i, arr) => {
  const de = Math.max(c[0].start, ganchoHasta);
  const sig = arr[i + 1]?.[0].start ?? Infinity;
  let a = Math.min(Math.max(c.at(-1).end + 0.25, de + 0.9), sig, DUR);
  for (const corte of CORTES) if (a > corte - 0.5 / FPS && a - corte < 0.3 && de < corte) a = corte - 0.5 / FPS;
  return { de: n(de), a: n(a), texto: c.map((w) => w.text).join(' ').replace(/[,…]$/, '') };
});
const PROMO = /casa viva|escr[ií]benos|whatsapp|compra|precio|\$|cup|usd|pedid/i;
for (const s of subs) if (PROMO.test(s.texto)) throw new Error(`frase promocional en la escena: «${s.texto}»`);

const capas = [];
const g = pngGancho(CFG.gancho);
fs.writeFileSync(`${PIEZAS}/gancho.png`, g.png);
capas.push({ file: `${PIEZAS}/gancho.png`, x: 0, y: g.y, de: 0, a: ganchoHasta, texto: `[gancho] ${CFG.gancho}` });
subs.forEach((s, i) => {
  const r = pngSubtitulo(s.texto, s.y);
  const file = `${PIEZAS}/sub-${String(i + 1).padStart(2, '0')}.png`;
  fs.writeFileSync(file, r.png);
  capas.push({ file, x: 0, y: r.y, de: s.de, a: s.a, texto: r.ls.join(' / '), alto: r.h });
});
// Logo oficial (horizontal crema) en pastilla petróleo, los últimos segundos.
const logo = await sharp(Buffer.from(fs.readFileSync('../redes/logo-horizontal-crema.svg'))).resize({ width: 300 }).png().toBuffer();
const lm = await sharp(logo).metadata();
const PW = lm.width + 80, PH = lm.height + 44;
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}"><rect width="${PW}" height="${PH}" rx="${PH / 2}" fill="${PETROLEO}"/></svg>`))
  .composite([{ input: logo, left: 40, top: 22 }]).png().toFile(`${PIEZAS}/logo.png`);
capas.push({ file: `${PIEZAS}/logo.png`, x: Math.round((W - PW) / 2), y: CFG.logoY, de: n(DUR - CFG.logoDur), a: DUR + 1, texto: '[logo]' });
fs.writeFileSync(`${PIEZAS}/capas.json`, JSON.stringify({ planos: PLANOS, capas }, null, 2));
for (const c of capas) console.log(`${c.de.toFixed(2).padStart(6)}–${Math.min(c.a, DUR).toFixed(2).padStart(6)}  y=${c.y}${c.alto ? `–${c.y + c.alto}` : ''}  ${c.texto}`);

if (LIMPIO) {
  fs.writeFileSync(`${PIEZAS}/limpio.fc`, camara('[0:v]', '[vout]'));
  ff(['-i', ESCENA, '-/filter_complex', `${PIEZAS}/limpio.fc`, '-map', '[vout]', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14',
    '-pix_fmt', 'yuv420p', '-r', String(FPS), '-t', String(n(DUR)), '-movflags', '+faststart', `${PIEZAS}/base-limpia.mp4`], 'base limpia');
  console.log(`${PIEZAS}/base-limpia.mp4 lista`);
  process.exit(0);
}

// ───────────── 3. Audio: escena, fundido corto al final, loudnorm −14 en 2 pasadas ─────────────
const crudo = `${PIEZAS}/audio-crudo.wav`, audio = `${PIEZAS}/audio-final.wav`;
ff(['-i', ESCENA, '-vn', '-af', `aresample=48000,atrim=0:${n(DUR)},afade=t=out:st=${n(DUR - 0.25)}:d=0.25,apad=whole_dur=${n(DUR)}`,
  '-ac', '2', '-c:a', 'pcm_s16le', crudo], 'audio crudo');
const LN = 'loudnorm=I=-14:TP=-1.5:LRA=11';
const med = JSON.parse(ff(['-i', crudo, '-af', `${LN}:print_format=json`, '-f', 'null', '-'], 'loudnorm 1').stderr.match(/\{[\s\S]*?\}/g).at(-1));
ff(['-i', crudo, '-af', `${LN}:measured_I=${med.input_i}:measured_TP=${med.input_tp}:measured_LRA=${med.input_lra}:measured_thresh=${med.input_thresh}:offset=${med.target_offset}:linear=true,aresample=48000`,
  '-ac', '2', '-c:a', 'pcm_s16le', audio], 'loudnorm 2');
console.log(`audio: entrada ${med.input_i} LUFS → −14 LUFS`);

// ───────────── 4. Montaje ─────────────
let fc = camara('[0:v]', '[cam]') + ';\n';
let prev = '[cam]';
capas.forEach((c, i) => {
  const out = i === capas.length - 1 ? '[vout]' : `[o${i}]`;
  fc += `${prev}[${i + 2}:v]overlay=x=${c.x}:y=${c.y}:enable='gte(t,${c.de})*lt(t,${c.a})'${out};\n`;
  prev = out;
});
fc = fc.trimEnd().replace(/;$/, '');
fs.writeFileSync(`${PIEZAS}/montaje.fc`, fc);
const t0 = Date.now();
ff(['-i', ESCENA, '-i', audio, ...capas.flatMap((c) => ['-i', c.file]),
  '-/filter_complex', `${PIEZAS}/montaje.fc`, '-map', '[vout]', '-map', '1:a',
  '-c:v', 'libx264', '-preset', RAPIDO ? 'veryfast' : 'slow', '-crf', '18', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', String(n(DUR)), '-movflags', '+faststart', SALIDA], 'montaje');
console.log(`${SALIDA}: ${(fs.statSync(SALIDA).size / 1e6).toFixed(2)} MB en ${((Date.now() - t0) / 1000).toFixed(0)} s`);

// Copia para subir desde el navegador (< 9,5 MB): 2 pasadas.
const log = `${PIEZAS}/x264-fb`;
const fbV = ['-c:v', 'libx264', '-preset', 'slow', '-b:v', '4200k', '-maxrate', '5200k', '-bufsize', '10000k', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-passlogfile', log];
ff(['-i', SALIDA, ...fbV, '-pass', '1', '-an', '-f', 'null', '-'], 'fb pasada 1');
ff(['-i', SALIDA, ...fbV, '-pass', '2', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', SALIDA_FB], 'fb pasada 2');
for (const f of fs.readdirSync(PIEZAS)) if (f.startsWith('x264-fb')) fs.rmSync(`${PIEZAS}/${f}`);
const fbMB = fs.statSync(SALIDA_FB).size / 1e6;
console.log(`${SALIDA_FB}: ${fbMB.toFixed(2)} MB`);
if (fbMB >= 9.5) throw new Error('la copia -fb pasa de 9,5 MB: bajar -b:v');

// Hoja de contacto: un fotograma cada 1,5 s (0; 1,5; …).
ff(['-i', SALIDA, '-vf', 'fps=fps=2/3:round=up,scale=360:-1,tile=5x2', '-frames:v', '1', '-q:v', '3', 'contacto.jpg'], 'contacto');
console.log('contacto.jpg listo');
