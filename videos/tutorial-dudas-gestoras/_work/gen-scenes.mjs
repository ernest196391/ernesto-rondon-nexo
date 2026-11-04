// Genera index.html + compositions para tutorial-dudas-gestoras (tutorial 4, gestoras).
// Adaptado del generador de tutorial-como-comprar. Coordenadas de capturas en el marco 750x1624 (375x812 @2x).
// Tiempos alineados a assets/audio/voz-segmentos.json y whisper-final.json.
// Uso: node _work/gen-scenes.mjs .
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
      const style = s.fit ? ` style="height:auto;top:${SB + (s.dy || 0)}px"` : s.dy ? ` style="top:${SB + s.dy}px"` : '';
      inner.push(`<img class="shot" id="${id}-s${i}" src="${s.src}" alt=""${style} />`);
      if (s.at !== undefined) js.push(fadeIn(`#${id}-s${i}`, s.at));
      else if (i > 0) js.push(fadeIn(`#${id}-s${i}`, 0));
      if (s.outAt) js.push(fadeOut(`#${id}-s${i}`, s.outAt));
    });
    (cfg.overlays || []).forEach((o) => inner.push(o));
    (cfg.hls || []).forEach((h, i) => {
      const { X, Y } = geo(h.w);
      const [x1, y1, x2, y2] = h.r;
      const pad = 6;
      const dy = h.dy || 0;
      inner.push(`<div class="hl" id="${id}-h${i}" style="left:${X(x1) - pad}px;top:${Y(y1) + dy - pad}px;width:${X(x2) - X(x1) + 2 * pad}px;height:${Y(y2) - Y(y1) + 2 * pad}px"></div>`);
      js.push(`tl.fromTo("#${id}-h${i}", { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, ${h.at});`);
      js.push(fadeOut(`#${id}-h${i}`, h.out ?? dur - 0.3));
    });
    (cfg.taps || []).forEach((t, i) => {
      const { X, Y } = geo(t.w);
      const x = t.abs ? t.x : X(t.x);
      const y = t.abs ? t.y : Y(t.y) + (t.dy || 0);
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

// WhatsApp-style chat with the Casa Viva number (brand colours). msgs: {id, out?, html, at}
const chatBox = (id, msgs, opts = {}) => `
        <div class="chat" data-layout-allow-occlusion data-layout-allow-overlap id="${id}-chat"${opts.hidden ? ' style="opacity:0"' : ''}>
          <div class="chat-head" data-layout-allow-occlusion data-layout-allow-overlap><div class="chat-sb">10:24</div><div class="avatar"><img src="assets/logo/casa-viva-isotipo-crema.svg" alt="" /></div><div><div class="chat-title">Casa Viva</div><div class="chat-sub">en línea</div></div></div>
          <div class="chat-body"><div class="chat-col" id="${id}-col">
            <div class="day-chip" data-layout-allow-occlusion data-layout-allow-overlap>Hoy</div>
${msgs.map((m) => `            <div class="bubble${m.out ? ' out' : ''}" data-layout-allow-occlusion data-layout-allow-overlap id="${m.id}">${m.html}<span class="time">${m.time || '10:24'}${m.out ? ' <span class="ticks">✓✓</span>' : ''}</span></div>`).join('\n')}
          </div></div>
        </div>`;
const chatJs = (msgs, start) => msgs.map((m) => {
  if (m.out) clicks.push(f2(start + m.at - 0.02));
  return pop(`#${m.id}`, m.at, m.out ? 'top right' : 'top left');
}).join('\n          ');

// ---------------- timing (absolute seconds) ----------------
const seg = JSON.parse(fs.readFileSync(`${P}/assets/audio/voz-segmentos.json`, 'utf8'));
const TOTAL = seg.total; // 72.3
const cuts = [0, 4.3, 18.2, 29.26, 40.59, 56.18, 67.35, TOTAL];
const ids = ['s01-portada', 's02-acceso', 's03-enlace', 's04-pedidos', 's05-mensajero', 's06-recogida', 's07-cierre'];
const dur = (i) => f2(cuts[i + 1] - cuts[i]);
const base = (i) => ({ id: ids[i], dur: dur(i), start: cuts[i] });
const scenes = {};

// S1 — portada: logo horizontal + título en Cinzel
scenes[ids[0]] = scene({
  ...base(0),
  css: `
        #s01-logo { position: absolute; left: 50%; top: 250px; width: 600px; margin-left: -300px; display: block; }
        #s01-block { position: absolute; left: 70px; right: 70px; top: 560px; display: flex; flex-direction: column; align-items: center; gap: 34px; text-align: center; }
        #s01-eyebrow { display: inline-flex; padding: 14px 30px; border-radius: 999px; background: #0D3B45; color: #F6F1E6; font-weight: 600; font-size: 34px; }
        #s01-head { font-family: "Cinzel", Georgia, serif; font-weight: 600; font-size: 104px; line-height: 1.12; letter-spacing: 0.06em; color: #2B2420; text-transform: uppercase; }
        .s01-line { display: block; }
        #s01-rule { display: block; width: 260px; height: 10px; border-radius: 5px; background: #A35A1F; }
        #s01-sub { font-weight: 500; font-size: 58px; color: #0D3B45; }
        #s01-list { position: absolute; left: 90px; right: 90px; top: 1300px; display: flex; flex-wrap: wrap; justify-content: center; gap: 18px; }
        .s01-chip { padding: 16px 28px; border-radius: 999px; background: #fffdf9; border: 3px solid rgba(13, 59, 69, 0.18); font-weight: 500; font-size: 34px; color: #2B2420; }`,
  extra: `
        <img id="s01-logo" src="assets/logo/casa-viva-horizontal-marron.svg" alt="Casa Viva" />
        <div id="s01-block">
          <div id="s01-eyebrow">Para gestoras</div>
          <h1 id="s01-head"><span class="s01-line" id="s01-l1">Tus dudas</span><span class="s01-line" id="s01-l2">del primer día</span></h1>
          <span id="s01-rule"></span>
          <div id="s01-sub">resueltas</div>
        </div>
        <div id="s01-list"><span class="s01-chip" id="s01-p1">Tu área</span><span class="s01-chip" id="s01-p2">Tu enlace</span><span class="s01-chip" id="s01-p3">Tus pedidos</span><span class="s01-chip" id="s01-p4">Mensajero y CUP</span><span class="s01-chip" id="s01-p5">Recogida</span></div>`,
  extraJs: `
          tl.fromTo("#s01-logo", { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.05);
          tl.fromTo("#s01-eyebrow", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, 0.3);
          tl.fromTo("#s01-l1", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.55, ease: "power4.out" }, 0.45);
          tl.fromTo("#s01-l2", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.55, ease: "power4.out" }, 0.62);
          tl.fromTo("#s01-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "expo.out" }, 1.0);
          tl.fromTo("#s01-sub", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, 1.2);
          ${[1, 2, 3, 4, 5].map((n) => `tl.fromTo("#s01-p${n}", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.6)" }, ${f2(1.6 + n * 0.18)});`).join('\n          ')}
          tl.fromTo("#s01-logo", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power2.in", immediateRender: false }, 3.95);
          tl.fromTo("#s01-block", { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.35, ease: "power2.in", immediateRender: false }, 3.9);
          tl.fromTo("#s01-list", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power2.in", immediateRender: false }, 3.95);`,
});

// S2 — mi acceso: chat → página de entrada (pública) con usuario = WhatsApp + contraseña
const s2msgs = [
  { id: 's02-m1', out: true, at: 2.2, html: 'mi acceso' },
  { id: 's02-m2', at: 3.1, html: `🔑 ${BL()}, toca este enlace para entrar a tu panel sin contraseña (<span class="mk" id="s02-mk1"><i class="mk-bar"></i><span class="mk-t">sirve 7 días, una sola vez</span></span>; no lo compartas):<br><span class="lnk">casaviva.company/${BL('xxxxxxxxxxxxxxxx')}</span><br><br>Si se te vence, escríbeme <b>mi acceso</b> otra vez.` },
];
scenes[ids[1]] = scene({
  ...base(1), enter: 'phone',
  eyebrow: ['1', 'Entrar a tu área'],
  caps: [
    { at: 0.2, out: 6.75, html: 'Escríbeme <span class="k">«mi acceso»</span>' },
    { at: 7.0, out: 9.7, html: 'Tu contraseña, en <span class="k">Mi perfil</span>' },
    { at: 9.9, html: 'Luego: tu <span class="k">WhatsApp</span> y tu contraseña' },
  ],
  screens: [{ src: 'assets/screens/a01-area.jpg', at: 6.8 }],
  overlays: [
    `<div class="typed" id="s02-u" style="left:${geo().X(130)}px;top:${geo().Y(268)}px">53 5XXX XXXX</div>`,
    `<div class="typed" id="s02-p" style="left:${geo().X(130)}px;top:${geo().Y(448)}px">••••••••</div>`,
  ],
  hls: [
    { at: 7.4, out: 9.75, r: [100, 880, 645, 1075] },
    { at: 10.3, out: 12.3, r: [108, 245, 642, 343] },
    { at: 12.5, r: [108, 425, 642, 523] },
  ],
  screenExtra: chatBox('s02', s2msgs),
  css: `
        #s02-chat { position: absolute; left: 0; top: 0; width: 620px; height: 1388px; z-index: 6; }`,
  extraJs: `
          ${sbHide('s02-acceso', 0, 7.12)}
          ${chatJs(s2msgs, cuts[1])}
          tl.fromTo("#s02-mk1 .mk-bar", { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power2.out" }, 4.7);
          tl.fromTo("#s02-chat", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: "power1.in", immediateRender: false }, 6.8);
          ${fadeIn('#s02-u', 10.6, 0.3)}
          ${fadeIn('#s02-p', 12.7, 0.3)}`,
});

// S3 — mi enlace: la tienda con su nombre (difuminado) → chat «mi enlace» → no hace falta Clientes
const s3msgs = [
  { id: 's03-m1', out: true, at: 4.6, html: 'mi enlace' },
  { id: 's03-m2', at: 5.3, html: `🔗 ${BL()}, este es <b>tu enlace de ventas</b> (tu tienda):<br><span class="lnk">casaviva.company/tienda/?ref=${BL('XXXXXXXX')}</span><br><br>Compártelo con tus clientes: <span class="mk" id="s03-mk1"><i class="mk-bar"></i><span class="mk-t">todo lo que compren desde ahí queda a tu nombre</span></span> y suma a tu comisión 💛<br>Este enlace <span class="mk" id="s03-mk2"><i class="mk-bar"></i><span class="mk-t">no caduca nunca</span></span>. El que dura 7 días es otro: el de <b>entrar a tu área</b> (escríbeme <b>mi acceso</b> si se te vence).` },
];
scenes[ids[2]] = scene({
  ...base(2),
  eyebrow: ['2', 'Tu enlace de la tienda'],
  caps: [
    { at: 0.1, out: 4.3, html: 'Tu enlace <span class="k">no caduca nunca</span>' },
    { at: 4.5, out: 8.0, html: 'Pídelo: <span class="k">«mi enlace»</span>' },
    { at: 8.2, html: 'No hace falta añadirlo en <span class="k">Clientes</span>' },
  ],
  screens: [{ src: 'assets/screens/t01-tienda.jpg' }],
  hls: [{ at: 0.6, out: 4.1, r: [48, 365, 702, 645] }],
  screenExtra: chatBox('s03', s3msgs, { hidden: true }) + `
        <div class="dim" data-layout-allow-occlusion id="s03-dim"></div>
        <div class="card" data-layout-allow-occlusion data-layout-allow-overlap id="s03-card"><div class="card-ic">✓</div><div class="card-t">Lo que compren con tu enlace <b>ya es tuyo</b>.<br>No tienes que añadir al cliente en <b>Clientes</b>.</div></div>`,
  css: `
        #s03-chat { position: absolute; left: 0; top: 0; width: 620px; height: 1388px; z-index: 6; }
        #s03-dim { z-index: 7; }
        #s03-card { top: 330px; }`,
  extraJs: `
          ${fadeIn('#s03-chat', 4.3, 0.3)}
          ${sbHide('s03-enlace', 4.45)}
          ${chatJs(s3msgs, cuts[2])}
          tl.fromTo("#s03-mk2 .mk-bar", { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power2.out" }, 5.8);
          tl.fromTo("#s03-mk1 .mk-bar", { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power2.out" }, 6.9);
          tl.fromTo("#s03-col", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: "power1.in", immediateRender: false }, 8.0);
          ${fadeIn('#s03-dim', 8.1, 0.3)}
          tl.fromTo("#s03-card", { opacity: 0, y: -60 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.5)" }, 8.2);`,
});

// S4 — ¿cómo va mi pedido?: «#2903» y «mis pedidos» (respuestas reales del bot) + avisos de cada paso
const usd = (v) => `<span class="price">${v} USD</span>`;
const s4msgs = [
  { id: 's04-m1', out: true, at: 1.7, html: '#2903' },
  { id: 's04-m2', at: 2.3, html: `📦 Pedido <b>#2903</b> · Cliente (11/10)<br>🕐 Para recoger · la tienda lo está preparando<br>🏬 Recogida en tienda<br>💵 A pagar en la tienda: ${usd('40.00')}<br>🧺 2 × Cintas de luces bluetooth con RGB (5m)` },
  { id: 's04-m3', out: true, at: 3.0, html: 'mis pedidos' },
  { id: 's04-m4', at: 3.6, html: `📋 ${BL()}, tus pedidos abiertos (2):<br><br>📦 <b>#2920</b> Cliente — Listo para recoger en la tienda — ${usd('33.00')}<br>🕐 <b>#2903</b> Cliente — Para recoger · la tienda lo está preparando — ${usd('40.00')}<br><br>Para ver uno entero, escríbeme su número, por ejemplo <b>#2920</b>.` },
];
const ntf = (id, html) => `<div class="ntf" data-layout-allow-occlusion data-layout-allow-overlap id="${id}"><div class="ntf-ic"><span class="ntf-logo"></span></div><div class="ntf-b"><div class="ntf-h"><b>Casa Viva</b><span>ahora</span></div><div class="ntf-t">${html}</div></div></div>`;
const NUM = `#${BL('0000')}`;
scenes[ids[3]] = scene({
  ...base(3),
  eyebrow: ['3', '¿Cómo va mi pedido?'],
  caps: [
    { at: 0.1, out: 5.4, html: 'Escríbeme el <span class="k">número</span> o «mis pedidos»' },
    { at: 5.6, html: 'Te avisamos de <span class="k">cada paso</span>' },
  ],
  screenExtra: chatBox('s04', s4msgs) + `
        <div class="dim" data-layout-allow-occlusion id="s04-dim"></div>
        ${ntf('s04-n1', `📦 Tu pedido <b>${NUM}</b> ya está <b>listo</b> en la tienda. Estamos buscando mensajero; te aviso en cuanto lo coja.`)}
        ${ntf('s04-n2', `🛵 Tu pedido <b>${NUM}</b> ya lo tiene <b>${BL()}</b> (📞 ${BL('+53 0000 0000')}). Te aviso la hora en cuanto me la diga.`)}
        ${ntf('s04-n3', `✅ Tu pedido <b>${NUM}</b> (cliente: Cliente) <b>fue entregado</b> por ${BL()}. ¡Gracias, tu comisión queda pendiente del cierre de caja! 💛`)}`,
  css: `
        #s04-chat { position: absolute; left: 0; top: 0; width: 620px; height: 1388px; z-index: 6; }
        #s04-chat .bubble { font-size: 25px; }
        #s04-dim { z-index: 7; }
        #s04-n1 { top: 180px; } #s04-n2 { top: 410px; } #s04-n3 { top: 640px; }`,
  extraJs: `
          ${sbHide('s04-pedidos', 0)}
          ${chatJs(s4msgs, cuts[3])}
          tl.fromTo("#s04-col", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.35, ease: "power1.in", immediateRender: false }, 5.5);
          ${fadeIn('#s04-dim', 5.55, 0.35)}
          tl.fromTo("#s04-n1", { opacity: 0, y: -70 }, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.5)" }, 7.6);
          tl.fromTo("#s04-n2", { opacity: 0, y: -70 }, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.5)" }, 9.1);
          tl.fromTo("#s04-n3", { opacity: 0, y: -70 }, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.5)" }, 10.35);`,
});
notifs.push(f2(cuts[3] + 7.6), f2(cuts[3] + 9.1), f2(cuts[3] + 10.35));

// S5 — mensajero de confianza en la nota + precio en CUP + «tasa de hoy»
const s5msgs = [
  { id: 's05-m1', out: true, at: 11.8, html: 'tasa de hoy' },
  { id: 's05-m2', at: 12.5, html: `💱 <b>Tasa de hoy</b> (${BL('11/10 9:00')}):<br>• CUP: 1 USD = <b>${BL('000')} CUP</b><br>• Euro: precio × ${BL('0,0')}<br>• Tarjeta Clásica: precio × ${BL('0,0')}<br>• Zelle: precio × ${BL('0,0')}<br>• PayPal: precio + ${BL('0')} %<br>Ejemplo: 10 USD = ${BL('0000')} CUP. <span class="mk" id="s05-mk1"><i class="mk-bar"></i><span class="mk-t">La calculadora de tu área ya la usa.</span></span><br><br>📋 <b>Datos para pagar</b> (mensaje de la tienda en el grupo General):<br>${BL('Xxxxxxx xxxxx xxxx xxxxxxx xxxx')}<br>${BL('Xxxxx xxxxxxxx xxxx xxxxx')}` },
];
const gi = geo(744);
scenes[ids[4]] = scene({
  ...base(4),
  eyebrow: ['4', 'Tu mensajero y el cobro en CUP'],
  caps: [
    { at: 0.1, out: 5.3, html: 'En la nota: <span class="k">mensajero: Nombre</span>' },
    { at: 5.5, out: 10.85, html: 'Precio en CUP con la <span class="k">tasa del día</span>' },
    { at: 11.05, html: 'Escríbeme <span class="k">«tasa de hoy»</span>' },
  ],
  screens: [
    { src: 'assets/screens/n01-nota-vacia.jpg', outAt: 5.45 },
    { src: 'assets/screens/n02-nota.jpg', at: 3.3, outAt: 5.45 },
    { src: 'assets/screens/gestora-inicio.jpg', at: 5.45, fit: true },
  ],
  hls: [
    { at: 3.5, out: 5.3, r: [30, 600, 720, 712] },
    { at: 8.7, out: 10.9, w: 744, r: [160, 785, 490, 880] },
  ],
  taps: [{ at: 2.6, x: 375, y: 656, hold: 0.35 }],
  screenExtra: chatBox('s05', s5msgs, { hidden: true }),
  css: `
        #s05-scr .shot:nth-of-type(1) { }
        #s05-chat { position: absolute; left: 0; top: 0; width: 620px; height: 1388px; z-index: 6; }
        #s05-chat .bubble { font-size: 25px; }`,
  extraJs: `
          ${fadeIn('#s05-chat', 10.95, 0.3)}
          ${sbHide('s05-mensajero', 11.1)}
          ${chatJs(s5msgs, cuts[4])}
          tl.fromTo("#s05-mk1 .mk-bar", { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power2.out" }, 13.4);`,
});

// S6 — recogida: horario en el checkout (público) → página Cómo llegar
scenes[ids[5]] = scene({
  ...base(5), exit: 'phone',
  eyebrow: ['5', 'Recogida en la tienda'],
  caps: [
    { at: 0.1, out: 4.6, html: 'De <span class="k">10 a. m. a 5 p. m.</span>' },
    { at: 4.8, out: 8.1, html: 'Almuerzo: <span class="k">de 1 a 1 y media</span>' },
    { at: 8.3, html: 'Pásale la página <span class="k">Cómo llegar</span>' },
  ],
  screens: [
    { src: 'assets/screens/n00-recogida.jpg' },
    { src: 'assets/screens/l01-como-llegar.jpg', at: 8.2 },
  ],
  hls: [
    { at: 0.5, out: 1.9, r: [30, 540, 720, 652] },
    { at: 2.1, out: 4.6, r: [28, 762, 712, 808] },
    { at: 4.8, out: 8.0, r: [28, 806, 712, 852] },
    { at: 8.5, out: 9.9, r: [20, 300, 730, 680] },
    { at: 10.0, r: [24, 898, 398, 996] },
  ],
  css: `
        #s06-recogida-scr { }`,
});

// S7 — cierre: ASÍ DE FÁCIL + logo vertical + ¿Dudas? Escríbeme
scenes[ids[6]] = scene({
  ...base(6),
  css: `
        #s07-title { position: absolute; left: 60px; right: 60px; top: 190px; text-align: center; font-family: "Cinzel", Georgia, serif; font-weight: 600; font-size: 84px; letter-spacing: 0.08em; color: #2B2420; }
        #s07-lead { position: absolute; left: 60px; right: 60px; top: 330px; text-align: center; font-weight: 500; font-size: 42px; color: #2B2420; }
        #s07-grid { position: absolute; left: 90px; right: 90px; top: 410px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .s07-c { padding: 24px 18px; border-radius: 22px; background: #0D3B45; color: #F6F1E6; text-align: center; font-weight: 600; font-size: 40px; }
        #s07-logo { position: absolute; left: 50%; top: 820px; width: 440px; margin-left: -220px; display: block; }
        #s07-q { position: absolute; left: 60px; right: 60px; top: 1170px; text-align: center; font-weight: 600; font-size: 76px; color: #0D3B45; }
        #s07-url { position: absolute; left: 60px; right: 60px; top: 1280px; text-align: center; font-weight: 500; font-size: 46px; color: #2B2420; }`,
  extra: `
        <div id="s07-title">ASÍ DE FÁCIL</div>
        <div id="s07-lead">Escríbeme:</div>
        <div id="s07-grid"><div class="s07-c" id="s07-c1">mi acceso</div><div class="s07-c" id="s07-c2">mi enlace</div><div class="s07-c" id="s07-c3">mis pedidos</div><div class="s07-c" id="s07-c4">tasa de hoy</div></div>
        <img id="s07-logo" src="assets/logo/casa-viva-vertical-marron.svg" alt="Casa Viva" />
        <div id="s07-q">¿Dudas? Escríbeme.</div>
        <div id="s07-url">casaviva.company</div>`,
  extraJs: `
          tl.fromTo("#s07-title", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: "power4.out" }, 0.1);
          tl.fromTo("#s07-lead", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, 0.35);
          ${[1, 2, 3, 4].map((n) => `tl.fromTo("#s07-c${n}", { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.6)" }, ${f2(0.2 + n * 0.08)});`).join('\n          ')}
          tl.fromTo("#s07-logo", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.75);
          tl.fromTo("#s07-q", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.4)" }, 0.8);
          tl.fromTo("#s07-url", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" }, 1.4);`,
});

for (const id of ids) fs.writeFileSync(`${P}/compositions/${id}.html`, scenes[id]);

// ---------------- subtítulos (whisper-final.json, palabra por palabra) ----------------
// Cada subtítulo = trozo exacto del guion. [ ] = palabra clave (crema sobre ámbar).
const CUES = [
  [0, 'Estas son las [dudas] que más me preguntaron el primer día.'],
  [1, 'Para entrar a tu área, escríbeme: [mi acceso].'],
  [1, 'El enlace sirve [7 días], y una sola vez.'],
  [1, 'Dentro, pon tu contraseña en [Mi perfil].'],
  [1, 'Después entras con tu número de WhatsApp y [esa contraseña].'],
  [2, 'Tu enlace de la tienda [no caduca nunca].'],
  [2, 'Pídelo escribiendo: [mi enlace].'],
  [2, 'Todo lo que compren por ahí [es tuyo],'],
  [2, 'y no tienes que añadir al cliente en [Clientes].'],
  [3, '¿Cómo va un pedido?'],
  [3, 'Escríbeme su número, o: [mis pedidos],'],
  [3, 'y te digo cómo está.'],
  [3, 'Y te avisamos cuando la tienda lo tiene [listo],'],
  [3, 'cuando lo coge un [mensajero],'],
  [3, 'y cuando [se entrega].'],
  [4, '¿Tienes un mensajero de confianza?'],
  [4, 'En la nota del pedido pon: [mensajero, y su nombre].'],
  [4, 'En tu área, la [calculadora] te da el precio en pesos,'],
  [4, 'con la [tasa del día].'],
  [4, 'Y si me escribes: [tasa de hoy],'],
  [4, 'te la mando, con los datos para pagar.'],
  [5, 'Para recoger en la tienda:'],
  [5, 'de [10 de la mañana a 5 de la tarde].'],
  [5, 'De una a una y media es el [almuerzo].'],
  [5, 'Pásale a tu cliente la página [Cómo llegar].'],
  [6, '¿Dudas? [Escríbeme].'],
];
const words = JSON.parse(fs.readFileSync(`${P}/assets/audio/whisper-final.json`, 'utf8')).words;
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const NUMW = { 7: 'siete', 10: '10', 5: '5' };
let wi = 0;
const cues = CUES.map(([sg, text], ci) => {
  const toks = text.replace(/[[\]]/g, '').split(/\s+/).filter(Boolean);
  const i0 = wi;
  toks.forEach((t) => {
    const w = words[wi];
    const a = norm(t), b = norm(w.word);
    if (a !== b && norm(NUMW[a] || a) !== b) console.warn(`  ! cue ${ci}: guion «${t}» ↔ whisper «${w.word}»`);
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
      .price { color: #A35A1F; font-weight: 600; }
      .ticks { color: #0D3B45; font-size: 19px; }
      .chat-head { background: #0D3B45; }
      .chat-sb { position: absolute; left: 38px; top: 10px; font-weight: 600; font-size: 22px; color: #F6F1E6; }
      .avatar { background: #0D3B45; border: 3px solid rgba(246, 241, 230, 0.6); }
      .avatar img { width: 46px; height: 46px; display: block; }
      .chat-body { background-color: #ece5d6; background-image: radial-gradient(rgba(13, 59, 69, 0.07) 2px, transparent 2.5px); }
      .chat-col { display: flex; flex-direction: column; gap: 16px; }
      .bubble { font-size: 27px; color: #2B2420; }
      .bubble b { font-weight: 600; }
      .bubble.out { font-weight: 500; font-size: 30px; }
      .typed { position: absolute; z-index: 5; font-weight: 500; font-size: 26px; color: #2B2420; opacity: 0; }
      .ntf-ic { background: #0D3B45; }
      .ntf-logo { width: 36px; height: 37px; display: block; background: url("assets/logo/casa-viva-isotipo-compacto-crema.svg") center / contain no-repeat; }
      .ntf-h b { font-weight: 600; }
      .ntf-t { font-size: 26px; }
      .ntf-t b { font-weight: 600; }
      .card { position: absolute; left: 26px; right: 26px; padding: 34px 32px; border-radius: 28px; background: #0D3B45; color: #F6F1E6; display: flex; gap: 22px; align-items: flex-start; box-shadow: 0 22px 50px rgba(43, 36, 32, 0.35); z-index: 9; opacity: 0; }
      .card-ic { flex: 0 0 auto; width: 64px; height: 64px; border-radius: 50%; background: #F6F1E6; color: #0D3B45; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 40px; }
      .card-t { font-size: 36px; line-height: 1.3; font-weight: 500; }
      .card-t b { font-weight: 600; }
    </style>`;
const head = fs.readFileSync(`${P}/_work/head.html`, 'utf8')
  .replace(/<title>.*<\/title>/, '<title>Tutorial: tus dudas del primer día</title>')
  .replace('</style>', EXTRA_CSS);
const sceneDivs = ids.map((id, i) => `      <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${cuts[i]}" data-duration="${dur(i)}" data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920"></div>`).join('\n');
const whooshes = cuts.slice(1, -1).map((c, i) => `      <audio id="sfx-whoosh-${i + 1}" src="assets/sfx/whoosh-short.mp3" data-start="${f2(c - 0.25)}" data-duration="0.57" data-track-index="5" data-audio-group="sfx" data-volume="0.3"></audio>`).join('\n');
const clickTags = clicks.sort((a, b) => a - b).map((t, i) => `      <audio id="sfx-click-${i + 1}" src="assets/sfx/click-soft.mp3" data-start="${t}" data-duration="0.36" data-track-index="6" data-audio-group="sfx" data-volume="0.55"></audio>`).join('\n');
const notifTags = notifs.map((t, i) => `      <audio id="sfx-notif-${i + 1}" src="assets/sfx/notification.mp3" data-start="${t}" data-duration="1.2" data-track-index="7" data-audio-group="sfx" data-volume="0.3"></audio>`).join('\n');
const phoneStart = cuts[1];
const phoneDur = f2(cuts[6] - cuts[1]);
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
console.log('ok', ids.length, 'scenes; cues', cues.length, '; clicks', clicks.length, '; phone', phoneStart, phoneDur);
