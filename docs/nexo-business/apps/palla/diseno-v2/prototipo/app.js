/* Pa'llá · prototipo clicable v2 (solo diseño). Navegación por #pantalla. Sin librerías salvo el mapa (opcional).
   v2: menos texto, un solo amarillo por pantalla, avanza solo con temporizadores y barra de progreso del viaje. */
(function () {
	'use strict';
	var Q = new URLSearchParams(location.search);
	var LIENZO = Q.has('lienzo');
	var SIN_MAPA = Q.has('nomapa');
	var QUIETO = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
	var R = window.PDATOS.rutas;
	var $ = function (s, r) { return (r || document).querySelector(s); };
	var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
	var pant = $('#pant'), marco = $('#marco'), mapaEl = $('#mapa');
	var ultimo = function (c) { return c[c.length - 1]; };

	// ---------- Utilidades ----------
	function ico(n, c) { return '<svg class="p-ico ' + (c || '') + '" aria-hidden="true"><use href="../iconos.svg#' + n + '"/></svg>'; }
	function veh(t, v) { return '../vehiculos/3d/' + t + '-' + (v || 'lado') + '.webp'; }
	function miles(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
	function cup(n) { return miles(n) + ' CUP'; }
	function cupG(n) { return miles(n) + '<small>CUP</small>'; }
	function r10(x) { return Math.round(x / 10) * 10; }
	function km(x) { return String(Math.round(x * 10) / 10).replace('.', ','); }
	function hora(minMas) { var d = new Date(Date.now() + (minMas || 0) * 60000); return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); }
	function estr(e) { return '<span class="pa-estr">' + ico('estrella-llena', 'p-ico--16') + e + '</span>'; }
	function ir(id) { location.hash = id; }
	var LS = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { } }, del: function (k) { try { localStorage.removeItem(k); } catch (e) { } } };
	var timers = [];
	function T(fn, ms) { timers.push(setTimeout(fn, ms)); }
	function I(fn, ms) { timers.push(setInterval(fn, ms)); }
	function tostada(txt, icono) {
		var v = $('.pa-tostada'); if (v) { v.remove(); }
		var t = document.createElement('div'); t.className = 'pa-tostada'; t.setAttribute('role', 'status');
		t.innerHTML = ico(icono || 'check', 'p-ico--20') + '<span>' + txt + '</span>';
		marco.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
	}
	// Hoja que sube encima de la pantalla (ayuda, forma de pago, pasos para pagar)
	function hojaSobre(html, alAbrir) {
		var h = document.createElement('div'); h.className = 'pa-sobre';
		h.innerHTML = '<div class="pa-velo" data-cerrar></div><section class="pa-hoja" style="z-index:11"><div class="p-hoja__asa"></div>' + html + '</section>';
		marco.appendChild(h);
		$$('[data-cerrar]', h).forEach(function (x) { x.addEventListener('click', function () { h.remove(); }); });
		if (alAbrir) { alAbrir(h); }
		timers.push({ off: function () { h.remove(); } });
		return h;
	}

	// ---------- Lugares, rutas y precios (rutas reales de nuestro OSRM) ----------
	var ORIGEN = { n: 'Calle N e/ 23 y 25', d: 'Vedado', p: R.viaje.c[0] };
	var DEST = {
		coppelia: { n: 'Coppelia', d: '23 y L, Vedado', p: ultimo(R.viaje.c) },
		obispo: { n: 'Obispo e/ Habana y Compostela', d: 'La Habana Vieja', p: ultimo(R.obispo.c) }
	};
	var ENVIO = { de: { n: 'Línea y Paseo', d: 'Vedado', p: R.envio.c[0] }, a: { n: 'Hidalgo, Nuevo Vedado', d: 'Plaza', p: ultimo(R.envio.c) }, ruta: R.envio };

	// Precio justo: tabla de precios v2 aprobada por Ernesto (4-nov). [mínimo, km incluidos, CUP por km]
	var TARIFA = { "taxi-basico": [3000, 2, 200], "taxi-clasico": [3500, 2, 400], "taxi-xl": [4500, 2, 400],
		"tric-electrico": [1500, 2, 300], "tric-xl": [2200, 2, 400], "tric-bici": [800, 2, 250], "tric-carga": [2000, 3, 300],
		"moto": [800, 3, 230], "mensajero": [1000, 3, 250] };
	var MIN_DE = {};
	function justo(tipo, k) {
		var t = TARIFA[tipo], v = Math.ceil((t[0] + Math.max(0, k - t[1]) * t[2]) / 10) * 10;
		MIN_DE[v] = Math.max(MIN_DE[v] || 0, t[0]);
		return v;
	}
	// El cliente baja hasta −20 %, pero nunca debajo del mínimo (decisión de Ernesto); sube hasta +50 %.
	function limites(j) { return { min: Math.max(MIN_DE[j] || 0, Math.ceil(j * 0.8 / 10) * 10), max: Math.floor(j * 1.5 / 10) * 10 }; }

	var TIPOS = {
		tric: [{ id: 'tric-electrico', n: 'Eléctrico', c: '4', i: 'usuario', eta: 2 }, { id: 'tric-bici', n: 'Bici', c: '2', i: 'usuario', eta: 4 }, { id: 'tric-xl', n: 'Eléctrico XL', c: '6–8', i: 'usuario', eta: 6 }, { id: 'tric-carga', n: 'Carga', c: '300 kg', i: 'caja', eta: 9 }],
		taxi: [{ id: 'taxi-basico', n: 'Básico', c: '4', i: 'usuario', eta: 3 }, { id: 'taxi-clasico', n: 'Clásico', c: '4', i: 'usuario', eta: 5 }, { id: 'taxi-xl', n: 'XL', c: '7', i: 'usuario', eta: 8 }],
		moto: [{ id: 'moto', n: 'Moto', c: '1', i: 'usuario', eta: 2 }]
	};
	var NOMBRE_TIPO = {}; Object.keys(TIPOS).forEach(function (g) { TIPOS[g].forEach(function (t) { NOMBRE_TIPO[t.id] = t; }); });
	NOMBRE_TIPO.mensajero = { id: 'mensajero', n: 'Mensajero', c: '1', eta: 4 };
	var GRUPO = { 'tric-electrico': 'tric', 'tric-bici': 'tric', 'tric-xl': 'tric', 'tric-carga': 'tric', 'taxi-basico': 'taxi', 'taxi-clasico': 'taxi', 'taxi-xl': 'taxi', moto: 'moto', mensajero: 'mens' };
	var PALABRA = { tric: 'triciclo', taxi: 'taxi', moto: 'moto', mens: 'mensajero' };

	// ---------- Estado del camino (con valores de ejemplo para abrir cualquier pantalla suelta) ----------
	var S = { svc: 'tric', tipo: 'tric-electrico', dest: 'coppelia', precio: null, primera: false, pago: 'efectivo', oferta: null, envio: { tam: 'mano', cobrar: false, precio: null }, chPaso: 'ir', estrellas: 0 };
	try { var g = JSON.parse(sessionStorage.getItem('palla-proto') || 'null'); if (g && !LIENZO) { S = Object.assign(S, g); } } catch (e) { }
	function guardar() { if (!LIENZO) { try { sessionStorage.setItem('palla-proto', JSON.stringify(S)); } catch (e) { } } }
	function dest() { return DEST[S.dest] || DEST.coppelia; }
	// Triciclo, bici y moto van por el camino corto; el taxi, por el de carro (calles de un sentido).
	function porCarro() { return GRUPO[S.tipo] === 'taxi'; }
	function rutaV() { return S.dest === 'obispo' ? R.obispo : (porCarro() ? R.viaje : R.viajeCorto); }
	function rutaLlega() { return porCarro() ? R.llega : R.llegaCorto; }
	function kmViaje() { return rutaV().km; }
	function minViaje() { return Math.max(2, Math.round(rutaV().min * 1.6)); }
	function precioJ() { return justo(S.tipo, kmViaje()); }
	function precio() { var j = precioJ(), l = limites(j); var p = S.precio || j; return Math.min(l.max, Math.max(l.min, p)); }
	function precioEnvio() { return S.envio.precio || justo('mensajero', ENVIO.ruta.km); }
	var KC = R.viajeCorto.km, PRECIO_CH = justo('tric-electrico', KC);
	function chPrecio() { return S.chPrecio || PRECIO_CH; }

	var CHOFERES = [
		{ id: 'yr', n: 'Yoandri R.', e: '4,9', v: 212, col: 'azul', min: 2, mod: 0 },
		{ id: 'mp', n: 'Maikel P.', e: '4,7', v: 98, col: 'blanco', min: 4, mod: 0.1 },
		{ id: 'dc', n: 'Dayana C.', e: '4,8', v: 340, col: 'gris', min: 1, mod: 0.2 },
		{ id: 'rg', n: 'Ramón G.', e: '5,0', v: 51, col: 'verde', min: 6, mod: 0 }
	];
	function iniciales(n) { return n.split(' ').map(function (x) { return x[0]; }).join('').slice(0, 2); }

	// ---------- Barra de progreso del viaje (como Yandex Go) ----------
	// Un solo valor k (0 → 1) mueve la barra, el vehículo de encima, el % y el vehículo del mapa (o del plano de reserva).
	function barra(tipoV, llegaTxt) {
		return '<div class="p-progreso" role="progressbar" aria-label="Recorrido" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">'
			+ '<div class="p-progreso__pista"><i class="p-progreso__lleno"></i><span class="p-progreso__veh"><img src="' + veh(tipoV) + '" alt=""></span></div>'
			+ '<div class="p-progreso__txt"><span><b data-pct>0 %</b> recorrido</span><span>' + llegaTxt + '</span></div></div>';
	}
	function recorrido(r, o) {
		var box = $('.p-progreso', r); if (!box) { return; }
		var lleno = $('.p-progreso__lleno', box), vh = $('.p-progreso__veh', box), pct = $('[data-pct]', box);
		var t0 = performance.now() - (Math.min(95, +Q.get('desde') || 0) / 100) * o.ms, hecho = false, raf = 0, ant = -1; // ?desde=40 empieza en el 40 %
		function pintar(k) {
			if (QUIETO) { k = Math.floor(k * 10) / 10; } // reducir movimiento: % fijo por tramos, sin deslizar
			lleno.style.transform = 'scaleX(' + k.toFixed(4) + ')';
			vh.style.left = 'calc(' + (k * 100).toFixed(2) + '% - ' + (k * 36).toFixed(1) + 'px)';
			var p = Math.round(k * 100);
			if (p !== ant) { ant = p; pct.textContent = p + ' %'; box.setAttribute('aria-valuenow', p); if (o.cada) { o.cada(k); } }
			PMapa.colocar(o.id, k);
		}
		function paso(t) {
			var k = (t - t0) / o.ms;
			if (LIENZO) { k = 0.3 + (k % 0.6); } // en el lienzo va y vuelve entre 30 y 90 %, sin cambiar de pantalla
			else if (k >= 1) { pintar(1); if (!hecho) { hecho = true; if (o.fin) { o.fin(); } } return; }
			pintar(k); raf = requestAnimationFrame(paso);
		}
		raf = requestAnimationFrame(paso);
		timers.push({ off: function () { cancelAnimationFrame(raf); } });
	}

	// =====================================================================================
	// PANTALLAS
	// =====================================================================================
	var SCR = {};
	var LOGO = '<svg width="48" height="48" viewBox="0 0 96 96" aria-hidden="true"><rect width="96" height="96" rx="22" fill="#0E0E0E"/><path fill="#FFC21A" fill-rule="evenodd" d="M25 20h27a20 20 0 0 1 0 40h-9v16H25zM43 34v12h7a6 6 0 0 0 0-12z"/><path d="M43 76c10 0 24-2 34-12" fill="none" stroke="#FFC21A" stroke-width="5" stroke-linecap="round"/><circle cx="78" cy="63" r="5" fill="#fff"/></svg>';

	// ---------- Cliente ----------
	SCR.carga = {
		html: function () {
			return '<div class="pa-carga" role="img" aria-label="Pa\'llá">'
				+ '<svg viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="#161616"/>'
				+ '<path class="pc-p" fill="#FFC21A" fill-rule="evenodd" d="M25 20h27a20 20 0 0 1 0 40h-9v16H25zM43 34v12h7a6 6 0 0 0 0-12z"/>'
				+ '<path class="pc-ruta" d="M43 76c10 0 24-2 34-12" fill="none" stroke="#FFC21A" stroke-width="5" stroke-linecap="round" opacity=".9"/>'
				+ '<circle class="pc-punto" cx="78" cy="63" r="5" fill="#fff"/></svg><b>Pa\'llá</b></div>';
		},
		init: function () { if (!LIENZO) { T(function () { ir(LS.get('palla-dentro') ? 'inicio' : 'entrar'); }, 1400); } }
	};

	SCR.entrar = {
		html: function () {
			return '<div class="pa-llena"><div class="pa-cuerpo" style="padding-top:64px">' + LOGO
				+ '<div><h1 class="p-titulo">Muévete por La Habana</h1><p class="p-2" style="margin:6px 0 0">Taxi, triciclo o mensajero. Tú pones el precio.</p></div>'
				+ '<div><label class="pa-etq" for="tel">Tu móvil</label>'
				+ '<div class="pa-tel"><span class="pref">+53</span><label class="p-campo"><input id="tel" inputmode="tel" autocomplete="tel" value="5 312 4210" aria-label="Número de móvil"></label></div></div>'
				+ '</div><div class="pa-pie"><a class="p-btn p-btn--marca p-btn--ancho" href="#codigo">' + ico('whatsapp', 'p-ico--20') + 'Código por WhatsApp</a>'
				+ '<a class="pa-enlace" href="#codigo">¿Sin WhatsApp? Por SMS</a></div></div>';
		}
	};

	SCR.codigo = {
		html: function () {
			return '<div class="pa-llena"><div class="pa-cab"><a class="pa-volver" href="#entrar" aria-label="Volver">' + ico('atras') + '</a></div>'
				+ '<div class="pa-cuerpo"><div><h1 class="p-titulo">Escribe el código</h1><p class="p-2" style="margin:6px 0 0">Llegó por WhatsApp al +53 5 312 4210.</p></div>'
				+ '<div class="pa-cajas" aria-label="Código de 4 cifras"><span>2</span><span>0</span><span>5</span><span class="is-act">9</span></div>'
				+ '<a class="pa-enlace" href="#codigo" style="align-self:center">Reenviar en 0:42</a>'
				+ '<div><label class="pa-etq" for="nom">¿Cómo te llamas?</label><label class="p-campo"><input id="nom" value="Laura" autocomplete="given-name"></label></div>'
				+ '</div><div class="pa-pie"><a class="p-btn p-btn--marca p-btn--ancho" href="#inicio" id="entra">Entrar</a></div></div>';
		},
		init: function () { $('#entra').onclick = function () { LS.set('palla-dentro', '1'); }; }
	};

	function cercanos(svc) {
		var img = { taxi: 'taxi-basico', tric: 'tric-electrico', mens: 'mensajero' }[svc] || 'tric-electrico';
		var ida = function (c) { return c.concat(c.slice().reverse()); };
		var a = R.llegaCorto.c, b = R.viaje.c, c = R.obispo.c.slice(0, 28), d = R.envio.c.slice(0, 30);
		return [['c1', veh(img, 'arriba'), ida(a), 70000, true], ['c2', veh(img, 'arriba'), ida(b.slice().reverse()), 50000, true], ['c3', veh(img, 'arriba'), ida(c), 80000, true], ['c4', veh(img, 'arriba'), ida(d), 90000, true]];
	}

	function filaLugar(href, icono, n, d, dd, fin) {
		return '<a class="p-fila" href="' + href + '"' + (dd ? ' data-d="' + dd + '"' : '') + '><span class="p-fila__ico">' + ico(icono) + '</span><span class="p-fila__txt"><b>' + n + '</b><span>' + d + '</span></span>' + (fin ? '<span class="p-fila__fin">' + fin + '</span>' : '') + '</a>';
	}

	SCR.inicio = {
		mapa: function () { return { ver: [ORIGEN.p], zoom: 15.4, pins: [['yo', ORIGEN.p]], mover: cercanos(S.svc) }; },
		html: function () {
			var serv = function (s, n, i) { return '<button class="pa-serv" data-s="' + s + '" aria-pressed="' + (S.svc === s) + '">' + ico(i, 'p-ico--20') + n + '</button>'; };
			var mens = S.svc === 'mens';
			return '<div class="pa-arriba"><a class="p-btn p-btn--redondo" href="#perfil" aria-label="Menú">' + ico('menu') + '</a></div>'
				+ '<section class="pa-hoja" aria-label="Pedir"><div class="p-hoja__asa"></div>'
				+ '<div class="pa-servicios">' + serv('taxi', 'Taxi', 'coche') + serv('tric', 'Triciclo', 'triciclo') + serv('mens', 'Mensajero', 'paquete') + '</div>'
				+ '<a class="pa-buscar" href="#' + (mens ? 'envio' : 'destino') + '"><i>' + ico('buscar', 'p-ico--20') + '</i><div><b>' + (mens ? '¿Qué mandamos?' : '¿A dónde vamos?') + '</b><span>Desde ' + ORIGEN.n + '</span></div></a>'
				+ '<div class="pa-fila-chips"><a class="p-chip" href="#recogida" data-d="coppelia">' + ico('casa', 'p-ico--16') + 'Casa</a><a class="p-chip" href="#recogida" data-d="obispo">' + ico('trabajo', 'p-ico--16') + 'Trabajo</a></div>'
				+ filaLugar('#recogida', 'reloj', 'Coppelia', '23 y L, Vedado', 'coppelia')
				+ filaLugar('#recogida', 'reloj', 'Obispo e/ Habana y Compostela', 'La Habana Vieja', 'obispo')
				+ '</section>';
		},
		init: function (r) {
			$$('.pa-serv', r).forEach(function (b) { b.onclick = function () { S.svc = b.dataset.s; if (S.svc !== 'mens') { S.tipo = TIPOS[S.svc][0].id; S.precio = null; } guardar(); mostrar(); }; });
			$$('[data-d]', r).forEach(function (a) { a.addEventListener('click', function () { S.dest = a.dataset.d; S.precio = null; guardar(); }); });
		}
	};

	SCR.destino = {
		html: function () {
			var kc = km(S.svc === 'taxi' ? R.viaje.km : R.viajeCorto.km) + ' km';
			return '<div class="pa-llena"><div class="pa-cab"><a class="pa-volver" href="#inicio" aria-label="Volver">' + ico('atras') + '</a><h1>¿A dónde vamos?</h1></div>'
				+ '<div class="pa-cuerpo" style="gap:4px"><div class="pa-od"><span class="pm-pin pm-pin--yo"></span><span class="pm-pin pm-pin--destino"></span>'
				+ '<label class="p-campo"><input value="' + ORIGEN.n + '" aria-label="Recoger en"></label>'
				+ '<label class="p-campo is-foco"><input id="q" value="Copp" aria-label="Llevar a" autocomplete="off"><button class="pa-volver" style="width:32px;height:32px" aria-label="Borrar" onclick="this.previousElementSibling.value=\'\'">' + ico('cerrar', 'p-ico--16') + '</button></label></div>'
				+ '<div style="margin-top:8px">'
				+ filaLugar('#recogida', 'pin', '<em class="pa-resaltar">Copp</em>elia', '23 y L, Vedado', 'coppelia', kc)
				+ filaLugar('#recogida', 'pin', '<em class="pa-resaltar">Cop</em>a Room', 'Paseo y Malecón, Vedado', 'coppelia', '2,6 km')
				+ filaLugar('#recogida', 'pin', 'Calle <em class="pa-resaltar">Copp</em>inger', 'Cerro', 'coppelia', '4,4 km')
				+ filaLugar('#recogida', 'reloj', 'Obispo e/ Habana y Compostela', 'La Habana Vieja', 'obispo', '4,1 km')
				+ '</div></div><div class="pa-fijo"><a class="p-fila" href="#fijar"><span class="p-fila__ico">' + ico('mapa') + '</span><span class="p-fila__txt"><b>Fijar en el mapa</b></span></a></div></div>';
		},
		init: function (r) {
			$$('[data-d]', r).forEach(function (a) { a.addEventListener('click', function () { S.dest = a.dataset.d; S.precio = null; guardar(); }); });
			var q = $('#q', r); if (!LIENZO) { q.focus(); q.setSelectionRange(4, 4); }
		}
	};

	function pinCentro(arriba) { return '<div class="pa-pin-centro" style="top:calc(50% - ' + (arriba || 120) + 'px)"><span class="cabeza"></span><span class="palo"></span><span class="suelo"></span></div>'; }
	function escucharCentro() {
		var m = PMapa.mapa(); if (!m) { return; }
		var pc = $('.pa-pin-centro');
		var a = function () { if (pc) { pc.classList.add('is-mueve'); } }, b = function () {
			if (pc) { pc.classList.remove('is-mueve'); }
			var el = $('.pa-pin-centro'); if (!el) { return; }
			var r = el.getBoundingClientRect(), mr = mapaEl.getBoundingClientRect();
			var ll = m.unproject([r.left + r.width / 2 - mr.left, r.bottom - mr.top]);
			PMapa.calle([ll.lng, ll.lat]).then(function (n) { if (n && $('#dir')) { $('#dir').textContent = n; } });
		};
		m.on('movestart', a); m.on('moveend', b);
		timers.push({ off: function () { m.off('movestart', a); m.off('moveend', b); } });
	}

	SCR.fijar = {
		mapa: function () { return { ver: [DEST.obispo.p], zoom: 16.5, arriba: 0, listo: escucharCentro }; },
		html: function () {
			return '<div class="pa-arriba"><a class="p-btn p-btn--redondo" href="#destino" aria-label="Volver">' + ico('atras') + '</a><span class="pa-pastilla">Mueve el mapa</span></div>'
				+ pinCentro(140)
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div><p class="p-mini" style="margin:0 0 2px">Llevar a</p>'
				+ '<p class="p-h2" id="dir" style="margin:0">Obispo</p><p class="p-peq" style="margin:2px 0 16px">e/ Habana y Compostela, La Habana Vieja</p>'
				+ '<a class="p-btn p-btn--marca p-btn--ancho" href="#recogida" id="aqui">Llevar aquí</a></section>';
		},
		init: function () { $('#aqui').addEventListener('click', function () { S.dest = 'obispo'; S.precio = null; guardar(); }); }
	};

	SCR.recogida = {
		mapa: function () { return { ver: [ORIGEN.p], zoom: 17, pins: [['yo', ORIGEN.p]], listo: escucharCentro }; },
		html: function () {
			return '<div class="pa-arriba"><a class="p-btn p-btn--redondo" href="#destino" aria-label="Volver">' + ico('atras') + '</a><span class="pa-pastilla">A ' + dest().n.split(' e/')[0] + ' · ' + km(kmViaje()) + ' km</span></div>'
				+ pinCentro(150)
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div><p class="p-h2" style="margin:0">¿Te recogemos aquí?</p>'
				+ '<p class="p-peq" style="margin:2px 0 14px"><span id="dir">' + ORIGEN.n + '</span>, ' + ORIGEN.d + '</p>'
				+ '<label class="p-campo" style="margin-bottom:12px">' + ico('nota', 'p-ico--20') + '<input placeholder="Nota para el chofer" aria-label="Nota para el chofer"></label>'
				+ '<a class="p-btn p-btn--marca p-btn--ancho" href="#tipo">Confirmar recogida</a></section>';
		}
	};

	SCR.tipo = {
		mapa: function () { var c = rutaV().c; return { ruta: c, ver: c, pins: [['origen', c[0]], ['destino', ultimo(c), dest().n.split(' e/')[0] + ' · ' + minViaje() + ' min']] }; },
		html: function () {
			var g = GRUPO[S.tipo] || 'tric'; if (g === 'mens') { g = 'tric'; }
			var pest = function (k, n) { return '<button aria-pressed="' + (g === k) + '" data-g="' + k + '">' + n + '</button>'; };
			var lista = TIPOS[g].map(function (t) {
				return '<button class="pa-tipo" data-t="' + t.id + '" aria-pressed="' + (S.tipo === t.id) + '"><img src="' + veh(t.id) + '" alt="" width="72" height="41"><span><b>' + t.n + '</b><span>' + ico(t.i, 'p-ico--16') + t.c + ' · ' + t.eta + ' min</span></span><span class="pr">' + cupG(justo(t.id, (t.id.indexOf('taxi') === 0 ? (S.dest === 'obispo' ? R.obispo : R.viaje) : (S.dest === 'obispo' ? R.obispo : R.viajeCorto)).km)) + '</span></button>';
			}).join('');
			return '<div class="pa-arriba"><a class="p-btn p-btn--redondo" href="#recogida" aria-label="Volver">' + ico('atras') + '</a></div>'
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div><div class="p-pest">' + pest('tric', 'Triciclo') + pest('taxi', 'Taxi') + pest('moto', 'Moto') + '</div>'
				+ '<div class="pa-tipos">' + lista + '</div>'
				+ '<a class="p-btn p-btn--marca p-btn--ancho" href="#precio">Elegir ' + NOMBRE_TIPO[S.tipo].n + '</a></section>';
		},
		init: function (r) {
			$$('[data-g]', r).forEach(function (b) { b.onclick = function () { S.tipo = TIPOS[b.dataset.g][0].id; S.svc = b.dataset.g === 'taxi' ? 'taxi' : 'tric'; S.precio = null; guardar(); mostrar(true); }; });
			$$('[data-t]', r).forEach(function (b) { b.onclick = function () { S.tipo = b.dataset.t; S.precio = null; guardar(); mostrar(true); }; });
		}
	};

	// Control del precio justo: − / + de 10 en 10, entre −20 % y +50 %. Sirve para viaje y envío.
	function controlPrecio(j, p) {
		var l = limites(j);
		var dif = p === j ? 'Precio justo' : (p > j ? '+' : '−') + Math.round(Math.abs(p - j) / j * 100) + ' % · justo ' + miles(j);
		return '<div class="pa-precio"><button class="p-btn p-btn--icono pa-pm" id="menos" aria-label="Bajar 10 CUP"' + (p <= l.min ? ' disabled' : '') + '>' + ico('menos') + '</button>'
			+ '<div class="pa-precio-n" aria-live="polite"><span class="p-precio">' + cupG(p) + '</span><span>' + dif + '</span></div>'
			+ '<button class="p-btn p-btn--icono pa-pm" id="mas" aria-label="Subir 10 CUP"' + (p >= l.max ? ' disabled' : '') + '>' + ico('mas') + '</button></div>';
	}
	function engancharPrecio(r, get, set) {
		$('#menos', r).onclick = function () { set(get() - 10); };
		$('#mas', r).onclick = function () { set(get() + 10); };
	}
	function nombrePago() { return S.pago === 'transfer' ? 'Transfermóvil' : 'Efectivo'; }
	function hojaPago(alElegir) {
		var op = function (v, i, n) { return '<button class="p-fila" data-pago="' + v + '"><span class="p-fila__ico">' + ico(i) + '</span><span class="p-fila__txt"><b>' + n + '</b></span>' + (S.pago === v ? ico('check', 'p-ico--20') : '') + '</button>'; };
		hojaSobre('<p class="p-h2" style="margin:0 0 8px">¿Cómo pagas?</p>' + op('efectivo', 'efectivo', 'Efectivo') + op('transfer', 'transfer', 'Transfermóvil'), function (h) {
			$$('[data-pago]', h).forEach(function (b) { b.onclick = function () { S.pago = b.dataset.pago; guardar(); h.remove(); alElegir(); }; });
		});
	}

	SCR.precio = {
		mapa: function () { var c = rutaV().c; return { ruta: c, rutaQuieta: true, ver: c, arriba: 70, pins: [['origen', c[0]], ['destino', ultimo(c)]] }; },
		html: function () {
			var t = NOMBRE_TIPO[S.tipo], g = GRUPO[S.tipo];
			return '<div class="pa-arriba"><a class="p-btn p-btn--redondo" href="#tipo" aria-label="Volver">' + ico('atras') + '</a></div>'
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div>'
				+ '<div class="pa-resumen"><img src="' + veh(S.tipo) + '" alt="" width="56" height="32"><div><b>' + t.n + '</b><span>' + dest().n.split(' e/')[0] + ' · ' + km(kmViaje()) + ' km · ' + minViaje() + ' min</span></div></div>'
				+ '<div id="ctl">' + controlPrecio(precioJ(), precio()) + '</div>'
				+ '<div class="pa-op"><b>Coger la 1.ª oferta</b><button class="p-interruptor" role="switch" aria-checked="' + S.primera + '" id="primera" aria-label="Coger la primera oferta"></button></div>'
				+ '<button class="pa-op" id="pago">' + ico(S.pago === 'transfer' ? 'transfer' : 'efectivo', 'p-ico--20') + '<b id="pago-n">' + nombrePago() + '</b>' + ico('sigue', 'p-ico--20') + '</button>'
				+ '<a class="p-btn p-btn--marca p-btn--ancho" href="#buscando" id="pedir" style="margin-top:12px">Pedir ' + PALABRA[g] + ' · ' + cup(precio()) + '</a></section>';
		},
		init: function (r) {
			var pintar = function () { $('#ctl', r).innerHTML = controlPrecio(precioJ(), precio()); $('#pedir', r).textContent = 'Pedir ' + PALABRA[GRUPO[S.tipo]] + ' · ' + cup(precio()); engancharPrecio(r, precio, fijar); };
			var fijar = function (v) { S.precio = v; guardar(); pintar(); };
			engancharPrecio(r, precio, fijar);
			$('#primera', r).onclick = function () { S.primera = !S.primera; this.setAttribute('aria-checked', S.primera); guardar(); };
			$('#pago', r).onclick = function () { hojaPago(function () { mostrar(true); }); };
			$('#pedir', r).onclick = function () { S.oferta = null; guardar(); };
		}
	};

	// Ofertas en vivo (cliente). modo = 'viaje' | 'envio'
	function esqueleto() { return '<div class="pa-esq-oferta" aria-hidden="true"><span class="p-esq" style="width:32px;height:32px;border-radius:50%"></span><span><span class="p-esq" style="width:58%;height:12px"></span><span class="p-esq" style="width:36%;height:10px;margin-top:8px"></span></span><span class="p-esq" style="width:52px;height:22px"></span></div>'; }
	function deslizar(el, alQuitar) {
		var x0 = null, dx = 0;
		el.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) { return; } x0 = e.clientX; dx = 0; try { el.setPointerCapture(e.pointerId); } catch (er) { } el.style.transition = 'none'; });
		el.addEventListener('pointermove', function (e) { if (x0 === null) { return; } dx = e.clientX - x0; el.style.transform = 'translateX(' + dx + 'px)'; el.style.opacity = 1 - Math.min(1, Math.abs(dx) / 240); });
		var fin = function () { if (x0 === null) { return; } x0 = null; el.style.transition = 'transform 180ms, opacity 180ms'; if (Math.abs(dx) > 90) { el.style.transform = 'translateX(' + (dx > 0 ? 420 : -420) + 'px)'; el.style.opacity = 0; setTimeout(alQuitar, 180); } else { el.style.transform = ''; el.style.opacity = ''; } };
		el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', fin);
	}
	function pantallaOfertas(modo) {
		var esEnvio = modo === 'envio';
		return {
			mapa: function () { var p = esEnvio ? ENVIO.de.p : ORIGEN.p; return { ver: [p], zoom: 15.2, pins: [['origen', p]], mover: cercanos(esEnvio ? 'mens' : GRUPO[S.tipo] === 'taxi' ? 'taxi' : 'tric') }; },
			html: function () {
				var p = esEnvio ? precioEnvio() : precio();
				return '<div class="pa-radar" aria-hidden="true"><i></i><i></i><i></i></div>'
					+ '<div class="pa-arriba"><a class="pa-pastilla" href="#' + (esEnvio ? 'envio-precio' : 'precio') + '">' + ico('cerrar', 'p-ico--16') + 'Cancelar</a></div>'
					+ '<section class="pa-hoja" style="max-height:74%"><div class="p-hoja__asa"></div>'
					+ '<div class="pa-tuya"><div><p class="p-mini" style="margin:0 0 4px">Tu oferta · ' + (esEnvio ? 'Mensajero' : NOMBRE_TIPO[S.tipo].n) + '</p><b id="tuya">' + cup(p) + '</b></div><button class="p-btn p-btn--suave p-btn--chico" id="subir">' + ico('mas', 'p-ico--16') + '10 %</button></div>'
					+ '<div class="pa-ofertas" id="ofertas"></div><div id="esq">' + esqueleto() + esqueleto() + '</div></section>';
			},
			init: function (r) {
				var cont = $('#ofertas', r), esq = $('#esq', r), n = 0, cogida = false;
				var precioActual = function () { return esEnvio ? precioEnvio() : precio(); };
				var tipoN = esEnvio ? 'Moto con caja' : NOMBRE_TIPO[S.tipo].n;
				var nombres = esEnvio ? [{ id: 'am', n: 'Alexis M.', e: '4,9', v: 410, min: 3, mod: 0 }, { id: 'lr', n: 'Lisandra R.', e: '4,8', v: 122, min: 5, mod: 0.1 }, { id: 'jc', n: 'Jorge C.', e: '4,6', v: 67, min: 2, mod: 0.2 }] : CHOFERES;
				// El amarillo solo en la mejor oferta (la más barata; si empatan, la que llega antes). Las demás, gris.
				var marcarMejor = function () {
					var arts = $$('.p-oferta', cont), mejor = null;
					arts.forEach(function (a) { if (!mejor || +a.dataset.p < +mejor.dataset.p || (+a.dataset.p === +mejor.dataset.p && +a.dataset.m < +mejor.dataset.m)) { mejor = a; } });
					arts.forEach(function (a) { $('[data-si]', a).className = 'p-btn ' + (a === mejor ? 'p-btn--marca' : 'p-btn--suave'); });
				};
				var quitar = function (el) { el.remove(); marcarMejor(); };
				var anadir = function (c, forzarAcepta) {
					var p = precioActual(), mod = forzarAcepta ? 0 : c.mod;
					if (!forzarAcepta && p < (esEnvio ? justo('mensajero', ENVIO.ruta.km) : precioJ()) && mod === 0) { mod = 0.1; }
					var ofrece = r10(p * (1 + mod)), acepta = mod === 0;
					var el = document.createElement('article');
					el.className = 'p-oferta'; el.dataset.p = ofrece; el.dataset.m = c.min;
					el.innerHTML = '<span class="p-cara p-oferta__cara">' + iniciales(c.n) + '</span>'
						+ '<div class="p-oferta__q">' + c.n + ' ' + estr(c.e) + '</div>'
						+ '<div class="p-oferta__precio">' + miles(ofrece) + '<small>' + (acepta ? 'tu precio' : '+' + Math.round(mod * 100) + ' %') + '</small></div>'
						+ '<div class="p-oferta__s">' + tipoN + ' · ' + c.min + ' min</div>'
						+ '<button class="p-btn p-btn--suave" data-si>Aceptar ' + miles(ofrece) + '</button>'
						+ '<i class="p-oferta__tiempo" aria-hidden="true"></i>';
					cont.insertBefore(el, cont.firstChild);
					n++; esq.innerHTML = n >= 3 ? '' : esqueleto();
					marcarMejor();
					var seg = 60, linea = $('.p-oferta__tiempo', el);
					var tick = setInterval(function () { seg--; linea.style.transform = 'scaleX(' + (seg / 60) + ')'; if (seg <= 0) { clearInterval(tick); quitar(el); } }, 1000);
					timers.push(tick);
					deslizar(el, function () { clearInterval(tick); quitar(el); });
					$('[data-si]', el).onclick = function () { elegir(c, ofrece); };
					if (S.primera && acepta && !cogida && !esEnvio) { cogida = true; T(function () { tostada('Cogimos la 1.ª oferta: ' + cup(ofrece)); elegir(c, ofrece); }, 900); }
				};
				var elegir = function (c, ofrece) {
					if (esEnvio) { S.envio.precio = ofrece; S.envio.mens = c; guardar(); ir('envio-seguimiento'); return; }
					S.oferta = { c: c, precio: ofrece }; guardar(); ir('viene');
				};
				T(function () { anadir(nombres[0]); }, LIENZO ? 300 : 1400);
				T(function () { anadir(nombres[1]); }, LIENZO ? 500 : 3000);
				T(function () { anadir(nombres[2]); }, LIENZO ? 700 : 4800);
				if (!esEnvio) { T(function () { anadir(nombres[3]); }, 9000); }
				$('#subir', r).onclick = function () {
					var j = esEnvio ? justo('mensajero', ENVIO.ruta.km) : precioJ(), l = limites(j), p = precioActual();
					var nuevo = Math.min(l.max, r10(p * 1.1));
					if (nuevo === p) { tostada('Ya está en el máximo', 'info'); return; }
					if (esEnvio) { S.envio.precio = nuevo; } else { S.precio = nuevo; } guardar();
					$('#tuya', r).textContent = cup(nuevo);
					tostada('Subiste a ' + cup(nuevo), 'flecha');
					T(function () { anadir({ id: 'x' + nuevo, n: esEnvio ? 'Yudith P.' : 'Osmany L.', e: '4,8', v: 176, min: 3, mod: 0 }, true); }, 1500);
				};
			}
		};
	}
	SCR.buscando = pantallaOfertas('viaje');

	function oferta() { return S.oferta || { c: CHOFERES[0], precio: precio() }; }
	function filaChofer(c, sub, tel) {
		return '<div class="pa-chofer"><span class="p-cara">' + iniciales(c.n) + '</span><div class="pa-chofer__q"><b>' + c.n + ' ' + estr(c.e) + '</b><span>' + sub + '</span></div>'
			+ '<a class="p-btn p-btn--icono" href="tel:' + (tel || '+5353124567') + '" aria-label="Llamar">' + ico('telefono', 'p-ico--20') + '</a>'
			+ '<button class="p-btn p-btn--icono" data-msj aria-label="Mensaje">' + ico('whatsapp', 'p-ico--20') + '</button></div>';
	}
	function hojaAyuda() {
		hojaSobre('<p class="p-h2" style="margin:0 0 8px">¿Necesitas ayuda?</p>'
			+ '<a class="p-fila" href="tel:106"><span class="p-fila__ico" style="color:var(--error)">' + ico('telefono') + '</span><span class="p-fila__txt"><b>Policía (106)</b><span>Si estás en peligro</span></span></a>'
			+ '<button class="p-fila" data-cerrar data-ok><span class="p-fila__ico">' + ico('compartir') + '</span><span class="p-fila__txt"><b>Avisar a Mamá</b><span>Ve tu viaje en vivo</span></span></button>'
			+ '<button class="p-fila" data-cerrar data-ok><span class="p-fila__ico">' + ico('whatsapp') + '</span><span class="p-fila__txt"><b>Hablar con Pa\'llá</b><span>Te contesta una persona</span></span></button>', function (h) {
			$$('[data-ok]', h).forEach(function (b) { b.addEventListener('click', function () { tostada('Hecho'); }); });
		});
	}
	function arribaViaje(atras) {
		return '<div class="pa-arriba">' + (atras ? '<a class="p-btn p-btn--redondo" href="#' + atras + '" aria-label="Volver">' + ico('atras') + '</a>' : '<span></span>')
			+ '<span class="pa-arriba__der"><button class="pa-pastilla" id="comp">' + ico('compartir', 'p-ico--16') + 'Compartir</button><button class="pa-pastilla pa-ayuda" id="ayuda">' + ico('escudo', 'p-ico--16') + 'Ayuda</button></span></div>';
	}
	function engancharViaje(r, txtComp) {
		$('#ayuda', r).onclick = hojaAyuda;
		$('#comp', r).onclick = function () { tostada(txtComp || 'Enlace del viaje copiado'); };
		$$('[data-msj]', r).forEach(function (b) { b.onclick = function () { tostada('Abre WhatsApp', 'whatsapp'); }; });
	}
	function eta(mini, grande, precioN, sub) {
		return '<div class="pa-eta"><div><p class="p-mini">' + mini + '</p><b id="eta">' + grande + '</b></div><div><b class="pa-eta__pr">' + cup(precioN) + '</b><span>' + sub + '</span></div></div>';
	}

	SCR.viene = {
		mapa: function () { var c = rutaLlega().c; return { ver: c, ruta: c, rutaQuieta: true, pins: [['origen', ultimo(c), 'Tú']], conducir: [['chofer', veh(S.tipo, 'arriba'), c]] }; },
		html: function () {
			var o = oferta(), t = S.tipo;
			return arribaViaje()
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div>'
				+ eta('Tu ' + PALABRA[GRUPO[t]] + ' viene', 'Llega en ' + o.c.min + ' min', o.precio, 'Fijo · ' + nombrePago().toLowerCase())
				+ barra(t, 'Llega ' + hora(o.c.min))
				+ filaChofer(o.c, NOMBRE_TIPO[t].n + ' ' + (o.c.col || '') + ' · LOT al día')
				+ '<div class="pa-codigo"><span>Código al subir</span><b>4817</b></div>'
				+ '<a class="p-btn p-btn--texto pa-cancelar" href="#inicio">Cancelar</a></section>';
		},
		init: function (r) {
			engancharViaje(r, 'Enlace del viaje copiado');
			var o = oferta();
			recorrido(r, {
				id: 'chofer', ms: 14000 + o.c.min * 2000,
				cada: function (k) { var m = Math.ceil(o.c.min * (1 - k)); $('#eta', r).textContent = k >= 1 ? 'Ya llegó' : m <= 0 ? 'Llegando' : 'Llega en ' + m + ' min'; },
				fin: function () { tostada('Tu chofer llegó. Dile el código 4817.'); T(function () { ir('viaje'); }, 2200); }
			});
		}
	};

	SCR.viaje = {
		mapa: function () { var c = rutaV().c; return { ver: c, ruta: c, rutaQuieta: true, pins: [['destino', ultimo(c), dest().n.split(' e/')[0]]], conducir: [['chofer', veh(S.tipo, 'arriba'), c]] }; },
		html: function () {
			var o = oferta();
			return arribaViaje()
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div>'
				+ eta('Camino a ' + dest().n.split(' e/')[0], 'Llegas a las ' + hora(minViaje()), o.precio, 'Fijo · no cambia')
				+ barra(S.tipo, km(kmViaje()) + ' km')
				+ filaChofer(o.c, NOMBRE_TIPO[S.tipo].n + ' ' + (o.c.col || '')) + '</section>';
		},
		init: function (r) {
			engancharViaje(r, 'Mamá ya ve tu viaje en vivo');
			recorrido(r, { id: 'chofer', ms: 16000, fin: function () { T(function () { ir('llegada'); }, 900); } });
		}
	};

	function estrellas(n) { var h = ''; for (var i = 1; i <= 5; i++) { h += '<button aria-label="' + i + ' estrellas" class="' + (i <= n ? 'is-on' : '') + '" data-e="' + i + '"><svg viewBox="0 0 24 24"><use href="../iconos.svg#estrella-llena"/></svg></button>'; } return '<div class="pa-estrellas">' + h + '</div>'; }
	function engancharEstrellas(r, alTocar) { $$('[data-e]', r).forEach(function (b) { b.onclick = function () { var n = +b.dataset.e; S.estrellas = n; $$('[data-e]', r).forEach(function (x) { x.classList.toggle('is-on', +x.dataset.e <= n); }); if (alTocar) { alTocar(n); } }; }); }
	function bloquePago(monto, nombre) {
		return '<div class="pa-seg" role="group" aria-label="Forma de pago"><button data-pg="efectivo" aria-pressed="' + (S.pago !== 'transfer') + '">Efectivo</button><button data-pg="transfer" aria-pressed="' + (S.pago === 'transfer') + '">Transfermóvil</button></div>'
			+ '<div id="tm" class="pa-tm" style="display:' + (S.pago === 'transfer' ? 'flex' : 'none') + '"><div><span class="p-peq">Número de ' + nombre + '</span><b class="p-num">5 312 4567</b></div><button class="p-btn p-btn--suave p-btn--chico" id="copiar">' + ico('copiar', 'p-ico--16') + 'Copiar</button></div>';
	}
	function engancharPago(r) {
		$$('[data-pg]', r).forEach(function (b) { b.onclick = function () { S.pago = b.dataset.pg; guardar(); $$('[data-pg]', r).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); $('#tm', r).style.display = S.pago === 'transfer' ? 'flex' : 'none'; }; });
		var c = $('#copiar', r); if (c) { c.onclick = function () { tostada('Número copiado'); }; }
	}
	function monto(mini, n) { return '<div class="pa-monto"><p class="p-mini">' + mini + '</p><span class="p-precio">' + cupG(n) + '</span></div>'; }

	SCR.llegada = {
		html: function () {
			var o = oferta(), q = o.c.n.split(' ')[0];
			return '<div class="pa-llena"><div class="pa-cuerpo" style="padding-top:32px">'
				+ '<div class="pa-hecho">' + ico('check', 'p-ico--20') + '<div><p class="p-h2" style="margin:0">Llegaste a ' + dest().n.split(' e/')[0] + '</p><p class="p-peq" style="margin:0">' + hora(0) + ' · ' + km(kmViaje()) + ' km con ' + o.c.n + '</p></div></div>'
				+ monto('A pagar a ' + q + ' · lo acordado', o.precio)
				+ bloquePago(o.precio, q)
				+ '<div><p class="pa-etq" style="text-align:center">¿Qué tal el viaje?</p>' + estrellas(LIENZO ? 0 : S.estrellas) + '</div>'
				+ '<div id="tras" class="pa-tras" hidden><div class="pa-chips" style="justify-content:center"><button class="p-chip">Puntual</button><button class="p-chip">Amable</button><button class="p-chip">Buen vehículo</button><button class="p-chip">Manejó bien</button></div>'
				+ '<p class="pa-etq" style="text-align:center;margin-top:16px">Propina para ' + q + '</p><div class="pa-chips" style="justify-content:center"><button class="p-chip">+10</button><button class="p-chip">+20</button><button class="p-chip">+50</button><button class="p-chip" aria-pressed="true">Nada</button></div></div>'
				+ '</div><div class="pa-pie"><a class="p-btn p-btn--marca p-btn--ancho" href="#viajes" id="listo">Listo</a></div></div>';
		},
		init: function (r) {
			var tras = $('#tras', r);
			if (S.estrellas && !LIENZO) { tras.hidden = false; }
			engancharPago(r); engancharEstrellas(r, function () { tras.hidden = false; });
			$$('.pa-chips', r).forEach(function (g, i) { $$('.p-chip', g).forEach(function (c) { c.onclick = function () { if (i === 1) { $$('.p-chip', g).forEach(function (x) { x.setAttribute('aria-pressed', x === c); }); } else { c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true'); } }; }); });
			$('#listo', r).onclick = function () { S.estrellas = 0; guardar(); tostada('Gracias. Viaje guardado.'); };
		}
	};

	SCR.viajes = {
		html: function () {
			var fila = function (ic, svc, t, d, pr, dd, tipo) { return '<a class="p-fila pa-viaje" href="#precio" data-d="' + dd + '" data-tipo="' + tipo + '"><span class="p-fila__ico" style="color:var(--' + svc + ')">' + ico(ic) + '</span><span class="p-fila__txt"><b>' + t + '</b><span>' + d + '</span></span><span class="p-fila__fin">' + pr + '</span></a>'; };
			return '<div class="pa-llena"><div class="pa-cab"><a class="pa-volver" href="#inicio" aria-label="Volver">' + ico('atras') + '</a><h1>Mis viajes</h1></div><div class="pa-cuerpo" style="gap:0">'
				+ '<p class="pa-etq">Hoy</p>'
				+ fila('triciclo', 'tric', 'Coppelia', 'Eléctrico · ' + hora(0) + ' · Yoandri ★ 5', cup(PRECIO_CH), 'coppelia', 'tric-electrico')
				+ '<p class="pa-etq" style="margin-top:20px">Esta semana</p>'
				+ fila('coche', 'taxi', 'Obispo e/ Habana y Compostela', 'Taxi Básico · lunes 18:05', '3.420 CUP', 'obispo', 'taxi-basico')
				+ fila('paquete', 'mens', 'Envío a Hidalgo', 'Mensajero · lunes 10:20 · con foto', '1.250 CUP', 'coppelia', 'mensajero')
				+ fila('triciclo', 'tric', 'Calle N e/ 23 y 25', 'Bici · domingo 21:40', '800 CUP', 'coppelia', 'tric-bici')
				+ '<p class="p-aviso" style="margin-top:20px">' + ico('guardado') + 'Se ven aunque no haya señal.</p>'
				+ '</div></div>';
		},
		init: function (r) {
			$$('.pa-viaje', r).forEach(function (a) {
				a.addEventListener('click', function (e) {
					if (a.dataset.tipo === 'mensajero') { e.preventDefault(); ir('envio'); return; }
					S.dest = a.dataset.d; S.tipo = a.dataset.tipo; S.svc = GRUPO[S.tipo] === 'taxi' ? 'taxi' : 'tric'; S.precio = null; guardar();
				});
			});
		}
	};

	SCR.perfil = {
		html: function () {
			var t = LS.get('palla-tema') || 'auto';
			var op = function (v, n) { return '<button data-tema="' + v + '" aria-pressed="' + (t === v) + '">' + n + '</button>'; };
			var fila = function (i, b, s, h) { return '<a class="p-fila" href="' + (h || '#perfil') + '"><span class="p-fila__ico">' + ico(i) + '</span><span class="p-fila__txt"><b>' + b + '</b>' + (s ? '<span>' + s + '</span>' : '') + '</span></a>'; };
			return '<div class="pa-llena"><div class="pa-cab"><a class="pa-volver" href="#inicio" aria-label="Volver">' + ico('atras') + '</a><h1>Perfil</h1></div><div class="pa-cuerpo" style="gap:4px">'
				+ '<div class="pa-yo"><span class="p-cara" style="width:48px;height:48px;font-size:16px">LM</span><div><p class="p-h2" style="margin:0">Laura M.</p><p class="p-peq" style="margin:0">+53 5 312 4210 · ★ 4,8</p></div></div>'
				+ '<p class="pa-etq">Mis lugares</p>' + fila('casa', 'Casa', 'Calle 19 e/ 4 y 6, Vedado') + fila('trabajo', 'Trabajo', 'Obispo e/ Habana y Compostela')
				+ '<p class="pa-etq">Seguridad</p>' + fila('personas', 'Contactos de confianza', 'Mamá') + fila('escudo', 'Ayuda en un viaje', 'Policía 106 y Pa\'llá')
				+ '<p class="pa-etq">Pantalla</p><div class="pa-seg" style="grid-template-columns:1.4fr 1fr 1fr">' + op('auto', 'De noche') + op('claro', 'Claro') + op('oscuro', 'Oscuro') + '</div>'
				+ '<p class="pa-etq">Más</p>' + fila('efectivo', 'Pago preferido', nombrePago()) + fila('lista', 'Mis viajes', '', '#viajes')
				+ '<a class="p-fila" href="#entrar" id="salir" style="color:var(--error)"><span class="p-fila__ico" style="color:var(--error)">' + ico('salir') + '</span><span class="p-fila__txt"><b>Salir</b></span></a>'
				+ '</div></div>';
		},
		init: function (r) {
			$$('[data-tema]', r).forEach(function (b) { b.onclick = function () { LS.set('palla-tema', b.dataset.tema); location.reload(); }; });
			$('#salir', r).onclick = function () { LS.del('palla-dentro'); };
		}
	};

	SCR.sinconexion = {
		mapa: function () { return { offline: true }; },
		html: function () {
			return '<div class="pa-banda" role="status" id="banda">' + ico('sin-senal', 'p-ico--20') + '<span>Sin señal. Tu pedido sale solo cuando vuelva.</span></div>'
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div>'
				+ filaLugar('#sinconexion', 'reloj', 'Triciclo a Coppelia', cup(PRECIO_CH) + ' · guardado', '')
				+ '<div class="pa-dos"><a class="p-btn p-btn--suave p-btn--chico" href="#sinconexion">' + ico('whatsapp', 'p-ico--20') + 'Por WhatsApp</a><a class="p-btn p-btn--suave p-btn--chico" href="tel:+5350000000">' + ico('telefono', 'p-ico--20') + 'Llamar</a></div>'
				+ '<p class="pa-etq">En tu móvil</p>'
				+ filaLugar('#sinconexion', 'casa', 'Casa', 'Calle 19 e/ 4 y 6, Vedado') + filaLugar('#sinconexion', 'trabajo', 'Trabajo', 'Obispo e/ Habana y Compostela') + filaLugar('#viajes', 'lista', 'Mis viajes', 'Los 4 últimos')
				+ '</section>';
		},
		init: function (r) {
			if (LIENZO) { return; }
			T(function () { var b = $('#banda', r); b.classList.add('is-bien'); b.innerHTML = ico('check', 'p-ico--20') + '<span>Volvió la señal. Enviamos tu pedido.</span>'; }, 4000);
			T(function () { S.tipo = 'tric-electrico'; S.dest = 'coppelia'; S.precio = null; guardar(); ir('buscando'); }, 5800);
		}
	};

	// ---------- Mensajero (el cliente manda algo) ----------
	SCR.envio = {
		html: function () {
			var tam = function (k, i, n, s) { return '<button data-tam="' + k + '" aria-pressed="' + (S.envio.tam === k) + '">' + ico(i) + '<b>' + n + '</b><span>' + s + '</span></button>'; };
			return '<div class="pa-llena"><div class="pa-cab"><a class="pa-volver" href="#inicio" aria-label="Volver">' + ico('atras') + '</a><h1>Mandar algo</h1></div><div class="pa-cuerpo">'
				+ '<div class="pa-od"><span class="pm-pin"></span><span class="pm-pin pm-pin--destino"></span>'
				+ '<label class="p-campo"><input value="' + ENVIO.de.n + ', ' + ENVIO.de.d + '" aria-label="Recoger en"></label>'
				+ '<label class="p-campo"><input value="' + ENVIO.a.n + '" aria-label="Llevar a"></label></div>'
				+ '<div><label class="pa-etq" for="que">¿Qué mandas?</label><label class="p-campo"><input id="que" value="Llaves y un sobre"></label></div>'
				+ '<div><p class="pa-etq">Tamaño</p><div class="pa-tamano">' + tam('mano', 'llave', 'En la mano', 'llaves, sobre') + tam('mochila', 'paquete', 'Mochila', 'hasta 10 kg') + tam('grande', 'caja', 'Grande', 'en triciclo') + '</div></div>'
				+ '<p class="p-aviso">' + ico('info') + 'Nada prohibido. Si mandas dinero, dilo.</p>'
				+ '</div><div class="pa-pie"><a class="p-btn p-btn--marca p-btn--ancho" href="#envio-recibe">Seguir</a></div></div>';
		},
		init: function (r) { $$('[data-tam]', r).forEach(function (b) { b.onclick = function () { S.envio.tam = b.dataset.tam; guardar(); $$('[data-tam]', r).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }; }); }
	};

	SCR['envio-recibe'] = {
		html: function () {
			return '<div class="pa-llena"><div class="pa-cab"><a class="pa-volver" href="#envio" aria-label="Volver">' + ico('atras') + '</a><h1>¿Quién lo recibe?</h1></div><div class="pa-cuerpo">'
				+ '<div><label class="pa-etq" for="rn">Nombre</label><label class="p-campo">' + ico('usuario', 'p-ico--20') + '<input id="rn" value="Marta"></label></div>'
				+ '<div><label class="pa-etq" for="rt">Teléfono</label><div class="pa-tel"><span class="pref">+53</span><label class="p-campo"><input id="rt" inputmode="tel" value="5 312 4567"></label></div>'
				+ '<p class="p-peq" style="margin:8px 0 0">Le llega por WhatsApp quién va y su código.</p></div>'
				+ '<div><p class="pa-etq">¿Cobrar al entregar?</p><div class="pa-seg"><button data-c="0" aria-pressed="' + !S.envio.cobrar + '">No</button><button data-c="1" aria-pressed="' + !!S.envio.cobrar + '">Sí, cobrar</button></div></div>'
				+ '<label class="p-campo" id="cob" style="display:' + (S.envio.cobrar ? 'flex' : 'none') + '"><input inputmode="numeric" value="1.500" aria-label="Cuánto cobrar"><span class="p-cup">CUP</span></label>'
				+ '<div><label class="pa-etq" for="rnota">Nota</label><label class="p-campo">' + ico('nota', 'p-ico--20') + '<input id="rnota" value="Apto. 3, tocar fuerte"></label></div>'
				+ '</div><div class="pa-pie"><a class="p-btn p-btn--marca p-btn--ancho" href="#envio-precio">Ver precio</a></div></div>';
		},
		init: function (r) { $$('[data-c]', r).forEach(function (b) { b.onclick = function () { S.envio.cobrar = b.dataset.c === '1'; guardar(); $$('[data-c]', r).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); $('#cob', r).style.display = S.envio.cobrar ? 'flex' : 'none'; }; }); }
	};

	SCR['envio-precio'] = {
		mapa: function () { var c = ENVIO.ruta.c; return { ruta: c, ver: c, arriba: 70, pins: [['origen', c[0]], ['destino', ultimo(c), 'Marta']] }; },
		html: function () {
			var j = justo('mensajero', ENVIO.ruta.km);
			return '<div class="pa-arriba"><a class="p-btn p-btn--redondo" href="#envio-recibe" aria-label="Volver">' + ico('atras') + '</a></div>'
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div>'
				+ '<div class="pa-resumen"><img src="' + veh('mensajero') + '" alt="" width="56" height="32"><div><b>Llaves y un sobre</b><span>' + ENVIO.a.n + ' · ' + km(ENVIO.ruta.km) + ' km</span></div></div>'
				+ '<div id="ctl">' + controlPrecio(j, Math.min(limites(j).max, Math.max(limites(j).min, precioEnvio()))) + '</div>'
				+ '<p class="p-aviso" style="justify-content:center;margin:4px 0 14px">' + ico('camara') + 'Foto al entregar</p>'
				+ '<a class="p-btn p-btn--marca p-btn--ancho" href="#envio-ofertas" id="pedir">Buscar mensajero · ' + cup(precioEnvio()) + '</a></section>';
		},
		init: function (r) {
			var j = justo('mensajero', ENVIO.ruta.km), l = limites(j);
			var get = function () { return Math.min(l.max, Math.max(l.min, precioEnvio())); };
			var set = function (v) { S.envio.precio = v; guardar(); $('#ctl', r).innerHTML = controlPrecio(j, get()); $('#pedir', r).textContent = 'Buscar mensajero · ' + cup(get()); engancharPrecio(r, get, set); };
			engancharPrecio(r, get, set);
		}
	};

	SCR['envio-ofertas'] = pantallaOfertas('envio');

	SCR['envio-seguimiento'] = {
		mapa: function () { var c = ENVIO.ruta.c; return { ver: c, ruta: c, rutaQuieta: true, pins: [['destino', ultimo(c), 'Marta']], conducir: [['m', veh('mensajero', 'arriba'), c]] }; },
		html: function () {
			var m = S.envio.mens || { n: 'Alexis M.', e: '4,9', min: 3 };
			return arribaViaje('inicio')
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div>'
				+ '<ol class="pa-etapas" aria-label="Estado del envío"><li class="is-hecho">Recogido</li><li class="is-ahora">En camino</li><li>Entregado</li></ol>'
				+ eta('Llaves y un sobre · para Marta', 'Llega en 7 min', precioEnvio(), 'Fijo · ' + nombrePago().toLowerCase())
				+ barra('mensajero', 'Llega ' + hora(7))
				+ filaChofer(m, 'Moto con caja · ' + hora(-6) + ' recogido')
				+ '<div class="pa-codigo"><span>Código de Marta</span><b>2905</b></div></section>';
		},
		init: function (r) {
			engancharViaje(r, 'Enlace de seguimiento copiado');
			recorrido(r, {
				id: 'm', ms: 18000,
				cada: function (k) { var mi = Math.ceil(7 * (1 - k)); $('#eta', r).textContent = k >= 1 ? 'Entregando' : mi <= 0 ? 'Llegando' : 'Llega en ' + mi + ' min'; },
				fin: function () { var e = $$('.pa-etapas li', r); e[1].className = 'is-hecho'; e[2].className = 'is-ahora'; T(function () { ir('envio-entregado'); }, 1400); }
			});
		}
	};

	var FOTO = '<svg class="pa-foto" viewBox="0 0 320 240" role="img" aria-label="Foto de entrega"><defs><linearGradient id="pf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9D3C4"/><stop offset="1" stop-color="#BDB5A3"/></linearGradient><linearGradient id="pp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3D6B5A"/><stop offset="1" stop-color="#2B4F42"/></linearGradient><linearGradient id="ps" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3EBD9"/><stop offset="1" stop-color="#D8CBAE"/></linearGradient></defs>'
		+ '<rect width="320" height="240" fill="url(#pf)"/><rect x="0" y="196" width="320" height="44" fill="#9C9381"/><rect x="96" y="28" width="128" height="170" rx="3" fill="url(#pp)"/><rect x="108" y="40" width="104" height="70" rx="2" fill="none" stroke="#2A4A3E" stroke-width="3"/><rect x="108" y="120" width="104" height="66" rx="2" fill="none" stroke="#2A4A3E" stroke-width="3"/><circle cx="204" cy="118" r="5" fill="#C9B26A"/><text x="160" y="22" text-anchor="middle" font-family="Geist,Arial" font-weight="600" font-size="13" fill="#5E5747">3</text>'
		+ '<g transform="rotate(-6 160 200)"><rect x="128" y="176" width="72" height="44" rx="3" fill="url(#ps)" stroke="#B8A88A"/><path d="M128 186l36 16 36-16" fill="none" stroke="#B8A88A" stroke-width="2"/></g><ellipse cx="180" cy="226" rx="44" ry="6" fill="#000" opacity=".15"/>'
		+ '<rect x="10" y="10" width="54" height="24" rx="12" fill="rgba(0,0,0,.55)"/><text x="37" y="26" text-anchor="middle" font-family="Geist,Arial" font-weight="600" font-size="11" fill="#fff">18:19</text></svg>';

	SCR['envio-entregado'] = {
		html: function () {
			var m = S.envio.mens || { n: 'Alexis M.' };
			return '<div class="pa-llena"><div class="pa-cab"><a class="pa-volver" href="#envio-seguimiento" aria-label="Volver">' + ico('atras') + '</a><h1>Entregado</h1></div><div class="pa-cuerpo">'
				+ '<div class="pa-hecho">' + ico('check', 'p-ico--20') + '<p style="margin:0">Marta lo recibió a las ' + hora(0) + ' · código 2905</p></div>'
				+ '<figure style="margin:0">' + FOTO + '<figcaption class="p-peq" style="margin-top:6px">Foto de ' + m.n + '</figcaption></figure>'
				+ '<div class="pa-total"><span>A pagar</span><span class="p-precio" style="font-size:28px">' + cupG(precioEnvio()) + '</span></div>'
				+ bloquePago(precioEnvio(), m.n.split(' ')[0])
				+ estrellas(LIENZO ? 0 : 5)
				+ '</div><div class="pa-pie"><a class="p-btn p-btn--marca p-btn--ancho" href="#viajes">Listo</a></div></div>';
		},
		init: function (r) { engancharPago(r); engancharEstrellas(r); }
	};

	// ---------- Chofer (app Pa'llá de Android) ----------
	function cabChofer(t, atras) {
		return '<div class="pa-cab">' + (atras ? '<a class="pa-volver" href="#' + atras + '" aria-label="Volver">' + ico('atras') + '</a>' : '<span style="width:12px"></span>')
			+ '<h1>' + t + '</h1><a class="pa-volver" href="#ch-perfil" aria-label="Mi perfil"><span class="p-cara">YR</span></a></div>';
	}

	SCR['ch-alta'] = {
		html: function () {
			var paso = function (c, n, b, s, extra) { return '<li class="' + c + '"><span class="n">' + (c === 'is-hecho' ? ico('check', 'p-ico--16') : n) + '</span><div style="flex:1"><b>' + b + '</b><span>' + s + '</span>' + (extra || '') + '</div></li>'; };
			var tipos = ['Bici', 'Eléctrico', 'Eléctrico XL', 'Carga', 'Moto', 'Mensajero', 'Taxi'].map(function (t) { return '<button class="p-chip" aria-pressed="' + (t === 'Eléctrico') + '">' + t + '</button>'; }).join('');
			return '<div class="pa-llena">' + cabChofer('Hazte chofer') + '<div class="pa-cuerpo">'
				+ '<div><p class="p-peq" style="margin:0 0 8px">2 de 4 · unos 5 minutos</p><div class="pa-medidor"><i style="width:50%"></i></div></div>'
				+ '<ol class="pa-pasos">'
				+ paso('is-hecho', 1, 'Carné de identidad', 'Recibido')
				+ paso('is-hecho', 2, 'Selfie con tu carné', 'Recibido')
				+ paso('is-ahora', 3, 'Foto del vehículo', 'De lado, con luz de día', '<a class="p-btn p-btn--suave p-btn--chico" href="#ch-alta" style="margin-top:10px">' + ico('camara', 'p-ico--20') + 'Hacer la foto</a>')
				+ paso('', 4, 'Tipo de vehículo', 'Elige uno', '<div class="pa-chips" style="margin-top:10px">' + tipos + '</div>')
				+ '</ol><p class="p-aviso">' + ico('info') + 'Licencia y LOT si las tienes (taxi: obligatorias).</p>'
				+ '</div><div class="pa-pie"><a class="p-btn p-btn--marca p-btn--ancho" href="#ch-conectar">Enviar para revisar</a></div></div>';
		},
		init: function (r) { $$('.pa-chips .p-chip', r).forEach(function (c) { c.onclick = function () { $$('.pa-chips .p-chip', r).forEach(function (x) { x.setAttribute('aria-pressed', x === c); }); }; }); }
	};

	SCR['ch-conectar'] = {
		html: function () {
			var on = S.chOn !== false;
			var op = function (id, b, s, v) { return '<div class="pa-op"><div><b>' + b + '</b><span>' + s + '</span></div><button class="p-interruptor" role="switch" aria-checked="' + v + '" data-op="' + id + '" aria-label="' + b + '"></button></div>'; };
			return '<div class="pa-llena">' + cabChofer('Hola, Yoandri') + '<div class="pa-cuerpo">'
				+ '<div class="pa-total"><div><p class="p-mini">Hoy</p><span class="p-precio">' + cupG(16400) + '</span></div><a class="p-btn p-btn--suave p-btn--chico" href="#ch-ganancias">7 viajes' + ico('sigue', 'p-ico--16') + '</a></div>'
				+ '<button class="pa-conectar ' + (on ? 'is-on' : '') + '" id="con" aria-pressed="' + on + '">' + ico('encender') + '<span>' + (on ? 'En línea' : 'Conectarme') + '</span></button>'
				+ '<p class="p-aviso">' + ico('ruta') + 'Mucha demanda en Vedado y Centro Habana.</p>'
				+ '<div><p class="pa-etq">Qué acepto hoy</p>'
				+ op('pasaje', 'Pasaje', 'Eléctrico · 4 plazas', true)
				+ op('envios', 'Envíos', 'Lo que quepa en el triciclo', true)
				+ op('cv', 'Casa Viva', 'Solo si eres su mensajero', false)
				+ '</div></div>' + (on ? '<div class="pa-pie"><a class="p-btn p-btn--marca p-btn--ancho" href="#ch-pedidos">Ver pedidos cerca (3)</a></div>' : '') + '</div>';
		},
		init: function (r) {
			$('#con', r).onclick = function () { S.chOn = S.chOn === false; guardar(); mostrar(true); };
			$$('[data-op]', r).forEach(function (b) { b.onclick = function () { b.setAttribute('aria-checked', b.getAttribute('aria-checked') !== 'true'); }; });
		}
	};

	SCR['ch-pedidos'] = {
		html: function () {
			var ped = function (id, pr, tipo, cli, de, dist, a, kmv, nota) {
				var b = [0, 0.1, 0.2, 0.3].map(function (m, i) { var v = r10(pr * (1 + m)); return '<button class="' + (i ? '' : 'acepto') + '" data-v="' + v + '" data-p="' + id + '">' + (i ? miles(v) + '<small>+' + (m * 100) + ' %</small>' : 'Acepto<small>' + miles(v) + '</small>') + '</button>'; }).join('');
				return '<article class="pa-pedido" id="' + id + '"><div class="arriba"><div><span class="p-precio" style="font-size:30px">' + cupG(pr) + '</span><div class="p-peq">' + cli + '</div></div><span class="p-sello">' + tipo + '</span></div>'
					+ '<div class="od"><span class="pm-pin"></span><b>' + de + '</b><small>A ' + dist + ' de ti</small><span class="pm-pin pm-pin--destino"></span><b>' + a + '</b><small>Viaje de ' + kmv + '</small></div>'
					+ (nota ? '<p class="p-aviso">' + ico('nota') + '«' + nota + '»</p>' : '')
					+ '<div class="pa-contra">' + b + '</div><i class="p-oferta__tiempo" aria-hidden="true"></i></article>';
			};
			return '<div class="pa-llena">' + cabChofer('Pedidos cerca', 'ch-conectar') + '<div class="pa-cuerpo" style="gap:0">'
				+ ped('p1', PRECIO_CH, 'Pasaje', 'Laura ★ 4,8 · 23 viajes', 'Calle N e/ 23 y 25', '600 m', 'Coppelia, 23 y L', km(KC) + ' km', 'Voy con una niña')
				+ ped('p2', 1250, 'Envío', 'Ernesto ★ 5,0 · cabe en la mano', 'Línea y Paseo', '1,1 km', 'Hidalgo, Nuevo Vedado', '4,0 km', '')
				+ ped('p3', 2130, 'Pasaje', 'Carlos ★ 4,6 · 8 viajes', '21 y H', '900 m', 'Obispo, Habana Vieja', '4,1 km', '')
				+ '</div></div>';
		},
		init: function (r) {
			var seg = 45; I(function () { seg = Math.max(0, seg - 1); $$('.p-oferta__tiempo', r).forEach(function (s) { s.style.transform = 'scaleX(' + (seg / 45) + ')'; }); }, 1000);
			T(function () { var p = $('#p3', r); if (p) { p.classList.add('is-perdido'); $('.pa-contra', p).outerHTML = '<p class="p-peq" style="margin:0">Lo cogió otro chofer.</p>'; } }, LIENZO ? 600 : 7000);
			$$('[data-v]', r).forEach(function (b) {
				b.onclick = function () {
					var card = $('#' + b.dataset.p, r); card.classList.add('is-enviado');
					var v = +b.dataset.v;
					var aviso = document.createElement('p'); aviso.className = 'p-aviso'; aviso.innerHTML = ico('reloj') + '<span>Enviaste <b>' + cup(v) + '</b>. Esperando…</span>';
					card.appendChild(aviso);
					T(function () { aviso.className = 'p-aviso p-aviso--bien'; aviso.innerHTML = ico('check') + '<span><b>¡Aceptó ' + cup(v) + '!</b> Ve a recoger.</span>'; S.chPrecio = v; S.chPaso = 'ir'; guardar(); T(function () { ir('ch-recoger'); }, 1100); }, 1800);
				};
			});
		}
	};

	SCR['ch-recoger'] = {
		mapa: function () { var c = R.llegaCorto.c; return { ruta: c, ver: c, pins: [['origen', ultimo(c), 'Laura']], mover: [['yo-ch', veh('tric-electrico', 'arriba'), c, LIENZO ? 400000 : 30000, false]] }; },
		html: function () {
			var llegue = S.chPaso === 'codigo';
			return '<div class="pa-arriba"><a class="p-btn p-btn--redondo" href="#ch-pedidos" aria-label="Volver">' + ico('atras') + '</a><a class="pa-pastilla" href="#ch-recoger">' + ico('navegar', 'p-ico--16') + 'Navegar</a></div>'
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div>'
				+ eta(llegue ? 'Ya llegaste' : 'Recoge a Laura · 3 min', 'Calle N e/ 23 y 25', chPrecio(), 'Fijo · efectivo')
				+ '<p class="p-aviso" style="margin:10px 0 4px">' + ico('nota') + '«Voy con una niña» · portón verde</p>'
				+ (llegue
					? '<p class="pa-etq" style="text-align:center;margin-top:12px">Pide el código a Laura</p><div class="pa-cajas" style="margin-bottom:16px"><span>4</span><span>8</span><span>1</span><span class="is-act">7</span></div><a class="p-btn p-btn--marca p-btn--ancho" href="#ch-viaje">' + ico('check', 'p-ico--20') + 'Recogí a Laura</a>'
					: filaChofer({ n: 'Laura M.', e: '4,8' }, 'Pasajera · 23 viajes', '+5353124210') + '<button class="p-btn p-btn--marca p-btn--ancho" id="llegue" style="margin-top:14px">Llegué</button>')
				+ '</section>';
		},
		init: function (r) {
			var l = $('#llegue', r); if (l) { l.onclick = function () { S.chPaso = 'codigo'; guardar(); mostrar(true); tostada('Le avisamos a Laura'); }; }
			$$('[data-msj]', r).forEach(function (b) { b.onclick = function () { tostada('WhatsApp con Laura', 'whatsapp'); }; });
			var c = $('a[href="#ch-viaje"]', r); if (c) { c.addEventListener('click', function () { S.chPaso = 'ir'; guardar(); }); }
		}
	};

	SCR['ch-viaje'] = {
		mapa: function () { var c = R.viajeCorto.c; return { ruta: c, ver: c, pins: [['destino', ultimo(c), 'Coppelia']], mover: [['yo-ch', veh('tric-electrico', 'arriba'), c, LIENZO ? 400000 : 30000, false]] }; },
		html: function () {
			return '<div class="pa-arriba"><span></span><a class="pa-pastilla" href="#ch-viaje">' + ico('navegar', 'p-ico--16') + 'Navegar</a></div>'
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div>'
				+ eta('Llevando a Laura · ' + km(KC) + ' km', 'Coppelia, 23 y L', chPrecio(), 'Efectivo')
				+ '<a class="p-btn p-btn--marca p-btn--ancho" href="#ch-cobrar" style="margin-top:16px">Terminé el viaje</a></section>';
		}
	};

	SCR['ch-cobrar'] = {
		html: function () {
			var v = chPrecio();
			return '<div class="pa-llena">' + cabChofer('Cobrar', 'ch-viaje') + '<div class="pa-cuerpo">'
				+ monto('Cobra a Laura · efectivo', v)
				+ '<p class="p-peq" style="text-align:center;margin:-8px 0 0">Si paga por Transfermóvil, espera el SMS del banco.</p>'
				+ '<a class="p-btn p-btn--marca p-btn--ancho" href="#ch-ganancias" id="cob">' + ico('check', 'p-ico--20') + 'Cobrado</a>'
				+ '<div><p class="pa-etq" style="text-align:center">¿Qué tal Laura?</p>' + estrellas(5) + '</div>'
				+ '<div class="pa-chips" style="justify-content:center"><button class="p-chip" aria-pressed="true">Puntual</button><button class="p-chip">Amable</button><button class="p-chip">Problema</button></div>'
				+ '<button class="p-btn p-btn--texto" style="align-self:center" id="nopago">No me pagó</button></div></div>';
		},
		init: function (r) { engancharEstrellas(r); $('#cob', r).onclick = function () { tostada('Viaje terminado. +' + cup(chPrecio())); }; $('#nopago', r).onclick = function () { tostada('Avisamos a Pa\'llá. Te llamamos.', 'info'); }; }
	};

	SCR['ch-ganancias'] = {
		html: function () {
			var dias = [['L', 12600], ['M', 15800], ['X', 18900, 1], ['J', 0], ['V', 0], ['S', 0], ['D', 0]];
			var barras = dias.map(function (d) { return '<div class="' + (d[2] ? 'is-hoy' : '') + '"><i style="height:' + Math.max(4, d[1] / 20000 * 100) + '%"></i><span>' + d[0] + '</span></div>'; }).join('');
			var fila = function (i, b, s, pr, h) { return '<' + (h ? 'a href="' + h + '"' : 'div') + ' class="p-fila"><span class="p-fila__ico">' + ico(i) + '</span><span class="p-fila__txt"><b>' + b + '</b><span>' + s + '</span></span><span class="p-fila__fin">' + pr + '</span></' + (h ? 'a' : 'div') + '>'; };
			return '<div class="pa-llena">' + cabChofer('Ganancias', 'ch-conectar') + '<div class="pa-cuerpo">'
				+ '<div class="pa-seg"><button aria-pressed="true">Hoy</button><button>Semana</button></div>'
				+ '<div><p class="p-mini">Hoy, miércoles</p><span class="p-precio">' + cupG(18900) + '</span><p class="p-peq" style="margin:4px 0 0">8 viajes · 5 h 10 min · ★ 4,9</p></div>'
				+ '<div><div class="pa-total"><b>Esta semana</b><b class="p-num">47.300 CUP</b></div><div class="pa-barras">' + barras + '</div></div>'
				+ '<p class="p-aviso p-aviso--bien">' + ico('check') + 'Comisión 0 % en el piloto.</p>'
				+ '<div><p class="pa-etq">Últimos viajes</p>'
				+ fila('triciclo', 'Coppelia', hora(0) + ' · Laura · efectivo', cup(chPrecio()))
				+ fila('paquete', 'Envío a Nuevo Vedado', '16:05 · Transfermóvil', '1.250 CUP')
				+ fila('moneda', 'Lo que debo a Pa\'llá', 'Hoy: nada (piloto)', ico('sigue', 'p-ico--20'), '#ch-deuda')
				+ '</div></div></div>';
		}
	};

	SCR['ch-deuda'] = {
		html: function () {
			var tope = 2000, debe = 1480;
			return '<div class="pa-llena">' + cabChofer('Lo que debo', 'ch-ganancias') + '<div class="pa-cuerpo">'
				+ '<div><p class="p-mini">Semana del 2 al 8 nov · 8 % (tras el piloto)</p><span class="p-precio">' + cupG(debe) + '</span><p class="p-peq" style="margin:4px 0 0">Paga antes del lunes 9.</p></div>'
				+ '<div><div class="pa-medidor"><i style="width:' + (debe / tope * 100) + '%"></i></div><p class="p-peq" style="margin:8px 0 0">Tope ' + cup(tope) + ': después se pausan solo los viajes en efectivo.</p></div>'
				+ '</div><div class="pa-pie"><button class="p-btn p-btn--marca p-btn--ancho" id="tm">' + ico('transfer', 'p-ico--20') + 'Pagar por Transfermóvil</button></div></div>';
		},
		init: function (r) {
			$('#tm', r).onclick = function () {
				hojaSobre('<p class="p-h2" style="margin:0 0 12px">Pagar ' + cup(1480) + '</p><ol class="pa-pasos">'
					+ '<li><span class="n">1</span><div><b>Abre Transfermóvil</b><span>Pagos → Transferencia</span></div></li>'
					+ '<li><span class="n">2</span><div><b>Tarjeta de Pa\'llá</b><span class="p-num">9205 •••• •••• 0417</span></div></li>'
					+ '<li><span class="n">3</span><div><b>Nota: CH-0417</b><span>El SMS del banco basta</span></div></li></ol>'
					+ '<button class="p-btn p-btn--tinta p-btn--ancho" data-cerrar>Abrir Transfermóvil</button>');
			};
		}
	};

	SCR['ch-perfil'] = {
		html: function () {
			var doc = function (i, b, s, ok) { return '<div class="p-fila"><span class="p-fila__ico">' + ico(i) + '</span><span class="p-fila__txt"><b>' + b + '</b><span>' + s + '</span></span><span class="p-sello">' + (ok ? ico('check') + 'Bien' : 'Falta') + '</span></div>'; };
			return '<div class="pa-llena">' + cabChofer('Mi perfil', 'ch-conectar') + '<div class="pa-cuerpo" style="gap:4px">'
				+ '<div class="pa-yo"><span class="p-cara" style="width:48px;height:48px;font-size:16px">YR</span><div><p class="p-h2" style="margin:0">Yoandri R.</p><p class="p-peq" style="margin:0">★ 4,9 · 212 viajes · desde oct. 2026</p></div></div>'
				+ '<div class="pa-resumen" style="margin:8px 0"><img src="' + veh('tric-electrico') + '" alt="" width="88" height="50"><div><b>Triciclo Eléctrico</b><span>Azul · 4 plazas · techo</span></div></div>'
				+ '<p class="pa-etq">Papeles</p>'
				+ doc('carne', 'Carné de identidad', 'Revisado', true) + doc('selfie', 'Selfie con carné', 'Revisado', true) + doc('camara', 'Foto del vehículo', 'Revisada', true)
				+ doc('nota', 'LOT temporal', 'Vale hasta el 31-dic-2026', true) + doc('llave', 'Licencia A', 'Opcional en triciclo', false)
				+ '<a class="p-fila" href="#ch-deuda" style="border-top:1px solid var(--linea);margin-top:12px"><span class="p-fila__ico">' + ico('moneda') + '</span><span class="p-fila__txt"><b>Lo que debo a Pa\'llá</b></span>' + ico('sigue', 'p-ico--20') + '</a></div></div>';
		}
	};

	// =====================================================================================
	// MOTOR: mostrar pantalla + mapa (o plano de reserva)
	// =====================================================================================
	var actual = null;
	function limpiar() {
		timers.forEach(function (t) { if (t && t.off) { t.off(); } else { clearTimeout(t); clearInterval(t); } });
		timers = [];
		$$('.pa-tostada, .pa-sobre').forEach(function (t) { t.remove(); });
	}
	function mostrar(mismo) {
		var id = decodeURIComponent(location.hash.slice(1)) || 'carga';
		if (!SCR[id]) { id = 'inicio'; }
		limpiar();
		var s = SCR[id]; actual = id;
		pant.innerHTML = s.html();
		var cfg = s.mapa ? s.mapa() : null;
		marco.classList.toggle('sin-mapa', !cfg);
		marco.classList.toggle('sin-red', !!(cfg && cfg.offline));
		if (cfg && !cfg.offline) {
			var hoja = $('.pa-hoja', pant);
			PMapa.escena(cfg, hoja ? hoja.offsetHeight : 0);
			if (cfg.listo) { PMapa.iniciar(mapaEl, TEMA, SIN_MAPA).then(function (m) { if (m && actual === id) { cfg.listo(); } }); }
		}
		if (s.init) { s.init(pant); }
		$$('#menu a').forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + id); });
		var meta = (window.PPANTALLAS || []).filter(function (p) { return p.id === id; })[0];
		document.title = (meta ? meta.t + ' · ' : '') + 'Pa\'llá';
		if (!mismo) { pant.scrollTop = 0; }
	}

	// Menú lateral (solo en el ordenador, fuera del móvil)
	var menu = $('#menu');
	if (menu && window.PPANTALLAS) {
		var h = '<div class="marca">Pa\'llá</div>', gr = '';
		PPANTALLAS.forEach(function (p) { if (p.g !== gr) { gr = p.g; h += '<h3>' + gr + '</h3>'; } h += '<a href="#' + p.id + '">' + p.t + '</a>'; });
		menu.innerHTML = h + '<h3>Tema</h3><a href="?tema=claro' + location.hash + '">Claro</a><a href="?tema=oscuro' + location.hash + '">Oscuro</a>';
	}

	var TEMA = document.documentElement.dataset.tema;
	PMapa.iniciar(mapaEl, TEMA, SIN_MAPA); // prepara el plano al momento; el mapa de verdad (si hay red) entra después
	window.addEventListener('hashchange', function () { mostrar(); });
	mostrar();
})();
