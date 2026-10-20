// Billete Seguro — guía para revisar billetes con el celular (Casa Viva / NEXO).
// Dos modos: "guia" (sin internet, la persona responde cada prueba) e "ia"
// (además, la IA mira las fotos). El resultado nunca dice "100 % bueno".
(() => {
  const API = "https://viwwlriwlwodrfukbgbj.supabase.co/functions/v1/billete-seguro-revisa";
  const $app = document.getElementById("app");
  const BILLETES = window.BILLETES;
  const PRUEBAS = window.PRUEBAS;

  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const leer = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };

  // El enlace del equipo trae ?equipo=CODIGO; se guarda y se quita de la barra.
  const url = new URL(location.href);
  if (url.searchParams.get("equipo")) {
    guardar("bs_equipo", url.searchParams.get("equipo").trim());
    url.searchParams.delete("equipo");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }

  const S = {
    pantalla: "inicio",
    modo: leer("bs_modo", "ia"),
    moneda: leer("bs_moneda", "CUP"),
    billete: null,
    paso: 0,
    resp: {},
    fotos: {},
    serie: "",
    pedido: "",
    ia: null,
    iaPromesa: null,
    pila: [],
  };
  const equipo = () => leer("bs_equipo", "");
  const puedeIA = () => !!equipo() && navigator.onLine;
  if (!puedeIA()) S.modo = "guia";

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const miles = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const nombre = b => `${miles(b.valor)} ${b.moneda}`;
  const normSerie = s => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

  const I = {
    atras: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    si: c => `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c || "#0D3B45"}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>`,
    no: c => `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c || "#9B2C2C"}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>`,
    duda: c => `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c || "#7E4515"}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v5"/><path d="M12 16.5h.01"/><circle cx="12" cy="12" r="9"/></svg>`,
    camara: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    aviso: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg>',
    play: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    wa: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z"/></svg>',
  };

  // ---------- navegación ----------
  function ir(pantalla, extra) {
    S.pila.push({ pantalla: S.pantalla, paso: S.paso });
    S.pantalla = pantalla;
    Object.assign(S, extra || {});
    pintar();
  }
  function volver() {
    const p = S.pila.pop();
    if (!p) return;
    S.pantalla = p.pantalla; S.paso = p.paso;
    pintar();
  }
  function reiniciar() {
    Object.assign(S, { pantalla: "inicio", billete: null, paso: 0, resp: {}, fotos: {}, serie: "", pedido: "", ia: null, iaPromesa: null, pila: [] });
    pintar();
  }
  const pasosTotales = () => PRUEBAS.length;

  function cabecera(texto) {
    const n = S.pantalla === "prueba" ? S.paso + 1 : 0;
    const barras = S.pantalla === "prueba"
      ? `<div class="bars" aria-hidden="true">${PRUEBAS.map((_, i) => `<span class="${i < n ? "on" : ""}"></span>`).join("")}</div>` : "";
    return `<div class="top">
      <button class="back" type="button" data-a="volver" aria-label="Volver">${I.atras}</button>
      <div class="progress"><div>${esc(texto)}</div>${barras}</div>
      <span class="chip ${S.modo === "ia" ? "ia" : ""}">${S.modo === "ia" ? "Con IA" : "Sin internet"}</span>
    </div>`;
  }

  // ---------- pantallas ----------
  function pInicio() {
    const ia = puedeIA();
    const lista = BILLETES.filter(b => b.moneda === S.moneda);
    const avisos = BILLETES.filter(b => b.reportadas).map(b => `${b.reportadas.map(r => r.texto).join(" y ")} del ${miles(b.valor)}`);
    return `
      <div class="stack">
        <img class="logo" src="logo-casa-viva.svg" alt="Casa Viva" width="168" height="34">
        <h1>Billete Seguro</h1>
        <p class="muted">Revisa un billete en un minuto, antes de aceptarlo.</p>
      </div>
      <fieldset class="modos">
        <legend class="label">¿Cómo lo revisamos?</legend>
        <label class="modo ${ia ? "" : "off"}">
          <input type="radio" name="modo" value="ia" ${S.modo === "ia" ? "checked" : ""} ${ia ? "" : "disabled"}>
          <span><b>Con internet</b><span>${ia ? "La IA mira tus fotos" : (navigator.onLine ? "Abre el enlace de tu equipo" : "Ahora no hay internet")}</span></span>
        </label>
        <label class="modo">
          <input type="radio" name="modo" value="guia" ${S.modo === "guia" ? "checked" : ""}>
          <span><b>Sin internet</b><span>Solo la guía, gratis</span></span>
        </label>
      </fieldset>
      <div class="tabs" role="tablist" aria-label="Moneda">
        ${["CUP", "USD", "EUR"].map(m => `<button role="tab" type="button" data-moneda="${m}" aria-selected="${S.moneda === m}">${m}</button>`).join("")}
      </div>
      <div class="stack">
        <div class="label">Elige el billete</div>
        <div class="grid-billetes">
          ${lista.map(b => `<button type="button" class="billete" data-billete="${b.id}">
            <span class="v">${miles(b.valor)}${b.nuevo ? '<span class="tag">NUEVO</span>' : ""}</span>
            <span class="p">${esc(b.id === "cup-1000" ? b.nota : `${b.patriota} · ${b.nota}`)}</span>
            ${b.hayFalsos ? '<span class="w">Ya hay falsos</span>' : ""}
          </button>`).join("")}
        </div>
      </div>
      ${avisos.length ? `<div class="aviso" role="note">${I.aviso}<span><b>Series reportadas como falsas:</b> ${esc(avisos.join("; "))}.</span></div>` : ""}
      <a class="btn btn-soft" href="video.mp4" target="_blank" rel="noopener" style="margin-top:auto">${I.play}Mira cómo funciona (1 min)</a>
      <p class="pie">Billete Seguro te ayuda, pero no sustituye al banco. Si dudas, no lo aceptes.</p>`;
  }

  function visorFoto(tipo, uv) {
    const f = S.fotos[tipo];
    return `<div class="visor ${uv ? "uv" : ""}">
      ${f ? `<img src="${f}" alt="Tu foto"><span class="chip ia foto-ok">Foto lista</span>`
          : `<div class="marco">${uv ? "Alumbra el billete con la lámpara y haz la foto" : "Pon el billete dentro del marco"}</div>`}
    </div>
    <input type="file" accept="image/*" capture="environment" id="foto-${tipo}" data-foto="${tipo}">`;
  }

  function pFrente() {
    const b = S.billete;
    return `${cabecera(`Foto de frente · ${nombre(b)}`)}
      <div class="stack"><h1>De frente</h1><p class="lead">Pon el billete sobre una mesa, con buena luz, y haz una foto de frente, entero y sin reflejos.</p></div>
      ${visorFoto("frente")}
      <p class="small muted">La IA lee el número de serie y revisa el dibujo y los colores.</p>
      <div class="bottom">
        <label class="btn ${S.fotos.frente ? "btn-soft" : "btn-primary"}" for="foto-frente">${I.camara}${S.fotos.frente ? "Repetir la foto" : "Tomar foto"}</label>
        ${S.fotos.frente ? `<button class="btn btn-primary" type="button" data-a="siguiente">Seguir</button>` : ""}
      </div>`;
  }

  function pPrueba() {
    const b = S.billete;
    const pr = PRUEBAS[S.paso];
    const d = b.pruebas[pr.id];
    const conFoto = S.modo === "ia" && pr.foto;
    return `${cabecera(`Paso ${S.paso + 1} de ${pasosTotales()} · ${nombre(b)}`)}
      <div class="stack"><h1>${esc(pr.titulo)}</h1><p class="lead">${esc(pr.pide)}</p></div>
      ${conFoto ? visorFoto(pr.foto, pr.id === "uv") : ""}
      <div class="lista">
        <div class="label">Tiene que verse</div>
        ${d.ve.map(t => `<div class="item">${I.si()}<span>${esc(t)}</span></div>`).join("")}
      </div>
      <div class="ojo" role="note"><b>Ojo:</b> ${esc(d.ojo)}</div>
      ${b.verificado ? "" : '<p class="small muted">Datos de este billete por confirmar con la ficha del Banco Central.</p>'}
      <div class="bottom">
        ${conFoto ? `<label class="btn ${S.fotos[pr.foto] ? "btn-soft" : "btn-teal"}" for="foto-${pr.foto}">${I.camara}${S.fotos[pr.foto] ? "Repetir la foto" : "Tomar foto"}</label>` : ""}
        <div class="pregunta">${esc(pr.pregunta)}</div>
        <button class="btn btn-primary" type="button" data-resp="si">${esc(pr.si)}</button>
        <div class="row2">
          <button class="btn btn-outline" type="button" data-resp="no">${esc(pr.no)}</button>
          <button class="btn btn-soft" type="button" data-resp="duda">No estoy seguro</button>
        </div>
        ${pr.sinLampara ? `<button class="btn btn-link" type="button" data-resp="sin_lampara">No tengo lámpara<small>El resultado será menos seguro</small></button>` : ""}
      </div>`;
  }

  function pSerie() {
    const b = S.billete;
    const leyendo = S.modo === "ia" && S.iaPromesa && !S.ia;
    return `${cabecera(`Último paso · ${nombre(b)}`)}
      <div class="stack"><h1>Número de serie</h1><p class="lead">Está impreso en el billete, con letras y números.</p></div>
      ${leyendo ? '<p class="nota">La IA está leyendo el número de tu foto…</p>' : ""}
      <div class="campo">
        <label for="serie">Número de serie</label>
        <input id="serie" class="serie" type="text" autocomplete="off" autocapitalize="characters" inputmode="text" placeholder="Escríbelo como aparece" value="${esc(S.serie)}">
      </div>
      <div class="campo">
        <label for="pedido">Pedido o cliente <span class="muted" style="font-weight:400">(si quieres)</span></label>
        <input id="pedido" type="text" autocomplete="off" placeholder="Ej.: pedido 4223" value="${esc(S.pedido)}">
      </div>
      <div class="nota" role="note"><b>Lo comparamos con</b> las series reportadas como falsas y con los billetes que ya se revisaron en este teléfono.</div>
      <div class="bottom">
        <button class="btn btn-primary" type="button" data-a="resultado">Ver el resultado</button>
        <button class="btn btn-link" type="button" data-a="sinserie">No lo encuentro o no se lee</button>
      </div>`;
  }

  function pAnalizando() {
    return `<div class="cargando"><div class="spin" aria-hidden="true"></div><h1>Revisando</h1><p class="muted">La IA está mirando tus fotos. Tarda unos segundos.</p></div>`;
  }

  // ---------- decisión ----------
  function decidir() {
    const b = S.billete;
    const motivos = [];
    let nivel = "ok"; // ok < duda < no
    const subir = n => { if (n === "no" || (n === "duda" && nivel === "ok")) nivel = n; };

    const filas = PRUEBAS.map(pr => {
      const r = S.resp[pr.id];
      if (r === "no") { subir("no"); motivos.push(`${pr.titulo}: no se ve como debe.`); return [pr.titulo, "No pasó", "no"]; }
      if (r === "duda") { subir("duda"); motivos.push(`${pr.titulo}: no estabas seguro.`); return [pr.titulo, "Dudoso", "duda"]; }
      if (r === "sin_lampara") return [pr.titulo, "Sin lámpara", "duda"];
      return [pr.titulo, "Bien", "ok"];
    });

    const serie = normSerie(S.serie);
    let filaSerie = ["Número de serie", serie ? "No está en la lista" : "Sin número", serie ? "ok" : "duda"];
    const rep = serie && (b.reportadas || []).find(r => serie.startsWith(r.prefijo));
    if (rep) { subir("no"); motivos.push(`La serie ${rep.texto} se reportó como falsa.`); filaSerie = ["Número de serie", `Serie ${rep.texto} reportada`, "no"]; }
    const hist = leer("bs_historial", []);
    const antes = serie && hist.find(h => h.billete === b.id && h.serie === serie);
    const notas = [];
    if (antes) notas.push(`Este mismo número ya se revisó en este teléfono el ${new Date(antes.fecha).toLocaleDateString("es")}. Si no es el mismo billete, uno de los dos es falso.`);
    if (S.resp.uv === "sin_lampara") notas.push("Se revisó sin lámpara ultravioleta: el resultado es menos seguro.");

    if (S.modo === "ia") {
      const ia = S.ia || {};
      if (ia.error) notas.push("La IA no respondió. El resultado es solo con tus respuestas.");
      else {
        if (ia.veredicto === "falso") subir("no");
        if (ia.veredicto === "dudoso") subir("duda");
        (ia.motivos || []).slice(0, 4).forEach(m => motivos.push(`IA: ${m}`));
        filas.push(["Fotos (IA)", ia.veredicto === "falso" ? "Señales de falso" : ia.veredicto === "dudoso" ? "Dudoso" : "Bien",
          ia.veredicto === "falso" ? "no" : ia.veredicto === "dudoso" ? "duda" : "ok"]);
      }
    }
    filas.push(filaSerie);
    return { nivel, motivos, filas, notas, serie };
  }

  function pResultado() {
    const b = S.billete;
    const r = S.decision;
    const cab = {
      ok: { clase: "ok", icono: I.si("#0D3B45"), titulo: "Sin señales de falso", sub: `${nombre(b)} · pasó las pruebas. Puedes aceptarlo.` },
      duda: { clase: "duda", icono: I.duda("#A35A1F"), titulo: "Dudoso", sub: `${nombre(b)} · revísalo con otra persona antes de aceptarlo.` },
      no: { clase: "no", icono: I.no("#9B2C2C"), titulo: "No lo aceptes", sub: `${nombre(b)} · hay señales de billete falso.` },
    }[r.nivel];
    const icono = { ok: I.si(), no: I.no(), duda: I.duda() };
    return `
      <div class="res ${cab.clase}"><div class="circ">${cab.icono.replace('width="20" height="20"', 'width="40" height="40"')}</div><h1>${cab.titulo}</h1><p>${esc(cab.sub)}</p></div>
      <div class="tabla">${r.filas.map(([t, v, c]) => `<div class="fila"><span>${esc(t)}</span><b class="${c}" style="display:flex;align-items:center;gap:6px">${icono[c]}${esc(v)}</b></div>`).join("")}</div>
      ${r.motivos.length && r.nivel !== "ok" ? `<div class="lista"><div class="label">Por qué</div>${r.motivos.map(m => `<div class="item">${I.duda()}<span>${esc(m)}</span></div>`).join("")}</div>` : ""}
      ${r.notas.map(n => `<div class="nota" role="note">${esc(n)}</div>`).join("")}
      ${r.nivel === "no" ? `<div class="pasos"><div class="label">Qué hacer, con calma</div>
        <div class="paso"><span>1</span><span>Devuélvelo con educación y pide otro billete o un pago por transferencia. Puede que el cliente no lo sepa.</span></div>
        <div class="paso"><span>2</span><span>No se lo pases a nadie. Si ya lo aceptaste, llévalo al banco.</span></div>
        <div class="paso"><span>3</span><span>Avisa al equipo, para que nadie más lo reciba.</span></div></div>`
      : r.nivel === "ok" ? '<div class="nota" role="note">Ninguna app lo asegura al 100 %. Si el cliente es nuevo y el pago es grande, pide que otra persona del equipo también lo mire.</div>' : ""}
      <div class="bottom">
        ${r.nivel === "ok"
          ? `<button class="btn btn-primary" type="button" data-a="otro">Revisar otro billete</button><button class="btn btn-soft" type="button" data-a="compartir">${I.wa}Compartir el resultado</button>`
          : `<button class="btn btn-dark" type="button" data-a="compartir">${I.wa}Avisar al equipo</button><button class="btn btn-soft" type="button" data-a="otro">Revisar otro billete</button>`}
      </div>`;
  }

  function textoCompartir() {
    const b = S.billete, r = S.decision;
    const t = { ok: "✅ Billete sin señales de falso", duda: "⚠️ Billete dudoso", no: "⛔ Billete falso: no lo acepten" }[r.nivel];
    return [t, `${nombre(b)}${r.serie ? ` · serie ${r.serie}` : ""}${S.pedido ? ` · ${S.pedido}` : ""}`,
      ...r.motivos.slice(0, 3).map(m => `- ${m}`), "Revisado con Billete Seguro (Casa Viva)"].join("\n");
  }

  // ---------- fotos e IA ----------
  function cargarImagen(file) {
    return new Promise((res, rej) => {
      const img = new Image();
      const u = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(u); res(img); };
      img.onerror = () => { URL.revokeObjectURL(u); rej(new Error("imagen")); };
      img.src = u;
    });
  }
  async function reducir(file, max = 1400) {
    const img = await cargarImagen(file);
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.82);
  }
  // Las fotos van juntas en una sola imagen, cada una con su nombre encima.
  async function collage() {
    const partes = [["frente", "FRENTE"], ["contraluz", "A CONTRALUZ"], ["uv", "LUZ ULTRAVIOLETA"]].filter(([k]) => S.fotos[k]);
    const imgs = await Promise.all(partes.map(([k]) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = S.fotos[k]; })));
    const W = 1000, BAR = 44;
    const alturas = imgs.map(i => Math.min(720, Math.round(i.naturalHeight * W / i.naturalWidth)));
    const c = document.createElement("canvas");
    c.width = W; c.height = alturas.reduce((a, h) => a + h + BAR, 0);
    const g = c.getContext("2d");
    g.fillStyle = "#000"; g.fillRect(0, 0, c.width, c.height);
    let y = 0;
    imgs.forEach((img, n) => {
      g.fillStyle = "#2B2420"; g.fillRect(0, y, W, BAR);
      g.fillStyle = "#F6F1E6"; g.font = "bold 26px sans-serif"; g.fillText(partes[n][1], 14, y + 31);
      y += BAR;
      const h = alturas[n], w = Math.min(W, Math.round(img.naturalWidth * h / img.naturalHeight));
      g.drawImage(img, (W - w) / 2, y, w, h);
      y += h;
    });
    for (const q of [0.75, 0.6, 0.45]) { const d = c.toDataURL("image/jpeg", q); if (d.length < 1_400_000) return d; }
    return c.toDataURL("image/jpeg", 0.35);
  }
  async function preguntarIA() {
    const b = S.billete;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 75_000);
    try {
      const imagen = await collage();
      const r = await fetch(API, {
        method: "POST", signal: ctl.signal, headers: { "content-type": "application/json" },
        body: JSON.stringify({ equipo: equipo(), billete: { id: b.id, moneda: b.moneda, valor: b.valor, patriota: b.patriota, pruebas: b.pruebas }, imagen }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return { error: true, codigo: d.error || r.status };
      return d;
    } catch (e) {
      return { error: true, codigo: e.name };
    } finally { clearTimeout(t); }
  }
  function lanzarIA() {
    if (S.modo !== "ia" || S.iaPromesa) return;
    S.iaPromesa = preguntarIA().then(ia => {
      S.ia = ia;
      if (!ia.error && ia.serie && !S.serie) S.serie = String(ia.serie).toUpperCase();
      if (S.pantalla === "serie") pintar();
      return ia;
    });
  }

  async function verResultado() {
    const s = document.getElementById("serie"); if (s) S.serie = s.value.trim();
    const p = document.getElementById("pedido"); if (p) S.pedido = p.value.trim();
    if (S.modo === "ia" && S.iaPromesa && !S.ia) { ir("analizando"); await S.iaPromesa; S.pila.pop(); }
    S.decision = decidir();
    const hist = leer("bs_historial", []);
    hist.unshift({ fecha: Date.now(), billete: S.billete.id, serie: S.decision.serie, nivel: S.decision.nivel });
    guardar("bs_historial", hist.slice(0, 300));
    S.pantalla = "resultado";
    pintar();
  }

  function siguientePrueba() {
    if (S.paso < PRUEBAS.length - 1) ir("prueba", { paso: S.paso + 1 });
    else { lanzarIA(); ir("serie"); }
  }

  // ---------- pintar y eventos ----------
  function pintar() {
    const html = { inicio: pInicio, frente: pFrente, prueba: pPrueba, serie: pSerie, analizando: pAnalizando, resultado: pResultado }[S.pantalla]();
    $app.innerHTML = html;
    window.scrollTo(0, 0);
    const h = $app.querySelector("h1"); if (h && S.pantalla !== "inicio") { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }

  $app.addEventListener("click", e => {
    const el = e.target.closest("button");
    if (!el) return;
    if (el.dataset.moneda) { S.moneda = el.dataset.moneda; guardar("bs_moneda", S.moneda); return pintar(); }
    if (el.dataset.billete) {
      S.billete = BILLETES.find(b => b.id === el.dataset.billete);
      Object.assign(S, { resp: {}, fotos: {}, serie: "", pedido: "", ia: null, iaPromesa: null, decision: null });
      return S.modo === "ia" ? ir("frente") : ir("prueba", { paso: 0 });
    }
    if (el.dataset.resp) {
      const pr = PRUEBAS[S.paso];
      S.resp[pr.id] = el.dataset.resp;
      return siguientePrueba();
    }
    const a = el.dataset.a;
    if (a === "volver") return volver();
    if (a === "siguiente") return ir("prueba", { paso: 0 });
    if (a === "resultado") return verResultado();
    if (a === "sinserie") { const s = document.getElementById("serie"); if (s) s.value = ""; return verResultado(); }
    if (a === "otro") return reiniciar();
    if (a === "compartir") return window.open(`https://wa.me/?text=${encodeURIComponent(textoCompartir())}`, "_blank", "noopener");
  });

  $app.addEventListener("change", async e => {
    const t = e.target;
    if (t.name === "modo") { S.modo = t.value; guardar("bs_modo", S.modo); return; }
    if (t.dataset.foto && t.files && t.files[0]) {
      try { S.fotos[t.dataset.foto] = await reducir(t.files[0]); }
      catch { alert("No se pudo abrir la foto. Prueba otra vez."); }
      pintar();
    }
  });
  $app.addEventListener("input", e => {
    if (e.target.id === "serie") S.serie = e.target.value;
    if (e.target.id === "pedido") S.pedido = e.target.value;
  });
  window.addEventListener("online", () => S.pantalla === "inicio" && pintar());
  window.addEventListener("offline", () => { if (S.pantalla === "inicio") { S.modo = "guia"; pintar(); } });

  pintar();
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
})();
