// Genera index.html + compositions para tutorial-piedras (tutorial «Las piedras», programa de gestoras).
// Adaptado del generador de tutorial-estudio-fotos. Todas las capturas en el marco 750x1624 (375x812 @2x).
// Tiempos alineados a assets/audio/voz-segmentos.json y whisper-final.json.
// Uso: node _work/gen-scenes.mjs .   (y después volver a tallar la música con carve.mjs)
import fs from 'node:fs';
const P = process.argv[2] || '.';
const SB = 46;
const f2 = (n) => Number(n.toFixed(3));
// per-screen scale (capture width -> 620 px)
const geo = (w = 750) => { const S = 620 / w; return { X: (x) => Math.round(x * S), Y: (y) => Math.round(SB + y * S) }; };

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
            <div class="day-chip" data-layout-allow-occlusion data-layout-allow-overlap>${opts.day || 'Hoy'}</div>
${msgs.map((m) => `            <div class="bubble${m.out ? ' out' : ''}${m.cls ? ' ' + m.cls : ''}" data-layout-allow-occlusion data-layout-allow-overlap id="${m.id}">${m.html}<span class="time">${m.time || '10:24'}${m.out ? ' <span class="ticks">✓✓</span>' : ''}</span></div>`).join('\n')}
          </div></div>
        </div>`;
const chatJs = (msgs, start) => msgs.map((m) => {
  if (m.out) clicks.push(f2(start + m.at - 0.02));
  return pop(`#${m.id}`, m.at, m.out ? 'top right' : 'top left');
}).join('\n          ');


// ---------------- timing (absolute seconds) ----------------
const seg = JSON.parse(fs.readFileSync(`${P}/assets/audio/voz-segmentos.json`, 'utf8'));
const TOTAL = seg.total; // 63.69
// cortes a ~0,3 s antes de que empiece la voz de la escena siguiente
const cuts = [0, ...seg.segs.slice(1).map((s) => f2(s.start - 0.3)), TOTAL];
const ids = ['s01-gancho', 's02-puntos', 's03-vales', 's04-piedras', 's05-invitar', 's06-red', 's07-honesto', 's08-cierre'];
const dur = (i) => f2(cuts[i + 1] - cuts[i]);
const base = (i) => ({ id: ids[i], dur: dur(i), start: cuts[i] });
const scenes = {};
const SCR = 'assets/screens';
const listCard = (id, top, rows) => `
          <div class="card lcard" id="${id}" style="top:${top}px"><div class="lc-rows">${rows.map((r, i) => `<div class="lc-row" id="${id}-r${i}"><span class="lc-ic">${r[0]}</span><span class="lc-t">${r[1]}</span></div>`).join('')}</div></div>`;
const LCSS = `
        .lcard { padding: 26px 26px; }
        .lc-rows { display: flex; flex-direction: column; gap: 18px; width: 100%; }
        .lc-row { display: flex; align-items: center; gap: 18px; font-size: 34px; line-height: 1.25; font-weight: 500; }
        .lc-row b { font-weight: 600; }
        .lc-ic { flex: 0 0 auto; min-width: 108px; height: 64px; padding: 0 14px; border-radius: 32px; background: #A35A1F; color: #F6F1E6; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; font-size: 34px; }
        .lc-ic.soft { background: #F6F1E6; color: #0D3B45; }`;

// S1 — gancho (0–3,1 s)
scenes[ids[0]] = scene({
  ...base(0),
  css: `
        #s01-logo { position: absolute; left: 50%; top: 200px; width: 560px; margin-left: -280px; display: block; }
        #s01-block { position: absolute; left: 70px; right: 70px; top: 470px; display: flex; flex-direction: column; align-items: center; gap: 34px; text-align: center; }
        #s01-eyebrow { display: inline-flex; padding: 14px 30px; border-radius: 999px; background: #0D3B45; color: #F6F1E6; font-weight: 600; font-size: 34px; }
        #s01-head { font-weight: 600; font-size: 88px; line-height: 1.12; letter-spacing: -0.02em; color: #2B2420; text-wrap: balance; }
        #s01-head b { font-weight: 600; color: #0D3B45; }
        #s01-rule { display: block; width: 260px; height: 10px; border-radius: 5px; background: #A35A1F; }
        #s01-title { font-family: "Cinzel", Georgia, serif; font-weight: 600; font-size: 96px; line-height: 1.12; letter-spacing: 0.06em; color: #0D3B45; }
        #s01-gems { display: flex; gap: 22px; }
        .s01-gem { width: 64px; height: 64px; }`,
  extra: `
        <img id="s01-logo" src="assets/logo/casa-viva-horizontal-marron.svg" alt="Casa Viva" />
        <div id="s01-block">
          <div id="s01-eyebrow">Nuevo · Programa de gestoras</div>
          <h1 id="s01-head">Vender y traer gestoras <b>te da más</b></h1>
          <span id="s01-rule"></span>
          <div id="s01-title">LAS PIEDRAS</div>
          <div id="s01-gems">${['#b0743c', '#8a949c', '#c9a227'].map((c, i) => `<svg class="s01-gem" id="s01-gem${i}" viewBox="0 0 48 48" aria-hidden="true"><path d="M14 8h20l8 10-18 22L6 18z" fill="${c}" opacity=".28"/><path d="M14 8h20l8 10-18 22L6 18zM6 18h36M18 8l-4 10 10 22 10-22-4-10" fill="none" stroke="${c}" stroke-width="2.4" stroke-linejoin="round"/></svg>`).join('')}</div>
        </div>`,
  extraJs: `
          tl.fromTo("#s01-logo", { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.0);
          tl.fromTo("#s01-eyebrow", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 0.1);
          tl.fromTo("#s01-head", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.5, ease: "power4.out" }, 0.2);
          tl.fromTo("#s01-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "expo.out" }, 1.3);
          tl.fromTo("#s01-title", { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, 1.5);
          ${[0, 1, 2].map((i) => `tl.fromTo("#s01-gem${i}", { opacity: 0, y: 20, scale: 0.6 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(2)" }, ${f2(1.8 + i * 0.12)});`).join('\n          ')}
          tl.fromTo("#s01-logo", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power2.in", immediateRender: false }, ${f2(dur(0) - 0.3)});
          tl.fromTo("#s01-block", { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.28, ease: "power2.in", immediateRender: false }, ${f2(dur(0) - 0.3)});`,
});

// S2 — los puntos: venta entregada y cobrada; 1 punto = 1 USD limpio para la tienda
scenes[ids[1]] = scene({
  ...base(1), enter: 'phone',
  eyebrow: ['1', 'Los puntos'],
  caps: [
    { at: 0.15, out: 3.0, html: 'Venta <span class="k">entregada y cobrada</span>' },
    { at: 3.1, html: '<span class="k">1 punto = 1 USD</span> limpio' },
  ],
  screens: [{ src: `${SCR}/pi-puntos.jpg` }],
  hls: [
    { at: 0.9, out: 3.0, r: [66, 394, 682, 438] },
    { at: 3.2, r: [66, 350, 532, 396] },
  ],
});

// S3 — Mi piedra: cada vale con sus puntos
scenes[ids[2]] = scene({
  ...base(2),
  eyebrow: ['2', 'Mi piedra'],
  caps: [
    { at: 0.1, out: 1.85, html: 'Menú → <span class="k">Mi piedra</span>' },
    { at: 1.95, html: '<span class="k">Cada vale</span>, con sus puntos' },
  ],
  screens: [
    { src: `${SCR}/pi-menu.jpg`, at: 0, d: 0.25 },
    { src: `${SCR}/pi-vales.jpg`, at: 1.75, d: 0.2 },
  ],
  hls: [
    { at: 0.5, out: 1.7, r: [20, 1156, 580, 1236] },
    { at: 2.0, out: 2.95, r: [70, 559, 680, 959] },
    { at: 3.0, r: [556, 559, 690, 1064] },
  ],
  taps: [{ at: 1.35, x: 300, y: 1196, hold: 0.3 }],
});

// S4 — las piedras: puntos del equipo; Bronce, Plata, Oro… Corona
scenes[ids[3]] = scene({
  ...base(3),
  eyebrow: ['3', 'Las piedras'],
  caps: [
    { at: 0.1, out: 2.95, html: 'Los puntos de <span class="k">tu equipo</span>' },
    { at: 3.1, out: 6.75, html: 'Bronce · 65 → <span class="k">5.000 CUP</span>' },
    { at: 6.85, out: 10.1, html: 'Plata · 130 → <span class="k">10.000 CUP</span>' },
    { at: 10.2, out: 13.2, html: 'Oro · 195 → <span class="k">15.000 CUP</span>' },
    { at: 13.3, html: 'Cada mes · <span class="k">hasta Corona</span>' },
  ],
  screens: [
    { src: `${SCR}/pi-top.jpg`, at: 0, d: 0.25 },
    { src: `${SCR}/pi-puntos.jpg`, at: 2.95, d: 0.25 },
    { src: `${SCR}/pi-tabla.jpg`, at: 13.15, d: 0.25 },
  ],
  hls: [
    { at: 0.5, out: 1.6, r: [32, 812, 367, 951] },
    { at: 1.6, out: 2.9, r: [383, 812, 718, 951] },
    { at: 3.2, out: 6.75, r: [70, 809, 680, 883] },
    { at: 6.85, out: 10.1, r: [70, 883, 680, 957] },
    { at: 10.2, out: 13.1, r: [70, 957, 680, 1031] },
    { at: 13.45, r: [70, 1180, 680, 1253] },
  ],
});

// S5 — invitar: Mi equipo → Invita a otra gestora → Mandar por WhatsApp (y el mensaje que sale)
const s5chat = [
  { id: 's05-m1', at: 4.75, out: true, html: 'Únete como gestora de Casa Viva: vendes sin poner dinero y ganas comisión por cada venta. Regístrate aquí: <span class="lnk">casaviva.company/registro-gestora/?invita=TUCODIGO</span>' },
];
scenes[ids[4]] = scene({
  ...base(4),
  eyebrow: ['4', 'Invita'],
  caps: [
    { at: 0.1, out: 1.6, html: 'Abre <span class="k">Mi equipo</span>' },
    { at: 1.7, html: 'Toca <span class="k">Mandar por WhatsApp</span>' },
  ],
  screens: [
    { src: `${SCR}/pi-menu.jpg`, at: 0, d: 0.25 },
    { src: `${SCR}/eq-invita.jpg`, at: 1.45, d: 0.2 },
  ],
  hls: [
    { at: 0.45, out: 1.4, r: [20, 1073, 580, 1152] },
    { at: 1.7, out: 3.15, r: [32, 829, 718, 1291] },
    { at: 3.2, out: 4.4, r: [70, 1181, 398, 1253] },
  ],
  taps: [
    { at: 1.15, x: 300, y: 1112, hold: 0.25 },
    { at: 4.05, x: 234, y: 1217, hold: 0.3 },
  ],
  screenExtra: chatBox('s05', s5chat, { hidden: true, title: 'Tu amiga', sub: 'en línea', avatar: 'A' }),
  css: `
        #s05-chat { position: absolute; left: 0; top: 0; width: 620px; height: 1388px; z-index: 10; }`,
  extraJs: `
          ${fadeIn('#s05-chat', 4.45, 0.3)}
          ${chatJs(s5chat, cuts[4])}`,
});

// S6 — lo que ganas: 1 % durante 12 meses; 0,5 % del 2.º nivel si eres Plata; con 1 venta tuya ese mes
scenes[ids[5]] = scene({
  ...base(5),
  eyebrow: ['5', 'Lo que ganas'],
  caps: [
    { at: 0.1, out: 4.0, html: '<span class="k">1 %</span> de tus invitadas' },
    { at: 4.1, out: 7.2, html: 'Si eres Plata: <span class="k">0,5 %</span> más' },
    { at: 7.3, html: 'Con <span class="k">1 venta tuya</span> ese mes' },
  ],
  screens: [{ src: `${SCR}/eq-top.jpg`, at: 0, d: 0.3 }],
  hls: [{ at: 0.5, out: 3.9, r: [70, 872, 680, 1032] }],
  screenExtra: listCard('s06-card', 130, [
    ['1 %', 'de lo que venden <b>tus invitadas</b>, durante <b>12 meses</b>'],
    ['0,5 %', 'de <b>las invitadas de ellas</b>, si ese mes eres <b>Plata</b>'],
    ['✓', 'Para cobrarlo: <b>1 venta tuya</b> entregada ese mes'],
  ]),
  css: LCSS,
  extraJs: `
          tl.fromTo("#s06-card", { opacity: 0, y: 40, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.5)" }, 0.35);
          tl.fromTo("#s06-card-r0", { opacity: 0.16 }, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0.5);
          tl.fromTo("#s06-card-r1", { opacity: 0.16 }, { opacity: 1, duration: 0.35, ease: "power2.out" }, 4.1);
          tl.fromTo("#s06-card-r2", { opacity: 0.16 }, { opacity: 1, duration: 0.35, ease: "power2.out" }, 7.3);`,
});

// S7 — claro y honesto: el bono depende de lo que gane el equipo; fondo del 15 %; si no alcanza, una parte; «Pedir mi pago»
scenes[ids[6]] = scene({
  ...base(6), exit: 'phone',
  eyebrow: ['6', 'Claro y honesto'],
  caps: [
    { at: 0.1, out: 3.55, html: 'El bono depende <span class="k">del equipo</span>' },
    { at: 3.65, out: 6.6, html: 'Sale del <span class="k">15 %</span> de la ganancia' },
    { at: 6.7, out: 8.95, html: 'Si no alcanza: <span class="k">una parte</span>' },
    { at: 9.05, html: 'Se cobra en <span class="k">Pedir mi pago</span>' },
  ],
  screens: [
    { src: `${SCR}/pi-oro.jpg`, at: 0, d: 0.3 },
    { src: `${SCR}/pi-menu.jpg`, at: 8.95, d: 0.25 },
  ],
  hls: [
    { at: 1.2, out: 3.6, r: [70, 785, 680, 863] },
    { at: 6.7, out: 8.9, r: [70, 785, 680, 993] },
    { at: 9.3, r: [20, 841, 580, 920] },
  ],
  screenExtra: listCard('s07-card', 130, [
    ['15 %', 'de la ganancia del equipo es el <b>fondo</b> del mes'],
    ['Parte', 'Si no alcanza, ese mes se paga <b>una parte</b>, igual para todas'],
  ]) + listCard('s07-card2', 130, [
    ['→', 'En <b>Cobrar</b>, toca <b>Pedir mi pago</b>'],
  ]),
  css: LCSS,
  extraJs: `
          tl.fromTo("#s07-card", { opacity: 0, y: 40, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.5)" }, 3.7);
          tl.fromTo("#s07-card-r0", { opacity: 0.16 }, { opacity: 1, duration: 0.35, ease: "power2.out" }, 3.85);
          tl.fromTo("#s07-card-r1", { opacity: 0.16 }, { opacity: 1, duration: 0.35, ease: "power2.out" }, 6.75);
          ${fadeOut('#s07-card', 8.85, 0.2)}
          tl.fromTo("#s07-card2", { opacity: 0, y: 40, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.5)" }, 9.5);`,
});

// S8 — cierre: ASÍ DE FÁCIL + «En prueba: dinos qué no entiendes» + logo vertical
scenes[ids[7]] = scene({
  ...base(7),
  css: `
        #s10-title { position: absolute; left: 60px; right: 60px; top: 180px; text-align: center; font-family: "Cinzel", Georgia, serif; font-weight: 600; font-size: 84px; letter-spacing: 0.08em; color: #2B2420; }
        #s10-grid { position: absolute; left: 90px; right: 90px; top: 320px; display: flex; flex-direction: column; gap: 18px; }
        .s10-c { display: flex; align-items: center; gap: 22px; padding: 20px 28px; border-radius: 22px; background: #0D3B45; color: #F6F1E6; font-weight: 600; font-size: 40px; }
        .s10-n { display: inline-flex; width: 58px; height: 58px; flex: 0 0 auto; border-radius: 50%; align-items: center; justify-content: center; background: #F6F1E6; color: #0D3B45; font-size: 32px; }
        #s10-free { position: absolute; left: 110px; right: 110px; top: 720px; padding: 20px 30px; border-radius: 999px; background: #A35A1F; color: #F6F1E6; font-weight: 600; font-size: 42px; text-align: center; white-space: nowrap; }
        #s10-logo { position: absolute; left: 50%; top: 880px; width: 400px; margin-left: -200px; display: block; }
        #s10-q { position: absolute; left: 60px; right: 60px; top: 1200px; text-align: center; font-weight: 600; font-size: 72px; color: #0D3B45; }
        #s10-url { position: absolute; left: 60px; right: 60px; top: 1300px; text-align: center; font-weight: 500; font-size: 46px; color: #2B2420; }`,
  extra: `
        <div id="s10-title">ASÍ DE FÁCIL</div>
        <div id="s10-grid"><div class="s10-c" id="s10-c1"><span class="s10-n">1</span>Vende: cada venta da puntos</div><div class="s10-c" id="s10-c2"><span class="s10-n">2</span>Tu equipo sube de piedra</div><div class="s10-c" id="s10-c3"><span class="s10-n">3</span>Invita: 1 % durante 12 meses</div></div>
        <div id="s10-free">En prueba · dinos qué no entiendes</div>
        <img id="s10-logo" src="assets/logo/casa-viva-vertical-marron.svg" alt="Casa Viva" />
        <div id="s10-q">¿Dudas? Escríbeme.</div>
        <div id="s10-url">casaviva.company</div>`,
  extraJs: `
          tl.fromTo("#s10-title", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: "power4.out" }, 0.05);
          ${[1, 2, 3].map((n) => `tl.fromTo("#s10-c${n}", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.38, ease: "back.out(1.6)" }, ${f2(0.1 + n * 0.12)});`).join('\n          ')}
          tl.fromTo("#s10-free", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.8)" }, 0.4);
          tl.fromTo("#s10-logo", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, 1.2);
          tl.fromTo("#s10-q", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.42, ease: "back.out(1.4)" }, 1.6);
          tl.fromTo("#s10-url", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" }, 1.9);`,
});

for (const id of ids) fs.writeFileSync(`${P}/compositions/${id}.html`, scenes[id]);

// ---------------- subtítulos (whisper-final.json, palabra por palabra) ----------------
// Cada subtítulo = trozo exacto del guion (cifras como las escribe Whisper). [ ] = palabra clave (crema sobre ámbar).
const CUES = [
  [0, 'Ahora vender y traer a otras gestoras'],
  [0, '[te da más].'],
  [1, 'Cada venta tuya, [entregada y cobrada],'],
  [1, 'te da puntos.'],
  [1, 'Un punto es [un dólar]'],
  [1, 'que le queda limpio a la tienda.'],
  [2, 'En el menú toca [Mi piedra].'],
  [2, 'Ahí ves [cada vale] con sus puntos.'],
  [3, 'Con los puntos de [tu equipo]'],
  [3, 'cada mes subes de piedra.'],
  [3, 'Bronce con 65 puntos'],
  [3, 'son [5.000 pesos].'],
  [3, 'Plata con 130 puntos'],
  [3, '[10.000 pesos].'],
  [3, 'Oro con 195 puntos'],
  [3, '[15.000 pesos].'],
  [3, 'Y así hasta [Corona].'],
  [4, 'Para invitar, abre [Mi equipo].'],
  [4, 'En Invita a otra gestora,'],
  [4, 'toca [Mandar por WhatsApp].'],
  [5, 'Ganas el [1%] de lo que vendan'],
  [5, 'tus invitadas durante [12 meses],'],
  [5, 'y si eres Plata, el [medio por ciento]'],
  [5, 'de las invitadas de ellas.'],
  [5, 'Para cobrarlo, entrega al menos'],
  [5, '[una venta tuya] ese mes.'],
  [6, 'Te lo decimos claro,'],
  [6, 'el bono [depende de lo que gane el equipo].'],
  [6, 'Sale de un fondo,'],
  [6, 'del [15%] de la ganancia.'],
  [6, 'Si no alcanza, ese mes'],
  [6, '[se paga una parte]'],
  [6, 'y lo cobras en [Pedir mi pago].'],
  [7, 'Está [en prueba].'],
  [7, 'Dinos [qué no entiendes].'],
];
const words = JSON.parse(fs.readFileSync(`${P}/assets/audio/whisper-final.json`, 'utf8')).words;
words.forEach((w) => { if (/^\s*Bronze$/.test(w.word)) w.word = w.word.replace('Bronze', 'Bronce'); }); // Whisper escribe «Bronze» con contexto; aislada se oye «bronce» (comprobado)
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
  .replace(/<title>.*<\/title>/, '<title>Tutorial: Las piedras</title>')
  .replace('</style>', EXTRA_CSS);
const sceneDivs = ids.map((id, i) => `      <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${cuts[i]}" data-duration="${dur(i)}" data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920"></div>`).join('\n');
const whooshes = cuts.slice(1, -1).map((c, i) => `      <audio id="sfx-whoosh-${i + 1}" src="assets/sfx/whoosh-short.mp3" data-start="${f2(c - 0.25)}" data-duration="0.57" data-track-index="5" data-audio-group="sfx" data-volume="0.3"></audio>`).join('\n');
const clickTags = clicks.sort((a, b) => a - b).map((t, i) => `      <audio id="sfx-click-${i + 1}" src="assets/sfx/click-soft.mp3" data-start="${t}" data-duration="0.36" data-track-index="6" data-audio-group="sfx" data-volume="0.55"></audio>`).join('\n');
const notifTags = notifs.map((t, i) => `      <audio id="sfx-notif-${i + 1}" src="assets/sfx/notification.mp3" data-start="${t}" data-duration="1.2" data-track-index="7" data-audio-group="sfx" data-volume="0.3"></audio>`).join('\n');
const phoneStart = cuts[1];
const phoneDur = f2(cuts[7] - cuts[1]);
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
// marco del teléfono: entra en S2 y se va al final de S7
const shellTl = `          tl.fromTo("#ps-body", { opacity: 0, y: 160 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0);
          tl.fromTo("#ps-body", { opacity: 1, y: 0 }, { opacity: 0, y: 110, duration: 0.42, ease: "power2.in", immediateRender: false }, ${shellExit});
`;
let shell = fs.readFileSync(`${P}/compositions/phone-shell.html`, 'utf8');
shell = shell.replace(/( {10}tl\.fromTo\("#ps-body"[^\n]*\n)+/, shellTl);
fs.writeFileSync(`${P}/compositions/phone-shell.html`, shell);
let bg = fs.readFileSync(`${P}/compositions/bg.html`, 'utf8');
// fondo: etiqueta y duraciones de este video (línea a línea)
bg = bg.replace(/Gestoras · [^<]+</, 'Gestoras · Las piedras<').split('\n').map((l) => {
  if (l.includes('"#bg-glow-a"')) return l.replace(/repeat: \d+/, 'repeat: 8');
  if (l.includes('"#bg-glow-b"')) return l.replace(/repeat: \d+/, 'repeat: 6');
  if (l.includes('"#bg-dots"') || l.includes('"#progress-fill"')) return l.replace(/duration: [\d.]+/, `duration: ${TOTAL}`);
  if (l.includes('"#brandbar", { opacity: 0 }')) return l.replace(/\}, [\d.]+\);$/, `}, ${f2(cuts[1] + 0.1)});`);
  if (l.includes('"#brandbar", { opacity: 1 }')) return l.replace(/\}, [\d.]+\);$/, `}, ${f2(TOTAL - 0.5)});`);
  return l;
}).join('\n');
fs.writeFileSync(`${P}/compositions/bg.html`, bg);
console.log('ok', ids.length, 'scenes; cues', cues.length, '; clicks', clicks.length, '; phone', phoneStart, phoneDur, '; shell exit', shellExit);
