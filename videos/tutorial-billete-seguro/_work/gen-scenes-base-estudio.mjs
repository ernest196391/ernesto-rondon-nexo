// Genera index.html + compositions para tutorial-estudio-fotos (tutorial «Mi estudio de fotos», gestoras).
// Adaptado del generador de tutorial-nexo-busca. Todas las capturas en el marco 750x1624 (375x812 @2x).
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
const TOTAL = seg.total; // 54.77
// cortes a ~0,3 s antes de que empiece la voz de la escena siguiente
const cuts = [0, 3.22, 13.3, 21.39, 26.65, 30.97, 40.81, 45.23, 49.75, TOTAL];
const ids = ['s01-gancho', 's02-lo-pidieron', 's03-antes-despues', 's04-donde-esta', 's05-producto', 's06-gemini', 's07-subir', 's08-galeria', 's09-cierre'];
const dur = (i) => f2(cuts[i + 1] - cuts[i]);
const base = (i) => ({ id: ids[i], dur: dur(i), start: cuts[i] });
const scenes = {};
const SCR = 'assets/screens';

// S1 — gancho (0–3,2 s)
scenes[ids[0]] = scene({
  ...base(0),
  css: `
        #s01-logo { position: absolute; left: 50%; top: 200px; width: 560px; margin-left: -280px; display: block; }
        #s01-block { position: absolute; left: 70px; right: 70px; top: 470px; display: flex; flex-direction: column; align-items: center; gap: 34px; text-align: center; }
        #s01-eyebrow { display: inline-flex; padding: 14px 30px; border-radius: 999px; background: #0D3B45; color: #F6F1E6; font-weight: 600; font-size: 34px; }
        #s01-head { font-weight: 600; font-size: 90px; line-height: 1.12; letter-spacing: -0.02em; color: #2B2420; text-wrap: balance; }
        #s01-head b { font-weight: 600; color: #0D3B45; }
        #s01-rule { display: block; width: 260px; height: 10px; border-radius: 5px; background: #A35A1F; }
        #s01-title { font-family: "Cinzel", Georgia, serif; font-weight: 600; font-size: 86px; line-height: 1.12; letter-spacing: 0.06em; color: #0D3B45; }`,
  extra: `
        <img id="s01-logo" src="assets/logo/casa-viva-horizontal-marron.svg" alt="Casa Viva" />
        <div id="s01-block">
          <div id="s01-eyebrow">Nuevo · Para gestoras</div>
          <h1 id="s01-head">¿Tu foto sale <b>oscura</b>, o el producto sale <b>en su caja</b>?</h1>
          <span id="s01-rule"></span>
          <div id="s01-title">MI ESTUDIO<br />DE FOTOS</div>
        </div>`,
  extraJs: `
          tl.fromTo("#s01-logo", { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.0);
          tl.fromTo("#s01-eyebrow", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 0.1);
          tl.fromTo("#s01-head", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.5, ease: "power4.out" }, 0.2);
          tl.fromTo("#s01-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "expo.out" }, 1.4);
          tl.fromTo("#s01-title", { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, 1.6);
          tl.fromTo("#s01-logo", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power2.in", immediateRender: false }, 2.92);
          tl.fromTo("#s01-block", { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.28, ease: "power2.in", immediateRender: false }, 2.92);`,
});

// S2 — nos lo dijeron (chats recreados con el texto real; nombre de pila, sin teléfonos)
const MIC = '<svg class="mic" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const s2a = [
  { id: 's02-a1', at: 0.5, time: '11:08', html: 'La tienda está oscura ahora mismo 😂' },
  { id: 's02-a2', at: 2.9, time: '11:09', cls: 'vnote', html: `<span class="vn">${MIC}<span class="vn-wave"></span><span class="vn-t">0:09</span></span><span class="vn-tx">«…mi teléfono no tira buenas fotos, pero bueno, ya se las tiro así»</span>` },
];
const s2b = [
  { id: 's02-b1', at: 5.6, time: '16:13', html: 'Fotos de todas las cortinas de Baño para enviar a un cliente' },
];
scenes[ids[1]] = scene({
  ...base(1), enter: 'phone',
  eyebrow: ['', 'Nos lo dijeron'],
  caps: [
    { at: 0.15, out: 5.05, html: 'Nana: <span class="k">la tienda está oscura</span>' },
    { at: 5.25, out: 8.7, html: 'Dayami: <span class="k">fotos para un cliente</span>' },
    { at: 8.9, html: 'Las <span class="k">escuchamos</span>' },
  ],
  screenExtra: chatBox('s02a', s2a, { title: 'Nana', sub: 'tienda Casa Viva', avatar: 'N', day: '12 oct' }) + chatBox('s02b', s2b, { hidden: true, title: 'Dayami', sub: 'gestora', avatar: 'D', day: '13 oct' }) + `
          <div class="card" id="s02-card" style="top:520px"><span class="card-ic">✓</span><span class="card-t"><b>Las escuchamos.</b><br>Ahora haces tú las fotos bonitas.</span></div>`,
  css: `
        #s02a-chat, #s02b-chat { position: absolute; left: 0; top: 0; width: 620px; height: 1388px; z-index: 10; }
        #s02-card { z-index: 12; }
        .vnote { min-width: 420px; }
        .vn { display: flex; align-items: center; gap: 14px; color: #0D3B45; margin-bottom: 10px; }
        .vn .mic { width: 34px; height: 34px; flex: 0 0 auto; }
        .vn-wave { flex: 1 1 auto; height: 26px; border-radius: 13px; background: repeating-linear-gradient(90deg, rgba(13, 59, 69, 0.55) 0 4px, transparent 4px 9px); }
        .vn-t { font-size: 22px; color: #6b5f57; }
        .vn-tx { display: block; font-style: italic; font-size: 26px; color: #2B2420; }`,
  extraJs: `
          ${chatJs(s2a, cuts[1])}
          ${fadeIn('#s02b-chat', 5.3, 0.3)}
          ${chatJs(s2b, cuts[1])}
          tl.fromTo("#s02-card", { opacity: 0, y: 40, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.5)" }, 8.9);`,
});
notifs.push(f2(cuts[1] + 0.5), f2(cuts[1] + 5.6));

// S3 — la solución: ANTES / DESPUÉS en grande (foto real que hizo Dany con su estudio el 14-oct)
const CARD = 940;
scenes[ids[2]] = scene({
  ...base(2),
  eyebrow: ['', 'La solución'],
  caps: [
    { at: 0.15, out: 2.0, html: 'Tu <span class="k">estudio de fotos</span>' },
    { at: 2.1, out: 4.5, html: 'Foto normal → <span class="k">foto bonita</span>' },
    { at: 4.6, html: 'La hizo <span class="k">Dany</span>' },
  ],
  css: `
        #s03-card { position: absolute; left: 70px; top: 430px; width: ${CARD}px; height: ${CARD}px; border-radius: 36px; overflow: hidden; background: #2B2420; box-shadow: 0 30px 70px rgba(43, 36, 32, 0.32); }
        #s03-card img { position: absolute; left: 0; top: 0; width: ${CARD}px; height: ${CARD}px; display: block; }
        #s03-mask { position: absolute; left: 0; top: 0; width: ${CARD}px; height: ${CARD}px; overflow: hidden; }
        #s03-line { position: absolute; left: -3px; top: 0; width: 6px; height: ${CARD}px; background: #F6F1E6; box-shadow: 0 0 18px rgba(43, 36, 32, 0.45); }
        #s03-knob { position: absolute; left: -31px; top: ${CARD / 2 - 34}px; width: 68px; height: 68px; border-radius: 50%; background: #F6F1E6; color: #0D3B45; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 22px rgba(43, 36, 32, 0.35); }
        #s03-knob svg { width: 40px; height: 40px; }
        .s03-tag { position: absolute; top: 26px; padding: 12px 26px; border-radius: 999px; font-weight: 600; font-size: 34px; letter-spacing: 0.06em; }
        #s03-tag-a { left: 26px; background: #2B2420; color: #F6F1E6; }
        #s03-tag-d { right: 26px; background: #A35A1F; color: #F6F1E6; }
        #s03-note { position: absolute; left: 70px; right: 70px; top: ${430 + CARD + 30}px; text-align: center; font-weight: 500; font-size: 34px; line-height: 1.3; color: #2B2420; }
        #s03-note b { font-weight: 600; color: #0D3B45; }`,
  extra: `
        <div id="s03-card" data-layout-allow-overflow>
          <img id="s03-before" src="${SCR}/antes.jpg" alt="Antes" />
          <div id="s03-mask"><img id="s03-after" src="${SCR}/despues.jpg" alt="Después" /></div>
          <div id="s03-line"><span id="s03-knob"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
          <span class="s03-tag" id="s03-tag-a">ANTES</span>
          <span class="s03-tag" id="s03-tag-d">DESPUÉS</span>
        </div>
        <div id="s03-note">Set para baño 3 piezas · <b>hecha con Gemini, gratis</b></div>`,
  extraJs: `
          tl.fromTo("#s03-card", { opacity: 0, scale: 0.92, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: "power3.out" }, 0.2);
          tl.fromTo("#s03-tag-a", { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.35, ease: "power3.out" }, 0.7);
          tl.fromTo("#s03-mask", { x: ${CARD} }, { x: 0, duration: 1.0, ease: "power2.inOut" }, 2.85);
          tl.fromTo("#s03-after", { x: -${CARD} }, { x: 0, duration: 1.0, ease: "power2.inOut" }, 2.85);
          tl.fromTo("#s03-line", { x: ${CARD} }, { x: 0, duration: 1.0, ease: "power2.inOut" }, 2.85);
          tl.fromTo("#s03-line", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none" }, 2.85);
          tl.fromTo("#s03-line", { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "none", immediateRender: false }, 3.7);
          tl.fromTo("#s03-line", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none", immediateRender: false }, 5.95);
          tl.fromTo("#s03-tag-a", { opacity: 1 }, { opacity: 0, duration: 0.2, ease: "power1.in", immediateRender: false }, 3.0);
          tl.fromTo("#s03-tag-d", { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.35, ease: "power3.out" }, 3.6);
          tl.fromTo("#s03-after", { scale: 1 }, { scale: 1.05, duration: 2.0, ease: "sine.inOut", immediateRender: false }, 3.85);
          tl.fromTo("#s03-note", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 4.7);
          tl.fromTo("#s03-mask", { x: 0 }, { x: ${CARD / 2}, duration: 0.9, ease: "power2.inOut", immediateRender: false }, 5.95);
          tl.fromTo("#s03-after", { x: 0, scale: 1.05 }, { x: -${CARD / 2}, scale: 1, duration: 0.9, ease: "power2.inOut", immediateRender: false }, 5.95);
          tl.fromTo("#s03-line", { x: 0 }, { x: ${CARD / 2}, duration: 0.9, ease: "power2.inOut", immediateRender: false }, 5.95);
          tl.fromTo("#s03-tag-a", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out", immediateRender: false }, 6.5);
          tl.fromTo("#s03-card", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power1.in", immediateRender: false }, ${f2(dur(2) - 0.3)});
          tl.fromTo("#s03-note", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power1.in", immediateRender: false }, ${f2(dur(2) - 0.3)});`,
});

// S4 — dónde está: menú → Herramientas → Mi estudio de fotos
scenes[ids[3]] = scene({
  ...base(3), enter: 'phone',
  eyebrow: ['', 'Dónde está'],
  caps: [
    { at: 0.1, out: 2.1, html: 'En tu área, abre <span class="k">el menú</span>' },
    { at: 2.25, html: 'Toca <span class="k">Mi estudio de fotos</span>' },
  ],
  screens: [
    { src: `${SCR}/ef-home.jpg` },
    { src: `${SCR}/ef-menu.jpg`, at: 1.75 },
  ],
  hls: [
    { at: 0.9, out: 1.7, r: [20, 20, 96, 96] },
    { at: 2.2, out: 3.0, r: [20, 730, 580, 776] },
    { at: 3.1, r: [20, 1112, 580, 1192] },
  ],
  taps: [
    { at: 1.5, x: 56, y: 57, hold: 0.25 },
    { at: 4.2, x: 250, y: 1152, hold: 0.35 },
  ],
});

// S5 — paso 1: busca tu producto y elige la idea
scenes[ids[4]] = scene({
  ...base(4),
  eyebrow: ['1', 'Producto e idea'],
  caps: [
    { at: 0.1, out: 1.4, html: 'Busca <span class="k">tu producto</span>' },
    { at: 1.5, html: 'Elige: <span class="k">en un baño bonito</span>' },
  ],
  screens: [
    { src: `${SCR}/ef-e1.jpg`, at: 0, d: 0.3 },
    { src: `${SCR}/ef-e2.jpg`, at: 1.3, d: 0.2 },
  ],
  hls: [
    { at: 0.3, out: 0.95, r: [70, 240, 680, 332] },
    { at: 0.95, out: 1.3, r: [70, 640, 680, 795] },
    { at: 1.5, out: 2.5, r: [70, 238, 680, 575] },
    { at: 2.6, r: [70, 931, 545, 1011] },
  ],
  taps: [
    { at: 1.1, x: 375, y: 717, hold: 0.2 },
    { at: 3.0, x: 307, y: 971, hold: 0.35 },
  ],
});

// S6 — paso 2: copia, guarda la foto, abre Gemini (con VPN en Cuba), adjunta, pega y envía
scenes[ids[5]] = scene({
  ...base(5),
  eyebrow: ['2', 'En Gemini, gratis'],
  caps: [
    { at: 0.1, out: 1.5, html: 'Copia la <span class="k">instrucción</span>' },
    { at: 1.6, out: 2.9, html: 'Guarda la <span class="k">foto del producto</span>' },
    { at: 3.0, out: 4.7, html: 'Abre <span class="k">Gemini</span> · gratis con Gmail' },
    { at: 4.8, out: 6.8, html: 'En Cuba: <span class="k">con VPN</span>' },
    { at: 6.9, html: 'Adjunta, pega y <span class="k">envía</span>' },
  ],
  screens: [{ src: `${SCR}/ef-e3.jpg`, at: 0, d: 0.3 }],
  hls: [
    { at: 0.3, out: 1.5, r: [212, 414, 482, 486] },
    { at: 1.6, out: 2.9, r: [212, 830, 582, 902] },
    { at: 3.0, out: 4.7, r: [212, 1294, 416, 1366] },
    { at: 4.8, out: 6.8, r: [212, 1170, 655, 1278] },
  ],
  taps: [
    { at: 0.9, x: 347, y: 450, hold: 0.3 },
    { at: 2.3, x: 397, y: 866, hold: 0.3 },
    { at: 3.6, x: 314, y: 1330, hold: 0.3 },
  ],
  screenExtra: `
          <div class="card" id="s06-card" style="top:300px"><span class="card-ic">✦</span><span class="card-t"><b>En Gemini:</b><br>1 · Toca <b>+</b> y adjunta la foto<br>2 · Pega la instrucción<br>3 · Envía</span></div>`,
  extraJs: `
          tl.fromTo("#s06-card", { opacity: 0, y: 40, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.5)" }, 6.9);`,
});

// S7 — paso 3: descarga la foto de Gemini, apaga la VPN, «Subir mi foto de Gemini»
scenes[ids[6]] = scene({
  ...base(6),
  eyebrow: ['3', 'Súbela'],
  caps: [
    { at: 0.1, out: 1.8, html: 'Descarga <span class="k">la foto</span> de Gemini' },
    { at: 1.9, html: 'Apaga la VPN y toca <span class="k">Subir</span>' },
  ],
  screens: [{ src: `${SCR}/ef-e3b.jpg`, at: 0, d: 0.3 }],
  hls: [
    { at: 0.3, out: 1.8, r: [126, 388, 656, 509] },
    { at: 1.9, out: 2.7, r: [126, 517, 656, 598] },
    { at: 2.8, r: [70, 732, 680, 828] },
  ],
  taps: [{ at: 3.7, x: 375, y: 780, hold: 0.35 }],
});

// S8 — paso 4: en tu galería → descargar, compartir, poner en mi tienda
scenes[ids[7]] = scene({
  ...base(7), exit: 'phone',
  eyebrow: ['4', 'Úsala'],
  caps: [
    { at: 0.1, out: 1.5, html: 'Ya está en <span class="k">tu galería</span>' },
    { at: 1.6, out: 3.0, html: 'Descárgala o <span class="k">compártela</span>' },
    { at: 3.1, html: 'O ponla <span class="k">en tu tienda</span>' },
  ],
  screens: [
    { src: `${SCR}/ef-e4.jpg`, at: 0, d: 0.3 },
    { src: `${SCR}/ef-e5.jpg`, at: 3.75, d: 0.2 },
  ],
  hls: [
    { at: 0.3, out: 1.5, r: [72, 315, 678, 922] },
    { at: 1.6, out: 2.1, r: [96, 1108, 654, 1180] },
    { at: 2.15, out: 3.0, r: [96, 1196, 654, 1268] },
    { at: 3.05, out: 3.7, r: [96, 1284, 654, 1356] },
    { at: 3.9, r: [96, 892, 263, 940] },
  ],
  taps: [{ at: 3.5, x: 375, y: 1320, hold: 0.25 }],
});

// S9 — cierre: ASÍ DE FÁCIL + gratis + logo vertical + ¿Dudas? Escríbeme
scenes[ids[8]] = scene({
  ...base(8),
  css: `
        #s10-title { position: absolute; left: 60px; right: 60px; top: 180px; text-align: center; font-family: "Cinzel", Georgia, serif; font-weight: 600; font-size: 84px; letter-spacing: 0.08em; color: #2B2420; }
        #s10-grid { position: absolute; left: 110px; right: 110px; top: 320px; display: flex; flex-direction: column; gap: 18px; }
        .s10-c { display: flex; align-items: center; gap: 22px; padding: 20px 28px; border-radius: 22px; background: #0D3B45; color: #F6F1E6; font-weight: 600; font-size: 40px; }
        .s10-n { display: inline-flex; width: 58px; height: 58px; flex: 0 0 auto; border-radius: 50%; align-items: center; justify-content: center; background: #F6F1E6; color: #0D3B45; font-size: 32px; }
        #s10-free { position: absolute; left: 130px; right: 130px; top: 720px; padding: 20px 30px; border-radius: 999px; background: #A35A1F; color: #F6F1E6; font-weight: 600; font-size: 46px; text-align: center; white-space: nowrap; }
        #s10-logo { position: absolute; left: 50%; top: 880px; width: 400px; margin-left: -200px; display: block; }
        #s10-q { position: absolute; left: 60px; right: 60px; top: 1200px; text-align: center; font-weight: 600; font-size: 76px; color: #0D3B45; }
        #s10-url { position: absolute; left: 60px; right: 60px; top: 1310px; text-align: center; font-weight: 500; font-size: 46px; color: #2B2420; }`,
  extra: `
        <div id="s10-title">ASÍ DE FÁCIL</div>
        <div id="s10-grid"><div class="s10-c" id="s10-c1"><span class="s10-n">1</span>Elige producto e idea</div><div class="s10-c" id="s10-c2"><span class="s10-n">2</span>Hazla en Gemini (con VPN)</div><div class="s10-c" id="s10-c3"><span class="s10-n">3</span>Súbela y compártela</div></div>
        <div id="s10-free">Gratis · hasta 20 fotos al día</div>
        <img id="s10-logo" src="assets/logo/casa-viva-vertical-marron.svg" alt="Casa Viva" />
        <div id="s10-q">¿Dudas? Escríbeme.</div>
        <div id="s10-url">casaviva.company</div>`,
  extraJs: `
          tl.fromTo("#s10-title", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: "power4.out" }, 0.05);
          ${[1, 2, 3].map((n) => `tl.fromTo("#s10-c${n}", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.38, ease: "back.out(1.6)" }, ${f2(0.1 + n * 0.12)});`).join('\n          ')}
          tl.fromTo("#s10-free", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.8)" }, 0.45);
          tl.fromTo("#s10-logo", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, 1.0);
          tl.fromTo("#s10-q", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.42, ease: "back.out(1.4)" }, 1.0);
          tl.fromTo("#s10-url", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" }, 1.4);`,
});

for (const id of ids) fs.writeFileSync(`${P}/compositions/${id}.html`, scenes[id]);

// ---------------- subtítulos (whisper-final.json, palabra por palabra) ----------------
// Cada subtítulo = trozo exacto del guion (cifras como las escribe Whisper). [ ] = palabra clave (crema sobre ámbar).
const CUES = [
  [0, '¿Tu foto sale [oscura],'],
  [0, 'o el producto sale [en su caja]?'],
  [1, 'Nos lo dijeron.'],
  [1, 'Nana: la tienda está oscura,'],
  [1, 'mi teléfono [no tira buenas fotos].'],
  [1, 'Dayami: fotos de todas las cortinas'],
  [1, 'de baño, [para enviar a un cliente].'],
  [1, '[Las escuchamos].'],
  [2, 'Ahora tienes tu [estudio de fotos].'],
  [2, 'De una foto normal, sale'],
  [2, 'una [foto bonita] para vender.'],
  [2, 'Mira esta, la hizo [Dany].'],
  [3, 'Está en tu área.'],
  [3, 'Abre el menú, y en Herramientas,'],
  [3, 'toca: [Mi estudio de fotos].'],
  [4, 'Busca [tu producto],'],
  [4, 'y elige cómo la quieres.'],
  [4, 'Por ejemplo: [en un baño bonito].'],
  [5, 'Copia [la instrucción],'],
  [5, 'y guarda la foto del producto.'],
  [5, 'Abre [Gemini], que es gratis'],
  [5, 'con tu Gmail.'],
  [5, 'En Cuba [necesita VPN].'],
  [5, 'Adjunta la foto, pega la instrucción,'],
  [5, 'y [envía].'],
  [6, 'Descarga la foto que te hizo Gemini.'],
  [6, 'Apaga la VPN, y toca:'],
  [6, '[Subir mi foto de Gemini].'],
  [7, 'Ya está en [tu galería].'],
  [7, 'Descárgala, compártela con tu cliente,'],
  [7, 'o [ponla en tu tienda].'],
  [8, 'Es [gratis].'],
  [8, '¿Dudas? [Escríbeme].'],
];
const words = JSON.parse(fs.readFileSync(`${P}/assets/audio/whisper-final.json`, 'utf8')).words;
words.forEach((w) => { if (/^\s*Dani\.?$/.test(w.word)) w.word = w.word.replace('Dani', 'Dany'); });
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
  .replace(/<title>.*<\/title>/, '<title>Tutorial: Mi estudio de fotos</title>')
  .replace('</style>', EXTRA_CSS);
const sceneDivs = ids.map((id, i) => `      <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${cuts[i]}" data-duration="${dur(i)}" data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920"></div>`).join('\n');
const whooshes = cuts.slice(1, -1).map((c, i) => `      <audio id="sfx-whoosh-${i + 1}" src="assets/sfx/whoosh-short.mp3" data-start="${f2(c - 0.25)}" data-duration="0.57" data-track-index="5" data-audio-group="sfx" data-volume="0.3"></audio>`).join('\n');
const clickTags = clicks.sort((a, b) => a - b).map((t, i) => `      <audio id="sfx-click-${i + 1}" src="assets/sfx/click-soft.mp3" data-start="${t}" data-duration="0.36" data-track-index="6" data-audio-group="sfx" data-volume="0.55"></audio>`).join('\n');
const notifTags = notifs.map((t, i) => `      <audio id="sfx-notif-${i + 1}" src="assets/sfx/notification.mp3" data-start="${t}" data-duration="1.2" data-track-index="7" data-audio-group="sfx" data-volume="0.3"></audio>`).join('\n');
const phoneStart = cuts[1];
const phoneDur = f2(cuts[8] - cuts[1]);
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
// marco del teléfono: se va en el antes/después (S3) y vuelve en S4
const hideAt = f2(cuts[2] - cuts[1] - 0.05), showAt = f2(cuts[3] - cuts[1]);
const shellTl = `          tl.fromTo("#ps-body", { opacity: 0, y: 160 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0);
          tl.fromTo("#ps-body", { opacity: 1, y: 0 }, { opacity: 0, y: 110, duration: 0.4, ease: "power2.in", immediateRender: false }, ${hideAt});
          tl.fromTo("#ps-body", { opacity: 0, y: 160 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", immediateRender: false }, ${showAt});
          tl.fromTo("#ps-body", { opacity: 1, y: 0 }, { opacity: 0, y: 110, duration: 0.42, ease: "power2.in", immediateRender: false }, ${shellExit});
`;
let shell = fs.readFileSync(`${P}/compositions/phone-shell.html`, 'utf8');
shell = shell.replace(/( {10}tl\.fromTo\("#ps-body"[^\n]*\n)+/, shellTl);
fs.writeFileSync(`${P}/compositions/phone-shell.html`, shell);
let bg = fs.readFileSync(`${P}/compositions/bg.html`, 'utf8');
// fondo: etiqueta y duraciones de este video (línea a línea)
bg = bg.replace(/Gestoras · [^<]+</, 'Gestoras · Estudio de fotos<').split('\n').map((l) => {
  if (l.includes('"#bg-glow-a"')) return l.replace(/repeat: \d+/, 'repeat: 8');
  if (l.includes('"#bg-glow-b"')) return l.replace(/repeat: \d+/, 'repeat: 6');
  if (l.includes('"#bg-dots"') || l.includes('"#progress-fill"')) return l.replace(/duration: [\d.]+/, `duration: ${TOTAL}`);
  if (l.includes('"#brandbar", { opacity: 0 }')) return l.replace(/\}, [\d.]+\);$/, `}, ${f2(cuts[1] + 0.1)});`);
  if (l.includes('"#brandbar", { opacity: 1 }')) return l.replace(/\}, [\d.]+\);$/, `}, ${f2(TOTAL - 0.5)});`);
  return l;
}).join('\n');
fs.writeFileSync(`${P}/compositions/bg.html`, bg);
console.log('ok', ids.length, 'scenes; cues', cues.length, '; clicks', clicks.length, '; phone', phoneStart, phoneDur, '; shell exit', shellExit);
