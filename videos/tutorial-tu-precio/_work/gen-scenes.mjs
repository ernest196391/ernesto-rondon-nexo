// Genera index.html + compositions para tutorial-tu-precio (tutorial «Tu precio», gestoras).
// Adaptado del generador de tutorial-fotos-para-publicar. oy = desplazamiento vertical de la captura (barra de dirección). Coordenadas de capturas en el marco 750x1624 (375x812 @2x).
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
const TOTAL = seg.total; // 48.84
const cuts = [0, 3.9, 12.47, 20.62, 32.12, 38.89, 44.38, TOTAL];
const ids = ['s01-portada', 's02-mis-precios', 's03-un-producto', 's04-quien-lo-ve', 's05-tu-pedido', 's06-si-cambias', 's07-cierre'];
const dur = (i) => f2(cuts[i + 1] - cuts[i]);
const base = (i) => ({ id: ids[i], dur: dur(i), start: cuts[i] });
const scenes = {};
const SCR = 'assets/screens';
// Barra de dirección (las capturas no la tienen): la dirección real de la ficha, con el código anonimizado.
const OY = 60;
const ADDR_GEN = '<span class="addr-pill">casaviva.company/producto/organizador…</span>';
const ADDR_REF = '<span class="addr-pill">casaviva.company/…/organizador…<b>?ref=TUCODIGO</b></span>';
const ADDR_HL = { r: [0, 0, 750, 72] }; // la barra entera (Y(0)=46, Y(72)≈106)

// S1 — portada: logo horizontal + título en Cinzel + la idea
scenes[ids[0]] = scene({
  ...base(0),
  css: `
        #s01-logo { position: absolute; left: 50%; top: 250px; width: 600px; margin-left: -300px; display: block; }
        #s01-block { position: absolute; left: 70px; right: 70px; top: 560px; display: flex; flex-direction: column; align-items: center; gap: 34px; text-align: center; }
        #s01-eyebrow { display: inline-flex; padding: 14px 30px; border-radius: 999px; background: #0D3B45; color: #F6F1E6; font-weight: 600; font-size: 34px; }
        #s01-head { font-family: "Cinzel", Georgia, serif; font-weight: 600; font-size: 130px; line-height: 1.1; letter-spacing: 0.06em; color: #2B2420; text-transform: uppercase; }
        .s01-line { display: block; }
        #s01-rule { display: block; width: 260px; height: 10px; border-radius: 5px; background: #A35A1F; }
        #s01-sub { font-weight: 500; font-size: 54px; line-height: 1.2; color: #0D3B45; }
        #s01-list { position: absolute; left: 90px; right: 90px; top: 1330px; display: flex; flex-wrap: wrap; justify-content: center; gap: 18px; }
        .s01-chip { padding: 16px 28px; border-radius: 999px; background: #fffdf9; border: 3px solid rgba(13, 59, 69, 0.18); font-weight: 500; font-size: 34px; color: #2B2420; }`,
  extra: `
        <img id="s01-logo" src="assets/logo/casa-viva-horizontal-marron.svg" alt="Casa Viva" />
        <div id="s01-block">
          <div id="s01-eyebrow">Para gestoras</div>
          <h1 id="s01-head"><span class="s01-line" id="s01-l1">Tu</span><span class="s01-line" id="s01-l2">precio</span></h1>
          <span id="s01-rule"></span>
          <div id="s01-sub">Lo que subas<br>es para ti</div>
        </div>
        <div id="s01-list"><span class="s01-chip" id="s01-p1">Mis precios</span><span class="s01-chip" id="s01-p2">Tu enlace</span><span class="s01-chip" id="s01-p3">Ver la tienda</span></div>`,
  extraJs: `
          tl.fromTo("#s01-logo", { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.05);
          tl.fromTo("#s01-eyebrow", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, 0.25);
          tl.fromTo("#s01-l1", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.55, ease: "power4.out" }, 0.4);
          tl.fromTo("#s01-l2", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.55, ease: "power4.out" }, 0.55);
          tl.fromTo("#s01-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "expo.out" }, 0.9);
          tl.fromTo("#s01-sub", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, 1.55);
          ${[1, 2, 3].map((n) => `tl.fromTo("#s01-p${n}", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.6)" }, ${f2(2.0 + n * 0.16)});`).join('\n          ')}
          tl.fromTo("#s01-logo", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power2.in", immediateRender: false }, 3.55);
          tl.fromTo("#s01-block", { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.35, ease: "power2.in", immediateRender: false }, 3.5);
          tl.fromTo("#s01-list", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power2.in", immediateRender: false }, 3.55);`,
});

// S2 — Mis precios: menú → Mis precios → Aumento general → Aplicar a mi tienda
scenes[ids[1]] = scene({
  ...base(1), enter: 'phone',
  eyebrow: ['1', 'Mis precios'],
  caps: [
    { at: 0.15, out: 3.95, html: 'Tu área → <span class="k">Mis precios</span>' },
    { at: 4.15, html: 'Todos a la vez: <span class="k">Aumento general</span>' },
  ],
  screens: [
    { src: `${SCR}/p-menu.jpg`, outAt: 1.85 },
    { src: `${SCR}/p-top.jpg`, at: 1.7 },
  ],
  hls: [
    { at: 0.9, out: 1.75, r: [30, 556, 580, 616] },
    { at: 4.4, out: 6.7, r: [153, 546, 680, 636] },
    { at: 6.75, r: [153, 665, 680, 757] },
  ],
  taps: [
    { at: 1.4, x: 150, y: 586, hold: 0.3 },
    { at: 7.1, x: 416, y: 711, hold: 0.4 },
  ],
});

// S3 — un solo producto: Ver y cambiar precios de un producto → buscar → escribir 35 → Guardar → «Precio guardado.»
scenes[ids[2]] = scene({
  ...base(2),
  eyebrow: ['2', 'Un producto'],
  caps: [
    { at: 0.1, out: 4.45, html: 'Abre: <span class="k">Ver y cambiar precios</span>' },
    { at: 4.65, html: 'Escribe <span class="k">tu precio</span> y toca Guardar' },
  ],
  screens: [
    { src: `${SCR}/p-top.jpg` },
    { src: `${SCR}/p-list.jpg`, at: 3.55 },
    { src: `${SCR}/p-typed.jpg`, at: 5.75, d: 0.15 },
    { src: `${SCR}/p-saved.jpg`, at: 7.0, d: 0.15 },
  ],
  hls: [
    { at: 1.6, out: 3.45, r: [70, 1108, 680, 1236] },
    { at: 4.6, out: 5.55, r: [70, 610, 544, 694] },
    { at: 5.75, out: 6.7, r: [100, 990, 650, 1076] },
    { at: 7.15, r: [100, 1206, 280, 1236] },
  ],
  taps: [
    { at: 3.3, x: 375, y: 1172, hold: 0.3 },
    { at: 6.85, x: 375, y: 1163, hold: 0.35 },
  ],
});
notifs.push(f2(cuts[2] + 7.05));

// S4 — quién lo ve: con tu enlace (35) / tienda general (30)
scenes[ids[3]] = scene({
  ...base(3),
  eyebrow: ['3', 'Quién lo ve'],
  caps: [
    { at: 0.1, out: 2.9, html: 'Tu precio: solo con <span class="k">tu enlace</span>' },
    { at: 3.1, out: 5.75, html: 'Tienda general: <span class="k">precio de Casa Viva</span>' },
    { at: 5.95, out: 8.85, html: 'Tienda general: <span class="k">30 USD</span>' },
    { at: 9.05, html: 'Con tu enlace: <span class="k">35 USD</span>' },
  ],
  screens: [
    { src: `${SCR}/p-ref.jpg`, oy: OY, addr: ADDR_REF },
    { src: `${SCR}/p-gen.jpg`, oy: OY, addr: ADDR_GEN, at: 3.0 },
    { src: `${SCR}/p-ref-mid.jpg`, oy: OY, addr: ADDR_REF, at: 9.0 }, // la misma ficha con tu enlace, el precio a la vista
  ],
  hls: [
    { at: 0.5, out: 2.85, ...ADDR_HL },
    { at: 1.2, out: 2.85, r: [50, 164, 700, 444], oy: OY },
    { at: 3.4, out: 5.6, ...ADDR_HL },
    { at: 7.6, out: 8.85, r: [280, 1016, 470, 1072], oy: OY },
    { at: 9.3, ...ADDR_HL },
    { at: 9.55, r: [280, 1048, 470, 1104], oy: OY },
  ],
});

// S5 — tu propio pedido: Ver la tienda (o tu enlace) → Añadir al carrito → sale a tu precio
scenes[ids[4]] = scene({
  ...base(4), exit: 'phone',
  eyebrow: ['4', 'Tu pedido'],
  caps: [
    { at: 0.1, out: 3.55, html: 'Entra desde <span class="k">Ver la tienda</span>' },
    { at: 3.75, html: 'Al carrito: sale a <span class="k">tu precio</span>' },
  ],
  screens: [
    { src: `${SCR}/p-top.jpg` },
    { src: `${SCR}/p-ref.jpg`, oy: OY, addr: ADDR_REF, at: 2.6 },
    { src: `${SCR}/p-cart.jpg`, oy: OY, addr: ADDR_REF, at: 3.6 },
  ],
  hls: [
    { at: 1.5, out: 2.5, r: [468, 16, 730, 96] },
    { at: 2.9, out: 3.55, ...ADDR_HL },
    { at: 4.95, r: [280, 332, 470, 388], oy: OY },
  ],
  taps: [
    { at: 2.3, x: 600, y: 56, hold: 0.3 },
    { at: 4.55, x: 375, y: 1220, oy: OY, hold: 0.4 },
  ],
});

// S6 — si cambias tu precio: el enlace enseña siempre el último precio guardado (Core: resolve_price en cada visita)
scenes[ids[5]] = scene({
  ...base(5),
  eyebrow: ['5', 'Si lo cambias'],
  css: `
        #s06-title { position: absolute; left: 70px; right: 70px; top: 300px; text-align: center; font-weight: 600; font-size: 78px; line-height: 1.1; color: #0D3B45; }
        .s06-row { position: absolute; left: 90px; right: 90px; height: 190px; padding: 0 40px; border-radius: 34px; background: #0D3B45; color: #F6F1E6; display: flex; align-items: center; justify-content: space-between; gap: 24px; box-shadow: 0 22px 50px rgba(43, 36, 32, 0.22); }
        #s06-ra { top: 520px; }
        #s06-rb { top: 750px; }
        .s06-l { font-weight: 600; font-size: 46px; line-height: 1.1; }
        .s06-ar { font-weight: 600; font-size: 54px; opacity: 0.7; }
        .s06-r { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; font-weight: 500; font-size: 32px; }
        .s06-p { display: inline-block; padding: 6px 22px; border-radius: 16px; background: #F6F1E6; color: #A35A1F; font-weight: 600; font-size: 52px; }
        #s06-note { position: absolute; left: 110px; right: 110px; top: 1030px; text-align: center; font-weight: 500; font-size: 52px; line-height: 1.25; color: #2B2420; }
        #s06-note b { font-weight: 600; color: #0D3B45; }`,
  extra: `
        <div id="s06-title">Si cambias tu precio</div>
        <div class="s06-row" id="s06-ra"><span class="s06-l">Guardas 35</span><span class="s06-ar">→</span><span class="s06-r">Tu cliente ve<span class="s06-p" id="s06-pa">35 USD</span></span></div>
        <div class="s06-row" id="s06-rb"><span class="s06-l">Quitas<br>tu aumento</span><span class="s06-ar">→</span><span class="s06-r">Tu cliente ve<span class="s06-p" id="s06-pb">30 USD</span></span></div>
        <div id="s06-note">Tu enlace enseña siempre<br><b>el precio que tienes guardado</b>.</div>`,
  extraJs: `
          tl.fromTo("#s06-title", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, 0.1);
          tl.fromTo("#s06-ra", { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.45, ease: "back.out(1.5)" }, 0.3);
          tl.fromTo("#s06-rb", { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.45, ease: "back.out(1.5)" }, 0.75);
          tl.fromTo("#s06-pb", { scale: 0.6 }, { scale: 1, duration: 0.4, ease: "back.out(2)" }, 1.55);
          tl.fromTo("#s06-note", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, 2.6);
          tl.fromTo("#s06-title, #s06-ra, #s06-rb, #s06-note", { opacity: 1 }, { opacity: 0, duration: 0.28, ease: "power2.in", immediateRender: false }, ${f2(dur(5) - 0.3)});`,
});

// S7 — cierre: ASÍ DE FÁCIL + logo vertical + ¿Dudas? Escríbeme
scenes[ids[6]] = scene({
  ...base(6),
  css: `
        #s07-title { position: absolute; left: 60px; right: 60px; top: 190px; text-align: center; font-family: "Cinzel", Georgia, serif; font-weight: 600; font-size: 84px; letter-spacing: 0.08em; color: #2B2420; }
        #s07-grid { position: absolute; left: 130px; right: 130px; top: 340px; display: flex; flex-direction: column; gap: 18px; }
        .s07-c { display: flex; align-items: center; gap: 22px; padding: 20px 28px; border-radius: 22px; background: #0D3B45; color: #F6F1E6; font-weight: 600; font-size: 42px; }
        .s07-n { display: inline-flex; width: 58px; height: 58px; flex: 0 0 auto; border-radius: 50%; align-items: center; justify-content: center; background: #F6F1E6; color: #0D3B45; font-size: 32px; }
        #s07-logo { position: absolute; left: 50%; top: 820px; width: 440px; margin-left: -220px; display: block; }
        #s07-q { position: absolute; left: 60px; right: 60px; top: 1170px; text-align: center; font-weight: 600; font-size: 76px; color: #0D3B45; }
        #s07-url { position: absolute; left: 60px; right: 60px; top: 1280px; text-align: center; font-weight: 500; font-size: 46px; color: #2B2420; }`,
  extra: `
        <div id="s07-title">ASÍ DE FÁCIL</div>
        <div id="s07-grid"><div class="s07-c" id="s07-c1"><span class="s07-n">1</span>Mis precios → Guardar</div><div class="s07-c" id="s07-c2"><span class="s07-n">2</span>Comparte tu enlace</div><div class="s07-c" id="s07-c3"><span class="s07-n">3</span>Tu pedido: Ver la tienda</div></div>
        <img id="s07-logo" src="assets/logo/casa-viva-vertical-marron.svg" alt="Casa Viva" />
        <div id="s07-q">¿Dudas? Escríbeme.</div>
        <div id="s07-url">casaviva.company</div>`,
  extraJs: `
          tl.fromTo("#s07-title", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: "power4.out" }, 0.05);
          ${[1, 2, 3].map((n) => `tl.fromTo("#s07-c${n}", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.38, ease: "back.out(1.6)" }, ${f2(0.12 + n * 0.13)});`).join('\n          ')}
          tl.fromTo("#s07-q", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.42, ease: "back.out(1.4)" }, 0.3);
          tl.fromTo("#s07-logo", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, 0.75);
          tl.fromTo("#s07-url", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" }, 1.2);`,
});

for (const id of ids) fs.writeFileSync(`${P}/compositions/${id}.html`, scenes[id]);

// ---------------- subtítulos (whisper-final.json, palabra por palabra) ----------------
// Cada subtítulo = trozo exacto del guion (cifras como las escribe Whisper). [ ] = palabra clave (crema sobre ámbar).
const CUES = [
  [0, 'Tú decides [tu precio].'],
  [0, 'Lo que subas, [es para ti].'],
  [1, 'En tu área, toca: [Mis precios].'],
  [1, 'Para subirlos todos a la vez,'],
  [1, 'pon un porcentaje en: [Aumento general],'],
  [1, 'y toca: [Aplicar a mi tienda].'],
  [2, 'Para un solo producto, abre:'],
  [2, '[Ver y cambiar precios de un producto].'],
  [2, 'Busca el producto, escribe [tu precio],'],
  [2, 'y toca: [Guardar].'],
  [3, 'Tus clientes ven tu precio'],
  [3, 'solo cuando entran por [tu enlace].'],
  [3, 'En la tienda general, todos ven'],
  [3, 'el [precio de Casa Viva].'],
  [3, 'Por ejemplo, este organizador'],
  [3, 'sale a [30 dólares] en la tienda,'],
  [3, 'y a [35] con tu enlace.'],
  [4, '¿El pedido lo haces tú?'],
  [4, 'Entra desde: [Ver la tienda],'],
  [4, 'o desde [tu enlace],'],
  [4, 'y añádelo al carrito ahí.'],
  [4, 'Así sale a [tu precio].'],
  [5, 'Y si quitas tu aumento,'],
  [5, 'tu cliente también [deja de verlo]:'],
  [5, 'tu enlace enseña siempre'],
  [5, 'el precio que [tienes guardado].'],
  [6, '¿Dudas? [Escríbeme].'],
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
      .addr { position: absolute; left: 0; right: 0; top: 46px; height: 60px; padding: 0 18px; display: flex; align-items: center; background: #ece6d8; border-bottom: 2px solid rgba(43, 36, 32, 0.08); z-index: 4; }
      .addr-pill { display: block; width: 100%; padding: 9px 20px; border-radius: 999px; background: #fffdf9; font-weight: 500; font-size: 23px; color: #2B2420; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .addr-pill b { font-weight: 600; color: #0D3B45; }
    </style>`;
const head = fs.readFileSync(`${P}/_work/head.html`, 'utf8')
  .replace(/<title>.*<\/title>/, '<title>Tutorial: tu precio</title>')
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
console.log('ok', ids.length, 'scenes; cues', cues.length, '; clicks', clicks.length, '; phone', phoneStart, phoneDur, '; shell exit', shellExit);
