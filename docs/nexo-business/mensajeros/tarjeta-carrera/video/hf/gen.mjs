// Genera index.html del tutorial «Tu tarjeta de carrera» (mensajeros, 23-oct-2026).
// Texto grande, sin voz, capturas reales de la tarjeta (pedido de PRUEBA #5425 con datos de ejemplo).
// Uso: node gen.mjs  → escribe index.html. Rectángulos medidos en la captura (750 px de ancho, 2x).
import fs from 'node:fs';

const SW = 964; // ancho de la pantalla del teléfono
const K = SW / 750; // captura 750 px → pantalla del teléfono
const DUR = 73.5;
const C = { crema: '#f6f1e6', marron: '#2b2420', petroleo: '#0d3b45', ambar: '#a35a1f' };

// Rectángulos de la tarjeta (x, y, ancho, alto) en px de la captura, por estado.
const R = {
  cliente: [58, 340, 634, 128], call: [58, 654, 309, 144], map: [383, 654, 309, 144],
  recoger: [44, 925, 662, 316], cobra: [58, 1362, 634, 132], bring: [58, 1807, 634, 318],
  pick: [28, 2179, 694, 158], ok: [28, 2357, 694, 158], warn: [28, 2536, 694, 158], no: [28, 2714, 694, 158],
  go: [58, 2616, 634, 116], opts: [58, 2722, 634, 560], warnb: [58, 3534, 634, 116], nob: [58, 3024, 634, 116],
};

// ---------- tiempos ----------
const T = {
  s0: [0, 3.4],
  s1: [3.4, 16.4], // 7 pasos (PDUR)
  s2: [19.8, 34.8],
  s3: [54.6, 8.0],
  s4: [62.6, 6.4],
  s5: [69.0, 4.5],
};

// ---------- 1 · el sistema en 7 pasos ----------
const ICON = {
  web: `<svg viewBox="0 0 120 120"><rect x="14" y="22" width="92" height="66" rx="8"/><path d="M14 38h92M44 100h32M60 88v12"/><path d="M40 56h12l5 14h16l6-12H55" /></svg>`,
  grupo: `<svg viewBox="0 0 120 120"><circle cx="40" cy="44" r="13"/><circle cx="80" cy="44" r="13"/><path d="M16 92c2-16 12-24 24-24s22 8 24 24M56 92c2-16 12-24 24-24s22 8 24 24"/></svg>`,
  yo: `<svg viewBox="0 0 120 120"><path d="M18 26h84a8 8 0 0 1 8 8v40a8 8 0 0 1-8 8H52l-22 18V82H18a8 8 0 0 1-8-8V34a8 8 0 0 1 8-8z"/><text x="60" y="66" text-anchor="middle" font-family="Figtree" font-weight="800" font-size="34" fill="#0d3b45" stroke="none">Yo</text></svg>`,
  tarjeta: `<svg viewBox="0 0 120 120"><rect x="30" y="14" width="60" height="92" rx="9"/><path d="M42 34h36M42 48h36M42 62h24"/><rect x="42" y="74" width="36" height="18" rx="5" fill="#a35a1f" stroke="none"/></svg>`,
  tienda: `<svg viewBox="0 0 120 120"><path d="M16 46l8-26h72l8 26"/><path d="M16 46c0 8 7 13 15 13s15-5 15-13c0 8 7 13 14 13s14-5 14-13c0 8 7 13 15 13s15-5 15-13"/><path d="M24 59v41h72V59"/><rect x="50" y="74" width="20" height="26"/></svg>`,
  casa: `<svg viewBox="0 0 120 120"><path d="M16 58L60 20l44 38"/><path d="M28 50v50h64V50"/><path d="M44 74l11 11 22-22" stroke="#a35a1f"/></svg>`,
  dinero: `<svg viewBox="0 0 120 120"><rect x="12" y="34" width="96" height="54" rx="8"/><circle cx="60" cy="61" r="13"/><path d="M26 48v26M94 48v26"/></svg>`,
};
const PASOS = [
  { i: 'web', t: 'Entra un pedido en la web', s: '' },
  { i: 'grupo', t: 'Sale al grupo <b>Mensajerías</b>', s: '' },
  { i: 'yo', t: 'Escribes «<b>Yo</b>»', s: 'y la carrera es tuya' },
  { i: 'tarjeta', t: 'Te llega el vale con tu <b>TARJETA</b> 🃏', s: '' },
  { i: 'tienda', t: 'Recoges en la tienda', s: 'Conill A esq. 45 #864 · de 10 a 4' },
  { i: 'casa', t: 'Entregas al cliente', s: 'y lo marcas en la tarjeta' },
  { i: 'dinero', t: 'Llevas el dinero a la tienda', s: 'antes de las 4' },
];
const P0 = T.s1[0];
const PDUR = [2.2, 2.0, 2.2, 2.4, 3.0, 2.2, 2.4]; // 16,4 s
const PT = PDUR.map((_, i) => P0 + PDUR.slice(0, i).reduce((a, b) => a + b, 0));
const SH = 1.0; // todo lo de después del sistema se corre 1 s

// ---------- 2 · la tarjeta por dentro ----------
// cada golpe: inicio, duración, captura, desplazamiento (px de captura), titular, marcas
const G = [
  { t: 19.8, d: 2.6, img: 'base', pan: 0, h: 'Tu <b>TARJETA</b> por dentro', marcas: [] },
  { t: 22.4, d: 3.0, img: 'base', pan: 0, n: 1, h: 'Cliente y dirección', marcas: ['cliente'] },
  { t: 25.4, d: 3.2, img: 'base', pan: 0, n: 2, h: '<b>Llamar</b> o abrir el mapa', marcas: ['call', 'map'], tap: 'call' },
  { t: 28.6, d: 3.0, img: 'base', pan: 880, n: 3, h: 'Qué recoger y dónde', marcas: ['recoger'] },
  { t: 31.6, d: 2.6, img: 'base', pan: 1262, n: 4, h: 'Cobras <b>30 USD</b>', marcas: ['cobra'] },
  { t: 34.2, d: 3.4, img: 'base', pan: 1262, n: 5, h: 'Traes <b>40 USD</b> a la tienda', s: '30 de productos + 10 del vuelto', marcas: ['bring'] },
  { t: 37.6, d: 1.9, img: 'base', pan: 2120, k: 'LOS 4 BOTONES', h: '<b>Recogí</b> · ya tengo el paquete', marcas: ['pick'], tap: 'pick' },
  { t: 39.5, d: 1.9, img: 'base', pan: 2120, k: 'LOS 4 BOTONES', h: '<b>Entregado</b> · ya lo entregué', marcas: ['ok'] },
  { t: 41.4, d: 1.9, img: 'base', pan: 2120, k: 'LOS 4 BOTONES', h: '<b>Problema</b> · algo salió mal', marcas: ['warn'] },
  { t: 43.3, d: 1.9, img: 'base', pan: 2120, k: 'LOS 4 BOTONES', h: '<b>Ya no puedo</b> · la suelto', marcas: ['no'] },
  { t: 45.2, d: 3.2, img: 'entregado', pan: 2150, k: 'ENTREGADO', h: 'Toca «<b>Sí, entregado</b>»', marcas: ['go'], tap: 'go' },
  { t: 48.4, d: 3.4, img: 'problema', pan: 2600, k: 'PROBLEMA', h: 'Elige qué pasó y <b>avisa</b>', marcas: ['opts', 'warnb'], tap: 'warnb' },
  { t: 51.8, d: 2.8, img: 'nopuedo', pan: 2150, h: '<b>Ya no puedo</b> · la sueltas', s: 'antes de recoger · vuelve al grupo', marcas: ['nob'] },
];

const px = (v) => Math.round(v * K);
const marcaHtml = (gi, name) => {
  const [x, y, w, h] = R[name];
  const p = 10;
  return `<div class="marca" id="g${gi}-${name}" style="left:${px(x) - p}px;top:${px(y) - p}px;width:${px(w) + 2 * p}px;height:${px(h) + 2 * p}px"></div>`;
};
const tapHtml = (gi, name) => {
  const [x, y, w, h] = R[name];
  return `<div class="tap" id="g${gi}-tap" style="left:${px(x + w * 0.88) - 45}px;top:${px(y + h / 2) - 45}px"></div>`;
};

let html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>Tutorial mensajeros · Tu tarjeta de carrera</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      /* Casa Viva · tutorial para mensajeros «Tu tarjeta de carrera» (23-oct-2026). Generado por gen.mjs: edita gen.mjs.
         Sin voz, texto grande, capturas reales de la tarjeta (pedido de PRUEBA, datos de ejemplo). Manual de marca. */
      @font-face { font-family: "Figtree"; src: url("assets/fuentes/figtree.ttf") format("truetype"); font-weight: 300 900; }
      @font-face { font-family: "Cinzel"; src: url("assets/fuentes/cinzel.ttf") format("truetype"); font-weight: 400 900; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: ${C.petroleo}; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: ${C.petroleo}; font-family: "Figtree", sans-serif; color: ${C.crema}; }
      .escena { position: absolute; inset: 0; background: ${C.petroleo}; overflow: hidden; }
      .centro { position: absolute; left: 70px; width: 940px; text-align: center; }
      .cinzel { font-family: "Cinzel"; font-weight: 600; letter-spacing: 6px; }
      b { font-weight: 800; }
      .pill { display: inline-block; background: ${C.ambar}; color: ${C.crema}; border-radius: 18px; padding: 0 20px; }
      #agua { position: absolute; inset: 0; z-index: 50; pointer-events: none; }
      #marca-agua { position: absolute; right: 56px; top: 60px; width: 74px; height: auto; opacity: 0.7; }

      /* teléfono */
      .tel { position: absolute; left: 40px; width: 1000px; border-radius: 64px; background: ${C.marron}; padding: 18px; box-shadow: 0 30px 80px rgba(0,0,0,0.35); }
      .pant { position: relative; width: ${SW}px; height: 100%; border-radius: 46px; overflow: hidden; background: #f4efe3; }
      .lienzo { position: absolute; left: 0; top: 0; width: ${SW}px; height: ${px(5200)}px; }
      .cap { position: absolute; left: 0; top: 0; width: ${SW}px; height: auto; }
      .marca { position: absolute; border: 9px solid ${C.ambar}; border-radius: 30px; opacity: 0; }
      .tap { position: absolute; width: 90px; height: 90px; border-radius: 50%; background: rgba(246,241,230,0.55); border: 6px solid ${C.crema}; opacity: 0; }

      /* 0 · gancho */
      #s0-logo { position: absolute; left: 290px; top: 200px; width: 500px; height: auto; }
      .gancho { position: absolute; left: 80px; width: 920px; top: 400px; padding: 36px 40px; border-radius: 30px; text-align: center; font-weight: 800; font-size: 96px; line-height: 1.06; background: ${C.crema}; color: ${C.marron}; }
      #s0-b { opacity: 0; }
      #s0-tel { top: 900px; height: 1200px; }

      /* 1 · el sistema */
      #s1-tit { top: 200px; font-size: 64px; }
      #s1-puntos { position: absolute; top: 320px; left: 230px; width: 620px; display: flex; justify-content: space-between; align-items: center; }
      .punto { width: 54px; height: 54px; border-radius: 50%; border: 5px solid ${C.crema}; color: ${C.crema}; font-weight: 800; font-size: 28px; display: flex; align-items: center; justify-content: center; }
      .paso { position: absolute; inset: 0; opacity: 0; }
      .icono { position: absolute; left: 375px; top: 640px; width: 330px; height: 330px; border-radius: 50%; background: ${C.crema}; display: flex; align-items: center; justify-content: center; }
      .icono svg { width: 210px; height: 210px; fill: none; stroke: ${C.petroleo}; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }
      .num-paso { position: absolute; left: 640px; top: 640px; width: 96px; height: 96px; border-radius: 50%; background: ${C.ambar}; color: ${C.crema}; font-weight: 800; font-size: 54px; display: flex; align-items: center; justify-content: center; }
      .paso-t { top: 1050px; font-weight: 700; font-size: 92px; line-height: 1.1; }
      .paso-s { top: 1290px; font-weight: 500; font-size: 54px; line-height: 1.2; opacity: 0.92; }

      /* 2 · la tarjeta */
      #s2-tel { top: 470px; height: 1400px; }
      .golpe-k { top: 168px; font-size: 44px; opacity: 0; }
      .golpe-h { top: 236px; font-weight: 700; font-size: 80px; line-height: 1.08; opacity: 0; }
      .golpe-h.con-s { top: 178px; font-size: 72px; }
      .golpe-sub { position: absolute; left: 70px; width: 940px; top: 360px; text-align: center; font-weight: 600; font-size: 50px; opacity: 0; }
      .golpe-n { display: inline-block; width: 92px; height: 92px; line-height: 92px; border-radius: 50%; background: ${C.ambar}; color: ${C.crema}; font-weight: 800; font-size: 56px; margin-right: 18px; vertical-align: 8px; }
      .estado { opacity: 0; }

      /* 3 · sin conexión */
      #s3-tit { top: 230px; font-weight: 800; font-size: 100px; }
      #s3-sub { top: 370px; font-weight: 500; font-size: 56px; opacity: 0; }
      .burbuja { position: absolute; right: 110px; padding: 26px 40px; border-radius: 34px 34px 8px 34px; background: #d9f2c9; color: ${C.marron}; font-weight: 700; font-size: 68px; white-space: nowrap; opacity: 0; }
      #s3-b1 { top: 490px; } #s3-b2 { top: 650px; } #s3-b3 { top: 810px; } #s3-b4 { top: 970px; }
      #s3-igual { top: 1160px; font-weight: 800; font-size: 64px; opacity: 0; }
      #s3-recogi { position: absolute; left: 90px; width: 900px; top: 1290px; padding: 30px 40px; border-radius: 30px; background: ${C.crema}; color: ${C.marron}; font-weight: 600; font-size: 52px; line-height: 1.2; text-align: center; opacity: 0; }

      /* 4 · reglas */
      #s4-tit { top: 330px; font-size: 76px; }
      .regla { position: absolute; left: 80px; width: 920px; padding: 34px 40px 34px 150px; border-radius: 30px; background: ${C.crema}; color: ${C.marron}; font-weight: 700; font-size: 62px; line-height: 1.12; opacity: 0; }
      .regla small { display: block; font-weight: 500; font-size: 40px; margin-top: 10px; }
      .regla i { position: absolute; left: 36px; top: 34px; width: 84px; height: 84px; border-radius: 50%; background: ${C.ambar}; color: ${C.crema}; font-style: normal; font-weight: 800; font-size: 50px; display: flex; align-items: center; justify-content: center; }
      #s4-r1 { top: 500px; } #s4-r2 { top: 840px; } #s4-r3 { top: 1040px; }

      /* 5 · cierre */
      #s5-logo { position: absolute; left: 265px; top: 380px; width: 550px; height: auto; }
      #s5-preg { top: 900px; font-weight: 800; font-size: 104px; }
      #s5-bot { position: absolute; left: 140px; width: 800px; top: 1060px; padding: 26px 0; border-radius: 28px; background: ${C.ambar}; text-align: center; font-weight: 800; font-size: 76px; color: ${C.crema}; }
      #s5-asi { top: 1250px; font-size: 52px; opacity: 0.9; }
      #fundido { position: absolute; inset: 0; background: ${C.petroleo}; opacity: 0; pointer-events: none; z-index: 60; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="1080" data-height="1920">
`;

// 0 · gancho
html += `
      <!-- 0 · Gancho (0–3,4 s) -->
      <div id="s0" class="clip escena" data-start="${T.s0[0]}" data-duration="${T.s0[1]}" data-track-index="1">
        <img id="s0-logo" src="assets/logo/casa-viva-horizontal-crema.svg" alt="Casa Viva" />
        <div id="s0-a" class="gancho">Ahora todo en <span class="pill">1</span> pantalla</div>
        <div id="s0-b" class="gancho">Menos mensajes,<br>más carreras</div>
        <div id="s0-tel" class="tel" data-layout-allow-overflow><div class="pant"><img class="cap" src="assets/capturas/base.jpg" alt="" /></div></div>
      </div>
`;

// 1 · sistema
html += `
      <!-- 1 · El sistema en 7 pasos (3,4–18,8 s) -->
      <div id="s1" class="clip escena" data-start="${T.s1[0]}" data-duration="${T.s1[1]}" data-track-index="1">
        <div id="s1-tit" class="centro cinzel">ASÍ FUNCIONA</div>
        <div id="s1-puntos">${PASOS.map((_, i) => `<div class="punto" id="s1-p${i + 1}">${i + 1}</div>`).join('')}</div>
${PASOS.map((p, i) => `        <div class="paso" id="s1-paso${i + 1}">
          <div class="icono" id="s1-ic${i + 1}">${ICON[p.i]}</div>
          <div class="num-paso">${i + 1}</div>
          <div class="centro paso-t">${p.t}</div>
          ${p.s ? `<div class="centro paso-s">${p.s}</div>` : ''}
        </div>`).join('\n')}
      </div>
`;

// 2 · tarjeta
const imgs = ['base', 'entregado', 'problema', 'nopuedo'];
html += `
      <!-- 2 · La tarjeta por dentro (18,8–53,6 s): capturas reales del pedido de PRUEBA #5425 -->
      <div id="s2" class="clip escena" data-start="${T.s2[0]}" data-duration="${T.s2[1]}" data-track-index="1">
${G.map((g, i) => `        ${g.k ? `<div class="centro cinzel golpe-k" id="g${i}-k">${g.k}</div>` : ''}<div class="centro golpe-h${g.s ? ' con-s' : ''}" id="g${i}-h">${g.n ? `<span class="golpe-n">${g.n}</span>` : ''}${g.h}</div>${g.s ? `<div class="golpe-sub" id="g${i}-s">${g.s}</div>` : ''}`).join('\n')}
        <div id="s2-tel" class="tel"><div class="pant" data-layout-allow-overflow>
          <div class="lienzo" id="s2-lienzo">
${imgs.map((s) => `            <img class="cap estado" id="cap-${s}" src="assets/capturas/${s}.jpg" alt="" />`).join('\n')}
${G.map((g, i) => g.marcas.map((m) => '            ' + marcaHtml(i, m)).join('\n') + (g.tap ? '\n            ' + tapHtml(i, g.tap) : '')).filter((s) => s.trim()).join('\n')}
          </div>
        </div></div>
      </div>
`;

// 3 · sin conexión
html += `
      <!-- 3 · ¿Sin conexión? (53,6–61,6 s): lo que el bot entiende hoy (dispatch-rules.js) -->
      <div id="s3" class="clip escena" data-start="${T.s3[0]}" data-duration="${T.s3[1]}" data-track-index="1">
        <div id="s3-tit" class="centro">¿Sin conexión?</div>
        <div id="s3-sub" class="centro">Escríbele al bot por WhatsApp:</div>
        <div class="burbuja" id="s3-b1">Recogí 5425</div>
        <div class="burbuja" id="s3-b2">Entregado 5425</div>
        <div class="burbuja" id="s3-b3">Problema 5425 no estaba</div>
        <div class="burbuja" id="s3-b4">No puedo 5425</div>
        <div id="s3-igual" class="centro">Hace lo mismo que los botones</div>
        <div id="s3-recogi" data-hold><b>Recogí:</b> también lo puede marcar<br>la tienda al darte el paquete</div>
      </div>
`;

// 4 · reglas
html += `
      <!-- 4 · Reglas (61,6–68 s) -->
      <div id="s4" class="clip escena" data-start="${T.s4[0]}" data-duration="${T.s4[1]}" data-track-index="1">
        <div id="s4-tit" class="centro cinzel">3 REGLAS</div>
        <div class="regla" id="s4-r1"><i>1</i>El dinero, a la tienda antes de las 4<small>si entregas después de las 4: al otro día, antes de las 4</small></div>
        <div class="regla" id="s4-r2"><i>2</i>La mensajería es tuya</div>
        <div class="regla" id="s4-r3"><i>3</i>¿Algo salió mal? Toca <span class="pill">Problema</span><small>no lo marques entregado</small></div>
      </div>
`;

// 5 · cierre
html += `
      <!-- 5 · Cierre (68–72,5 s) -->
      <div id="s5" class="clip escena" data-start="${T.s5[0]}" data-duration="${T.s5[1]}" data-track-index="1">
        <img id="s5-logo" src="assets/logo/casa-viva-vertical-crema.svg" alt="Casa Viva" />
        <div id="s5-preg" class="centro">¿Dudas?</div>
        <div id="s5-bot">Pregúntale al bot</div>
        <div id="s5-asi" class="centro cinzel">ASÍ DE FÁCIL</div>
      </div>

      <div id="agua" class="clip" data-start="3.4" data-duration="${T.s5[0] - 3.4}" data-track-index="2"><img id="marca-agua" src="assets/logo/casa-viva-isotipo-crema.svg" alt="" /></div>
      <div id="fundido"></div>
`;

// ---------- sonido ----------
const cortes = [3.4, ...PT.slice(1), ...[18.8, 27.6, 30.6, 36.6, 44.2, 47.4, 50.8, 53.6, 61.6, 68.0].map((t) => t + SH)];
const taps = [];
G.forEach((g) => { if (g.tap) taps.push(g.t + 1.0); });
const pops = [...PT.map((t) => t + 0.15), ...[54.4, 55.0, 55.6, 56.2, 62.0, 63.45, 64.9].map((t) => t + SH)];
let a = `
      <!-- Sonido: música propia sin derechos (make-music.mjs) + efectos Pixabay -->
      <audio id="musica" src="assets/audio/musica.mp3" data-start="0" data-duration="${DUR}" data-track-index="10" data-volume="0.5"
        data-automation='{"version":1,"lanes":[{"target":"volume","points":[{"t":0,"v":0.6},{"t":1.5,"v":1},{"t":${DUR - 2},"v":1},{"t":${DUR},"v":0}]}]}'></audio>
`;
cortes.forEach((t, i) => { a += `      <audio id="fx-w${i}" src="assets/sfx/whoosh-short.mp3" data-start="${(t - 0.15).toFixed(2)}" data-duration="0.57" data-track-index="11" data-volume="0.3"></audio>\n`; });
taps.forEach((t, i) => { a += `      <audio id="fx-c${i}" src="assets/sfx/click.mp3" data-start="${t.toFixed(2)}" data-duration="0.36" data-track-index="12" data-volume="0.55"></audio>\n`; });
pops.forEach((t, i) => { a += `      <audio id="fx-p${i}" src="assets/sfx/pop.mp3" data-start="${t.toFixed(2)}" data-duration="0.6" data-track-index="13" data-volume="0.3"></audio>\n`; });
a += `      <audio id="fx-brillo" src="assets/sfx/sparkle.mp3" data-start="${68.4 + SH}" data-duration="1.8" data-track-index="14" data-volume="0.3"></audio>\n`;
html += a + `    </div>\n`;

// ---------- animación ----------
const js = [];
const L = (s) => js.push('      ' + s);
L('const tl = gsap.timeline({ paused: true });');
// 0
L('tl.fromTo("#s0-tel", { y: 260 }, { y: 0, duration: 0.8, ease: "expo.out" }, 0);');
L('tl.fromTo("#s0-a", { scale: 0.94 }, { scale: 1, duration: 0.35, ease: "back.out(1.6)" }, 0);');
L('tl.to("#s0-a", { opacity: 0, duration: 0.15 }, 1.7);');
L('tl.fromTo("#s0-b", { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.25, ease: "power3.out" }, 1.72);');
// 1
L('tl.fromTo("#s1-tit", { opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.2 }, 3.4);');
PASOS.forEach((p, i) => {
  const t = PT[i], PD = PDUR[i];
  const id = `#s1-paso${i + 1}`;
  L(`tl.fromTo("${id}", { opacity: 0 }, { opacity: 1, duration: 0.18 }, ${t.toFixed(2)});`);
  L(`tl.fromTo("#s1-ic${i + 1}", { scale: 0.6 }, { scale: 1, duration: 0.45, ease: "back.out(1.7)" }, ${t.toFixed(2)});`);
  L(`tl.fromTo("${id} .paso-t", { y: 30 }, { y: 0, duration: 0.4, ease: "expo.out" }, ${(t + 0.05).toFixed(2)});`);
  L(`tl.set("#s1-p${i + 1}", { backgroundColor: "${C.ambar}", borderColor: "${C.ambar}" }, ${t.toFixed(2)});`);
  if (i < PASOS.length - 1) L(`tl.to("${id}", { opacity: 0, duration: 0.14 }, ${(t + PD - 0.14).toFixed(2)});`);
});
// 2
let curImg = null;
G.forEach((g, i) => {
  const t = g.t, end = g.t + g.d;
  if (i === 0) L(`tl.fromTo("#s2-tel", { y: 500 }, { y: 0, duration: 0.7, ease: "expo.out" }, ${t});`);
  if (g.img !== curImg) {
    if (curImg) L(`tl.set("#cap-${curImg}", { opacity: 0 }, ${t});`);
    L(`tl.set("#cap-${g.img}", { opacity: 1 }, ${t});`);
    curImg = g.img;
  }
  const prev = G[i - 1];
  if (!prev || prev.pan !== g.pan || prev.img !== g.img) {
    if (prev && prev.img === g.img) L(`tl.to("#s2-lienzo", { y: ${-px(g.pan)}, duration: 0.6, ease: "power2.inOut" }, ${t});`);
    else L(`tl.set("#s2-lienzo", { y: ${-px(g.pan)} }, ${t});`);
  }
  const mt = !prev || prev.pan === g.pan ? t + 0.15 : t + 0.55;
  // titular
  if (g.k && !(prev && prev.k === g.k)) L(`tl.fromTo("#g${i}-k", { opacity: 0 }, { opacity: 1, duration: 0.2 }, ${t});`);
  else if (g.k) L(`tl.set("#g${i}-k", { opacity: 1 }, ${t});`);
  L(`tl.fromTo("#g${i}-h", { opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.18 }, ${t.toFixed(2)});`);
  if (g.s) L(`tl.fromTo("#g${i}-s", { opacity: 0 }, { opacity: 1, duration: 0.2 }, ${(t + 0.5).toFixed(2)});`);
  const next = G[i + 1];
  const out = (end - 0.13).toFixed(2);
  L(`tl.to("#g${i}-h", { opacity: 0, duration: 0.13 }, ${out});`);
  if (g.s) L(`tl.to("#g${i}-s", { opacity: 0, duration: 0.13 }, ${out});`);
  if (g.k && !(next && next.k === g.k)) L(`tl.to("#g${i}-k", { opacity: 0, duration: 0.13 }, ${out});`);
  else if (g.k) L(`tl.set("#g${i}-k", { opacity: 0 }, ${end.toFixed(2)});`);
  g.marcas.forEach((m, j) => {
    const at = mt + j * 0.5;
    L(`tl.fromTo("#g${i}-${m}", { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 0.3, ease: "expo.out" }, ${at.toFixed(2)});`);
    L(`tl.to("#g${i}-${m}", { opacity: 0, duration: 0.12 }, ${out});`);
  });
  if (g.tap) {
    const at = t + 1.0;
    L(`tl.fromTo("#g${i}-tap", { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.18, ease: "power3.out" }, ${(at - 0.1).toFixed(2)});`);
    L(`tl.to("#g${i}-tap", { scale: 0.85, duration: 0.1, ease: "power2.in" }, ${(at + 0.1).toFixed(2)});`);
    L(`tl.to("#g${i}-tap", { opacity: 0, duration: 0.25 }, ${(at + 0.45).toFixed(2)});`);
  }
});
// 3
L('tl.fromTo("#s3-tit", { opacity: 0, scale: 1.1 }, { opacity: 1, scale: 1, duration: 0.3, ease: "expo.out" }, 54.6);');
L('tl.fromTo("#s3-sub", { opacity: 0 }, { opacity: 1, duration: 0.2 }, 55.0);');
['#s3-b1', '#s3-b2', '#s3-b3', '#s3-b4'].forEach((id, i) => L(`tl.fromTo("${id}", { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.4, ease: "expo.out" }, ${(55.4 + i * 0.6).toFixed(2)});`));
L('tl.fromTo("#s3-igual", { opacity: 0 }, { opacity: 1, duration: 0.25 }, 57.9);');
L('tl.fromTo("#s3-recogi", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: "expo.out" }, 58.5);');
// 4
L('tl.fromTo("#s4-tit", { opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.2 }, 62.6);');
['#s4-r1', '#s4-r2', '#s4-r3'].forEach((id, i) => L(`tl.fromTo("${id}", { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.45, ease: "expo.out" }, ${(63.0 + i * 1.45).toFixed(2)});`));
// 5
L('tl.fromTo("#s5-logo", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: "expo.out" }, 69.0);');
L('tl.fromTo("#s5-preg", { opacity: 0 }, { opacity: 1, duration: 0.25 }, 69.5);');
L('tl.fromTo("#s5-bot", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" }, 69.8);');
L('tl.fromTo("#s5-asi", { opacity: 0 }, { opacity: 0.9, duration: 0.3 }, 70.4);');
L(`tl.fromTo("#fundido", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.in" }, ${DUR - 0.65});`);
L('window.__timelines["main"] = tl;');

html += `    <script>\n${js.join('\n')}\n    </script>\n  </body>\n</html>\n`;
fs.writeFileSync(new URL('./index.html', import.meta.url), html);
console.log('index.html escrito', html.length, 'bytes');
