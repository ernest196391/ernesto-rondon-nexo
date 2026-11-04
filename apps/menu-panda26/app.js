(function () {
  "use strict";

  var M = window.PANDA_MENU;
  var $ = function (id) { return document.getElementById(id); };
  var FOTOGRAMAS = 36, COLUMNAS = 6, LADO = 400; // hoja de giro 6×6 de 400 px

  var productos = {};
  var destacados = [];
  M.categorias.forEach(function (c) {
    c.productos.forEach(function (p) {
      p.cat = c;
      productos[p.id] = p;
      if (p.giro) destacados.push(p);
    });
  });

  function cup(n) { return n.toLocaleString("en-US").replace(/,/g, ".") + " CUP"; }
  function normal(t) { return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function leer(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  var quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Iconos de línea (en vez de emojis) ----------
  var ICONOS = {
    combo: '<path d="M3 14h18M5 14c0-4 3-7 7-7s7 3 7 7M4 17h16l-1.5 3h-13z"/>',
    vaso: '<path d="M6 7h12l-1.5 13h-9zM5 7h14M12 7l2-4h3"/>',
    lata: '<rect x="7" y="4" width="10" height="16" rx="2"/><path d="M7 8h10M7 16h10"/>',
    botella: '<path d="M10 3h4v3l2 3v11H8V9l2-3zM8 13h8"/>',
    papas: '<path d="M6 10h12l-2 10H8zM8 10 7 3M11 10V2M14 10l1-7M17 10l2-5"/>',
    croqueta: '<rect x="4" y="8" width="16" height="8" rx="4"/><path d="M8 11h.01M12 13h.01M15 11h.01"/>',
    bol: '<path d="M3 11h18a9 9 0 0 1-18 0zM9 20h6M8 7c1-2 3-2 4 0s3 2 4 0"/>',
    salsa: '<path d="M12 3c3 5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6 6-11z"/>'
  };
  function icono(nombre) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONOS[nombre] || ICONOS.combo) + "</svg>"; }
  var MAS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var MENOS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>';

  // ---------- Sonido (sintetizado: no pesa nada) ----------
  var sonidoOn = leer("panda26-sonido", true);
  var ctx = null;
  function audio() {
    if (!sonidoOn) return null;
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tono(f, dur, vol, tipo, cuando) {
    var a = audio(); if (!a) return;
    var t = a.currentTime + (cuando || 0);
    var o = a.createOscillator(), g = a.createGain();
    o.type = tipo || "sine"; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function soplo() {
    var a = audio(); if (!a) return;
    var n = a.sampleRate * 0.35, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    f.type = "bandpass"; f.Q.value = 0.8;
    f.frequency.setValueAtTime(600, a.currentTime); f.frequency.exponentialRampToValueAtTime(3200, a.currentTime + 0.3);
    g.gain.value = 0.12; s.buffer = b; s.connect(f).connect(g).connect(a.destination); s.start();
  }
  var son = {
    toque: function () { tono(1800, 0.05, 0.06, "triangle"); },
    cambio: function () { tono(1500, 0.05, 0.05, "triangle"); soplo(); tono(880, 0.4, 0.03, "sine", 0.12); tono(1320, 0.5, 0.025, "sine", 0.18); },
    anadir: function () { tono(660, 0.18, 0.07, "sine"); tono(990, 0.3, 0.06, "sine", 0.09); }
  };
  function vibra(ms) { if (navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { /* nada */ } }
  function pintarSonido() { $("sonido").setAttribute("aria-pressed", sonidoOn ? "true" : "false"); }
  $("sonido").addEventListener("click", function () {
    sonidoOn = !sonidoOn; guardar("panda26-sonido", sonidoOn); pintarSonido(); son.toque();
  });

  // ---------- Abierto / cerrado (hora de Cuba) ----------
  function pintarEstado() {
    var h;
    try {
      var partes = new Intl.DateTimeFormat("en-US", { timeZone: "America/Havana", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
      var hh = +partes.find(function (x) { return x.type === "hour"; }).value % 24;
      var mm = +partes.find(function (x) { return x.type === "minute"; }).value;
      h = hh + mm / 60;
    } catch (e) { var d = new Date(); h = d.getHours() + d.getMinutes() / 60; }
    var abierto = h >= 10 && h < 20;
    var el = $("abierto");
    el.textContent = abierto ? "Abierto · cierra 8:00 p.m." : "Cerrado · abre 10:00 a.m.";
    el.classList.toggle("si", abierto);
  }

  // ---------- Pedido ----------
  var pedido = leer("panda26-pedido", {}) || {};
  Object.keys(pedido).forEach(function (id) { if (!productos[id]) delete pedido[id]; });

  function cambiar(id, delta) {
    var n = (pedido[id] || 0) + delta;
    if (n <= 0) delete pedido[id]; else pedido[id] = n;
    guardar("panda26-pedido", pedido);
    pintarCantidades(id);
  }
  function resumen() {
    var cant = 0, total = 0;
    Object.keys(pedido).forEach(function (id) { cant += pedido[id]; total += pedido[id] * productos[id].precio; });
    return { cant: cant, total: total };
  }
  function pintarCantidades(cambiado) {
    document.querySelectorAll("[data-cant]").forEach(function (o) {
      var id = o.getAttribute("data-cant");
      o.textContent = pedido[id] || 0;
      o.hidden = !pedido[id];
      if (id === cambiado) { o.classList.remove("salta"); void o.offsetWidth; o.classList.add("salta"); }
    });
    document.querySelectorAll("[data-menos]").forEach(function (b) { b.hidden = !pedido[b.getAttribute("data-menos")]; });
    var r = resumen(), barra = $("barra");
    var antes = barra.hidden;
    barra.hidden = r.cant === 0;
    $("barra-cant").textContent = r.cant;
    $("barra-total").textContent = cup(r.total);
    if (cambiado && !antes && !barra.hidden) { barra.classList.remove("late"); void barra.offsetWidth; barra.classList.add("late"); }
  }

  function contador(p) {
    return '<div class="contador">' +
      '<button class="menos" data-menos="' + p.id + '" aria-label="Quitar ' + p.nombre + '" hidden>' + MENOS + "</button>" +
      '<output data-cant="' + p.id + '">0</output>' +
      '<button data-mas="' + p.id + '" aria-label="Añadir ' + p.nombre + '">' + MAS + "</button></div>";
  }

  // ---------- Carta ----------
  function pintarCarta() {
    $("horario").textContent = M.horario;
    $("wa-pie").href = "https://api.whatsapp.com/send?phone=" + M.whatsapp;
    var frases = [M.aviso, "Servicio a domicilio todos los días", "Gira cada combo en 360°", "Pide por WhatsApp"];
    var tira = frases.map(function (f) { return "<span>" + f + "</span>"; }).join("");
    $("cinta").innerHTML = tira + tira;

    $("cats").innerHTML = M.categorias.map(function (c) {
      return '<a href="#cat-' + c.id + '" data-cat="' + c.id + '">' + c.nombre + "</a>";
    }).join("");

    $("menu").innerHTML = M.categorias.map(function (c) {
      var conGiro = c.productos.filter(function (p) { return p.giro; });
      var resto = c.productos.filter(function (p) { return !p.giro; });
      return '<section class="seccion" id="cat-' + c.id + '" data-seccion="' + c.id + '">' +
        '<div class="seccion-titulo"><h3>' + c.nombre + "</h3></div>" +
        (c.nota ? '<p class="nota">' + c.nota + "</p>" : "") +
        (conGiro.length ? '<div class="estrellas">' + conGiro.map(function (p) {
          return '<div class="estrella" data-item="' + p.id + '" data-busca="' + normal(p.nombre + " " + c.nombre) + '">' +
            '<button class="estrella-ver" data-ver="' + p.id + '" aria-label="Ver ' + p.nombre + ' en 360°" style="all:unset;display:block;cursor:pointer">' +
            '<img class="estrella-foto" src="' + p.estudio + '" alt="" loading="lazy" width="400" height="400">' +
            '<span class="sello-360">360°</span>' +
            '<div class="estrella-info"><strong>' + p.nombre + "</strong><span>" + cup(p.precio) + "</span></div></button>" +
            contador(p) + "</div>";
        }).join("") + "</div>" : "") +
        resto.map(function (p) {
          return '<div class="item" data-item="' + p.id + '" data-busca="' + normal(p.nombre + " " + c.nombre) + '">' +
            '<div class="item-icono">' + icono(p.icono || c.icono) + "</div>" +
            '<div class="item-texto"><strong>' + p.nombre + '</strong><span class="precio">' + cup(p.precio) + "</span></div>" +
            contador(p) + "</div>";
        }).join("") + "</section>";
    }).join("");

    $("puntos").innerHTML = destacados.map(function (p, i) {
      return '<button role="tab" data-punto="' + i + '" aria-label="' + p.nombre + '"></button>';
    }).join("");
    pintarCantidades();
  }

  $("buscar").addEventListener("input", function () {
    var q = normal(this.value.trim()), algo = false;
    document.querySelectorAll("[data-seccion]").forEach(function (s) {
      var visibles = 0;
      s.querySelectorAll("[data-item]").forEach(function (it) {
        var ok = !q || it.getAttribute("data-busca").indexOf(q) !== -1;
        it.hidden = !ok; if (ok) visibles++;
      });
      s.hidden = visibles === 0; if (visibles) algo = true;
    });
    $("vacio").hidden = algo;
  });

  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.getAttribute("data-seccion");
        document.querySelectorAll("[data-cat]").forEach(function (a) { a.classList.toggle("activa", a.getAttribute("data-cat") === id); });
      });
    }, { rootMargin: "-35% 0px -60% 0px" });
  }

  // ---------- Escenario: giro 360° ----------
  var actual = 0, fotograma = 0, pausado = false, arrastrando = false, hoja = null, cargando = null;
  var lienzo = $("giro-lienzo"), dibujo = lienzo.getContext("2d"), giro = $("giro");
  var hojas = {}; // giros ya bajados (solo se guardan los que se han visto)

  function dibujar() {
    if (!hoja) return;
    var f = ((Math.round(fotograma) % FOTOGRAMAS) + FOTOGRAMAS) % FOTOGRAMAS;
    dibujo.clearRect(0, 0, LADO, LADO);
    dibujo.drawImage(hoja, (f % COLUMNAS) * LADO, Math.floor(f / COLUMNAS) * LADO, LADO, LADO, 0, 0, LADO, LADO);
  }

  function bajarGiro(p, alListo) {
    if (hojas[p.id]) { if (alListo) alListo(hojas[p.id]); return; }
    var img = new Image();
    img.decoding = "async";
    img.onload = function () { hojas[p.id] = img; if (alListo) alListo(img); };
    img.src = p.giro;
  }

  function mostrar(i, sentido) {
    var p = destacados[(i + destacados.length) % destacados.length];
    actual = destacados.indexOf(p);
    var et = $("etiqueta");
    hoja = null;
    giro.classList.remove("listo", "entra");
    giro.classList.add("sale");
    et.classList.add("cambia");
    setTimeout(function () {
      $("et-cat").textContent = p.cat.nombre;
      $("et-nombre").textContent = p.nombre;
      $("et-frase").textContent = (p.frase || "") + (p.cat.nota ? " · " + p.cat.nota.toLowerCase() : "");
      $("et-precio").textContent = cup(p.precio);
      $("anadir-precio").textContent = cup(p.precio);
      $("giro-foto").src = p.estudio;
      $("giro-foto").alt = p.nombre;
      document.querySelectorAll("[data-punto]").forEach(function (b, k) { b.setAttribute("aria-selected", k === actual ? "true" : "false"); });
      giro.classList.remove("sale");
      void giro.offsetWidth;
      giro.classList.add("entra");
      et.classList.remove("cambia");
      fotograma = 0;
      $("giro-carga").classList.add("activa");
      cargando = p.id;
      bajarGiro(p, function (img) {
        if (cargando !== p.id) return;
        hoja = img; dibujar();
        giro.classList.add("listo");
        $("giro-carga").classList.remove("activa");
        // deja listo el siguiente sin prisa
        setTimeout(function () { if (cargando === p.id) bajarGiro(destacados[(actual + 1) % destacados.length]); }, 2500);
      });
    }, sentido === 0 ? 0 : 260);
  }

  var ultimo = 0;
  function bucle(t) {
    if (!pausado && !arrastrando && hoja && !document.hidden && !quieto) {
      if (t - ultimo > 1000 / 12) { fotograma += 1; dibujar(); ultimo = t; }
    }
    requestAnimationFrame(bucle);
  }

  var x0 = 0, f0 = 0, movido = false;
  giro.addEventListener("pointerdown", function (e) {
    if (!hoja) return;
    arrastrando = true; movido = false; x0 = e.clientX; f0 = fotograma;
    giro.setPointerCapture(e.pointerId);
  });
  giro.addEventListener("pointermove", function (e) {
    if (!arrastrando) return;
    var dx = e.clientX - x0;
    if (Math.abs(dx) > 4) movido = true;
    fotograma = f0 - dx / (giro.clientWidth * 1.1) * FOTOGRAMAS;
    dibujar();
    if (movido) $("pista").classList.add("oculta");
  });
  function suelta() { arrastrando = false; }
  giro.addEventListener("pointerup", suelta);
  giro.addEventListener("pointercancel", suelta);

  function siguiente(d) {
    var b = d > 0 ? $("siguiente") : $("anterior");
    b.classList.remove("onda"); void b.offsetWidth; b.classList.add("onda");
    son.cambio(); vibra(8);
    mostrar(actual + d, d);
  }
  $("siguiente").addEventListener("click", function () { siguiente(1); });
  $("anterior").addEventListener("click", function () { siguiente(-1); });
  $("pausa").addEventListener("click", function () {
    pausado = !pausado;
    this.setAttribute("aria-pressed", pausado ? "true" : "false");
    this.setAttribute("aria-label", pausado ? "Seguir girando" : "Pausar el giro");
    son.toque(); vibra(6);
  });
  document.addEventListener("keydown", function (e) {
    if (e.target.tagName === "INPUT") return;
    if (e.key === "ArrowRight") siguiente(1);
    if (e.key === "ArrowLeft") siguiente(-1);
  });

  $("anadir").addEventListener("click", function () {
    var p = destacados[actual];
    vuela($("giro-foto"), p.estudio);
    cambiar(p.id, 1);
    son.anadir(); vibra([10, 40, 14]);
  });

  function vuela(desde, src) {
    if (quieto) return;
    var r = desde.getBoundingClientRect();
    var img = document.createElement("img");
    img.src = src; img.className = "vuela"; img.alt = "";
    img.style.left = (r.left + r.width / 2 - 32) + "px";
    img.style.top = (r.top + r.height / 2 - 32) + "px";
    document.body.appendChild(img);
    requestAnimationFrame(function () {
      var dx = window.innerWidth / 2 - (r.left + r.width / 2);
      var dy = window.innerHeight - 50 - (r.top + r.height / 2);
      img.style.transform = "translate(" + dx + "px," + dy + "px) scale(.35)";
      img.style.opacity = "0.2";
    });
    setTimeout(function () { img.remove(); }, 750);
  }

  // ---------- Clics de la carta ----------
  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-mas],[data-menos],[data-ver],[data-punto],[data-cerrar]");
    if (!t) return;
    if (t.hasAttribute("data-mas")) {
      var id = t.getAttribute("data-mas");
      var foto = t.closest(".estrella") && t.closest(".estrella").querySelector("img");
      if (foto) vuela(foto, productos[id].estudio);
      cambiar(id, 1); son.anadir(); vibra(10);
    } else if (t.hasAttribute("data-menos")) {
      cambiar(t.getAttribute("data-menos"), -1); son.toque(); vibra(6);
    } else if (t.hasAttribute("data-ver")) {
      var i = destacados.indexOf(productos[t.getAttribute("data-ver")]);
      window.scrollTo({ top: 0, behavior: quieto ? "auto" : "smooth" });
      son.cambio(); mostrar(i, 1);
    } else if (t.hasAttribute("data-punto")) {
      var k = +t.getAttribute("data-punto");
      if (k !== actual) { son.cambio(); mostrar(k, k > actual ? 1 : -1); }
    } else if (t.hasAttribute("data-cerrar")) {
      cerrarHoja();
    }
  });

  // ---------- Hoja del pedido y WhatsApp ----------
  $("barra").addEventListener("click", function () {
    var r = resumen();
    $("lineas").innerHTML = Object.keys(pedido).map(function (id) {
      var p = productos[id];
      return "<li><span><b>" + pedido[id] + "×</b>" + p.nombre + "</span><span>" + cup(pedido[id] * p.precio) + "</span></li>";
    }).join("");
    $("total").textContent = cup(r.total);
    $("hoja").hidden = false;
    document.body.style.overflow = "hidden";
    son.toque();
  });
  function cerrarHoja() { $("hoja").hidden = true; document.body.style.overflow = ""; }
  $("hoja").addEventListener("click", function (e) { if (e.target === this) cerrarHoja(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("hoja").hidden) cerrarHoja(); });

  function entrega() { return document.querySelector('input[name="entrega"]:checked').value; }
  document.querySelectorAll('input[name="entrega"]').forEach(function (r) {
    r.addEventListener("change", function () { $("campo-dir").hidden = entrega() !== "domicilio"; son.toque(); });
  });

  $("pedir").addEventListener("click", function () {
    var r = resumen();
    if (!r.cant) return;
    var texto = ["Hola " + M.negocio + " 🐼 Quiero pedir:"].concat(
      Object.keys(pedido).map(function (id) { var p = productos[id]; return "• " + pedido[id] + " × " + p.nombre + " — " + cup(pedido[id] * p.precio); }),
      ["", "Total: " + cup(r.total)]
    );
    if (entrega() === "domicilio") {
      var dir = $("direccion").value.trim();
      texto.push("Entrega: 🛵 a domicilio" + (dir ? " — " + dir : ""));
    } else {
      texto.push("Entrega: 🏃 lo recojo en el kiosco");
    }
    var nota = $("nota").value.trim();
    if (nota) texto.push("Nota: " + nota);
    texto.push("", "(Pedido desde el menú digital)");
    // api.whatsapp.com directo: el atajo wa.me rompe los emojis al redirigir
    window.location.href = "https://api.whatsapp.com/send?phone=" + M.whatsapp + "&text=" + encodeURIComponent(texto.join("\n"));
  });

  // ---------- Arranque ----------
  pintarSonido();
  pintarEstado();
  setInterval(pintarEstado, 60000);
  pintarCarta();
  if (obs) document.querySelectorAll("[data-seccion]").forEach(function (s) { obs.observe(s); });
  mostrar(0, 0);
  requestAnimationFrame(bucle);

  var visto = false;
  try { visto = sessionStorage.getItem("panda26-intro") === "1"; sessionStorage.setItem("panda26-intro", "1"); } catch (e) { /* nada */ }
  var inicio = Date.now();
  function quitarIntro() {
    var espera = Math.max(0, (visto ? 300 : 1700) - (Date.now() - inicio));
    setTimeout(function () {
      $("intro").classList.add("fuera");
      setTimeout(function () { $("intro").remove(); }, 800);
    }, espera);
  }
  if (document.readyState === "complete") quitarIntro(); else window.addEventListener("load", quitarIntro);

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () { /* sin caché */ }); });
  }
})();
