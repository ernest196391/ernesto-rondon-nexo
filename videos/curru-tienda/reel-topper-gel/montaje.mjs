// Reel «Súper Prosko» y la cama plegable (14-oct-2026). Guion aprobado por Ernesto: guion.md.
// Paso 1 del montaje v2 (lo de ayer, reel-funda, generalizado a varias fuentes):
//  - base-limpia.mp4: solo la cámara (1080×1920, 30 fps). Cada plano sale de una fuente (foto del gancho o una
//    escena de Seedance) con su tramo, su velocidad (cámara lenta con fundido de fotogramas = desenfoque de
//    movimiento) y un acercamiento lento propio (zoompan sobre la fuente ampliada).
//  - PNG con resvg (letras del manual): gancho (caja petróleo), «10 SEGUNDOS ANTES», frase clave (caja ámbar),
//    subtítulos (Figtree crema con borde marrón) y logo en pastilla petróleo.
//  - hf/index.html: el proyecto HyperFrames (punch-in, destellos y capas) escrito desde aquí con los tiempos.
//  - tiempos.json: los tiempos de salida de cada plano, corte y frase (los usa mezcla.mjs).
// Uso: node montaje.mjs
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
const W = 1080, H = 1920, FPS = 30, UP = 2;
const CREMA = '#F6F1E6', MARRON = '#2B2420', PETROLEO = '#0D3B45', AMBAR = '#A35A1F';
const FONTS = [path.resolve('../redes/fuentes/Figtree[wght].ttf'), path.resolve('../redes/fuentes/Cinzel[wght].ttf')];
const PIEZAS = 'piezas';
fs.mkdirSync(PIEZAS, { recursive: true });
const CFG = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const n = (v) => Number(v.toFixed(4));
const ff = (args, et) => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', '-y', ...args], { encoding: 'utf8', maxBuffer: 1 << 30 });
  if (r.status !== 0) { console.error(r.stderr.slice(-3000)); throw new Error(`ffmpeg falló: ${et}`); }
  return r;
};

// ───────────── 1. Línea de tiempo de salida ─────────────
let t = 0;
const PLANOS = CFG.planos.map((p, i) => {
  const frames = Math.round(((p.a - p.de) / p.vel) * FPS);
  const o = { ...p, i, frames, out: n(t), fin: n(t + frames / FPS) };
  t += frames / FPS;
  return o;
});
const DUR = n(t);
const CORTES = PLANOS.slice(1).map((p) => p.out);
// tiempo de salida de un instante de una fuente (dentro de algún plano)
const aSalida = (src, s) => {
  const p = PLANOS.find((q) => q.src === src && s >= q.de - 1e-6 && s <= q.a + 1e-6);
  if (!p) throw new Error(`${src}@${s} no está en ningún plano`);
  return n(p.out + (s - p.de) / p.vel);
};
console.log(`duración ${DUR} s; cortes: ${CORTES.join(' · ')}`);

// ───────────── 2. Foto del gancho recortada como la portada (para que la caja caiga en el mismo sitio) ─────────────
if (CFG.fuentes.B) {
  const { zoom, cx, cy } = CFG.ganchoRecorte, src = CFG.fuentes.B;
  const m = await sharp(src).metadata();
  const cw = Math.round(m.width / zoom), ch = Math.round(m.height / zoom);
  const left = Math.min(Math.max(Math.round(cx * m.width - cw / 2), 0), m.width - cw);
  const top = Math.min(Math.max(Math.round(cy * m.height - ch / 2), 0), m.height - ch);
  await sharp(src).extract({ left, top, width: cw, height: ch }).resize(W * UP, H * UP, { kernel: 'lanczos3' }).png().toFile(`${PIEZAS}/gancho-foto.png`);
}

// ───────────── 3. Un mp4 por plano (cámara) y la base limpia ─────────────
const zoompan = (p) => {
  const N = Math.max(1, p.frames - 1);
  const P = `clip(on/${N},0,1)`, E = `(${P}*${P}*(3-2*${P}))`;
  const z = `${p.z[0]}+${n(p.z[1] - p.z[0])}*${E}`;
  // centro de la ventana en la fuente: el punto f queda centrado si se puede (sin salirse)
  const x = `clip(iw*${p.f[0]}-iw/zoom/2,0,iw-iw/zoom)`;
  const y = `clip(ih*${p.f[1]}-ih/zoom/2,0,ih-ih/zoom)`;
  return `zoompan=z='${z}':x='${x}':y='${y}':d=1:s=${W}x${H}:fps=${FPS}`;
};
const lista = [];
for (const p of PLANOS) {
  const out = `${PIEZAS}/plano-${p.i}.mp4`;
  let entrada, vf;
  if (p.src === 'B') {
    entrada = ['-loop', '1', '-framerate', String(FPS), '-t', String(n(p.frames / FPS + 0.2)), '-i', `${PIEZAS}/gancho-foto.png`];
    vf = `fps=${FPS},trim=end_frame=${p.frames},setpts=PTS-STARTPTS,format=yuv444p,${zoompan(p)}`;
  } else {
    entrada = ['-i', CFG.fuentes[p.src]];
    const lento = p.vel !== 1 ? `setpts=(PTS-STARTPTS)/${p.vel},framerate=fps=${FPS}:interp_start=0:interp_end=255:scene=100,` : `setpts=PTS-STARTPTS,fps=${FPS},`;
    vf = `trim=start=${p.de}:end=${n(p.a + 0.1)},${lento}trim=end_frame=${p.frames},setpts=PTS-STARTPTS,` +
      `scale=${W * UP}:${H * UP}:flags=lanczos,format=yuv444p,${zoompan(p)}`;
  }
  ff([...entrada, '-vf', `${vf},format=yuv420p,setsar=1`, '-frames:v', String(p.frames), '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-r', String(FPS), out], `plano ${p.i}`);
  lista.push(`file '${path.basename(out)}'`);
  console.log(`plano ${p.i}: ${p.out.toFixed(2)}–${p.fin.toFixed(2)} (${p.frames} f) ${p.que}`);
}
fs.writeFileSync(`${PIEZAS}/planos.txt`, lista.join('\n') + '\n');
ff(['-f', 'concat', '-safe', '0', '-i', `${PIEZAS}/planos.txt`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', `${PIEZAS}/base-limpia.mp4`], 'base limpia');

// ───────────── 4. PNG de textos (resvg) ─────────────
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const opts = { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Figtree' } };
const ancho = (txt, size, fam = 'Figtree', ls = 0) =>
  new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="${size * 2}"><text x="0" y="${size * 1.5}" font-family="${fam}" font-size="${size}" letter-spacing="${ls}">${esc(txt)}</text></svg>`, opts).getBBox()?.width ?? 0;
const caja = (texto, { size, lh, padX, padY, fondo, fam = 'Figtree', ls = 0, trazo = 1.8 }) => {
  const lns = texto.split('|');
  const bw = Math.ceil(Math.max(...lns.map((l) => ancho(l, size, fam, ls)))) + 2 * padX;
  const bh = lns.length * lh + 2 * padY;
  if (bw > W - 140) throw new Error(`caja demasiado ancha: ${texto}`);
  const txt = lns.map((l, k) => `<text x="${W / 2}" y="${(padY + lh * k + lh / 2 + size * 0.35).toFixed(1)}" text-anchor="middle" font-family="${fam}" font-size="${size}" letter-spacing="${ls}" fill="${CREMA}" stroke="${CREMA}" stroke-width="${trazo}">${esc(l)}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${bh}"><rect x="${(W - bw) / 2}" y="0" width="${bw}" height="${bh}" rx="${Math.min(28, bh / 2)}" fill="${fondo}"/>${txt}</svg>`;
  return { png: new Resvg(svg, opts).render().asPng(), h: bh };
};
const subtitulo = (texto, grande) => {
  const size = grande ? 92 : 76, lh = grande ? 108 : 92, pad = 18;
  if (ancho(texto, size) > W - 160) throw new Error(`subtítulo demasiado largo: ${texto}`);
  const h = lh + 2 * pad;
  const capa = (fill, sw) => `<text x="${W / 2}" y="${(pad + lh / 2 + size * 0.35).toFixed(1)}" text-anchor="middle" font-family="Figtree" font-size="${size}" fill="${fill}" stroke="${fill}" stroke-width="${sw}" stroke-linejoin="round">${esc(texto)}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}">${capa(MARRON, 14)}${capa(CREMA, 2)}</svg>`;
  return { png: new Resvg(svg, opts).render().asPng(), h };
};
const PROMO = /casa viva|escr[ií]benos|whatsapp|compra|precio|\$|cup|usd|pedid/i;
const capas = [];
const pon = (id, buf, h, centroY, de, a, pista, texto, x = 0) => {
  const file = `${id}.png`;
  fs.writeFileSync(`${PIEZAS}/${file}`, buf);
  capas.push({ id, file, x, y: Math.round(centroY - h / 2), h, de: n(de), a: n(a), pista, texto });
};
const g = caja(CFG.gancho, { size: 80, lh: 96, padX: 46, padY: 30, fondo: PETROLEO });
pon('gancho', g.png, g.h, CFG.ganchoY, 0, PLANOS[1].out, 1, `[gancho] ${CFG.gancho}`);
if (CFG.etiqueta) {
  const e = caja(CFG.etiqueta.texto, { size: 40, lh: 52, padX: 30, padY: 14, fondo: PETROLEO, fam: 'Cinzel', ls: 6, trazo: 1.1 });
  pon('etiqueta', e.png, e.h, CFG.etiqueta.y, CFG.etiqueta.de, CFG.etiqueta.a, 2, `[etiqueta] ${CFG.etiqueta.texto}`);
}
// Reel del topper (15-oct): el CTA en caja ámbar los últimos segundos, como la frase clave.
if (CFG.cta) {
  const c = caja(CFG.cta.texto, { size: 64, lh: 78, padX: 40, padY: 22, fondo: AMBAR });
  pon('cta', c.png, c.h, CFG.cta.y, aSalida(CFG.cta.src, CFG.cta.de), DUR, 2, `[cta] ${CFG.cta.texto}`);
}
const fr = caja(CFG.frase.texto, { size: 64, lh: 78, padX: 40, padY: 22, fondo: AMBAR });
pon('frase', fr.png, fr.h, CFG.frase.y, CFG.frase.de, CFG.frase.a, 2, `[frase clave] ${CFG.frase.texto}`);
CFG.subs.forEach((s, i) => {
  if (PROMO.test(s.texto)) throw new Error(`frase promocional: ${s.texto}`);
  const r = subtitulo(s.texto, s.grande);
  let de = aSalida(s.src, s.de), a = aSalida(s.src, Math.min(s.a, PLANOS.find((q) => q.src === s.src && s.de >= q.de && s.de <= q.a).a));
  pon(`sub-${String(i + 1).padStart(2, '0')}`, r.png, r.h, s.y, de, a, 3, s.texto);
});
// Logo oficial (horizontal crema) en pastilla petróleo, los últimos segundos (sin tarjeta final: bucle).
const logo = await sharp(Buffer.from(fs.readFileSync('../redes/logo-horizontal-crema.svg'))).resize({ width: 300 }).png().toBuffer();
const lm = await sharp(logo).metadata();
const PW = lm.width + 80, PH = lm.height + 44;
const pastilla = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}"><rect width="${PW}" height="${PH}" rx="${PH / 2}" fill="${PETROLEO}"/></svg>`))
  .composite([{ input: logo, left: 40, top: 22 }]).png().toBuffer();
fs.writeFileSync(`${PIEZAS}/logo.png`, pastilla);
capas.push({ id: 'logo', file: 'logo.png', x: Math.round((W - PW) / 2), y: CFG.logoY, h: PH, de: n(DUR - CFG.logoDur), a: DUR, pista: 4, texto: '[logo]' });
for (const c of capas) {
  console.log(`${c.de.toFixed(2).padStart(6)}–${c.a.toFixed(2).padStart(6)}  y=${c.y}–${c.y + c.h}  ${c.texto}`);
  if (c.y < 270 || c.y + c.h > 1545) console.warn(`  ¡ojo! fuera de la zona segura: ${c.texto}`);
}

// ───────────── 5. Proyecto HyperFrames ─────────────
const HF = 'hf';
fs.mkdirSync(`${HF}/assets`, { recursive: true });
fs.copyFileSync(`${PIEZAS}/base-limpia.mp4`, `${HF}/assets/base.mp4`);
for (const c of capas) fs.copyFileSync(`${PIEZAS}/${c.file}`, `${HF}/assets/${c.file}`);
// Punch-in rápidos: en el gancho (sobre la cara de Prosko) y en «aquí todo tranquilo» (cara de Cúrru).
// Reel del topper: sin punch-in de HyperFrames (el ritmo lo dan los cortes y los acercamientos de cada plano).
const PUNCH = [];
const DESTELLOS = CORTES.map((c) => [n(c), c === PLANOS[5].out ? 0.32 : 0.2]);
const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>Reel cama plegable v2</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      /* Reel «Súper Prosko» (14-oct). Lo escribe montaje.mjs: no editar a mano. Encima de la base limpia (cámara
         de ffmpeg) van los punch-in, un destello crema suave en los cortes y los PNG de textos y logo. */
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: #0d3b45; }
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; background: #0d3b45; }
      #cam { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; will-change: transform; }
      #base { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; object-fit: cover; }
      #destello { position: absolute; inset: 0; background: #f6f1e6; opacity: 0; pointer-events: none; }
      .capa { position: absolute; display: block; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="1080" data-height="1920">
      <!-- el tiempo va en el video, no en el envoltorio #cam -->
      <div id="cam">
        <video id="base" class="clip" src="assets/base.mp4" muted playsinline data-start="0" data-duration="${DUR}" data-track-index="0"></video>
      </div>
      <div id="destello"></div>
${capas.map((c) => `      <img id="${c.id}" class="clip capa" src="assets/${c.file}" style="top:${c.y}px; left:${c.x}px" data-start="${c.de}" data-duration="${n(c.a - c.de)}" data-track-index="${c.pista}" />`).join('\n')}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      tl.set("#cam", { scale: 1, transformOrigin: "540px 960px" }, 0);
${PUNCH.map((p) => `      tl.set("#cam", { transformOrigin: "${p.o}" }, ${n(p.t - 0.01)});
      tl.to("#cam", { scale: ${p.s}, duration: 0.13, ease: "power3.out" }, ${n(p.t)});
      tl.to("#cam", { scale: 1, duration: 0.04, ease: "none" }, ${n(p.vuelta)});`).join('\n')}
      for (const [t, pico] of ${JSON.stringify(DESTELLOS)}) {
        tl.set("#destello", { opacity: pico }, t);
        tl.to("#destello", { opacity: 0, duration: 0.2, ease: "power1.out" }, t + 0.001);
      }
      tl.set("#destello", { opacity: 0 }, ${n(DUR - 0.01)});
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync(`${HF}/index.html`, html);
if (!fs.existsSync(`${HF}/hyperframes.json`)) fs.copyFileSync('../reel-funda/hf/hyperframes.json', `${HF}/hyperframes.json`);
fs.writeFileSync(`${HF}/package.json`, JSON.stringify({ name: 'reel-cama-plegable-v2', private: true, type: 'module', scripts: { check: 'npx --yes hyperframes@0.8.154 check', render: 'npx --yes hyperframes@0.8.154 render' } }, null, 2));

// ───────────── 6. Tiempos para la mezcla ─────────────
fs.writeFileSync('tiempos.json', JSON.stringify({ DUR, FPS, planos: PLANOS, cortes: CORTES, punch: PUNCH.map((p) => p.t), capas }, null, 1));
console.log(`listo: ${PIEZAS}/base-limpia.mp4, hf/index.html, tiempos.json (${DUR} s)`);
