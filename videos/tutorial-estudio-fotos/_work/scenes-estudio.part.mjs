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

