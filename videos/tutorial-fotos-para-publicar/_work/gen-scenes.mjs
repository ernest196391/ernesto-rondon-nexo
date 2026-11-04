// Genera index.html + compositions para tutorial-fotos-para-publicar (tutorial 5, gestoras).
// Adaptado del generador de tutorial-dudas-gestoras. Coordenadas de capturas en el marco 750x1624 (375x812 @2x).
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
    html.push(`<div class="eyebrow" id="${id}-eb"><span class="eb-n">${cfg.eyebrow[0]}</span>${cfg.eyebrow[1]}</div>`);
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
      inner.push(`<img class="shot" id="${id}-s${i}" src="${s.src}" alt="" />`);
      if (s.at !== undefined) js.push(fadeIn(`#${id}-s${i}`, s.at, s.d ?? 0.25));
      else if (i > 0) js.push(fadeIn(`#${id}-s${i}`, 0));
      if (s.outAt) js.push(fadeOut(`#${id}-s${i}`, s.outAt));
    });
    (cfg.overlays || []).forEach((o) => inner.push(o));
    (cfg.hls || []).forEach((h, i) => {
      const { X, Y } = geo(h.w);
      const [x1, y1, x2, y2] = h.r;
      const pad = 6;
      inner.push(`<div class="hl" id="${id}-h${i}" style="left:${X(x1) - pad}px;top:${Y(y1) - pad}px;width:${X(x2) - X(x1) + 2 * pad}px;height:${Y(y2) - Y(y1) + 2 * pad}px"></div>`);
      js.push(`tl.fromTo("#${id}-h${i}", { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, ${h.at});`);
      js.push(fadeOut(`#${id}-h${i}`, h.out ?? dur - 0.3));
    });
    (cfg.taps || []).forEach((t, i) => {
      const { X, Y } = geo(t.w);
      const x = X(t.x);
      const y = Y(t.y);
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
const TOTAL = seg.total; // 45.05
const cuts = [0, 4.85, 13.55, 22.25, 32.4, 38.5, TOTAL];
const ids = ['s01-portada', 's02-donde', 's03-que-hay', 's04-foto-texto', 's05-todas', 's06-cierre'];
const dur = (i) => f2(cuts[i + 1] - cuts[i]);
const base = (i) => ({ id: ids[i], dur: dur(i), start: cuts[i] });
const scenes = {};
const SCR = 'assets/screens';

// S1 — portada: logo horizontal + título en Cinzel + el problema
scenes[ids[0]] = scene({
  ...base(0),
  css: `
        #s01-logo { position: absolute; left: 50%; top: 250px; width: 600px; margin-left: -300px; display: block; }
        #s01-block { position: absolute; left: 70px; right: 70px; top: 560px; display: flex; flex-direction: column; align-items: center; gap: 34px; text-align: center; }
        #s01-eyebrow { display: inline-flex; padding: 14px 30px; border-radius: 999px; background: #0D3B45; color: #F6F1E6; font-weight: 600; font-size: 34px; }
        #s01-head { font-family: "Cinzel", Georgia, serif; font-weight: 600; font-size: 110px; line-height: 1.12; letter-spacing: 0.06em; color: #2B2420; text-transform: uppercase; }
        .s01-line { display: block; }
        #s01-rule { display: block; width: 260px; height: 10px; border-radius: 5px; background: #A35A1F; }
        #s01-sub { font-weight: 500; font-size: 54px; line-height: 1.2; color: #0D3B45; }
        #s01-list { position: absolute; left: 90px; right: 90px; top: 1330px; display: flex; flex-wrap: wrap; justify-content: center; gap: 18px; }
        .s01-chip { padding: 16px 28px; border-radius: 999px; background: #fffdf9; border: 3px solid rgba(13, 59, 69, 0.18); font-weight: 500; font-size: 34px; color: #2B2420; }`,
  extra: `
        <img id="s01-logo" src="assets/logo/casa-viva-horizontal-marron.svg" alt="Casa Viva" />
        <div id="s01-block">
          <div id="s01-eyebrow">Para gestoras</div>
          <h1 id="s01-head"><span class="s01-line" id="s01-l1">Fotos</span><span class="s01-line" id="s01-l2">para publicar</span></h1>
          <span id="s01-rule"></span>
          <div id="s01-sub">Ya no tienes que pedirlas<br>una a una</div>
        </div>
        <div id="s01-list"><span class="s01-chip" id="s01-p1">Descargar foto</span><span class="s01-chip" id="s01-p2">Copiar texto</span><span class="s01-chip" id="s01-p3">Tu enlace</span></div>`,
  extraJs: `
          tl.fromTo("#s01-logo", { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.05);
          tl.fromTo("#s01-eyebrow", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, 0.3);
          tl.fromTo("#s01-l1", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.55, ease: "power4.out" }, 0.45);
          tl.fromTo("#s01-l2", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.55, ease: "power4.out" }, 0.62);
          tl.fromTo("#s01-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "expo.out" }, 1.0);
          tl.fromTo("#s01-sub", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, 2.3);
          ${[1, 2, 3].map((n) => `tl.fromTo("#s01-p${n}", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.6)" }, ${f2(2.9 + n * 0.18)});`).join('\n          ')}
          tl.fromTo("#s01-logo", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power2.in", immediateRender: false }, 4.5);
          tl.fromTo("#s01-block", { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.35, ease: "power2.in", immediateRender: false }, 4.45);
          tl.fromTo("#s01-list", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power2.in", immediateRender: false }, 4.5);`,
});

// S2 — dónde está: tu área → menú → Fotos para publicar; sin sesión: «mi acceso» (respuesta real del bot)
const s2msgs = [
  { id: 's02-m1', out: true, at: 7.0, html: 'mi acceso' },
  { id: 's02-m2', at: 7.7, html: `🔑 ${BL()}, toca este enlace para entrar a tu panel sin contraseña (sirve 7 días, una sola vez; no lo compartas):<br><span class="lnk">casaviva.company/${BL('xxxxxxxxxxxxxxxx')}</span><br><br>Si se te vence, escríbeme <b>mi acceso</b> otra vez.` },
];
scenes[ids[1]] = scene({
  ...base(1), enter: 'phone',
  eyebrow: ['1', 'Dónde está'],
  caps: [
    { at: 0.2, out: 4.75, html: 'Tu área → <span class="k">Fotos para publicar</span>' },
    { at: 5.0, html: '¿Sin sesión? Escríbeme <span class="k">«mi acceso»</span>' },
  ],
  screens: [
    { src: `${SCR}/f-herr.jpg`, outAt: 2.25 },
    { src: `${SCR}/f-menu.jpg`, at: 2.1, outAt: 3.85 },
    { src: `${SCR}/f-top.jpg`, at: 3.75 },
  ],
  hls: [{ at: 2.55, out: 3.7, r: [20, 862, 580, 942] }],
  taps: [
    { at: 1.95, x: 56, y: 52, hold: 0.3 },
    { at: 3.45, x: 230, y: 902, hold: 0.3 },
  ],
  screenExtra: chatBox('s02', s2msgs, { hidden: true }),
  css: `
        #s02-chat { position: absolute; left: 0; top: 0; width: 620px; height: 1388px; z-index: 10; }`,
  extraJs: `
          ${fadeIn('#s02-chat', 4.85, 0.3)}
          ${sbHide('s02-donde', 5.0)}
          ${chatJs(s2msgs, cuts[1])}`,
});

// S3 — qué hay: 194 en existencia → precio, CUP, quedan → buscar o categoría
scenes[ids[2]] = scene({
  ...base(2),
  eyebrow: ['2', 'Todo lo que hay'],
  caps: [
    { at: 0.1, out: 6.3, html: 'Con <span class="k">tu precio</span>, en CUP y lo que queda' },
    { at: 6.45, html: 'Busca, o abre una <span class="k">categoría</span>' },
  ],
  screens: [
    { src: `${SCR}/f-top.jpg` },
    { src: `${SCR}/f-search.jpg`, at: 2.6, outAt: 7.55 },
    { src: `${SCR}/f-cat.jpg`, at: 7.45 },
  ],
  hls: [
    { at: 0.6, out: 2.55, r: [56, 455, 402, 500] },
    { at: 3.0, out: 3.75, r: [46, 788, 158, 830] },
    { at: 3.8, out: 5.2, r: [156, 788, 298, 830] },
    { at: 5.3, out: 6.35, r: [46, 836, 166, 870] },
    { at: 6.45, out: 7.4, r: [58, 144, 692, 246] },
    { at: 7.8, r: [30, 138, 720, 250] },
  ],
});

// S4 — Descargar foto → Copiar texto → pegado en WhatsApp con TU enlace
const s4msgs = [
  { id: 's04-m1', out: true, cls: 'photo', at: 4.75, html: `<img class="bph" src="${SCR}/f-mochila-foto.jpg" alt="" /><b>MOCHILA ESTILO BOLSITA</b><br>Mochila ligera y práctica para el uso diario, viajes o llevar compras y artículos personales.<br>13 USD · 10.140 CUP<br>Pídelo aquí y te lo llevamos 🛵 <span class="lnk">casaviva.company/producto/mochila-estilo-bolsita/<span class="mk" id="s04-mk1"><i class="mk-bar"></i><span class="mk-t">?ref=${BL('XXXXXXXX')}</span></span></span>` },
];
scenes[ids[3]] = scene({
  ...base(3),
  eyebrow: ['3', 'Foto y texto'],
  caps: [
    { at: 0.1, out: 4.25, html: '<span class="k">Descargar foto</span> y Copiar texto' },
    { at: 4.45, html: 'El texto ya lleva <span class="k">tu enlace</span>' },
  ],
  screens: [
    { src: `${SCR}/f-search.jpg` },
    { src: `${SCR}/f-dl.jpg`, at: 0.95, d: 0.15 },
    { src: `${SCR}/f-copied.jpg`, at: 3.4, d: 0.15 },
  ],
  hls: [
    { at: 1.15, out: 3.2, r: [46, 1062, 346, 1136] },
    { at: 3.6, out: 4.25, r: [46, 1062, 346, 1136] },
  ],
  taps: [
    { at: 0.85, x: 199, y: 931, hold: 0.3 },
    { at: 3.3, x: 199, y: 1019, hold: 0.3 },
  ],
  screenExtra: chatBox('s04', s4msgs, { hidden: true, title: 'Cliente De Ejemplo', sub: 'en línea', avatar: 'CE' }) + `
        <div class="dim" data-layout-allow-occlusion id="s04-dim"></div>
        <div class="card" data-layout-allow-occlusion data-layout-allow-overlap id="s04-card"><div class="card-ic">✓</div><div class="card-t">Lo que compren con tu enlace <b>es venta tuya</b>.</div></div>`,
  css: `
        #s04-chat { position: absolute; left: 0; top: 0; width: 620px; height: 1388px; z-index: 10; }
        #s04-chat .bubble { font-size: 26px; max-width: 94%; }
        #s04-chat .avatar { background: #e4ece8; color: #0D3B45; border: 0; }
        .photo { padding: 8px 8px 12px; }
        .photo .bph { display: block; width: 100%; height: auto; border-radius: 14px; margin-bottom: 12px; }
        #s04-dim { z-index: 11; }
        #s04-card { top: 300px; z-index: 12; }`,
  extraJs: `
          ${fadeIn('#s04-chat', 4.35, 0.3)}
          ${sbHide('s04-foto-texto', 4.5)}
          ${chatJs(s4msgs, cuts[3])}
          tl.fromTo("#s04-mk1 .mk-bar", { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power2.out" }, 7.35);
          ${fadeIn('#s04-dim', 8.25, 0.3)}
          tl.fromTo("#s04-card", { opacity: 0, y: -60 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.5)" }, 8.3);`,
});
notifs.push(f2(cuts[3] + 3.45));

// S5 — una categoría entera: «Descargar todas (ZIP)»
scenes[ids[4]] = scene({
  ...base(4), exit: 'phone',
  eyebrow: ['4', 'Una categoría entera'],
  caps: [
    { at: 0.1, html: 'Toda la categoría: <span class="k">Descargar todas</span>' },
  ],
  screens: [{ src: `${SCR}/f-cat.jpg` }],
  hls: [
    { at: 0.4, out: 2.2, r: [30, 138, 720, 250] },
    { at: 3.5, r: [60, 330, 674, 380] },
  ],
  taps: [{ at: 2.75, x: 221, y: 281, hold: 0.4 }],
});

// S6 — cierre: ASÍ DE FÁCIL + logo vertical + ¿Dudas? Escríbeme
scenes[ids[5]] = scene({
  ...base(5),
  css: `
        #s06-title { position: absolute; left: 60px; right: 60px; top: 190px; text-align: center; font-family: "Cinzel", Georgia, serif; font-weight: 600; font-size: 84px; letter-spacing: 0.08em; color: #2B2420; }
        #s06-grid { position: absolute; left: 150px; right: 150px; top: 340px; display: flex; flex-direction: column; gap: 18px; }
        .s06-c { display: flex; align-items: center; gap: 22px; padding: 20px 28px; border-radius: 22px; background: #0D3B45; color: #F6F1E6; font-weight: 600; font-size: 44px; }
        .s06-n { display: inline-flex; width: 58px; height: 58px; flex: 0 0 auto; border-radius: 50%; align-items: center; justify-content: center; background: #F6F1E6; color: #0D3B45; font-size: 32px; }
        #s06-logo { position: absolute; left: 50%; top: 820px; width: 440px; margin-left: -220px; display: block; }
        #s06-q { position: absolute; left: 60px; right: 60px; top: 1170px; text-align: center; font-weight: 600; font-size: 76px; color: #0D3B45; }
        #s06-url { position: absolute; left: 60px; right: 60px; top: 1280px; text-align: center; font-weight: 500; font-size: 46px; color: #2B2420; }`,
  extra: `
        <div id="s06-title">ASÍ DE FÁCIL</div>
        <div id="s06-grid"><div class="s06-c" id="s06-c1"><span class="s06-n">1</span>Descargar foto</div><div class="s06-c" id="s06-c2"><span class="s06-n">2</span>Copiar texto</div><div class="s06-c" id="s06-c3"><span class="s06-n">3</span>Publica hoy 💛</div></div>
        <img id="s06-logo" src="assets/logo/casa-viva-vertical-marron.svg" alt="Casa Viva" />
        <div id="s06-q">¿Dudas? Escríbeme.</div>
        <div id="s06-url">casaviva.company</div>`,
  extraJs: `
          tl.fromTo("#s06-title", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: "power4.out" }, 0.1);
          ${[1, 2, 3].map((n) => `tl.fromTo("#s06-c${n}", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.4, ease: "back.out(1.6)" }, ${f2(0.25 + n * 0.15)});`).join('\n          ')}
          tl.fromTo("#s06-logo", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 1.2);
          tl.fromTo("#s06-q", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.4)" }, 2.7);
          tl.fromTo("#s06-url", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" }, 3.2);`,
});

for (const id of ids) fs.writeFileSync(`${P}/compositions/${id}.html`, scenes[id]);

// ---------------- subtítulos (whisper-final.json, palabra por palabra) ----------------
// Cada subtítulo = trozo exacto del guion. [ ] = palabra clave (crema sobre ámbar).
const CUES = [
  [0, '¿Necesitas [fotos para publicar]?'],
  [0, 'Ya no tienes que pedírmelas [una a una].'],
  [1, 'Entra a tu área, abre el [menú],'],
  [1, 'y toca: [Fotos para publicar].'],
  [1, 'Si no tienes la sesión abierta,'],
  [1, 'escríbeme: [mi acceso].'],
  [2, 'Ahí está todo lo que hay [en existencia],'],
  [2, 'con [tu precio], el precio en pesos,'],
  [2, 'y [cuántos quedan].'],
  [2, 'Busca un producto, o abre una [categoría].'],
  [3, 'Toca: [Descargar foto].'],
  [3, 'Después toca: [Copiar texto],'],
  [3, 'y pégalo junto a la foto.'],
  [3, 'El texto ya lleva [tu enlace],'],
  [3, 'así que la venta [es tuya].'],
  [4, '¿Quieres una [categoría entera]?'],
  [4, 'Toca: [Descargar todas],'],
  [4, 'y te bajas una foto de [cada producto].'],
  [5, 'Publica hoy, y comparte [tu enlace].'],
  [5, '¿Dudas? [Escríbeme].'],
];
const words = JSON.parse(fs.readFileSync(`${P}/assets/audio/whisper-final.json`, 'utf8')).words;
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
    </style>`;
const head = fs.readFileSync(`${P}/_work/head.html`, 'utf8')
  .replace(/<title>.*<\/title>/, '<title>Tutorial: fotos para publicar</title>')
  .replace('</style>', EXTRA_CSS);
const sceneDivs = ids.map((id, i) => `      <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${cuts[i]}" data-duration="${dur(i)}" data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920"></div>`).join('\n');
const whooshes = cuts.slice(1, -1).map((c, i) => `      <audio id="sfx-whoosh-${i + 1}" src="assets/sfx/whoosh-short.mp3" data-start="${f2(c - 0.25)}" data-duration="0.57" data-track-index="5" data-audio-group="sfx" data-volume="0.3"></audio>`).join('\n');
const clickTags = clicks.sort((a, b) => a - b).map((t, i) => `      <audio id="sfx-click-${i + 1}" src="assets/sfx/click-soft.mp3" data-start="${t}" data-duration="0.36" data-track-index="6" data-audio-group="sfx" data-volume="0.55"></audio>`).join('\n');
const notifTags = notifs.map((t, i) => `      <audio id="sfx-notif-${i + 1}" src="assets/sfx/notification.mp3" data-start="${t}" data-duration="1.2" data-track-index="7" data-audio-group="sfx" data-volume="0.3"></audio>`).join('\n');
const phoneStart = cuts[1];
const phoneDur = f2(cuts[5] - cuts[1]);
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
      <audio id="voz" src="assets/audio/voz.wav" data-start="0" data-duration="${f2(lastVoice + 0.2)}" data-track-index="3" data-audio-group="voiceover" data-volume="1"></audio>
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
console.log('ok', ids.length, 'scenes; cues', cues.length, '; clicks', clicks.length, '; phone', phoneStart, phoneDur, '; shell exit', shellExit);
