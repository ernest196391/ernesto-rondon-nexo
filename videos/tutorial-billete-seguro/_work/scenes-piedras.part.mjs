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

