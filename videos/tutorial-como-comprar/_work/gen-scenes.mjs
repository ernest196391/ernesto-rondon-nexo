// Generates index.html + compositions for tutorial-como-comprar (tutorial 3, clientes).
// Adapted from the tutorial-primera-venta generator. Screenshot coordinates are in the 750x1624 capture frame.
// Uso: node _work/gen-scenes.mjs <carpeta-del-proyecto>
import fs from 'node:fs';
const P = process.argv[2] || '.';
const S = 620 / 750;
const SB = 46;
const X = (x) => Math.round(x * S);
const Y = (y) => Math.round(SB + y * S);
const f2 = (n) => Number(n.toFixed(3));

const statusbar = (id) => `<div class="sb" id="${id}-sb"><span>10:24</span><span class="sb-icons"><span class="sb-bar" style="height:9px"></span><span class="sb-bar" style="height:13px"></span><span class="sb-bar" style="height:17px"></span><span class="sb-batt"></span></span></div>`;

const clicks = []; // absolute tap times → click sfx
function scene(cfg) {
  const { id, dur } = cfg;
  const html = [];
  const js = [];
  (cfg.caps || []).forEach((c, i) => {
    html.push(`<div class="cap" id="${id}-c${i}"><span class="ci">${c.html}</span></div>`);
    js.push(`tl.fromTo("#${id}-c${i}", { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, ${c.at});`);
    const out = c.out ?? dur - 0.28;
    js.push(`tl.fromTo("#${id}-c${i}", { opacity: 1 }, { opacity: 0, duration: 0.22, ease: "power2.in", immediateRender: false }, ${f2(out)});`);
    if (c.mark) js.push(`tl.fromTo("#${id}-c${i} .k", { backgroundSize: "0% 100%" }, { backgroundSize: "100% 100%", duration: 0.45, ease: "power2.out" }, ${f2(c.at + 0.35)});`);
  });
  if (cfg.screens) {
    const inner = [statusbar(id)];
    cfg.screens.forEach((s, i) => {
      inner.push(`<img class="${s.cover ? 'shot cover' : 'shot'}" id="${id}-s${i}" src="${s.src}" alt="" />`);
      if (i > 0) js.push(`tl.fromTo("#${id}-s${i}", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" }, ${s.at});`);
      if (s.outAt) js.push(`tl.fromTo("#${id}-s${i}", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power1.in", immediateRender: false }, ${s.outAt});`);
    });
    (cfg.hls || []).forEach((h, i) => {
      const [x1, y1, x2, y2] = h.r;
      const pad = 6;
      inner.push(`<div class="hl" id="${id}-h${i}" style="left:${X(x1) - pad}px;top:${Y(y1) - pad}px;width:${X(x2) - X(x1) + 2 * pad}px;height:${Y(y2) - Y(y1) + 2 * pad}px"></div>`);
      js.push(`tl.fromTo("#${id}-h${i}", { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, ${h.at});`);
      const out = h.out ?? dur - 0.3;
      js.push(`tl.fromTo("#${id}-h${i}", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power1.in", immediateRender: false }, ${f2(out)});`);
    });
    (cfg.taps || []).forEach((t, i) => {
      inner.push(`<div class="tap" id="${id}-t${i}" style="left:${X(t.x) - 46}px;top:${Y(t.y) - 46}px"><span class="tap-dot"></span><span class="tap-ring" id="${id}-t${i}r"></span></div>`);
      js.push(`tl.fromTo("#${id}-t${i}", { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" }, ${f2(t.at - 0.3)});`);
      js.push(`tl.fromTo("#${id}-t${i} .tap-dot", { scale: 1 }, { scale: 0.82, duration: 0.1, ease: "power2.in", yoyo: true, repeat: 1 }, ${t.at});`);
      js.push(`tl.fromTo("#${id}-t${i}r", { opacity: 0.9, scale: 1 }, { opacity: 0, scale: 2.1, duration: 0.5, ease: "power2.out" }, ${t.at});`);
      js.push(`tl.fromTo("#${id}-t${i}", { opacity: 1 }, { opacity: 0, duration: 0.2, ease: "power1.in", immediateRender: false }, ${f2(t.at + (t.hold ?? 0.45))});`);
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

// ---------------- scene timing (absolute seconds, aligned to assets/audio/voz-segmentos.json) ----------------
const TOTAL = 57.58;
const cuts = [0, 4.6, 10.5, 15.45, 20.1, 23.2, 28.6, 32.4, 42.25, 46.4, 50.05, TOTAL];
const ids = ['s01-titulo', 's02-enlace', 's03-producto', 's04-carrito', 's05-datos', 's06-entrega', 's07-direccion', 's08-pago', 's09-finaliza', 's10-gestora', 's11-cierre'];
const dur = (i) => f2(cuts[i + 1] - cuts[i]);
const base = (i) => ({ id: ids[i], dur: dur(i), start: cuts[i] });
const scenes = {};

// S1 — title
scenes[ids[0]] = scene({
  ...base(0),
  css: `
        #s01-block { position: absolute; left: 80px; right: 80px; top: 430px; display: flex; flex-direction: column; gap: 34px; }
        #s01-eyebrow { display: inline-flex; align-self: flex-start; padding: 14px 28px; border-radius: 999px; background: #0f3d3e; color: #f6f1e6; font-weight: 700; font-size: 34px; }
        #s01-head { font-weight: 800; font-size: 128px; line-height: 1.02; letter-spacing: -0.03em; color: #0f3d3e; }
        .s01-line { display: block; }
        #s01-rule { display: block; width: 300px; height: 14px; border-radius: 7px; background: #a35a24; transform-origin: left center; }
        #s01-sub { font-weight: 600; font-size: 56px; color: #6f6a62; }
        #s01-card { position: absolute; left: 80px; top: 1380px; width: 560px; padding: 30px 34px; border-radius: 18px; background: #fffdf9; border: 3px solid rgba(15, 61, 62, 0.16); box-shadow: 0 18px 40px rgba(15, 61, 62, 0.12); display: flex; flex-direction: column; gap: 10px; }
        #s01-card-l { font-weight: 600; font-size: 28px; color: #6f6a62; }
        #s01-card-v { font-weight: 800; font-size: 44px; color: #0f3d3e; }
        #s01-badge { position: absolute; right: 90px; top: 1300px; width: 300px; height: 300px; border-radius: 50%; background: #e4ece8; border: 6px solid #0f3d3e; display: flex; align-items: center; justify-content: center; font-size: 150px; }`,
  extra: `
        <div id="s01-block">
          <div id="s01-eyebrow">Para clientes · Casa Viva</div>
          <h1 id="s01-head"><span class="s01-line" id="s01-l1">Cómo</span><span class="s01-line" id="s01-l2">comprar en</span><span class="s01-line" id="s01-l3">Casa Viva</span></h1>
          <span id="s01-rule"></span>
          <div id="s01-sub">Mira qué fácil es.</div>
        </div>
        <div id="s01-card"><div id="s01-card-l">Desde tu teléfono</div><div id="s01-card-v">Paso a paso 📱</div></div>
        <div id="s01-badge">🛍️</div>`,
  extraJs: `
          tl.fromTo("#s01-eyebrow", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, 0.1);
          tl.fromTo("#s01-l1", { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 0.55, ease: "power4.out" }, 0.25);
          tl.fromTo("#s01-l2", { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 0.55, ease: "power4.out" }, 0.4);
          tl.fromTo("#s01-l3", { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 0.55, ease: "power4.out" }, 0.55);
          tl.fromTo("#s01-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "expo.out" }, 0.95);
          tl.fromTo("#s01-badge", { opacity: 0, scale: 0.4, rotation: -20 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.7, ease: "back.out(1.8)" }, 0.8);
          tl.fromTo("#s01-badge", { y: 0 }, { y: -18, duration: 1.2, ease: "sine.inOut", yoyo: true, repeat: 1, immediateRender: false }, 1.5);
          tl.fromTo("#s01-card", { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.55, ease: "power3.out" }, 1.2);
          tl.fromTo("#s01-sub", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.45, ease: "power2.out" }, 2.75);
          tl.fromTo("#s01-block", { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.35, ease: "power2.in", immediateRender: false }, 4.2);
          tl.fromTo("#s01-card", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power2.in", immediateRender: false }, 4.25);
          tl.fromTo("#s01-badge", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power2.in", immediateRender: false }, 4.25);`,
});

// S2 — the gestora's message with the link, then her store (name blurred)
const chat = `
        <div class="chat" id="s02-chat">
          <div class="chat-head"><div class="avatar">💬</div><div><div class="chat-title">Tu gestora</div><div class="chat-sub">en línea</div></div></div>
          <div class="chat-body">
            <div class="day-chip">Hoy</div>
            <div class="bubble" id="s02-b1">¡Hola! 😊 Aquí tienes mi tienda de Casa Viva 👇<span class="time">10:23</span></div>
            <div class="bubble" id="s02-b2"><span class="lp"><span class="lp-t">Tienda – Casa Viva</span><span class="lp-u">casaviva.company</span></span><span class="lnk" id="s02-lnk">Toca aquí para entrar 🔗</span><span class="time">10:23</span></div>
          </div>
        </div>`;
scenes[ids[1]] = scene({
  ...base(1), enter: 'phone',
  caps: [
    { at: 0.25, out: 3.3, html: 'Abre el <span class="k">enlace</span> de tu gestora', mark: true },
    { at: 3.6, html: 'Es <span class="k">su tienda</span>', mark: true },
  ],
  screens: [{ src: 'assets/screens/t01-tienda.jpg' }],
  hls: [{ at: 4.1, r: [48, 365, 702, 645] }],
  screenExtra: chat + `
        <div class="tap" id="s02-tl" style="left:150px;top:470px"><span class="tap-dot"></span><span class="tap-ring" id="s02-tlr"></span></div>`,
  css: `
        #s02-chat { position: absolute; left: 0; top: 0; width: 620px; height: 1388px; z-index: 6; }
        #s02-b1, #s02-b2 { font-size: 30px; }
        .lp { display: flex; flex-direction: column; gap: 4px; padding: 14px 18px; margin-bottom: 10px; border-radius: 12px; background: rgba(15, 61, 62, 0.08); border-left: 6px solid #0f3d3e; }
        .lp-t { font-weight: 800; font-size: 28px; color: #25231f; }
        .lp-u { font-size: 24px; color: #6f6a62; }
        .lnk { display: block; color: #1d5fa8; text-decoration: underline; font-size: 28px; font-weight: 700; }`,
  extraJs: `
          tl.fromTo("#s02-b1", { opacity: 0, scale: 0.6, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.6)", transformOrigin: "top left" }, 0.6);
          tl.fromTo("#s02-b2", { opacity: 0, scale: 0.6, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.6)", transformOrigin: "top left" }, 1.2);
          tl.fromTo("#s02-tl", { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" }, 2.3);
          tl.fromTo("#s02-tl .tap-dot", { scale: 1 }, { scale: 0.82, duration: 0.1, ease: "power2.in", yoyo: true, repeat: 1 }, 2.6);
          tl.fromTo("#s02-tlr", { opacity: 0.9, scale: 1 }, { opacity: 0, scale: 2.1, duration: 0.5, ease: "power2.out" }, 2.6);
          tl.fromTo("#s02-tl", { opacity: 1 }, { opacity: 0, duration: 0.2, ease: "power1.in", immediateRender: false }, 3.0);
          tl.fromTo("#s02-chat", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power1.in", immediateRender: false }, 3.0);
          tl.fromTo("#s02-enlace-h0", { boxShadow: "0 0 0 0 rgba(163,90,36,0.5)" }, { boxShadow: "0 0 0 22px rgba(163,90,36,0)", duration: 0.8, ease: "power2.out", immediateRender: false }, 4.5);`,
});
clicks.push(f2(cuts[1] + 2.58));

// S3 — product, colour, Añadir al carrito
scenes[ids[2]] = scene({
  ...base(2),
  caps: [
    { at: 0.1, out: 2.8, html: 'Elige el <span class="k">color</span>', mark: true },
    { at: 3.1, html: '<span class="k">Añadir al carrito</span>', mark: true },
  ],
  screens: [
    { src: 'assets/screens/t02-producto.jpg' },
    { src: 'assets/screens/t03-color.jpg', at: 1.3 },
    { src: 'assets/screens/t04-color-elegido.jpg', at: 2.35 },
    { src: 'assets/screens/t05-anadido.jpg', at: 3.85 },
  ],
  hls: [
    { at: 1.5, out: 2.3, r: [58, 634, 692, 738] },
    { at: 2.55, out: 3.75, r: [58, 1070, 692, 1164] },
    { at: 4.05, r: [22, 250, 728, 512] },
  ],
  taps: [
    { at: 0.75, x: 375, y: 640, hold: 0.35 },
    { at: 1.95, x: 375, y: 686, hold: 0.3 },
    { at: 3.45, x: 375, y: 1117, hold: 0.3 },
  ],
});

// S4 — cart → Finalizar compra
scenes[ids[3]] = scene({
  ...base(3),
  caps: [{ at: 0.1, html: 'Toca <span class="k">Finalizar compra</span>', mark: true }],
  screens: [{ src: 'assets/screens/t06-carrito.jpg' }],
  hls: [{ at: 0.7, out: 2.4, r: [20, 470, 730, 612] }, { at: 2.6, r: [25, 1010, 725, 1110] }],
  taps: [{ at: 3.25, x: 375, y: 1060 }],
});

// S5 — name + WhatsApp
scenes[ids[4]] = scene({
  ...base(4),
  caps: [{ at: 0.1, html: 'Tu nombre y tu <span class="k">WhatsApp</span>', mark: true }],
  screens: [{ src: 'assets/screens/t10-datos.jpg' }],
  hls: [{ at: 0.6, out: 1.85, r: [30, 715, 720, 1035] }, { at: 1.95, r: [30, 1140, 720, 1240] }],
});

// S6 — pickup or messenger
scenes[ids[5]] = scene({
  ...base(5),
  caps: [
    { at: 0.1, out: 1.75, html: '¿Cómo lo <span class="k">recibes</span>?', mark: true },
    { at: 1.95, out: 3.35, html: 'Lo recoges en la <span class="k">tienda</span>', mark: true },
    { at: 3.62, html: 'o te lo lleva un <span class="k">mensajero</span>', mark: true },
  ],
  screens: [
    { src: 'assets/screens/t08-entrega.jpg' },
    { src: 'assets/screens/t09-recogida.jpg', at: 2.05, outAt: 3.75 },
  ],
  hls: [
    { at: 0.45, out: 1.55, r: [30, 320, 725, 565] },
    { at: 2.3, out: 3.35, r: [30, 540, 725, 940] },
    { at: 3.95, r: [30, 322, 725, 440] },
  ],
  taps: [
    { at: 1.85, x: 375, y: 507, hold: 0.3 },
    { at: 3.6, x: 375, y: 468, hold: 0.3 },
  ],
});

// S7 — address + day
scenes[ids[6]] = scene({
  ...base(6),
  caps: [
    { at: 0.1, out: 2.25, html: 'Tu <span class="k">dirección</span>', mark: true },
    { at: 2.4, html: 'y el <span class="k">día</span> de entrega', mark: true },
  ],
  screens: [{ src: 'assets/screens/t11-direccion.jpg' }, { src: 'assets/screens/t12-dia.jpg', at: 2.3 }],
  hls: [{ at: 0.35, out: 1.2, r: [30, 490, 720, 820] }, { at: 1.3, out: 2.2, r: [30, 1150, 720, 1245] }, { at: 2.95, r: [25, 712, 725, 960] }],
  taps: [{ at: 2.7, x: 230, y: 875, hold: 0.3 }],
});

// S8 — payment (only what the checkout / product page show)
const picker = `
        <div class="dim" id="s08-dim"></div>
        <div id="s08-pick">
          <div class="pk-h">Moneda en que paga</div>
          <div class="pk-o" id="s08-o1">Dólares (USD)</div>
          <div class="pk-o" id="s08-o2">Pesos cubanos (CUP)</div>
          <div class="pk-o" id="s08-o3">Euros (EUR)</div>
        </div>
        <div id="s08-note"><div class="nt-ic">💬</div><div class="nt-t">Si pagas en pesos, <b>tu gestora te dice el cambio del día.</b></div></div>`;
scenes[ids[7]] = scene({
  ...base(7),
  caps: [
    { at: 0.1, out: 3.05, html: '<span class="k">Efectivo</span> o transferencia', mark: true },
    { at: 3.2, out: 5.85, html: 'En dólares, pesos o <span class="k">euros</span>', mark: true },
    { at: 6.0, html: 'En pesos: el <span class="k">cambio del día</span>', mark: true },
  ],
  screens: [{ src: 'assets/screens/t13-pago.jpg' }],
  hls: [{ at: 0.9, out: 2.9, r: [25, 505, 725, 740] }],
  screenExtra: picker,
  css: `
        #s08-pick { position: absolute; left: 40px; right: 40px; top: 560px; padding: 26px 0 14px; border-radius: 26px; background: #fffdf9; box-shadow: 0 22px 50px rgba(37, 35, 31, 0.35); z-index: 8; opacity: 0; }
        .pk-h { padding: 0 30px 14px; font-weight: 700; font-size: 26px; color: #6f6a62; border-bottom: 2px solid rgba(15, 61, 62, 0.1); }
        .pk-o { margin: 8px 14px 0; padding: 20px 18px; border-radius: 16px; font-weight: 700; font-size: 34px; color: #25231f; }
        #s08-note { position: absolute; left: 30px; right: 30px; top: 470px; padding: 30px 30px; border-radius: 26px; background: #0f3d3e; color: #f6f1e6; display: flex; gap: 20px; align-items: flex-start; box-shadow: 0 22px 50px rgba(37, 35, 31, 0.35); z-index: 9; opacity: 0; }
        .nt-ic { font-size: 54px; line-height: 1; }
        .nt-t { font-size: 38px; line-height: 1.3; font-weight: 600; }
        .nt-t b { font-weight: 800; color: #f3d9a4; }`,
  extraJs: `
          tl.fromTo("#s08-dim", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, 3.05);
          tl.fromTo("#s08-pick", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.4)" }, 3.1);
          tl.fromTo("#s08-o1", { backgroundColor: "rgba(195,148,67,0)" }, { backgroundColor: "rgba(195,148,67,0.28)", duration: 0.25, ease: "power1.out" }, 3.5);
          tl.fromTo("#s08-o1", { backgroundColor: "rgba(195,148,67,0.28)" }, { backgroundColor: "rgba(195,148,67,0)", duration: 0.25, ease: "power1.in", immediateRender: false }, 4.2);
          tl.fromTo("#s08-o2", { backgroundColor: "rgba(195,148,67,0)" }, { backgroundColor: "rgba(195,148,67,0.28)", duration: 0.25, ease: "power1.out" }, 4.25);
          tl.fromTo("#s08-o2", { backgroundColor: "rgba(195,148,67,0.28)" }, { backgroundColor: "rgba(195,148,67,0)", duration: 0.25, ease: "power1.in", immediateRender: false }, 5.05);
          tl.fromTo("#s08-o3", { backgroundColor: "rgba(195,148,67,0)" }, { backgroundColor: "rgba(195,148,67,0.28)", duration: 0.25, ease: "power1.out" }, 5.1);
          tl.fromTo("#s08-pick", { opacity: 1, y: 0 }, { opacity: 0, y: 40, duration: 0.3, ease: "power2.in", immediateRender: false }, 5.85);
          tl.fromTo("#s08-note", { opacity: 0, y: -60 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.5)" }, 6.05);`,
});

// S9 — review + done
scenes[ids[8]] = scene({
  ...base(8),
  caps: [
    { at: 0.1, out: 2.8, html: 'Revisa y <span class="k">finaliza</span>', mark: true },
    { at: 3.0, html: '¡Listo! <span class="k">Pedido hecho</span> ✅', mark: true },
  ],
  screens: [{ src: 'assets/screens/t15-revisa.jpg' }, { src: 'assets/screens/t16-listo.jpg', at: 2.85 }],
  hls: [{ at: 0.6, out: 1.85, r: [60, 515, 690, 1050] }, { at: 1.95, out: 2.75, r: [385, 1188, 678, 1275] }, { at: 3.25, r: [25, 455, 435, 525] }],
  taps: [{ at: 2.45, x: 530, y: 1232, hold: 0.3 }],
});

// S10 — the gestora writes to confirm
scenes[ids[9]] = scene({
  ...base(9), exit: 'phone',
  caps: [{ at: 0.1, html: 'Tu gestora te <span class="k">escribe</span>', mark: true }],
  screens: [{ src: 'assets/screens/t16-listo.jpg' }],
  hls: [{ at: 0.25, out: 0.95, r: [25, 730, 725, 845] }],
  screenExtra: `<div class="dim" id="s10-dim"></div><div class="ntf" id="s10-n1"><div class="ntf-ic"><svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path fill="#ffffff" d="M12 3C6.9 3 3 6.6 3 11c0 2.3 1.1 4.4 2.9 5.9L5 21l4.3-2.1c.9.2 1.8.3 2.7.3 5.1 0 9-3.6 9-8.1S17.1 3 12 3Z"/></svg></div><div class="ntf-b"><div class="ntf-h"><b>Tu gestora</b><span>ahora</span></div><div class="ntf-t">¡Hola! 😊 Ya vi tu pedido. Te escribo para <span class="mk" id="s10-m1"><i class="mk-bar" id="s10-m1-b"></i><span class="mk-t">confirmarlo</span></span>.</div></div></div>`,
  extraJs: `
          tl.fromTo("#s10-dim", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" }, 0.95);
          tl.fromTo("#s10-n1", { opacity: 0, y: -90 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.5)" }, 1.0);
          tl.fromTo("#s10-m1-b", { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: "power2.out" }, 2.6);`,
});

// S11 — closing
scenes[ids[10]] = scene({
  ...base(10),
  css: `
        #s11-block { position: absolute; left: 80px; right: 80px; top: 470px; display: flex; flex-direction: column; gap: 30px; }
        #s11-l1 { font-weight: 800; font-size: 130px; line-height: 1.02; letter-spacing: -0.03em; color: #0f3d3e; }
        #s11-rule { display: block; width: 300px; height: 14px; border-radius: 7px; background: #a35a24; transform-origin: left center; }
        #s11-l2 { font-weight: 700; font-size: 76px; line-height: 1.1; color: #25231f; }
        #s11-l2 .k2 { color: #a35a24; }
        #s11-steps { position: absolute; left: 80px; right: 80px; top: 1010px; display: flex; gap: 22px; }
        .s11-step { flex: 1; padding: 28px 18px; border-radius: 22px; background: #fffdf9; border: 3px solid rgba(15, 61, 62, 0.14); box-shadow: 0 14px 30px rgba(15, 61, 62, 0.1); display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .s11-ic { font-size: 64px; line-height: 1; }
        .s11-tx { font-weight: 800; font-size: 32px; color: #0f3d3e; }
        #s11-cta { position: absolute; left: 80px; right: 80px; top: 1330px; padding: 34px 40px; border-radius: 24px; background: #0f3d3e; color: #f6f1e6; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 24px 48px rgba(15, 61, 62, 0.25); }
        #s11-cta-t { font-weight: 800; font-size: 52px; }
        #s11-cta-s { font-weight: 700; font-size: 40px; color: #f3d9a4; }`,
  extra: `
        <div id="s11-block">
          <div id="s11-l1">¿Dudas?</div>
          <span id="s11-rule"></span>
          <div id="s11-l2">Escríbele a <span class="k2">tu gestora</span> 💬</div>
        </div>
        <div id="s11-steps"><div class="s11-step" id="s11-st1"><span class="s11-ic">🔗</span><span class="s11-tx">Su enlace</span></div><div class="s11-step" id="s11-st2"><span class="s11-ic">🛒</span><span class="s11-tx">Tu carrito</span></div><div class="s11-step" id="s11-st3"><span class="s11-ic">✅</span><span class="s11-tx">Tu pedido</span></div></div>
        <div id="s11-cta"><div id="s11-cta-t">¡Te esperamos! 🏡</div><div id="s11-cta-s">casaviva.company</div></div>`,
  extraJs: `
          tl.fromTo("#s11-l1", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.55, ease: "power4.out" }, 0.3);
          tl.fromTo("#s11-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "expo.out" }, 0.7);
          tl.fromTo("#s11-l2", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }, 1.0);
          tl.fromTo("#s11-st1", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.6)" }, 1.6);
          tl.fromTo("#s11-st2", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.6)" }, 1.85);
          tl.fromTo("#s11-st3", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.6)" }, 2.1);
          tl.fromTo("#s11-cta", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.55, ease: "back.out(1.4)" }, 2.85);`,
});

for (const id of ids) fs.writeFileSync(`${P}/compositions/${id}.html`, scenes[id]);

// ---------------- root index.html ----------------
const head = fs.readFileSync(`${P}/_work/head.html`, 'utf8').replace(/<title>.*<\/title>/, '<title>Tutorial: cómo comprar en Casa Viva</title>');
const sceneDivs = ids.map((id, i) => `      <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${cuts[i]}" data-duration="${dur(i)}" data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920"></div>`).join('\n');
const whooshes = cuts.slice(1, -1).map((c, i) => `      <audio id="sfx-whoosh-${i + 1}" src="assets/sfx/whoosh-short.mp3" data-start="${f2(c - 0.25)}" data-duration="0.57" data-track-index="5" data-audio-group="sfx" data-volume="0.3"></audio>`).join('\n');
const clickTags = clicks.sort((a, b) => a - b).map((t, i) => `      <audio id="sfx-click-${i + 1}" src="assets/sfx/click-soft.mp3" data-start="${t}" data-duration="0.36" data-track-index="6" data-audio-group="sfx" data-volume="0.55"></audio>`).join('\n');
const notifAt = f2(cuts[9] + 1.0);
const phoneStart = cuts[1];
const phoneDur = f2(cuts[10] - cuts[1]);
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
      <audio id="voz" src="assets/audio/voz.wav" data-start="0" data-duration="54.98" data-track-index="3" data-audio-group="voiceover" data-volume="1"></audio>
      <audio id="music-bed" src="assets/audio/musica.wav" data-start="0" data-duration="${TOTAL}" data-track-index="4" data-audio-group="music" data-volume="0.55"></audio>
${whooshes}
${clickTags}
      <audio id="sfx-notif-1" src="assets/sfx/notification.mp3" data-start="${notifAt}" data-duration="2.45" data-track-index="7" data-audio-group="sfx" data-volume="0.3"></audio>
    </div>
    <script>
      // root timeline: every scene and the background live in sub-compositions
      const tl = gsap.timeline({ paused: true });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync(`${P}/index.html`, index);
console.log('ok', ids.length, 'scenes; clicks', clicks.length, 'phone', phoneStart, phoneDur);
