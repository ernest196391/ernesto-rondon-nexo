// Genera index.html + compositions para tutorial-nexo-busca (tutorial «NEXO Busca», gestoras).
// Adaptado del generador de tutorial-tu-precio. Capturas de NEXO Busca en el marco 780x1688 (390x844 @2x); el menú, 750x1624.
// Tiempos alineados a assets/audio/voz-segmentos.json y whisper-final.json.
// Uso: node _work/gen-scenes.mjs .   (y después volver a tallar la música con carve.mjs)
import fs from 'node:fs';
const P = process.argv[2] || '.';
const SB = 46;
const f2 = (n) => Number(n.toFixed(3));
// per-screen scale (capture width -> 620 px)
const geo = (w = 780) => { const S = 620 / w; return { X: (x) => Math.round(x * S), Y: (y) => Math.round(SB + y * S) }; };

const statusbar = (id) => `<div class="sb" id="${id}-sb"><span>10:24</span><span class="sb-icons"><span class="sb-bar" style="height:9px"></span><span class="sb-bar" style="height:13px"></span><span class="sb-bar" style="height:17px"></span><span class="sb-batt"></span></span></div>`;
const BL = (t = 'Nombre') => `<span class="blur">${t}</span>`; // placeholder text under the blur, never the real data

const FACES = `
        @font-face { font-family: "Cinzel"; src: url("assets/fonts/cinzel-600.woff2") format("woff2"); font-weight: 600; font-style: normal; }
        @font-face { font-family: "Figtree"; src: url("assets/fonts/figtree-400.woff2") format("woff2"); font-weight: 400; font-style: normal; }
        @font-face { font-family: "Figtree"; src: url("assets/fonts/figtree-500.woff2") format("woff2"); font-weight: 500; font-style: normal; }
        @font-face { font-family: "Figtree"; src: url("assets/fonts/figtree-600.woff2") format("woff2"); font-weight: 600; font-style: normal; }`;
const clicks = []; // absolute tap times -> click sfx
const notifs = []; // absolute aviso times -> notification sfx
const fadeIn = (sel, at, d = 0.25) => `tl.fromTo("${sel}", { opacity: 0 }, { opacity: 1, duration: ${d}, ease: "power1.out" }, ${f2(at)});`;
const fadeOut = (sel, at, d = 0.25) => `tl.fromTo("${sel}", { opacity: 1 }, { opacity: 0, duration: ${d}, ease: "power1.in", immediateRender: false }, ${f2(at)});`;
const sbHide = (id, a, b) => `tl.fromTo("#${id}-sb", { opacity: 1 }, { opacity: 0, duration: 0.05, ease: "none", immediateRender: ${a === 0} }, ${a});` + (b ? `
          tl.fromTo("#${id}-sb", { opacity: 0 }, { opacity: 1, duration: 0.05, ease: "none", immediateRender: false }, ${b});` : '');
const pop = (sel, at, origin = 'top left') => `tl.fromTo("${sel}", { opacity: 0, scale: 0.7, y: 24 }, { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.6)", transformOrigin: "${origin}" }, ${f2(at)});`;

function scene(cfg) {
  const { id, dur } = cfg;
  const html = [];
  const js = [];
  if (cfg.eyebrow) {
    html.push(`<div class="eyebrow" id="${id}-eb">${cfg.eyebrow[0] ? `<span class="eb-n">${cfg.eyebrow[0]}</span>` : ''}${cfg.eyebrow[1]}</div>`);
    js.push(`tl.fromTo("#${id}-eb", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }, 0.05);`);
    js.push(fadeOut(`#${id}-eb`, dur - 0.3, 0.22));
  }
  (cfg.caps || []).forEach((c, i) => {
    html.push(`<div class="cap" id="${id}-c${i}"><span class="ci">${c.html}</span></div>`);
    js.push(`tl.fromTo("#${id}-c${i}", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, ${c.at});`);
    const out = c.out ?? dur - 0.28;
    js.push(`tl.fromTo("#${id}-c${i}", { opacity: 1 }, { opacity: 0, duration: 0.22, ease: "power2.in", immediateRender: false }, ${f2(out)});`);
    js.push(`tl.fromTo("#${id}-c${i} .k", { backgroundSize: "0% 100%" }, { backgroundSize: "100% 100%", duration: 0.45, ease: "power2.out" }, ${f2(c.at + 0.35)});`);
  });
  if (cfg.screens || cfg.screenExtra) {
    const inner = [statusbar(id)];
    (cfg.screens || []).forEach((s, i) => {
      inner.push(`<img class="shot" id="${id}-s${i}" src="${s.src}" alt=""${s.oy ? ` data-layout-allow-overflow style="top:${SB + s.oy}px"` : ''} />`);
      if (s.at !== undefined) js.push(fadeIn(`#${id}-s${i}`, s.at, s.d ?? 0.25));
      else if (i > 0) js.push(fadeIn(`#${id}-s${i}`, 0));
      if (s.outAt) js.push(fadeOut(`#${id}-s${i}`, s.outAt));
      if (s.addr) { inner.push(`<div class="addr" data-layout-allow-overlap data-layout-allow-occlusion id="${id}-a${i}">${s.addr}</div>`); if (s.at !== undefined) js.push(fadeIn(`#${id}-a${i}`, s.at, s.d ?? 0.25)); else if (i > 0) js.push(fadeIn(`#${id}-a${i}`, 0)); if (s.outAt) js.push(fadeOut(`#${id}-a${i}`, s.outAt)); }
    });
    (cfg.overlays || []).forEach((o) => inner.push(o));
    (cfg.hls || []).forEach((h, i) => {
      const { X, Y } = geo(h.w);
      const [x1, y1, x2, y2] = h.r; const oy = h.oy || 0;
      const pad = 6;
      inner.push(`<div class="hl" data-layout-allow-overflow id="${id}-h${i}" style="left:${X(x1) - pad}px;top:${Y(y1) + oy - pad}px;width:${X(x2) - X(x1) + 2 * pad}px;height:${Y(y2) - Y(y1) + 2 * pad}px"></div>`);
      js.push(`tl.fromTo("#${id}-h${i}", { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, ${h.at});`);
      js.push(fadeOut(`#${id}-h${i}`, h.out ?? dur - 0.3));
    });
    (cfg.taps || []).forEach((t, i) => {
      const { X, Y } = geo(t.w);
      const x = X(t.x);
      const y = Y(t.y) + (t.oy || 0);
      inner.push(`<div class="tap" id="${id}-t${i}" style="left:${x - 46}px;top:${y - 46}px"><span class="tap-dot"></span><span class="tap-ring" id="${id}-t${i}r"></span></div>`);
      js.push(`tl.fromTo("#${id}-t${i}", { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" }, ${f2(t.at - 0.3)});`);
      js.push(`tl.fromTo("#${id}-t${i} .tap-dot", { scale: 1 }, { scale: 0.82, duration: 0.1, ease: "power2.in", yoyo: true, repeat: 1 }, ${t.at});`);
      js.push(`tl.fromTo("#${id}-t${i}r", { opacity: 0.9, scale: 1 }, { opacity: 0, scale: 2.1, duration: 0.5, ease: "power2.out" }, ${t.at});`);
      js.push(fadeOut(`#${id}-t${i}`, t.at + (t.hold ?? 0.45), 0.2));
      clicks.push(f2(cfg.start + t.at - 0.02));
    });
    if (cfg.screenExtra) inner.push(cfg.screenExtra);
    html.push(`<div class="scr" id="${id}-scr">${inner.join('\n')}</div>`);
    if (cfg.enter === 'phone') js.unshift(`tl.fromTo("#${id}-scr", { opacity: 0, y: 160 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0);`);
    else js.unshift(`tl.fromTo("#${id}-scr", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out" }, 0);`);
    if (cfg.exit === 'phone') js.push(`tl.fromTo("#${id}-scr", { opacity: 1, y: 0 }, { opacity: 0, y: 110, duration: 0.42, ease: "power2.in", immediateRender: false }, ${f2(dur - 0.42)});`);
  }
  if (cfg.extra) html.push(cfg.extra);
  if (cfg.extraJs) js.push(cfg.extraJs);
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <template>
      <style>
${FACES}
        #${id}-root { position: absolute; inset: 0; }
${cfg.css || ''}
      </style>
      <div id="${id}-root" data-composition-id="${id}" data-width="1080" data-height="1920">
${html.join('\n')}
      </div>
      <script>
        (function () {
          const tl = gsap.timeline({ paused: true });
          ${js.join('\n          ')}
          window.__timelines["${id}"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
`;
}

// WhatsApp-style chat (brand colours). msgs: {id, out?, html, at}. opts: hidden, title, sub, avatar (html)
const chatBox = (id, msgs, opts = {}) => `
        <div class="chat" data-layout-allow-occlusion data-layout-allow-overlap id="${id}-chat"${opts.hidden ? ' style="opacity:0"' : ''}>
          <div class="chat-head" data-layout-allow-occlusion data-layout-allow-overlap><div class="chat-sb">10:24</div><div class="avatar">${opts.avatar || '<img src="assets/logo/casa-viva-isotipo-crema.svg" alt="" />'}</div><div><div class="chat-title">${opts.title || 'Casa Viva'}</div><div class="chat-sub">${opts.sub || 'en línea'}</div></div></div>
          <div class="chat-body"><div class="chat-col" id="${id}-col">
            <div class="day-chip" data-layout-allow-occlusion data-layout-allow-overlap>Hoy</div>
${msgs.map((m) => `            <div class="bubble${m.out ? ' out' : ''}${m.cls ? ' ' + m.cls : ''}" data-layout-allow-occlusion data-layout-allow-overlap id="${m.id}">${m.html}<span class="time">${m.time || '10:24'}${m.out ? ' <span class="ticks">✓✓</span>' : ''}</span></div>`).join('\n')}
          </div></div>
        </div>`;
const chatJs = (msgs, start) => msgs.map((m) => {
  if (m.out) clicks.push(f2(start + m.at - 0.02));
  return pop(`#${m.id}`, m.at, m.out ? 'top right' : 'top left');
}).join('\n          ');


// ---------------- timing (absolute seconds) ----------------
const seg = JSON.parse(fs.readFileSync(`${P}/assets/audio/voz-segmentos.json`, 'utf8'));
const TOTAL = seg.total; // 67.83
// cortes a ~0,3 s antes de que empiece la voz de la escena siguiente
const cuts = [0, 2.95, 16.45, 22.0, 26.71, 32.49, 37.04, 46.13, 54.0, 61.94, TOTAL];
const ids = ['s01-gancho', 's02-lo-pidieron', 's03-solucion', 's04-donde-esta', 's05-busca', 's06-vendedores', 's07-tu-precio', 's08-por-tu-cuenta', 's09-por-casa-viva', 's10-cierre'];
const dur = (i) => f2(cuts[i + 1] - cuts[i]);
const base = (i) => ({ id: ids[i], dur: dur(i), start: cuts[i] });
const scenes = {};
const SCR = 'assets/screens';
const M = 750; // el menú se capturó en 750x1624

// S1 — gancho (0–3 s): la pregunta que se hace cada gestora
scenes[ids[0]] = scene({
  ...base(0),
  css: `
        #s01-logo { position: absolute; left: 50%; top: 230px; width: 560px; margin-left: -280px; display: block; }
        #s01-block { position: absolute; left: 70px; right: 70px; top: 520px; display: flex; flex-direction: column; align-items: center; gap: 36px; text-align: center; }
        #s01-eyebrow { display: inline-flex; padding: 14px 30px; border-radius: 999px; background: #0D3B45; color: #F6F1E6; font-weight: 600; font-size: 34px; }
        #s01-head { font-weight: 600; font-size: 92px; line-height: 1.12; letter-spacing: -0.02em; color: #2B2420; text-wrap: balance; }
        #s01-head b { font-weight: 600; color: #0D3B45; }
        #s01-rule { display: block; width: 260px; height: 10px; border-radius: 5px; background: #A35A1F; }
        #s01-title { font-family: "Cinzel", Georgia, serif; font-weight: 600; font-size: 96px; letter-spacing: 0.06em; color: #0D3B45; }`,
  extra: `
        <img id="s01-logo" src="assets/logo/casa-viva-horizontal-marron.svg" alt="Casa Viva" />
        <div id="s01-block">
          <div id="s01-eyebrow">Nuevo · Para gestoras</div>
          <h1 id="s01-head">¿Tu cliente te pide algo que <b>no tenemos</b> en Casa Viva?</h1>
          <span id="s01-rule"></span>
          <div id="s01-title">NEXO BUSCA</div>
        </div>`,
  extraJs: `
          tl.fromTo("#s01-logo", { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.0);
          tl.fromTo("#s01-eyebrow", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 0.1);
          tl.fromTo("#s01-head", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.5, ease: "power4.out" }, 0.2);
          tl.fromTo("#s01-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "expo.out" }, 1.4);
          tl.fromTo("#s01-title", { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, 1.6);
          tl.fromTo("#s01-logo", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power2.in", immediateRender: false }, 2.65);
          tl.fromTo("#s01-block", { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.28, ease: "power2.in", immediateRender: false }, 2.65);`,
});

// S2 — las gestoras nos lo pidieron (chats recreados con el texto real; nombre de pila, sin teléfonos)
const ph = (src, w, h) => `<img class="ph" src="${src}" alt="" style="width:${w}px;height:${h}px" />`;
const s2a = [
  { id: 's02-a1', at: 0.5, time: '11:37', html: `${ph(`${SCR}/chat-dayami-cortinas.jpg`, 420, 420)}Son éstas, cortinas de Baño con Recubrimiento de Teflón` },
  { id: 's02-a2', at: 3.0, time: '12:17', html: 'Si, muchos clientes me han preguntado por esas específicamente' },
];
const s2b = [
  { id: 's02-b1', at: 6.55, time: '13:44', html: `${ph(`${SCR}/chat-nadielys-ventiladores.jpg`, 420, 413)}Buenas tardes, de casualidad estos ventiladores no sabes dónde hay` },
  { id: 's02-b2', at: 9.75, time: '13:53', out: true, html: 'Tienes cliente??' },
  { id: 's02-b3', at: 10.35, time: '13:54', html: 'Si que quiere comprar 2' },
  { id: 's02-b4', at: 10.85, time: '13:55', html: 'Cliente de Calabazar' },
];
scenes[ids[1]] = scene({
  ...base(1), enter: 'phone',
  eyebrow: ['', 'Ustedes lo pidieron'],
  caps: [
    { at: 0.15, out: 6.2, html: 'Dayami: <span class="k">cortinas de teflón</span>' },
    { at: 6.4, out: 12.1, html: 'Nadielys: <span class="k">2 ventiladores</span>' },
    { at: 12.3, html: 'Las <span class="k">escuchamos</span>' },
  ],
  screenExtra: chatBox('s02a', s2a, { title: 'Dayami', sub: 'gestora', avatar: 'D' }) + chatBox('s02b', s2b, { hidden: true, title: 'Nadielys', sub: 'gestora', avatar: 'N' }) + `
          <div class="card" id="s02-card" style="top:520px"><span class="card-ic">✓</span><span class="card-t"><b>Las escuchamos.</b><br>Ahora ya lo pueden vender.</span></div>`,
  css: `
        #s02a-chat, #s02b-chat { position: absolute; left: 0; top: 0; width: 620px; height: 1388px; z-index: 10; }
        #s02-card { z-index: 12; }`,
  extraJs: `
          ${chatJs(s2a, cuts[1])}
          ${fadeIn('#s02b-chat', 6.3, 0.3)}
          ${chatJs(s2b, cuts[1])}
          tl.fromTo("#s02-card", { opacity: 0, y: 40, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.5)" }, 12.3);`,
});
notifs.push(f2(cuts[1] + 0.5), f2(cuts[1] + 6.55));

// S3 — la solución: NEXO Busca
scenes[ids[2]] = scene({
  ...base(2),
  eyebrow: ['', 'La solución'],
  caps: [
    { at: 0.15, out: 1.45, html: 'Ahora lo <span class="k">puedes vender</span>' },
    { at: 1.6, html: 'Una foto → <span class="k">quién lo vende</span>' },
  ],
  screens: [{ src: `${SCR}/nb-01.jpg`, at: 0, d: 0.3 }],
  hls: [
    { at: 0.5, out: 3.3, r: [32, 146, 749, 503] },
    { at: 3.4, r: [70, 570, 712, 757] },
  ],
});

// S4 — dónde está: menú → Herramientas → NEXO Busca
scenes[ids[3]] = scene({
  ...base(3),
  eyebrow: ['', 'Dónde está'],
  caps: [
    { at: 0.1, out: 1.95, html: 'En tu área, abre <span class="k">el menú</span>' },
    { at: 2.1, html: 'Herramientas → <span class="k">NEXO Busca</span>' },
  ],
  screens: [
    { src: `${SCR}/nb-01.jpg` },
    { src: `${SCR}/nb-menu.jpg`, at: 1.45, outAt: 3.9 },
  ],
  hls: [
    { at: 0.6, out: 1.4, r: [20, 20, 96, 96] },
    { at: 2.05, out: 2.7, w: M, r: [20, 650, 580, 690] },
    { at: 2.75, out: 3.85, w: M, r: [20, 694, 580, 773] },
  ],
  taps: [
    { at: 1.2, x: 56, y: 57, hold: 0.25 },
    { at: 3.45, x: 180, y: 734, w: M, hold: 0.3 },
  ],
});

// S5 — paso 1: sube la foto (o escribe) → Buscar quién lo vende
scenes[ids[4]] = scene({
  ...base(4),
  eyebrow: ['1', 'Busca'],
  caps: [
    { at: 0.1, out: 3.35, html: 'Sube <span class="k">la foto</span> o escribe qué buscas' },
    { at: 3.5, html: 'Toca: <span class="k">Buscar quién lo vende</span>' },
  ],
  screens: [
    { src: `${SCR}/nb-01.jpg` },
    { src: `${SCR}/nb-02.jpg`, at: 1.35, d: 0.2 },
    { src: `${SCR}/nb-03.jpg`, at: 4.75, d: 0.2 },
  ],
  hls: [
    { at: 0.35, out: 1.3, r: [70, 570, 712, 757] },
    { at: 1.5, out: 2.15, r: [70, 570, 712, 757] },
    { at: 2.3, out: 3.4, r: [70, 835, 712, 921] },
    { at: 3.55, out: 4.7, r: [70, 1130, 712, 1215] },
    { at: 4.95, r: [70, 1224, 712, 1398] },
  ],
  taps: [
    { at: 1.05, x: 390, y: 663, hold: 0.25 },
    { at: 4.45, x: 390, y: 1172, hold: 0.25 },
  ],
});

// S6 — paso 2: salen los vendedores con su precio → Usar esta (en la captura se eligió el de 10 USD)
scenes[ids[5]] = scene({
  ...base(5),
  eyebrow: ['2', 'Elige'],
  caps: [
    { at: 0.1, out: 2.3, html: 'Salen los vendedores <span class="k">con su precio</span>' },
    { at: 2.45, html: 'Elige uno: <span class="k">Usar esta</span>' },
  ],
  screens: [
    { src: `${SCR}/nb-04.jpg`, at: 0, d: 0.3 },
    { src: `${SCR}/nb-05.jpg`, at: 3.95, d: 0.25 },
  ],
  hls: [
    { at: 0.9, out: 2.4, r: [70, 530, 210, 590] },
    { at: 1.1, out: 2.4, r: [70, 972, 210, 1030] },
    { at: 1.3, out: 2.4, r: [70, 1458, 210, 1516] },
    { at: 2.55, out: 3.9, r: [70, 801, 229, 873] },
    { at: 2.7, out: 3.9, r: [70, 1288, 229, 1358] },
    { at: 4.15, r: [33, 133, 748, 416] },
  ],
});

// S7 — paso 3: define tu precio (sumar USD, sumar % o precio final) → proveedor 10, tú 12, ganas 2 (cifras de la captura 05)
scenes[ids[6]] = scene({
  ...base(6),
  eyebrow: ['3', 'Tu precio'],
  caps: [
    { at: 0.1, out: 4.6, html: 'Define <span class="k">tu precio</span>' },
    { at: 4.75, html: 'Proveedor 10 · tú 12 → <span class="k">ganas 2 USD</span>' },
  ],
  screens: [{ src: `${SCR}/nb-05.jpg` }],
  hls: [
    { at: 0.4, out: 1.35, r: [70, 470, 712, 548] },
    { at: 1.5, out: 4.5, r: [70, 758, 712, 858] },
    { at: 5.55, out: 6.6, r: [70, 650, 380, 737] },
    { at: 6.7, out: 7.5, r: [70, 972, 380, 1058] },
    { at: 7.6, r: [400, 1078, 712, 1263] },
  ],
  taps: [{ at: 3.75, x: 600, y: 808, hold: 0.3 }],
});

// S8 — por tu cuenta: pregunta al proveedor, foto bonita, mándaselo a tu cliente (sin decir dónde lo compras)
scenes[ids[7]] = scene({
  ...base(7),
  eyebrow: ['4', 'Véndelo tú'],
  caps: [
    { at: 0.1, out: 2.15, html: 'Pregunta al <span class="k">proveedor</span>' },
    { at: 2.3, out: 4.4, html: 'Hazle una <span class="k">foto bonita</span>' },
    { at: 4.55, html: 'Mándalo <span class="k">sin decir dónde</span> lo compras' },
  ],
  screens: [
    { src: `${SCR}/nb-06.jpg`, at: 0, d: 0.3 },
    { src: `${SCR}/nb-07.jpg`, at: 3.15, d: 0.2, outAt: 4.6 },
    { src: `${SCR}/nb-08.jpg`, at: 4.45, d: 0.2 },
  ],
  hls: [
    { at: 0.4, out: 2.1, r: [70, 353, 438, 437] },
    { at: 0.9, out: 2.1, r: [70, 446, 712, 572] },
    { at: 2.3, out: 3.1, r: [70, 889, 374, 973] },
    { at: 3.4, out: 4.4, r: [70, 1022, 392, 1346] },
    { at: 4.75, out: 6.4, r: [70, 373, 712, 775] },
    { at: 6.5, r: [70, 827, 272, 910] },
  ],
  taps: [
    { at: 2.85, x: 222, y: 931, hold: 0.25 },
    { at: 7.0, x: 171, y: 868, hold: 0.3 },
  ],
});

// S9 — o por Casa Viva (bajo pedido): Mandar solicitud → Casa Viva lo confirma y te avisa (la comisión la dice Casa Viva)
scenes[ids[8]] = scene({
  ...base(8), exit: 'phone',
  eyebrow: ['5', 'O por Casa Viva'],
  caps: [
    { at: 0.1, out: 3.3, html: 'O véndelo <span class="k">por Casa Viva</span>' },
    { at: 3.45, out: 5.5, html: 'Casa Viva lo <span class="k">confirma</span>' },
    { at: 5.65, html: 'Te avisa con <span class="k">tu comisión</span>' },
  ],
  screens: [
    { src: `${SCR}/nb-09.jpg`, at: 0, d: 0.3 },
    { src: `${SCR}/nb-10.jpg`, at: 3.1, d: 0.2 },
  ],
  hls: [
    { at: 0.4, out: 2.2, r: [33, 563, 748, 880] },
    { at: 2.3, out: 3.05, r: [72, 1341, 525, 1425] },
    { at: 3.4, out: 5.5, r: [72, 589, 710, 809] },
    { at: 5.6, r: [567, 1247, 712, 1293] },
  ],
  taps: [{ at: 2.8, x: 298, y: 1383, hold: 0.25 }],
});
notifs.push(f2(cuts[8] + 5.75));

// S10 — cierre: ASÍ DE FÁCIL + 20 búsquedas al día, gratis + logo vertical + ¿Dudas? Escríbeme
scenes[ids[9]] = scene({
  ...base(9),
  css: `
        #s10-title { position: absolute; left: 60px; right: 60px; top: 180px; text-align: center; font-family: "Cinzel", Georgia, serif; font-weight: 600; font-size: 84px; letter-spacing: 0.08em; color: #2B2420; }
        #s10-grid { position: absolute; left: 110px; right: 110px; top: 320px; display: flex; flex-direction: column; gap: 18px; }
        .s10-c { display: flex; align-items: center; gap: 22px; padding: 20px 28px; border-radius: 22px; background: #0D3B45; color: #F6F1E6; font-weight: 600; font-size: 40px; }
        .s10-n { display: inline-flex; width: 58px; height: 58px; flex: 0 0 auto; border-radius: 50%; align-items: center; justify-content: center; background: #F6F1E6; color: #0D3B45; font-size: 32px; }
        #s10-free { position: absolute; left: 160px; right: 160px; top: 720px; padding: 20px 30px; border-radius: 999px; background: #A35A1F; color: #F6F1E6; font-weight: 600; font-size: 48px; text-align: center; white-space: nowrap; }
        #s10-logo { position: absolute; left: 50%; top: 880px; width: 400px; margin-left: -200px; display: block; }
        #s10-q { position: absolute; left: 60px; right: 60px; top: 1200px; text-align: center; font-weight: 600; font-size: 76px; color: #0D3B45; }
        #s10-url { position: absolute; left: 60px; right: 60px; top: 1310px; text-align: center; font-weight: 500; font-size: 46px; color: #2B2420; }`,
  extra: `
        <div id="s10-title">ASÍ DE FÁCIL</div>
        <div id="s10-grid"><div class="s10-c" id="s10-c1"><span class="s10-n">1</span>Sube la foto del cliente</div><div class="s10-c" id="s10-c2"><span class="s10-n">2</span>Usar esta → pon tu precio</div><div class="s10-c" id="s10-c3"><span class="s10-n">3</span>Véndelo tú o por Casa Viva</div></div>
        <div id="s10-free">20 búsquedas al día · gratis</div>
        <img id="s10-logo" src="assets/logo/casa-viva-vertical-marron.svg" alt="Casa Viva" />
        <div id="s10-q">¿Dudas? Escríbeme.</div>
        <div id="s10-url">casaviva.company</div>`,
  extraJs: `
          tl.fromTo("#s10-title", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: "power4.out" }, 0.05);
          ${[1, 2, 3].map((n) => `tl.fromTo("#s10-c${n}", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.38, ease: "back.out(1.6)" }, ${f2(0.1 + n * 0.12)});`).join('\n          ')}
          tl.fromTo("#s10-free", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.8)" }, 0.45);
          tl.fromTo("#s10-logo", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, 1.0);
          tl.fromTo("#s10-q", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.42, ease: "back.out(1.4)" }, 1.8);
          tl.fromTo("#s10-url", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" }, 2.2);`,
});

for (const id of ids) fs.writeFileSync(`${P}/compositions/${id}.html`, scenes[id]);

// ---------------- subtítulos (whisper-final.json, palabra por palabra) ----------------
// Cada subtítulo = trozo exacto del guion (cifras como las escribe Whisper). [ ] = palabra clave (crema sobre ámbar).
const CUES = [
  [0, '¿Tu cliente te pide algo'],
  [0, 'que no tenemos en [Casa Viva]?'],
  [1, 'Hoy mismo nos lo pidieron.'],
  [1, 'Dayami: muchos clientes me piden'],
  [1, '[cortinas de baño con teflón].'],
  [1, 'Nadielys: ¿de casualidad sabes'],
  [1, 'dónde hay [estos ventiladores]?'],
  [1, 'Un cliente en Calabazar [quiere 2].'],
  [1, '[Las escuchamos].'],
  [2, 'Ahora lo [puedes vender].'],
  [2, 'Con NEXO Busca, subes una foto,'],
  [2, 'y te decimos [quién lo vende] en Cuba,'],
  [2, 'y a qué precio.'],
  [3, 'Está en tu área.'],
  [3, 'Abre el menú, y en Herramientas,'],
  [3, 'toca: [NEXO Busca].'],
  [4, 'Sube la foto que te mandó el cliente,'],
  [4, 'o escribe [qué buscas].'],
  [4, 'Y toca: [Buscar quién lo vende].'],
  [5, 'En segundos salen los vendedores,'],
  [5, 'con [su precio].'],
  [5, 'Elige uno, y toca: [Usar esta].'],
  [6, 'Ahora define [tu precio]:'],
  [6, 'sumar dólares, sumar un porcentaje,'],
  [6, 'o el [precio final].'],
  [6, 'Por ejemplo: el proveedor pide 10,'],
  [6, 'tú pides 12, y [ganas 2 dólares].'],
  [7, 'Pregúntale al proveedor por [WhatsApp]'],
  [7, 'si lo tiene.'],
  [7, 'Hazle una [foto bonita]'],
  [7, 'en tu estudio de fotos.'],
  [7, 'Y mándasela a tu cliente,'],
  [7, '[sin decir dónde] lo compras.'],
  [8, '¿Prefieres venderlo [por Casa Viva]?'],
  [8, 'Manda [la solicitud].'],
  [8, 'Casa Viva lo confirma con el proveedor,'],
  [8, 'y te avisa por WhatsApp [con tu comisión].'],
  [9, '[20 búsquedas al día], gratis.'],
  [9, '¿Dudas? [Escríbeme].'],
];
const words = JSON.parse(fs.readFileSync(`${P}/assets/audio/whisper-final.json`, 'utf8')).words;
for (let i = 0; i < words.length - 1; i++) if (/^\s*Nadie$/.test(words[i].word) && /^\s*Liz\.?$/.test(words[i + 1].word)) { words[i] = { word: 'Nadielys:', start: words[i].start, end: words[i + 1].end }; words.splice(i + 1, 1); }
words.forEach((w) => { if (/Calabasar/.test(w.word)) w.word = w.word.replace('Calabasar', 'Calabazar'); });
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
let wi = 0;
const cues = CUES.map(([sg, text], ci) => {
  const toks = text.replace(/[[\]]/g, '').split(/\s+/).filter(Boolean);
  const i0 = wi;
  toks.forEach((t) => {
    const w = words[wi];
    if (!w) { console.warn(`  ! cue ${ci}: faltan palabras en whisper`); return; }
    if (norm(t) !== norm(w.word)) console.warn(`  ! cue ${ci}: guion «${t}» ↔ whisper «${w.word}»`);
    wi++;
  });
  return { ci, sg, text, i0, i1: wi - 1 };
});
if (wi !== words.length) console.warn(`  ! palabras guion ${wi} ≠ whisper ${words.length}`);
const segs = seg.segs;
cues.forEach((c, k) => {
  const s = segs[c.sg];
  c.start = Math.max(words[c.i0].start, s.start) - 0.05;
  const next = cues[k + 1];
  c.end = next && next.sg === c.sg ? Math.max(words[next.i0].start, s.start) - 0.06 : Math.min(s.end + 0.35, next ? segs[next.sg].start - 0.1 : TOTAL);
  c.start = f2(c.start); c.end = f2(c.end);
});
const cueHtml = cues.map((c, k) => `        <div class="sub" id="sub-${k}"><span class="sub-cap">${c.text.replace(/\[([^\]]+)\]/g, '<span class="sk">$1</span>')}</span></div>`).join('\n');
const cueJs = cues.map((c, k) => `tl.fromTo("#sub-${k}", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.14, ease: "power2.out" }, ${c.start});\n          tl.fromTo("#sub-${k}", { opacity: 1 }, { opacity: 0, duration: 0.1, ease: "power1.in", immediateRender: false }, ${f2(c.end - 0.1)});`).join('\n          ');
fs.writeFileSync(`${P}/compositions/subtitulos.html`, `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <template>
      <style>
${FACES}
        #subtitulos-root { position: absolute; inset: 0; z-index: 100; }
        .sub { position: absolute; left: 70px; right: 70px; bottom: 170px; display: flex; justify-content: center; opacity: 0; }
        .sub-cap { display: inline-block; max-width: 900px; padding: 18px 34px 20px; border-radius: 30px; background: rgba(13, 59, 69, 0.88); color: #F6F1E6; font-family: "Figtree", sans-serif; font-weight: 600; font-size: 48px; line-height: 1.28; text-align: center; text-wrap: balance; box-shadow: 0 14px 34px rgba(43, 36, 32, 0.22); }
        .sk { background: #A35A1F; color: #F6F1E6; border-radius: 10px; padding: 0 10px; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
      </style>
      <div id="subtitulos-root" data-composition-id="subtitulos" data-width="1080" data-height="1920">
${cueHtml}
      </div>
      <script>
        (function () {
          const tl = gsap.timeline({ paused: true });
          ${cueJs}
          window.__timelines["subtitulos"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
`);
fs.writeFileSync(`${P}/assets/audio/subtitulos.json`, JSON.stringify(cues.map(({ text, start, end }) => ({ text: text.replace(/[[\]]/g, ''), start, end })), null, 1));

// ---------------- root index.html ----------------
const EXTRA_CSS = `
      .scr { isolation: isolate; }
      .eyebrow { position: absolute; left: 60px; top: 150px; display: inline-flex; align-items: center; gap: 16px; padding: 10px 26px 10px 10px; border-radius: 999px; background: #0D3B45; color: #F6F1E6; font-weight: 600; font-size: 32px; opacity: 0; }
      .eb-n { display: inline-flex; width: 52px; height: 52px; border-radius: 50%; align-items: center; justify-content: center; background: #F6F1E6; color: #0D3B45; font-size: 30px; }
      .cap { top: 210px; height: 200px; font-size: 64px; line-height: 1.08; letter-spacing: -0.015em; }
      .blur { filter: blur(7px); color: #2B2420; }
      .lnk { color: #0D3B45; text-decoration: underline; font-weight: 500; word-break: break-all; }
      .ticks { color: #0D3B45; font-size: 19px; }
      .chat-head { background: #0D3B45; }
      .chat-sb { position: absolute; left: 38px; top: 10px; font-weight: 600; font-size: 22px; color: #F6F1E6; }
      .avatar { background: #0D3B45; border: 3px solid rgba(246, 241, 230, 0.6); }
      .avatar img { width: 46px; height: 46px; display: block; }
      .chat-body { background-color: #ece5d6; background-image: radial-gradient(rgba(13, 59, 69, 0.07) 2px, transparent 2.5px); }
      .chat-col { display: flex; flex-direction: column; gap: 16px; }
      .bubble { font-size: 27px; color: #2B2420; }
      .bubble b { font-weight: 600; }
      .bubble.out { font-weight: 400; font-size: 30px; }
      .card { position: absolute; left: 26px; right: 26px; padding: 34px 32px; border-radius: 28px; background: #0D3B45; color: #F6F1E6; display: flex; gap: 22px; align-items: flex-start; box-shadow: 0 22px 50px rgba(43, 36, 32, 0.35); z-index: 9; opacity: 0; }
      .card-ic { flex: 0 0 auto; width: 64px; height: 64px; border-radius: 50%; background: #F6F1E6; color: #0D3B45; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 40px; }
      .card-t { font-size: 40px; line-height: 1.3; font-weight: 500; }
      .card-t b { font-weight: 600; }
      .addr { position: absolute; left: 0; right: 0; top: 46px; height: 60px; padding: 0 18px; display: flex; align-items: center; background: #ece6d8; border-bottom: 2px solid rgba(43, 36, 32, 0.08); z-index: 4; }
      .addr-pill { display: block; width: 100%; padding: 9px 20px; border-radius: 999px; background: #fffdf9; font-weight: 500; font-size: 23px; color: #2B2420; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .addr-pill b { font-weight: 600; color: #0D3B45; }
      .eyebrow:not(:has(.eb-n)) { padding-left: 26px; }
      .bubble img.ph { display: block; border-radius: 14px; margin: -6px -8px 12px; object-fit: cover; }
      .avatar { font-weight: 600; font-size: 34px; color: #F6F1E6; }
    </style>`;
const head = fs.readFileSync(`${P}/_work/head.html`, 'utf8')
  .replace(/<title>.*<\/title>/, '<title>Tutorial: NEXO Busca</title>')
  .replace('</style>', EXTRA_CSS);
const sceneDivs = ids.map((id, i) => `      <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${cuts[i]}" data-duration="${dur(i)}" data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920"></div>`).join('\n');
const whooshes = cuts.slice(1, -1).map((c, i) => `      <audio id="sfx-whoosh-${i + 1}" src="assets/sfx/whoosh-short.mp3" data-start="${f2(c - 0.25)}" data-duration="0.57" data-track-index="5" data-audio-group="sfx" data-volume="0.3"></audio>`).join('\n');
const clickTags = clicks.sort((a, b) => a - b).map((t, i) => `      <audio id="sfx-click-${i + 1}" src="assets/sfx/click-soft.mp3" data-start="${t}" data-duration="0.36" data-track-index="6" data-audio-group="sfx" data-volume="0.55"></audio>`).join('\n');
const notifTags = notifs.map((t, i) => `      <audio id="sfx-notif-${i + 1}" src="assets/sfx/notification.mp3" data-start="${t}" data-duration="1.2" data-track-index="7" data-audio-group="sfx" data-volume="0.3"></audio>`).join('\n');
const phoneStart = cuts[1];
const phoneDur = f2(cuts[9] - cuts[1]);
const lastVoice = segs[segs.length - 1].end;
const index = `${head}
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="${TOTAL}"
      data-width="1080"
      data-height="1920"
    >
      <div id="bg-layer" data-composition-id="bg-layer" data-composition-src="compositions/bg.html" data-start="0" data-duration="${TOTAL}" data-track-index="0" data-track-kind="graphics" data-width="1080" data-height="1920"></div>
      <div id="phone-shell" data-composition-id="phone-shell" data-composition-src="compositions/phone-shell.html" data-start="${phoneStart}" data-duration="${phoneDur}" data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920"></div>
${sceneDivs}
      <div id="subtitulos" data-composition-id="subtitulos" data-composition-src="compositions/subtitulos.html" data-start="0" data-duration="${TOTAL}" data-track-index="8" data-track-kind="graphics" data-width="1080" data-height="1920"></div>
      <audio id="voz" src="assets/audio/voz.wav" data-start="0" data-duration="${f2(lastVoice)}" data-track-index="3" data-audio-group="voiceover" data-volume="1"></audio>
      <audio id="music-bed" src="assets/audio/musica.wav" data-start="0" data-duration="${TOTAL}" data-track-index="4" data-audio-group="music" data-volume="0.55"></audio>
${whooshes}
${clickTags}
${notifTags}
    </div>
    <script>
      // root timeline: every scene, the background and the subtitles live in sub-compositions
      const tl = gsap.timeline({ paused: true });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync(`${P}/index.html`, index);
// phone shell + fondo: duración de este video
const shellExit = f2(phoneDur - 0.42);
fs.writeFileSync(`${P}/compositions/phone-shell.html`, fs.readFileSync(`${P}/compositions/phone-shell.html`, 'utf8').replace(/immediateRender: false \}, [\d.]+\);/, `immediateRender: false }, ${shellExit});`));
let bg = fs.readFileSync(`${P}/compositions/bg.html`, 'utf8');
// fondo: etiqueta y duraciones de este video (línea a línea)
bg = bg.replace(/Gestoras · [^<]+</, 'Gestoras · NEXO Busca<').split('\n').map((l) => {
  if (l.includes('"#bg-glow-a"')) return l.replace(/repeat: \d+/, 'repeat: 8');
  if (l.includes('"#bg-glow-b"')) return l.replace(/repeat: \d+/, 'repeat: 6');
  if (l.includes('"#bg-dots"') || l.includes('"#progress-fill"')) return l.replace(/duration: [\d.]+/, `duration: ${TOTAL}`);
  if (l.includes('"#brandbar", { opacity: 0 }')) return l.replace(/\}, [\d.]+\);$/, `}, ${f2(cuts[1] + 0.1)});`);
  if (l.includes('"#brandbar", { opacity: 1 }')) return l.replace(/\}, [\d.]+\);$/, `}, ${f2(TOTAL - 0.5)});`);
  return l;
}).join('\n');
fs.writeFileSync(`${P}/compositions/bg.html`, bg);
console.log('ok', ids.length, 'scenes; cues', cues.length, '; clicks', clicks.length, '; phone', phoneStart, phoneDur, '; shell exit', shellExit);
