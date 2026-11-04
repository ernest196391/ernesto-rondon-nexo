// Reel «Se fue la corriente», versión 2 (lo pidió Ernesto el 12-oct después de verlo publicado en Facebook).
//  1) Subtítulos MÁS ARRIBA, en la zona segura (centro y≈1220; abajo los tapan el nombre de la página, el texto y
//     los botones). PNG por frase con resvg (Figtree crema #F6F1E6 con borde marrón #2B2420) + overlay con los
//     tiempos de Whisper. libass no usa las letras del manual, por eso no hay ASS.
//  2) MÁS CÁMARA: cambio de plano o acercamiento lento cada ~3 s (general → medio → primer plano), con zoompan
//     sobre la fuente ampliada 4× en yuv444p (paso de 0,25 px: no tiembla). Las caras quedan arriba de los subtítulos.
//  3) SIN PROMOCIÓN: fuera la escena 20-cta («En Casa Viva, el apagón se pasa fresquito. Escríbenos.»). Termina en
//     la risa después de «De tu tienda.» y el logo oficial 2 s (sin eslogan).
// Uso (desde esta carpeta):
//   node v2.mjs            → casa-viva-reel-apagon-v2.mp4, …-v2-fb.mp4 (< 9,5 MB) y contacto-v2.jpg
//   node v2.mjs --rapido   → lo mismo pero ampliación 2× y x264 veryfast (para probar encuadres)
//   node v2.mjs --temblor  → prueba de temblor: aplica la misma cámara a dos puntos sintéticos y mide su recorrido
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
process.chdir(AQUI);
const { Resvg } = createRequire('C:/Users/Ernesto/vivabot/')('@resvg/resvg-js');
const FFMPEG = 'C:/Users/Ernesto/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe';
const RAPIDO = process.argv.includes('--rapido');
const TEMBLOR = process.argv.includes('--temblor');
const UP = RAPIDO ? 2 : 4;                      // ampliación de la fuente antes del zoompan

const W = 1080, H = 1920, FPS = 30;
const CREMA = '#F6F1E6', MARRON = '#2B2420', PETROLEO = '#0D3B45';
const FONTS = [path.resolve('../redes/fuentes/Figtree[wght].ttf')];
const PIEZAS = 'v2-piezas';
fs.mkdirSync(PIEZAS, { recursive: true });

const ESCENA = '10-escena-v1.mp4';              // 15,07 s con el diálogo (la única escena que queda)
const CIERRE = '90-cierre.mp4';                 // tarjeta con el logo oficial (0–0,5 s es fundido desde negro)
const FRAMES_ESCENA = 452;                      // 15,067 s a 30 fps
const FIN_ESCENA = FRAMES_ESCENA / FPS;
const CIERRE_DESDE = 0.5, CIERRE_DUR = 2.0, FUNDIDO = 0.3;
const TOTAL = FIN_ESCENA + CIERRE_DUR - FUNDIDO;  // 16,77 s
const SALIDA = 'casa-viva-reel-apagon-v2.mp4';
const SALIDA_FB = 'casa-viva-reel-apagon-v2-fb.mp4';

// ───────────────────────────── 1. Cámara ─────────────────────────────
// Planos en fotogramas de 30 fps [de, a). z = zoom al empezar → al terminar. f = punto de la fuente (0–1, una cara) y
// o = dónde cae ese punto en la salida. Con eso se calcula el centro del encuadre al empezar y al terminar (recortado a
// los bordes de la imagen) y en medio se mueven zoom y centro con la misma curva suave: sin tirones a mitad de plano.
// Caras medidas en la fuente: Cúrru (0,43; 0,47) al teléfono, (0,31; 0,46) a partir de 10 s; el niño (0,79–0,83; 0,47).
// Los cortes caen en el apagón (fotograma 100 = 3,333 s) y cuando se enciende el ventilador (248 = 8,27 s).
const PLANOS = [
  { de: 0,   a: 100, z: [1.00, 1.10], f: [0.43, 0.47], o: [0.50, 0.42], que: 'general: Cúrru al teléfono, acercamiento lento' },
  { de: 100, a: 192, z: [1.34, 1.42], f: [0.42, 0.44], o: [0.50, 0.40], que: 'se va la luz: primer plano de Cúrru' },
  { de: 192, a: 248, z: [1.00, 1.06], f: [0.62, 0.50], o: [0.50, 0.45], que: 'general: aparece el niño por abajo' },
  { de: 248, a: 321, z: [1.20, 1.26], f: [0.79, 0.47], o: [0.72, 0.38], que: 'se enciende el ventilador: niño y ventilador' },
  { de: 321, a: 368, z: [1.28, 1.34], f: [0.31, 0.46], o: [0.40, 0.38], que: '«¿Y eso de dónde…?»: Cúrru' },
  { de: 368, a: 396, z: [1.26, 1.30], f: [0.82, 0.48], o: [0.72, 0.38], que: '«De tu tienda.»: el niño' },
  { de: 396, a: 452, z: [1.10, 1.00], f: [0.50, 0.46], o: [0.50, 0.42], que: 'la risa: se abre a plano general' },
];
const CORTES = PLANOS.slice(1).map((p) => p.de / FPS);
const centro = (p, z) => {
  const cl = (v, hi) => Math.min(Math.max(v, 0), hi);
  return [cl(p.f[0] - p.o[0] / z, 1 - 1 / z) + 0.5 / z, cl(p.f[1] - p.o[1] / z, 1 - 1 / z) + 0.5 / z];
};
for (const p of PLANOS) p.c = [centro(p, p.z[0]), centro(p, p.z[1])];

const n = (v) => Number(v.toFixed(5));
// Expresiones de zoompan: `on` = número de fotograma de salida; `zoom` ya vale el z de este fotograma.
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
  `${entrada}fps=${FPS},trim=end_frame=${FRAMES_ESCENA},setpts=PTS-STARTPTS,` +
  `scale=${W * UP}:${H * UP}:flags=bicubic,format=yuv444p,${zoompanExpr()},format=yuv420p,setsar=1${salida}`;

// Lo mismo en JS (para la prueba de temblor y para comprobar las caras).
const encuadre = (k) => {
  const p = PLANOS.find((q) => k >= q.de && k < q.a) ?? PLANOS.at(-1);
  const P = Math.min(1, Math.max(0, (k - p.de) / Math.max(1, p.a - p.de - 1)));
  const E = P * P * (3 - 2 * P), z = p.z[0] + (p.z[1] - p.z[0]) * E;
  const c = [0, 1].map((i) => p.c[0][i] + (p.c[1][i] - p.c[0][i]) * E);
  return { z, x0: c[0] - 0.5 / z, y0: c[1] - 0.5 / z };
};

const ff = (args, etiqueta) => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', '-y', ...args], { encoding: 'utf8', maxBuffer: 1 << 30 });
  if (r.status !== 0) { console.error(r.stderr.slice(-3000)); throw new Error(`ffmpeg falló: ${etiqueta}`); }
  return r;
};

// ───────────────────────────── Prueba de temblor ─────────────────────────────
if (TEMBLOR) {
  // Fuente sintética 720×1280 a 24 fps con dos cuadritos blancos quietos; se le aplica la cámara y se mide el centro
  // de cada cuadrito en cada fotograma. Sin temblor, la segunda diferencia (aceleración) dentro de un plano es ~0.
  const PUNTOS = [[0.35, 0.35], [0.60, 0.60]];
  const cajas = PUNTOS.map(([x, y]) => `drawbox=x=${x * 720 - 3}:y=${y * 1280 - 3}:w=6:h=6:color=white:t=fill`).join(',');
  fs.writeFileSync(`${PIEZAS}/temblor.fc`, camara(`color=black:s=720x1280:r=24:d=${FIN_ESCENA + 0.1},${cajas},`, ',format=gray[v]'));
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', '-v', 'error', '-/filter_complex', `${PIEZAS}/temblor.fc`,
    '-map', '[v]', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: W * H * (FRAMES_ESCENA + 5) });
  if (r.status !== 0) throw new Error(String(r.stderr));
  const frames = Math.floor(r.stdout.length / (W * H));
  const pistas = PUNTOS.map(() => []);
  for (let k = 0; k < frames; k++) {
    const { z, x0, y0 } = encuadre(k);
    PUNTOS.forEach(([px, py], i) => {
      const ex = (px - x0) * z * W, ey = (py - y0) * z * H;   // donde debería estar
      let s = 0, sx = 0, sy = 0;
      for (let y = Math.max(0, Math.round(ey) - 25); y < Math.min(H, Math.round(ey) + 25); y++)
        for (let x = Math.max(0, Math.round(ex) - 25); x < Math.min(W, Math.round(ex) + 25); x++) {
          const v = r.stdout[k * W * H + y * W + x]; if (v > 20) { s += v; sx += v * x; sy += v * y; }
        }
      pistas[i].push(s ? { k, x: sx / s, y: sy / s, ex, ey } : null);
    });
  }
  if (process.env.DUMP) fs.writeFileSync(process.env.DUMP, JSON.stringify(pistas));
  const limites = new Set(PLANOS.map((p) => p.de));
  pistas.forEach((pista, i) => {
    let peor = 0, peorK = -1, error = 0;
    for (let k = 1; k < pista.length - 1; k++) {
      const [a, b, c] = [pista[k - 1], pista[k], pista[k + 1]];
      if (!a || !b || !c || limites.has(k) || limites.has(k + 1)) continue;
      const acc = Math.hypot(a.x - 2 * b.x + c.x, a.y - 2 * b.y + c.y);
      if (acc > peor) { peor = acc; peorK = k; }
      error = Math.max(error, Math.hypot(b.x - b.ex + 0.5, b.y - b.ey + 0.5));
    }
    console.log(`punto ${i + 1}: ${pista.filter(Boolean).length}/${frames} fotogramas medidos; ` +
      `sacudida máx. ${peor.toFixed(2)} px (fotograma ${peorK}); desvío máx. del modelo ${error.toFixed(2)} px`);
  });
  process.exit(0);
}

// ───────────────────────────── 2. Subtítulos y gancho (PNG con resvg) ─────────────────────────────
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const opts = { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Figtree' } };
const ancho = (txt, size) =>
  new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="${size * 2}"><text x="0" y="${size * 1.5}" font-family="Figtree" font-size="${size}">${esc(txt)}</text></svg>`, opts).getBBox()?.width ?? 0;

const CORTAS = new Set(['el', 'la', 'lo', 'los', 'las', 'te', 'de', 'del', 'que', 'y', 'se', 'mi', 'tu', 'un', 'una', 'en', 'a', 'al', 'con', 'por', 'para', 'tú', '¿y']);
// Máx. 2 líneas: si no cabe en una, se parte donde quedan más parejas, mejor después de coma y nunca dejando
// «el», «que», «te»… colgando al final de la primera línea.
const lineas = (texto, size, maxW) => {
  if (texto.includes('|')) return texto.split('|');
  const pal = texto.split(' ');
  if (ancho(texto, size) <= maxW || pal.length < 2) return [texto];
  let mejor = null;
  for (let i = 1; i < pal.length; i++) {
    const l1 = pal.slice(0, i).join(' '), l2 = pal.slice(i).join(' ');
    let nota = Math.max(ancho(l1, size), ancho(l2, size));
    if (/,$/.test(pal[i - 1])) nota -= 150;
    if (CORTAS.has(pal[i - 1].toLowerCase())) nota += 250;
    if (!mejor || nota < mejor.nota) mejor = { nota, ls: [l1, l2] };
  }
  return mejor.ls;
};

const SUB = { size: 76, lh: 92, maxW: 900, centroY: 1220, borde: 14, peso: 2.0, pad: 18 };
const pngSubtitulo = (texto) => {
  const ls = lineas(texto, SUB.size, SUB.maxW);
  const h = ls.length * SUB.lh + 2 * SUB.pad;
  const capa = (fill, stroke, sw) => ls.map((l, k) =>
    `<text x="${W / 2}" y="${(SUB.pad + SUB.lh * k + SUB.lh / 2 + SUB.size * 0.35).toFixed(1)}" text-anchor="middle" font-family="Figtree" font-size="${SUB.size}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round">${esc(l)}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}">${capa(MARRON, MARRON, SUB.borde)}${capa(CREMA, CREMA, SUB.peso)}</svg>`;
  for (const l of ls) if (ancho(l, SUB.size) > W - 120) throw new Error(`línea demasiado larga: ${l}`);
  return { png: new Resvg(svg, opts).render().asPng(), h, y: Math.round(SUB.centroY - h / 2), ls };
};

const GANCHO = { texto: '¿Cuántas horas sin corriente|llevas hoy?', size: 60, lh: 74, padX: 44, padY: 26, top: 320, hasta: 2.6 };
const pngGancho = () => {
  const ls = lineas(GANCHO.texto, GANCHO.size, 900);
  const bw = Math.ceil(Math.max(...ls.map((l) => ancho(l, GANCHO.size)))) + 2 * GANCHO.padX;
  const bh = ls.length * GANCHO.lh + 2 * GANCHO.padY;
  const txt = ls.map((l, k) => `<text x="${W / 2}" y="${(GANCHO.padY + GANCHO.lh * k + GANCHO.lh / 2 + GANCHO.size * 0.35).toFixed(1)}" text-anchor="middle" font-family="Figtree" font-size="${GANCHO.size}" fill="${CREMA}" stroke="${CREMA}" stroke-width="1.4">${esc(l)}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${bh}"><rect x="${(W - bw) / 2}" y="0" width="${bw}" height="${bh}" rx="26" fill="${PETROLEO}"/>${txt}</svg>`;
  return { png: new Resvg(svg, opts).render().asPng(), h: bh, y: GANCHO.top };
};

// Frases desde las palabras de Whisper: hasta . ! ? …; si pasa de 7 palabras se parte por la coma más cercana al
// medio (o a la mitad). Nunca se corta una frase a medias en dos subtítulos raros.
const whisper = JSON.parse(fs.readFileSync('10-escena-v1.whisper.json', 'utf8'));
const palabras = whisper.words.map((w) => ({ text: String(w.word).trim(), start: w.start, end: w.end }));
const frases = [];
let cur = [];
for (const w of palabras) { cur.push(w); if (/[.!?…]$/.test(w.text)) { frases.push(cur); cur = []; } }
if (cur.length) frases.push(cur);
const partir = (s) => {
  if (s.length <= 7) return [s];
  const mid = s.length / 2;
  const comas = s.map((w, i) => (/,$/.test(w.text) && i < s.length - 1 ? i + 1 : -1)).filter((i) => i > 0);
  const cut = comas.length ? comas.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a)) : Math.ceil(mid);
  return [...partir(s.slice(0, cut)), ...partir(s.slice(cut))];
};
const trozos = frases.flatMap(partir);
const subs = trozos.map((c, i) => {
  const de = c[0].start;
  const sig = trozos[i + 1]?.[0].start ?? Infinity;
  let a = Math.min(Math.max(c.at(-1).end + 0.25, de + 0.9), sig, FIN_ESCENA);
  // No pisar un corte de plano: se quita medio fotograma antes del corte (si no, el primer fotograma del plano
  // nuevo todavía lleva la frase anterior por redondeo de t).
  for (const corte of CORTES) if (a > corte - 0.5 / FPS && a - corte < 0.3 && de < corte) a = corte - 0.5 / FPS;
  return { de: n(de), a: n(a), texto: c.map((w) => w.text).join(' ').replace(/,$/, '') };
});
// Regla de Ernesto: nada que promocione la tienda. Si alguna frase de la escena lo hiciera, se para aquí.
const PROMO = /casa viva|escr[ií]benos|whatsapp|compra|precio|\$|cup|usd|pedid/i;
for (const s of subs) if (PROMO.test(s.texto)) throw new Error(`frase promocional en la escena: «${s.texto}»`);

const capas = [];
const g = pngGancho();
fs.writeFileSync(`${PIEZAS}/gancho.png`, g.png);
capas.push({ file: `${PIEZAS}/gancho.png`, y: g.y, de: 0, a: GANCHO.hasta, texto: GANCHO.texto.replace('|', ' ') });
subs.forEach((s, i) => {
  const r = pngSubtitulo(s.texto);
  const file = `${PIEZAS}/sub-${String(i + 1).padStart(2, '0')}.png`;
  fs.writeFileSync(file, r.png);
  capas.push({ file, y: r.y, de: s.de, a: s.a, texto: s.texto, lineas: r.ls, alto: r.h });
});
fs.writeFileSync(`${PIEZAS}/subtitulos-v2.json`, JSON.stringify({ planos: PLANOS, capas }, null, 2));
for (const c of capas) console.log(`${c.de.toFixed(2).padStart(6)}–${c.a.toFixed(2).padStart(6)}  y=${c.y}${c.alto ? `–${c.y + c.alto}` : ''}  ${c.lineas ? c.lineas.join(' / ') : `[gancho] ${c.texto}`}`);

// ───────────────────────────── 3. Audio: escena sola, fundido, silencio en el logo, loudnorm −14 en 2 pasadas ─────
const crudo = `${PIEZAS}/audio-crudo.wav`, audio = `${PIEZAS}/audio-final.wav`;
ff(['-i', ESCENA, '-vn', '-af', `aresample=48000,atrim=0:${n(FIN_ESCENA)},afade=t=out:st=${n(FIN_ESCENA - FUNDIDO)}:d=${FUNDIDO},apad=whole_dur=${n(TOTAL)}`,
  '-ac', '2', '-c:a', 'pcm_s16le', crudo], 'audio crudo');
const LN = 'loudnorm=I=-14:TP=-1.5:LRA=11';
const med = JSON.parse(ff(['-i', crudo, '-af', `${LN}:print_format=json`, '-f', 'null', '-'], 'loudnorm 1').stderr.match(/\{[\s\S]*?\}/g).at(-1));
ff(['-i', crudo, '-af', `${LN}:measured_I=${med.input_i}:measured_TP=${med.input_tp}:measured_LRA=${med.input_lra}:measured_thresh=${med.input_thresh}:offset=${med.target_offset}:linear=true,aresample=48000`,
  '-ac', '2', '-c:a', 'pcm_s16le', audio], 'loudnorm 2');
console.log(`audio: entrada ${med.input_i} LUFS → −14 LUFS`);

// ───────────────────────────── 4. Montaje ─────────────────────────────
// Entradas: 0 escena, 1 cierre (desde 0,5 s, sin el fundido desde negro), 2 audio, 3… gancho y subtítulos.
let fc = camara('[0:v]', '[cam]') + ';\n';
let prev = '[cam]';
capas.forEach((c, i) => {
  const out = i === capas.length - 1 ? '[esc]' : `[o${i}]`;
  fc += `${prev}[${i + 3}:v]overlay=x=0:y=${c.y}:enable='gte(t,${c.de})*lt(t,${c.a})'${out};\n`;
  prev = out;
});
fc += `[1:v]fps=${FPS},scale=${W}:${H},setsar=1,format=yuv420p,setpts=PTS-STARTPTS[logo];\n`;
fc += `[esc]settb=1/${FPS}[esc2];[logo]settb=1/${FPS}[logo2];\n`;
fc += `[esc2][logo2]xfade=transition=fade:duration=${FUNDIDO}:offset=${n(FIN_ESCENA - FUNDIDO)},format=yuv420p[vout]`;
fs.writeFileSync(`${PIEZAS}/montaje.fc`, fc);

const t0 = Date.now();
ff(['-i', ESCENA, '-ss', String(CIERRE_DESDE), '-t', String(CIERRE_DUR), '-i', CIERRE, '-i', audio,
  ...capas.flatMap((c) => ['-i', c.file]),
  '-/filter_complex', `${PIEZAS}/montaje.fc`, '-map', '[vout]', '-map', '2:a',
  '-c:v', 'libx264', '-preset', RAPIDO ? 'veryfast' : 'slow', '-crf', '18', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', String(n(TOTAL)), '-movflags', '+faststart', SALIDA], 'montaje');
console.log(`${SALIDA}: ${(fs.statSync(SALIDA).size / 1e6).toFixed(2)} MB en ${((Date.now() - t0) / 1000).toFixed(0)} s`);

// Copia para subir desde el navegador (< 9,5 MB): mismo video, menos bitrate, 2 pasadas.
const log = `${PIEZAS}/x264-fb`;
const fbV = ['-c:v', 'libx264', '-preset', 'slow', '-b:v', '3600k', '-maxrate', '4500k', '-bufsize', '9000k', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-passlogfile', log];
ff(['-i', SALIDA, ...fbV, '-pass', '1', '-an', '-f', 'null', '-'], 'fb pasada 1');
ff(['-i', SALIDA, ...fbV, '-pass', '2', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', SALIDA_FB], 'fb pasada 2');
for (const f of fs.readdirSync(PIEZAS)) if (f.startsWith('x264-fb')) fs.rmSync(`${PIEZAS}/${f}`);
const fbMB = fs.statSync(SALIDA_FB).size / 1e6;
console.log(`${SALIDA_FB}: ${fbMB.toFixed(2)} MB`);
if (fbMB >= 9.5) throw new Error('la copia para Facebook pasa de 9,5 MB: bajar -b:v');

// Hoja de contacto para revisar: un fotograma cada 1,5 s exactos (0; 1,5; 3; … 16,5).
ff(['-i', SALIDA, '-vf', 'fps=fps=2/3:round=up,scale=360:-1,tile=6x2', '-frames:v', '1', '-q:v', '3', 'contacto-v2.jpg'], 'contacto');
console.log('contacto-v2.jpg listo');
