// Genera index.html + compositions para tutorial-billete-seguro (video «Billete Seguro», estilo Hormozi, para el equipo).
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
const TOTAL = seg.total; // 64.46
// cortes a ~0,3 s antes de que empiece la voz de la escena siguiente
const cuts = [0, ...seg.segs.slice(1).map((s) => f2(s.start - 0.3)), TOTAL];
const ids = ['s01-gancho', 's02-bici', 's03-niurka', 's04-giro', 's05-como', 's06-resultado', 's07-cuando', 's08-cierre'];
const dur = (i) => f2(cuts[i + 1] - cuts[i]);
const base = (i) => ({ id: ids[i], dur: dur(i), start: cuts[i] });
const scenes = {};
const SCR = 'assets/screens';
const ICON = {
  bici: '<svg viewBox="0 0 64 40" aria-hidden="true"><circle cx="13" cy="27" r="10" fill="none" stroke="currentColor" stroke-width="3.2"/><circle cx="51" cy="27" r="10" fill="none" stroke="currentColor" stroke-width="3.2"/><path d="M13 27l10-16h17l11 16M23 11l9 16 8-16M19 6h9M40 11l-3-6h7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  tel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5v3A2 2 0 0 1 19 20 16 16 0 0 1 4 5a2 2 0 0 1 2.5-2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  escudo: '<svg viewBox="0 0 48 56" aria-hidden="true"><path d="M24 3l19 7v15c0 13-8.5 22.5-19 28C13.5 47.5 5 38 5 25V10z" fill="#0D3B45"/><path d="M15 28l7 7 12-14" fill="none" stroke="#F6F1E6" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  nuevo: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  calle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="9" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
};

// S1 — gancho: casi perdemos una bici de 550 USD
scenes[ids[0]] = scene({
  ...base(0),
  css: `
        #s01-block { position: absolute; left: 70px; right: 70px; top: 300px; display: flex; flex-direction: column; align-items: center; gap: 30px; text-align: center; }
        #s01-eyebrow { display: inline-flex; padding: 14px 30px; border-radius: 999px; background: #0D3B45; color: #F6F1E6; font-weight: 600; font-size: 34px; }
        #s01-head { font-weight: 600; font-size: 100px; line-height: 1.05; letter-spacing: -0.02em; color: #2B2420; }
        #s01-bici { width: 360px; height: 225px; color: #0D3B45; }
        #s01-bici svg { width: 100%; height: 100%; display: block; }
        #s01-num { font-weight: 600; font-size: 210px; line-height: 1; letter-spacing: -0.04em; color: #A35A1F; }
        #s01-sub { font-weight: 500; font-size: 40px; color: #2B2420; }`,
  extra: `
        <div id="s01-block">
          <div id="s01-eyebrow">Pasó esta semana</div>
          <h1 id="s01-head">Casi perdemos</h1>
          <div id="s01-bici">${ICON.bici}</div>
          <div id="s01-num">550 USD</div>
          <div id="s01-sub">Pedido #4220 · bicicleta eléctrica</div>
        </div>`,
  extraJs: `
          tl.fromTo("#s01-eyebrow", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, 0.05);
          tl.fromTo("#s01-head", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.45, ease: "power4.out" }, 0.75);
          tl.fromTo("#s01-bici", { opacity: 0, x: -260 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }, 1.7);
          tl.fromTo("#s01-num", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)" }, 2.7);
          tl.fromTo("#s01-sub", { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power1.out" }, 3.2);
          tl.fromTo("#s01-block", { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.28, ease: "power2.in", immediateRender: false }, ${f2(dur(0) - 0.3)});`,
});

// S2 — la clienta de la bici: dos números y reportada en Facebook
notifs.push(f2(cuts[1] + 5.6));
scenes[ids[1]] = scene({
  ...base(1),
  eyebrow: ['', 'La clienta de la bici'],
  css: `
        .s02-row { position: absolute; left: 80px; right: 80px; display: flex; align-items: center; gap: 28px; padding: 30px 34px; border-radius: 28px; background: #FFFFFF; box-shadow: 0 18px 40px rgba(43, 36, 32, 0.14); opacity: 0; }
        .s02-ic { width: 92px; height: 92px; flex: 0 0 auto; border-radius: 50%; background: #0D3B45; color: #F6F1E6; display: flex; align-items: center; justify-content: center; }
        .s02-ic svg { width: 50px; height: 50px; }
        .s02-t { font-weight: 500; font-size: 40px; color: #2B2420; line-height: 1.2; }
        .s02-t b { display: block; font-weight: 600; font-size: 62px; letter-spacing: 0.04em; color: #0D3B45; }
        #s02-r1 { top: 280px; }
        #s02-r2 { top: 520px; }
        #s02-fb { position: absolute; left: 80px; right: 80px; top: 800px; padding: 34px; border-radius: 28px; background: #0D3B45; color: #F6F1E6; text-align: center; font-weight: 500; font-size: 42px; opacity: 0; }
        #s02-stamp { position: absolute; left: 110px; right: 110px; top: 1000px; padding: 26px 20px; border: 8px solid #9B2C2C; border-radius: 22px; color: #9B2C2C; text-align: center; font-family: "Cinzel", Georgia, serif; font-weight: 600; font-size: 56px; letter-spacing: 0.04em; line-height: 1.15; background: rgba(246, 241, 230, 0.92); opacity: 0; }`,
  extra: `
        <div class="s02-row" id="s02-r1"><span class="s02-ic">${ICON.chat}</span><span class="s02-t">Escribía desde<b>51•• ••23</b></span></div>
        <div class="s02-row" id="s02-r2"><span class="s02-ic">${ICON.tel}</span><span class="s02-t">Llamaba desde<b>52•• ••38</b></span></div>
        <div id="s02-fb">Cary la buscó en Facebook…</div>
        <div id="s02-stamp">REPORTADA COMO ESTAFADORA</div>`,
  extraJs: `
          tl.fromTo("#s02-r1", { opacity: 0, x: -80 }, { opacity: 1, x: 0, duration: 0.4, ease: "back.out(1.5)" }, 0.75);
          tl.fromTo("#s02-r2", { opacity: 0, x: 80 }, { opacity: 1, x: 0, duration: 0.4, ease: "back.out(1.5)" }, 2.3);
          tl.fromTo("#s02-fb", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 3.5);
          tl.fromTo("#s02-stamp", { opacity: 0, scale: 1.8, rotation: -14 }, { opacity: 1, scale: 1, rotation: -6, duration: 0.32, ease: "power4.in" }, 5.6);
          ${['#s02-r1', '#s02-r2', '#s02-fb', '#s02-stamp'].map((s) => fadeOut(s, dur(1) - 0.3, 0.22)).join('\n          ')}`,
});

// S3 — el aviso de Niurka: la secuencia de los estafadores
notifs.push(f2(cuts[2] + 0.4));
const pasos = [
  [2.84, 'Una pareja, con <b>el mismo número</b>'],
  [4.46, 'Pide un artículo'],
  [5.48, 'Da una <b>dirección falsa</b>'],
  [7.06, 'Espera al mensajero <b>en la calle</b>'],
  [8.74, 'Paga con un <b>billete falso de 100 USD</b>'],
];
scenes[ids[2]] = scene({
  ...base(2),
  eyebrow: ['', 'El aviso de Niurka'],
  css: `
        #s03-title { position: absolute; left: 80px; right: 80px; top: 250px; font-weight: 600; font-size: 70px; line-height: 1.1; color: #2B2420; }
        #s03-list { position: absolute; left: 70px; right: 70px; top: 420px; display: flex; flex-direction: column; gap: 22px; }
        .s03-p { display: flex; align-items: center; gap: 24px; padding: 22px 28px; border-radius: 24px; background: #FFFFFF; font-weight: 500; font-size: 42px; line-height: 1.2; color: #2B2420; box-shadow: 0 12px 28px rgba(43, 36, 32, 0.1); opacity: 0; }
        .s03-p b { font-weight: 600; color: #0D3B45; }
        .s03-n { width: 70px; height: 70px; flex: 0 0 auto; border-radius: 50%; background: #0D3B45; color: #F6F1E6; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 38px; }
        #s03-bye { position: absolute; left: 60px; right: 60px; top: 1180px; padding: 30px 20px; border-radius: 28px; background: #9B2C2C; color: #F6F1E6; text-align: center; font-family: "Cinzel", Georgia, serif; font-weight: 600; font-size: 76px; letter-spacing: 0.06em; opacity: 0; }`,
  extra: `
        <div id="s03-title">Así operan:</div>
        <div id="s03-list">${pasos.map((p, i) => `<div class="s03-p" id="s03-p${i}"><span class="s03-n">${i + 1}</span><span>${p[1]}</span></div>`).join('')}</div>
        <div id="s03-bye">Y DESAPARECE</div>`,
  extraJs: `
          tl.fromTo("#s03-title", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 0.9);
          ${pasos.map((p, i) => `tl.fromTo("#s03-p${i}", { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.38, ease: "back.out(1.6)" }, ${f2(p[0] - 0.1)});`).join('\n          ')}
          tl.fromTo("#s03-list", { opacity: 1 }, { opacity: 0.35, duration: 0.3, ease: "power1.out" }, 10.6);
          tl.fromTo("#s03-bye", { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power4.in" }, 10.7);
          ${['#s03-title', '#s03-list', '#s03-bye'].map((s) => fadeOut(s, dur(2) - 0.3, 0.22)).join('\n          ')}`,
});

// S4 — el giro: el que pierde es el que recibe el billete → Billete Seguro
scenes[ids[3]] = scene({
  ...base(3),
  css: `
        #s04-a { position: absolute; left: 70px; right: 70px; top: 330px; text-align: center; font-weight: 600; font-size: 84px; line-height: 1.1; color: #2B2420; }
        #s04-a b { font-weight: 600; color: #9B2C2C; }
        #s04-b { position: absolute; left: 70px; right: 70px; top: 760px; display: flex; flex-direction: column; align-items: center; gap: 26px; opacity: 0; }
        #s04-esc { width: 170px; height: 198px; }
        #s04-esc svg { width: 100%; height: 100%; display: block; }
        #s04-name { font-family: "Cinzel", Georgia, serif; font-weight: 600; font-size: 104px; letter-spacing: 0.06em; color: #0D3B45; text-align: center; line-height: 1.1; }
        #s04-de { font-weight: 500; font-size: 40px; color: #2B2420; }`,
  extra: `
        <div id="s04-a">El que pierde es<br><b>el que recibe el billete</b></div>
        <div id="s04-b"><div id="s04-esc">${ICON.escudo}</div><div id="s04-name">BILLETE SEGURO</div><div id="s04-de">de Casa Viva</div></div>`,
  extraJs: `
          tl.fromTo("#s04-a", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: "power4.out" }, 0.25);
          tl.fromTo("#s04-a", { y: 0 }, { y: -110, duration: 0.4, ease: "power2.inOut", immediateRender: false }, 2.3);
          tl.fromTo("#s04-b", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }, 2.75);
          ${['#s04-a', '#s04-b'].map((s) => fadeOut(s, dur(3) - 0.3, 0.22)).join('\n          ')}`,
});

// S5 — cómo funciona: eliges el billete, 4 pruebas y el número de serie (pantallas reales)
scenes[ids[4]] = scene({
  ...base(4), enter: 'phone',
  eyebrow: ['1', 'Cómo funciona'],
  caps: [
    { at: 0.3, out: 2.75, html: 'Eliges el <span class="k">billete</span>' },
    { at: 2.85, out: 6.85, html: '<span class="k">4 pruebas</span>' },
    { at: 6.95, html: 'El <span class="k">número de serie</span>' },
  ],
  screens: [
    { src: `${SCR}/bs-inicio.jpg` },
    { src: `${SCR}/bs-luz.jpg`, at: 2.85, d: 0.2 },
    { src: `${SCR}/bs-inclinar.jpg`, at: 3.85, d: 0.2 },
    { src: `${SCR}/bs-tocar.jpg`, at: 4.8, d: 0.2 },
    { src: `${SCR}/bs-uv.jpg`, at: 5.65, d: 0.2 },
    { src: `${SCR}/bs-serie.jpg`, at: 6.9, d: 0.2 },
  ],
  hls: [{ at: 0.6, out: 2.7, r: [32, 752, 365, 924] }],
  taps: [{ at: 1.9, x: 198, y: 838, hold: 0.4 }],
});

// S6 — el resultado: sin señales, dudoso o no lo aceptes; si sale rojo, avisa al equipo
notifs.push(f2(cuts[5] + 3.35));
scenes[ids[5]] = scene({
  ...base(5), exit: 'phone',
  eyebrow: ['2', 'El resultado'],
  caps: [
    { at: 1.35, out: 2.6, html: '<span class="k">Sin señales</span> de falso' },
    { at: 2.65, out: 3.2, html: '<span class="k">Dudoso</span>' },
    { at: 3.25, out: 4.4, html: '<span class="k">No lo aceptes</span>' },
    { at: 4.45, html: 'Si sale rojo: <span class="k">avisa al equipo</span>' },
  ],
  screens: [
    { src: `${SCR}/bs-ok.jpg` },
    { src: `${SCR}/bs-no.jpg`, at: 3.25, d: 0.2 },
  ],
  hls: [{ at: 6.2, r: [32, 1349, 718, 1457] }],
  taps: [{ at: 6.8, x: 375, y: 1403, hold: 0.5 }],
});

// S7 — cuándo usarla: billetes grandes, clientes nuevos y entregas en la calle
const bills = [[2.62, '100', 'USD'], [3.62, '5 000', 'CUP'], [4.38, '10 000', 'CUP'], [5.06, '20 000', 'CUP']];
scenes[ids[6]] = scene({
  ...base(6),
  eyebrow: ['', '¿Cuándo usarla?'],
  css: `
        #s07-title { position: absolute; left: 70px; right: 70px; top: 250px; font-weight: 600; font-size: 76px; line-height: 1.1; color: #2B2420; }
        #s07-title b { font-weight: 600; color: #A35A1F; }
        #s07-grid { position: absolute; left: 70px; right: 70px; top: 400px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px; }
        .s07-bill { height: 200px; border-radius: 22px; border: 6px solid #0D3B45; background: #FFFFFF; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; opacity: 0; box-shadow: 0 12px 28px rgba(43, 36, 32, 0.1); }
        .s07-v { font-weight: 600; font-size: 74px; line-height: 1; color: #0D3B45; letter-spacing: -0.02em; }
        .s07-m { font-weight: 600; font-size: 34px; color: #A35A1F; letter-spacing: 0.1em; }
        .s07-row { position: absolute; left: 70px; right: 70px; display: flex; align-items: center; gap: 26px; padding: 26px 30px; border-radius: 26px; background: #0D3B45; color: #F6F1E6; font-weight: 600; font-size: 46px; opacity: 0; }
        .s07-row svg { width: 64px; height: 64px; flex: 0 0 auto; }
        #s07-r1 { top: 900px; }
        #s07-r2 { top: 1060px; }`,
  extra: `
        <div id="s07-title">Con un <b>billete grande</b></div>
        <div id="s07-grid">${bills.map((b, i) => `<div class="s07-bill" id="s07-b${i}"><span class="s07-v">${b[1]}</span><span class="s07-m">${b[2]}</span></div>`).join('')}</div>
        <div class="s07-row" id="s07-r1">${ICON.nuevo}Clientes nuevos</div>
        <div class="s07-row" id="s07-r2">${ICON.calle}Entregas en la calle</div>`,
  extraJs: `
          tl.fromTo("#s07-title", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 1.5);
          ${bills.map((b, i) => `tl.fromTo("#s07-b${i}", { opacity: 0, scale: 0.6, rotation: ${i % 2 ? 6 : -6} }, { opacity: 1, scale: 1, rotation: 0, duration: 0.38, ease: "back.out(1.8)" }, ${f2(b[0] - 0.1)});`).join('\n          ')}
          tl.fromTo("#s07-r1", { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.4, ease: "back.out(1.5)" }, 6.9);
          tl.fromTo("#s07-r2", { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.4, ease: "back.out(1.5)" }, 8.4);
          ${['#s07-title', '#s07-grid', '#s07-r1', '#s07-r2'].map((s) => fadeOut(s, dur(6) - 0.3, 0.22)).join('\n          ')}`,
});

// S8 — cierre: dónde está, guárdalo hoy, logo vertical
scenes[ids[7]] = scene({
  ...base(7),
  css: `
        #s08-title { position: absolute; left: 60px; right: 60px; top: 190px; text-align: center; font-family: "Cinzel", Georgia, serif; font-weight: 600; font-size: 84px; letter-spacing: 0.06em; color: #0D3B45; }
        #s08-url { position: absolute; left: 70px; right: 70px; top: 330px; padding: 30px 20px; border-radius: 999px; background: #A35A1F; color: #F6F1E6; text-align: center; font-weight: 600; font-size: 54px; white-space: nowrap; }
        #s08-save { position: absolute; left: 60px; right: 60px; top: 500px; text-align: center; font-weight: 600; font-size: 64px; color: #2B2420; }
        #s08-save b { font-weight: 600; color: #A35A1F; }
        #s08-logo { position: absolute; left: 50%; top: 680px; width: 380px; margin-left: -190px; display: block; }
        #s08-q { position: absolute; left: 60px; right: 60px; top: 1060px; text-align: center; font-weight: 600; font-size: 60px; color: #0D3B45; }
        #s08-note { position: absolute; left: 60px; right: 60px; top: 1160px; text-align: center; font-weight: 500; font-size: 36px; color: #2B2420; }`,
  extra: `
        <div id="s08-title">BILLETE SEGURO</div>
        <div id="s08-url">casaviva.company/billete</div>
        <div id="s08-save">Guárdalo <b>hoy</b></div>
        <img id="s08-logo" src="assets/logo/casa-viva-vertical-marron.svg" alt="Casa Viva" />
        <div id="s08-q">¿Dudas? Escríbeme.</div>
        <div id="s08-note">Te ayuda, pero no sustituye al banco.</div>`,
  extraJs: `
          tl.fromTo("#s08-title", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: "power4.out" }, 0.05);
          tl.fromTo("#s08-url", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.8)" }, 0.65);
          tl.fromTo("#s08-save", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.4)" }, 3.2);
          tl.fromTo("#s08-logo", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, 4.0);
          tl.fromTo("#s08-q", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.42, ease: "back.out(1.4)" }, 5.9);
          tl.fromTo("#s08-note", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" }, 6.3);`,
});

for (const id of ids) fs.writeFileSync(`${P}/compositions/${id}.html`, scenes[id]);

// ---------------- subtítulos (whisper-final.json, palabra por palabra) ----------------
// Cada subtítulo = trozo exacto del guion (cifras como las escribe Whisper). [ ] = palabra clave (crema sobre ámbar).
const CUES = [ // [escena, texto exacto como lo escribe Whisper, texto a mostrar (opcional)]
  [0, 'Esta semana casi perdemos'],
  [0, 'una bicicleta eléctrica de [550 dólares].'],
  [1, 'La clienta escribía desde un número'],
  [1, 'y llamaba [desde otro].'],
  [1, 'Cari la buscó en Facebook', 'Cary la buscó en Facebook'],
  [1, 'y ya estaba [reportada como estafadora].'],
  [2, 'Y hoy, [Niurka] nos avisó de otra trampa.'],
  [2, 'Una pareja, con [el mismo número],'],
  [2, 'pide un artículo'],
  [2, 'y da una [dirección falsa].'],
  [2, 'Espera al mensajero [en la calle].'],
  [2, 'Paga con un [billete falso] de 100 dólares.'],
  [2, 'Y [desaparece].'],
  [3, 'El que pierde es [el que recibe el billete].'],
  [3, 'Por eso hicimos [Billete Seguro].'],
  [4, 'Eliges el billete'],
  [4, 'y haces [cuatro pruebas],'],
  [4, 'a contraluz, inclinándolo,'],
  [4, 'tocándolo y con [luz ultravioleta].'],
  [4, 'Al final, pones el [número de serie].'],
  [5, 'En un minuto te dice,'],
  [5, '[sin señales de falso],'],
  [5, '[dudoso] o [no lo aceptes].'],
  [5, 'Si sale rojo, lo devuelves con calma'],
  [5, 'y [avisas al equipo].'],
  [6, 'Úsala siempre que te paguen'],
  [6, 'con un [billete grande],'],
  [6, '[100 dólares] o [5 mil, 10 mil] o [20 mil pesos],'],
  [6, 'sobre todo con [clientes nuevos]'],
  [6, 'y en las [entregas en la calle].'],
  [7, 'Está en casaviva.company barra billete.', 'Está en [casaviva.company/billete]'],
  [7, 'Guarda el enlace [hoy],'],
  [7, 'antes de tu próxima entrega.'],
];
const words = JSON.parse(fs.readFileSync(`${P}/assets/audio/whisper-final.json`, 'utf8')).words;
words.forEach((w) => { if (/^\s*Bronze$/.test(w.word)) w.word = w.word.replace('Bronze', 'Bronce'); }); // Whisper escribe «Bronze» con contexto; aislada se oye «bronce» (comprobado)
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
let wi = 0;
const cues = CUES.map(([sg, text, disp], ci) => {
  const toks = text.replace(/[[\]]/g, '').split(/\s+/).filter(Boolean);
  const i0 = wi;
  toks.forEach((t) => {
    const w = words[wi];
    if (!w) { console.warn(`  ! cue ${ci}: faltan palabras en whisper`); return; }
    if (norm(t) !== norm(w.word)) console.warn(`  ! cue ${ci}: guion «${t}» ↔ whisper «${w.word}»`);
    wi++;
  });
  return { ci, sg, text: disp || text, i0, i1: wi - 1 };
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
  .replace(/<title>.*<\/title>/, '<title>Billete Seguro</title>')
  .replace('</style>', EXTRA_CSS);
const sceneDivs = ids.map((id, i) => `      <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${cuts[i]}" data-duration="${dur(i)}" data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920"></div>`).join('\n');
const whooshes = cuts.slice(1, -1).map((c, i) => `      <audio id="sfx-whoosh-${i + 1}" src="assets/sfx/whoosh-short.mp3" data-start="${f2(c - 0.25)}" data-duration="0.57" data-track-index="5" data-audio-group="sfx" data-volume="0.3"></audio>`).join('\n');
const clickTags = clicks.sort((a, b) => a - b).map((t, i) => `      <audio id="sfx-click-${i + 1}" src="assets/sfx/click-soft.mp3" data-start="${t}" data-duration="0.36" data-track-index="6" data-audio-group="sfx" data-volume="0.55"></audio>`).join('\n');
const notifTags = notifs.map((t, i) => `      <audio id="sfx-notif-${i + 1}" src="assets/sfx/notification.mp3" data-start="${t}" data-duration="1.2" data-track-index="7" data-audio-group="sfx" data-volume="0.3"></audio>`).join('\n');
const phoneStart = cuts[4];
const phoneDur = f2(cuts[6] - cuts[4]);
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
// marco del teléfono: entra en S5 (cómo funciona) y se va al final de S6 (resultado)
const shellTl = `          tl.fromTo("#ps-body", { opacity: 0, y: 160 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0);
          tl.fromTo("#ps-body", { opacity: 1, y: 0 }, { opacity: 0, y: 110, duration: 0.42, ease: "power2.in", immediateRender: false }, ${shellExit});
`;
let shell = fs.readFileSync(`${P}/compositions/phone-shell.html`, 'utf8');
shell = shell.replace(/( {10}tl\.fromTo\("#ps-body"[^\n]*\n)+/, shellTl);
fs.writeFileSync(`${P}/compositions/phone-shell.html`, shell);
let bg = fs.readFileSync(`${P}/compositions/bg.html`, 'utf8');
// fondo: etiqueta y duraciones de este video (línea a línea)
bg = bg.replace(/Gestoras · [^<]+</, 'Equipo · Billete Seguro<').split('\n').map((l) => {
  if (l.includes('"#bg-glow-a"')) return l.replace(/repeat: \d+/, 'repeat: 8');
  if (l.includes('"#bg-glow-b"')) return l.replace(/repeat: \d+/, 'repeat: 6');
  if (l.includes('"#bg-dots"') || l.includes('"#progress-fill"')) return l.replace(/duration: [\d.]+/, `duration: ${TOTAL}`);
  if (l.includes('"#brandbar", { opacity: 0 }')) return l.replace(/\}, [\d.]+\);$/, `}, ${f2(cuts[1] + 0.1)});`);
  if (l.includes('"#brandbar", { opacity: 1 }')) return l.replace(/\}, [\d.]+\);$/, `}, ${f2(TOTAL - 0.5)});`);
  return l;
}).join('\n');
fs.writeFileSync(`${P}/compositions/bg.html`, bg);
console.log('ok', ids.length, 'scenes; cues', cues.length, '; clicks', clicks.length, '; phone', phoneStart, phoneDur, '; shell exit', shellExit);
