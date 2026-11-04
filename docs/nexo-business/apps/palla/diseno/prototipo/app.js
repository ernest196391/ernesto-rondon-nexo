/* Pa'llá · prototipo clicable (solo diseño, datos de EJEMPLO). Navegación por #pantalla. Sin librerías salvo el mapa. */
(function () {
	'use strict';
	var Q = new URLSearchParams(location.search);
	var LIENZO = Q.has('lienzo');
	var SIN_MAPA = Q.has('nomapa');
	var R = window.PDATOS.rutas;
	var $ = function (s, r) { return (r || document).querySelector(s); };
	var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
	var pant = $('#pant'), marco = $('#marco'), mapaEl = $('#mapa');
	var ultimo = function (c) { return c[c.length - 1]; };

	// ---------- Utilidades ----------
	function ico(n, c) { return '<svg class="p-ico ' + (c || '') + '" aria-hidden="true"><use href="../iconos.svg#' + n + '"/></svg>'; }
	function veh(t, v) { return '../vehiculos/' + t + '-' + (v || 'lado') + '.svg'; }
	function miles(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
	function cup(n) { return miles(n) + ' CUP'; }
	function r10(x) { return Math.round(x / 10) * 10; }
	function km(x) { return String(Math.round(x * 10) / 10).replace('.', ','); }
	function hora(minMas) { var d = new Date(Date.now() + (minMas || 0) * 60000); return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); }
	function ir(id) { location.hash = id; }
	var timers = [];
	function T(fn, ms) { timers.push(setTimeout(fn, ms)); }
	function I(fn, ms) { timers.push(setInterval(fn, ms)); }
	function tostada(txt, icono) {
		var v = $('.pa-tostada'); if (v) { v.remove(); }
		var t = document.createElement('div'); t.className = 'pa-tostada'; t.setAttribute('role', 'status');
		t.innerHTML = ico(icono || 'check', 'p-ico--20') + '<span>' + txt + '</span>';
		marco.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
	}
	function demo(txt, a) { return '<a class="pa-demo" href="#' + a + '">Demo: ' + txt + ' →</a>'; }

	// ---------- Lugares y precios (EJEMPLO; rutas reales de nuestro OSRM) ----------
	var ORIGEN = { n: 'Calle N e/ 23 y 25', d: 'Vedado', p: R.viaje.c[0] };
	var DEST = {
		coppelia: { n: 'Coppelia', d: '23 y L, Vedado', p: ultimo(R.viaje.c), ruta: R.viaje },
		obispo: { n: 'Obispo e/ Habana y Compostela', d: 'La Habana Vieja', p: ultimo(R.obispo.c), ruta: R.obispo }
	};
	var ENVIO = { de: { n: 'Línea y Paseo', d: 'Vedado', p: R.envio.c[0] }, a: { n: 'Hidalgo, Nuevo Vedado', d: 'Plaza', p: ultimo(R.envio.c) }, ruta: R.envio };

	// Precio justo (decisión 4 de Ernesto). Moto y las proporciones del taxi son propuesta mía (ver informe).
	function justo(tipo, k) {
		var E = 60 + 50 * k, B = 424 * k; // B: 20 % por debajo de La Nave (≈ 2.650 CUP / 5 km)
		return r10({ 'tric-electrico': E, 'tric-bici': E * 0.7, 'tric-xl': E * 1.5, 'tric-carga': E * 1.5, 'moto': E * 0.8,
			'taxi-basico': B, 'taxi-clasico': B * 1.1, 'taxi-xl': B * 1.4, 'mensajero': 100 + 60 * k }[tipo]);
	}
	function limites(j) { return { min: Math.ceil(j * 0.8 / 10) * 10, max: Math.floor(j * 1.5 / 10) * 10 }; }

	var TIPOS = {
		tric: [{ id: 'tric-electrico', n: 'Eléctrico', c: '4 personas', eta: 2 }, { id: 'tric-bici', n: 'Bici', c: '2 personas', eta: 4 }, { id: 'tric-xl', n: 'Eléctrico XL', c: '6 a 8 personas', eta: 6 }, { id: 'tric-carga', n: 'Carga', c: 'Hasta 300 kg', eta: 9 }],
		taxi: [{ id: 'taxi-basico', n: 'Básico', c: '4 personas', eta: 3 }, { id: 'taxi-clasico', n: 'Clásico', c: 'Almendrón · 4', eta: 5 }, { id: 'taxi-xl', n: 'XL', c: '7 personas', eta: 8 }],
		moto: [{ id: 'moto', n: 'Moto', c: '1 persona', eta: 2 }]
	};
	var NOMBRE_TIPO = {}; Object.keys(TIPOS).forEach(function (g) { TIPOS[g].forEach(function (t) { NOMBRE_TIPO[t.id] = t; }); });
	NOMBRE_TIPO.mensajero = { id: 'mensajero', n: 'Mensajero', c: 'Moto con caja', eta: 4 };
	var GRUPO = { 'tric-electrico': 'tric', 'tric-bici': 'tric', 'tric-xl': 'tric', 'tric-carga': 'tric', 'taxi-basico': 'taxi', 'taxi-clasico': 'taxi', 'taxi-xl': 'taxi', moto: 'moto', mensajero: 'mens' };
	var PALABRA = { tric: 'triciclo', taxi: 'taxi', moto: 'moto', mens: 'mensajero' };

	// ---------- Estado del camino (con valores de ejemplo para abrir cualquier pantalla suelta) ----------
	var S = { svc: 'tric', tipo: 'tric-electrico', dest: 'coppelia', precio: null, primera: false, pago: 'efectivo', oferta: null, envio: { tam: 'mano', cobrar: false, precio: null }, chPaso: 'ir', estrellas: 5 };
	try { var g = JSON.parse(sessionStorage.getItem('palla-proto') || 'null'); if (g && !LIENZO) { S = Object.assign(S, g); } } catch (e) { }
	function guardar() { if (!LIENZO) { try { sessionStorage.setItem('palla-proto', JSON.stringify(S)); } catch (e) { } } }
	function dest() { return DEST[S.dest] || DEST.coppelia; }
	function kmViaje() { return dest().ruta.km; }
	function precioJ() { return justo(S.tipo, kmViaje()); }
	function precio() { var j = precioJ(), l = limites(j); var p = S.precio || j; return Math.min(l.max, Math.max(l.min, p)); }
	function precioEnvio() { return S.envio.precio || justo('mensajero', ENVIO.ruta.km); }

	var CHOFERES = [
		{ id: 'yr', n: 'Yoandri R.', e: '4,9', v: 212, col: 'azul', min: 2, mod: 0 },
		{ id: 'mp', n: 'Maikel P.', e: '4,7', v: 98, col: 'blanco', min: 4, mod: 0.1 },
		{ id: 'dc', n: 'Dayana C.', e: '4,8', v: 340, col: 'gris', min: 1, mod: 0.2 },
		{ id: 'rg', n: 'Ramón G.', e: '5,0', v: 51, col: 'verde', min: 6, mod: 0 }
	];
	function iniciales(n) { return n.split(' ').map(function (x) { return x[0]; }).join('').slice(0, 2); }

	// =====================================================================================
	// PANTALLAS
	// =====================================================================================
	var SCR = {};

	// ---------- Cliente ----------
	SCR.carga = {
		html: function () {
			return '<div class="pa-carga" role="img" aria-label="Pa\'llá">'
				+ '<svg viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="#161616"/>'
				+ '<path class="pc-p" fill="#FFC21A" fill-rule="evenodd" d="M25 20h27a20 20 0 0 1 0 40h-9v16H25zM43 34v12h7a6 6 0 0 0 0-12z"/>'
				+ '<path class="pc-ruta" d="M43 76c10 0 24-2 34-12" fill="none" stroke="#FFC21A" stroke-width="5" stroke-linecap="round" opacity=".9"/>'
				+ '<circle class="pc-punto" cx="78" cy="63" r="5" fill="#fff"/></svg>'
				+ '<b>Pa\'llá</b><small>Taxi · Triciclo · Mensajero</small></div>';
		},
		init: function () { if (!LIENZO) { T(function () { ir(localStorage.getItem('palla-dentro') ? 'inicio' : 'entrar'); }, 1400); } }
	};

	SCR.entrar = {
		html: function () {
			return '<div class="pa-llena"><div class="pa-cuerpo" style="padding-top:56px">'
				+ '<svg width="56" height="56" viewBox="0 0 96 96" aria-hidden="true"><rect width="96" height="96" rx="22" fill="#0E0E0E"/><path fill="#FFC21A" fill-rule="evenodd" d="M25 20h27a20 20 0 0 1 0 40h-9v16H25zM43 34v12h7a6 6 0 0 0 0-12z"/><path d="M43 76c10 0 24-2 34-12" fill="none" stroke="#FFC21A" stroke-width="5" stroke-linecap="round"/><circle cx="78" cy="63" r="5" fill="#fff"/></svg>'
				+ '<h1 class="p-titulo" style="margin-top:8px">Muévete por<br>La Habana</h1>'
				+ '<p class="p-2" style="margin:0">Taxi, triciclo o mensajero. Tú propones el precio.</p>'
				+ '<label class="pa-seccion" for="tel">Tu número de móvil</label>'
				+ '<div class="pa-tel"><span class="pref">+53</span><label class="p-campo"><input id="tel" inputmode="tel" autocomplete="tel" value="5 312 4210" aria-label="Número de móvil"></label></div>'
				+ '<p class="p-peq" style="margin:0">Te mandamos un código por WhatsApp. No hace falta contraseña.</p>'
				+ '</div><div class="pa-pie"><a class="p-btn p-btn--marca p-btn--ancho" href="#codigo">' + ico('whatsapp') + 'Código por WhatsApp</a>'
				+ '<a class="p-btn p-btn--borde p-btn--ancho p-btn--chico" href="#codigo">Mejor por SMS</a></div></div>';
		}
	};

	SCR.codigo = {
		html: function () {
			return '<div class="pa-llena"><div class="pa-cab"><a class="pa-volver" href="#entrar" aria-label="Volver">' + ico('atras') + '</a><h1>Escribe el código</h1></div>'
				+ '<div class="pa-cuerpo"><p class="p-2" style="margin:0">Lo mandamos por WhatsApp al <b style="color:var(--tinta)">+53 5 312 4210</b>.</p>'
				+ '<div class="pa-cajas" aria-label="Código de 4 cifras"><span>2</span><span>0</span><span>5</span><span class="is-act">9</span></div>'
				+ '<p class="p-peq" style="text-align:center;margin:0">¿No llegó? Reenviar en 0:42</p>'
				+ '<label class="pa-seccion" for="nom">¿Cómo te llamas?</label><label class="p-campo"><input id="nom" value="Laura" autocomplete="given-name"></label>'
				+ '<p class="p-peq" style="margin:0">El chofer solo ve tu nombre y tus estrellas.</p>'
				+ '</div><div class="pa-pie"><a class="p-btn p-btn--marca p-btn--ancho" href="#inicio" id="entra">Entrar</a></div></div>';
		},
		init: function () { $('#entra').onclick = function () { localStorage.setItem('palla-dentro', '1'); }; }
	};

	function cercanos(svc) {
		var img = { taxi: 'taxi-basico', tric: 'tric-electrico', mens: 'mensajero' }[svc] || 'tric-electrico';
		var ida = function (c) { return c.concat(c.slice().reverse()); };
		var a = R.llega.c, b = R.viaje.c, c = R.obispo.c.slice(0, 28), d = R.envio.c.slice(0, 30);
		return [['c1', veh(img, 'arriba'), ida(a), 70000], ['c2', veh(img, 'arriba'), ida(b.slice().reverse()), 50000], ['c3', veh(img, 'arriba'), ida(c), 80000], ['c4', veh(img, 'arriba'), ida(d), 90000]];
	}

	SCR.inicio = {
		mapa: function () { return { ver: [ORIGEN.p], zoom: 15.4, pins: [['yo', ORIGEN.p]], mover: cercanos(S.svc) }; },
		html: function () {
			var serv = function (s, n, i) { return '<button class="pa-serv" data-s="' + s + '" aria-pressed="' + (S.svc === s) + '"><i>' + ico(i, 'p-ico--20') + '</i>' + n + '</button>'; };
			return '<div class="pa-arriba"><a class="p-btn p-btn--redondo" href="#perfil" aria-label="Perfil">' + ico('menu') + '</a><a class="p-btn p-btn--redondo" href="#viajes" aria-label="Mis viajes">' + ico('reloj') + '</a></div>'
				+ '<section class="pa-hoja" aria-label="Pedir"><div class="p-hoja__asa"></div>'
				+ '<div class="pa-servicios">' + serv('taxi', 'Taxi', 'coche') + serv('tric', 'Triciclo', 'triciclo') + serv('mens', 'Mensajero', 'paquete') + '</div>'
				+ '<a class="pa-buscar" href="#' + (S.svc === 'mens' ? 'envio' : 'destino') + '">' + ico('buscar') + '<div><b>' + (S.svc === 'mens' ? '¿Qué mandamos?' : '¿A dónde vamos?') + '</b><span>Desde: ' + ORIGEN.n + ', ' + ORIGEN.d + '</span></div></a>'
				+ '<div class="pa-fila-chips"><a class="p-chip" href="#destino">' + ico('casa', 'p-ico--16') + 'Casa</a><a class="p-chip" href="#recogida" data-d="obispo">' + ico('trabajo', 'p-ico--16') + 'Trabajo</a><a class="p-chip p-chip--borde" href="#perfil">' + ico('mas', 'p-ico--16') + 'Guardar lugar</a></div>'
				+ '<a class="p-fila" href="#recogida" data-d="coppelia"><span class="p-fila__ico">' + ico('reloj', 'p-ico--20') + '</span><span class="p-fila__txt"><b>Coppelia</b><span>23 y L, Vedado</span></span>' + ico('sigue', 'p-ico--20') + '</a>'
				+ '<a class="p-fila" href="#recogida" data-d="obispo"><span class="p-fila__ico">' + ico('reloj', 'p-ico--20') + '</span><span class="p-fila__txt"><b>Obispo e/ Habana y Compostela</b><span>La Habana Vieja</span></span>' + ico('sigue', 'p-ico--20') + '</a>'
				+ '</section>';
		},
		init: function (r) {
			$$('.pa-serv', r).forEach(function (b) { b.onclick = function () { S.svc = b.dataset.s; if (S.svc !== 'mens') { S.tipo = TIPOS[S.svc][0].id; S.precio = null; } guardar(); mostrar(); }; });
			$$('[data-d]', r).forEach(function (a) { a.addEventListener('click', function () { S.dest = a.dataset.d; S.precio = null; guardar(); }); });
		}
	};

	SCR.destino = {
		html: function () {
			var sug = function (n, d, k, dd) { return '<a class="p-fila" href="#recogida" data-d="' + dd + '"><span class="p-fila__ico">' + ico('pin', 'p-ico--20') + '</span><span class="p-fila__txt"><b>' + n + '</b><span>' + d + '</span></span><span class="p-peq">' + k + '</span></a>'; };
			return '<div class="pa-llena"><div class="pa-cab"><a class="pa-volver" href="#inicio" aria-label="Volver">' + ico('atras') + '</a><h1>¿A dónde vamos?</h1></div>'
				+ '<div class="pa-cuerpo" style="gap:8px"><div class="pa-od"><span class="pm-pin" style="top:19px"></span><span class="pm-pin pm-pin--destino" style="bottom:19px"></span>'
				+ '<label class="p-campo"><input value="' + ORIGEN.n + '" aria-label="Recoger en"><span class="p-sello p-sello--bien">GPS</span></label>'
				+ '<label class="p-campo" style="border-color:var(--tinta);background:var(--fondo)"><input id="q" value="Copp" aria-label="Llevar a" autocomplete="off"><button class="pa-volver" style="width:32px;height:32px" aria-label="Borrar" onclick="this.previousElementSibling.value=\'\'">' + ico('cerrar', 'p-ico--16') + '</button></label></div>'
				+ '<div id="sug">'
				+ sug('<em class="pa-resaltar">Copp</em>elia', '23 y L, Vedado', '0,8 km', 'coppelia')
				+ sug('<em class="pa-resaltar">Cop</em>a Room (Hotel Riviera)', 'Paseo y Malecón, Vedado', '2,6 km', 'coppelia')
				+ sug('Calle <em class="pa-resaltar">Copp</em>inger', 'Cerro', '4,4 km', 'coppelia')
				+ '</div><p class="pa-seccion">Recientes</p>'
				+ '<a class="p-fila" href="#recogida" data-d="obispo"><span class="p-fila__ico">' + ico('reloj', 'p-ico--20') + '</span><span class="p-fila__txt"><b>Obispo e/ Habana y Compostela</b><span>La Habana Vieja</span></span><span class="p-peq">4,1 km</span></a>'
				+ '</div><div class="pa-fijo"><a class="p-fila" href="#fijar"><span class="p-fila__ico" style="background:var(--amarillo-suave)">' + ico('mapa', 'p-ico--20') + '</span><span class="p-fila__txt"><b>Fijar en el mapa</b><span>Si no encuentras la dirección</span></span>' + ico('sigue', 'p-ico--20') + '</a></div></div>';
		},
		init: function (r) {
			$$('[data-d]', r).forEach(function (a) { a.addEventListener('click', function () { S.dest = a.dataset.d; S.precio = null; guardar(); }); });
			var q = $('#q', r); if (!LIENZO) { q.focus(); q.setSelectionRange(4, 4); }
		}
	};

	function pinCentro(arriba) { return '<div class="pa-pin-centro" style="top:calc(50% - ' + (arriba || 120) + 'px)"><span class="cabeza"></span><span class="palo"></span><span class="suelo"></span></div>'; }
	function escucharCentro(fn) {
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
		mapa: function () { return { ver: [DEST.obispo.p], zoom: 16.5, arriba: 0, abajo: 240, listo: function () { escucharCentro(); } }; },
		html: function () {
			return '<div class="pa-arriba"><a class="p-btn p-btn--redondo" href="#destino" aria-label="Volver">' + ico('atras') + '</a><span class="pa-pastilla">' + ico('mapa', 'p-ico--16') + 'Mueve el mapa, no el pin</span></div>'
				+ pinCentro(140)
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div><p class="p-mini" style="margin:0 0 6px">Llevar a</p>'
				+ '<p class="p-h2" id="dir" style="margin:0">Obispo</p><p class="p-peq" style="margin:4px 0 16px">e/ Habana y Compostela, La Habana Vieja</p>'
				+ '<a class="p-btn p-btn--marca p-btn--ancho" href="#recogida" id="aqui">Llevar aquí</a></section>';
		},
		init: function () { $('#aqui').addEventListener('click', function () { S.dest = 'obispo'; S.precio = null; guardar(); }); }
	};

	SCR.recogida = {
		mapa: function () { return { ver: [ORIGEN.p], zoom: 17, abajo: 300, pins: [['yo', ORIGEN.p]], listo: function () { escucharCentro(); } }; },
		html: function () {
			return '<div class="pa-arriba"><a class="p-btn p-btn--redondo" href="#destino" aria-label="Volver">' + ico('atras') + '</a><span class="pa-pastilla">' + ico('pin', 'p-ico--16') + 'A ' + dest().n.split(' e/')[0] + ' · ' + km(kmViaje()) + ' km</span></div>'
				+ pinCentro(150)
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div><p class="p-h2" style="margin:0 0 4px">¿Te recogemos aquí?</p>'
				+ '<p style="margin:0 0 12px"><b id="dir">' + ORIGEN.n + '</b><span class="p-2">, ' + ORIGEN.d + '</span></p>'
				+ '<label class="p-campo" style="margin-bottom:12px">' + ico('nota', 'p-ico--20') + '<input placeholder="Nota para el chofer (opcional)" aria-label="Nota para el chofer"></label>'
				+ '<a class="p-btn p-btn--marca p-btn--ancho" href="#tipo">Confirmar recogida</a></section>';
		}
	};

	function rutaViaje() { return dest().ruta.c; }
	SCR.tipo = {
		mapa: function () { var c = rutaViaje(); return { ruta: c, ver: c, abajo: 470, pins: [['origen', c[0], 'Recogida'], ['destino', ultimo(c), dest().n.split(' e/')[0] + ' · ' + Math.max(2, Math.round(dest().ruta.min * 1.6)) + ' min']] }; },
		html: function () {
			var g = GRUPO[S.tipo] || 'tric'; if (g === 'mens') { g = 'tric'; }
			var pest = function (k, n) { return '<button class="p-chip" aria-pressed="' + (g === k) + '" data-g="' + k + '">' + n + '</button>'; };
			var lista = TIPOS[g].map(function (t) {
				return '<button class="pa-tipo" data-t="' + t.id + '" aria-pressed="' + (S.tipo === t.id) + '"><img src="' + veh(t.id) + '" alt="" width="92" height="53"><span><b>' + t.n + '</b><span>' + t.c + '</span><span>Llega en ' + t.eta + ' min</span></span><span class="pr">' + cup(justo(t.id, kmViaje())) + '<small>precio justo</small></span></button>';
			}).join('');
			var t = NOMBRE_TIPO[S.tipo];
			return '<div class="pa-arriba"><a class="p-btn p-btn--redondo" href="#recogida" aria-label="Volver">' + ico('atras') + '</a></div>'
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div><div class="pa-pest">' + pest('tric', 'Triciclo') + pest('taxi', 'Taxi') + pest('moto', 'Moto') + '</div>'
				+ '<div class="pa-tipos">' + lista + '</div>'
				+ '<p class="p-peq" style="margin:8px 4px 12px">' + ico('info', 'p-ico--16') + ' En el paso siguiente puedes subir o bajar el precio.</p>'
				+ '<a class="p-btn p-btn--marca p-btn--ancho" href="#precio">Elegir ' + t.n + '</a></section>';
		},
		init: function (r) {
			$$('[data-g]', r).forEach(function (b) { b.onclick = function () { S.tipo = TIPOS[b.dataset.g][0].id; S.svc = b.dataset.g === 'taxi' ? 'taxi' : 'tric'; S.precio = null; guardar(); mostrar(true); }; });
			$$('[data-t]', r).forEach(function (b) { b.onclick = function () { S.tipo = b.dataset.t; S.precio = null; guardar(); mostrar(true); }; });
		}
	};

	// Control del precio justo: − / + de 10 en 10, entre −20 % y +50 %. Sirve para viaje y envío.
	function controlPrecio(j, p, color) {
		var l = limites(j), f = (p - l.min) / ((l.max - l.min) || 1), fj = (j - l.min) / ((l.max - l.min) || 1);
		var pista = p < j ? ['var(--aviso)', 'Por debajo del justo: puede tardar más'] : p === j ? ['var(--bien)', 'Precio justo: sale rápido'] : ['var(--bien)', 'Por encima: más choferes te verán'];
		var dif = p === j ? 'Precio justo sugerido' : (p > j ? '+' : '−') + Math.round(Math.abs(p - j) / j * 100) + ' % del justo (' + cup(j) + ')';
		return '<div class="pa-precio"><button class="p-btn p-btn--redondo" id="menos" aria-label="Bajar 10 CUP"' + (p <= l.min ? ' disabled' : '') + '>' + ico('menos') + '</button>'
			+ '<div class="pa-precio-n" aria-live="polite"><b>' + miles(p) + '<small>CUP</small></b><span>' + dif + '</span></div>'
			+ '<button class="p-btn p-btn--redondo" id="mas" aria-label="Subir 10 CUP"' + (p >= l.max ? ' disabled' : '') + '>' + ico('mas') + '</button></div>'
			+ '<div class="pa-regla" aria-hidden="true"><em style="left:' + (fj * 100) + '%"></em><i style="left:' + (f * 100) + '%"></i></div>'
			+ '<div class="pa-regla-txt"><span>' + cup(l.min) + '</span><span>' + cup(l.max) + '</span></div>'
			+ '<p class="pa-pista"><span class="pa-punto" style="background:' + pista[0] + '"></span>' + pista[1] + '</p>';
	}
	function engancharPrecio(r, get, set) {
		$('#menos', r).onclick = function () { set(get() - 10); };
		$('#mas', r).onclick = function () { set(get() + 10); };
	}

	SCR.precio = {
		mapa: function () { var c = rutaViaje(); return { ruta: c, rutaQuieta: true, ver: c, abajo: 560, arriba: 70, pins: [['origen', c[0]], ['destino', ultimo(c)]] }; },
		html: function () {
			var t = NOMBRE_TIPO[S.tipo], j = precioJ(), p = precio(), g = GRUPO[S.tipo];
			return '<div class="pa-arriba"><a class="p-btn p-btn--redondo" href="#tipo" aria-label="Volver">' + ico('atras') + '</a></div>'
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div>'
				+ '<div style="display:flex;align-items:center;gap:10px"><img src="' + veh(S.tipo) + '" alt="" width="64" height="37"><div style="flex:1"><b>' + t.n + '</b><div class="p-peq">' + dest().n.split(' e/')[0] + ' · ' + km(kmViaje()) + ' km · ' + Math.max(2, Math.round(dest().ruta.min * 1.6)) + ' min</div></div><span class="p-sello p-sello--' + (g === 'moto' ? 'tric' : g) + '">' + (g === 'taxi' ? 'Taxi' : g === 'moto' ? 'Moto' : 'Triciclub') + '</span></div>'
				+ '<div id="ctl">' + controlPrecio(j, p) + '</div>'
				+ '<div class="pa-op"><div><b>Coger la 1.ª oferta a este precio</b><span>Si lo apagas, eliges tú por precio, tiempo y estrellas</span></div><button class="p-interruptor" role="switch" aria-checked="' + S.primera + '" id="primera" aria-label="Coger la primera oferta"></button></div>'
				+ '<div class="pa-op" style="display:block;padding:8px 0 12px"><div class="pa-pago"><button class="p-chip" data-pago="efectivo" aria-pressed="' + (S.pago === 'efectivo') + '">' + ico('efectivo', 'p-ico--20') + 'Efectivo</button><button class="p-chip" data-pago="transfer" aria-pressed="' + (S.pago === 'transfer') + '">' + ico('transfer', 'p-ico--20') + 'Transfermóvil</button></div></div>'
				+ '<a class="p-btn p-btn--marca p-btn--ancho" href="#buscando" id="pedir">Pedir ' + PALABRA[g] + ' · ' + cup(p) + '</a></section>';
		},
		init: function (r) {
			var pintar = function () { $('#ctl', r).innerHTML = controlPrecio(precioJ(), precio()); $('#pedir', r).lastChild.textContent = 'Pedir ' + PALABRA[GRUPO[S.tipo]] + ' · ' + cup(precio()); engancharPrecio(r, precio, fijar); };
			var fijar = function (v) { S.precio = v; guardar(); pintar(); };
			engancharPrecio(r, precio, fijar);
			$('#primera', r).onclick = function () { S.primera = !S.primera; this.setAttribute('aria-checked', S.primera); guardar(); };
			$$('[data-pago]', r).forEach(function (b) { b.onclick = function () { S.pago = b.dataset.pago; guardar(); $$('[data-pago]', r).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }; });
			$('#pedir', r).onclick = function () { S.oferta = null; S.subidas = 0; guardar(); };
		}
	};

	// Ofertas en vivo (cliente). modo = 'viaje' | 'envio'
	function pantallaOfertas(modo) {
		var esEnvio = modo === 'envio';
		return {
			mapa: function () { var p = esEnvio ? ENVIO.de.p : ORIGEN.p; return { ver: [p], zoom: 15.2, abajo: 470, pins: [['origen', p]], mover: cercanos(esEnvio ? 'mens' : GRUPO[S.tipo] === 'taxi' ? 'taxi' : 'tric') }; },
			html: function () {
				var p = esEnvio ? precioEnvio() : precio();
				return '<div class="pa-radar" aria-hidden="true"><i></i><i></i><i></i></div>'
					+ '<div class="pa-arriba"><a class="pa-pastilla" href="#' + (esEnvio ? 'envio-precio' : 'precio') + '" style="text-decoration:none;color:inherit;min-height:48px">' + ico('cerrar', 'p-ico--16') + 'Cancelar</a></div>'
					+ '<section class="pa-hoja" style="max-height:72%"><div class="p-hoja__asa"></div>'
					+ '<div class="pa-tuya"><div><p class="p-mini" style="margin:0 0 6px">Tu oferta · ' + (esEnvio ? 'Mensajero' : NOMBRE_TIPO[S.tipo].n) + '</p><b id="tuya">' + cup(p) + '</b></div><button class="p-btn p-btn--tinta p-btn--chico" id="subir">' + ico('mas', 'p-ico--20') + 'Subir 10 %</button></div>'
					+ '<p class="p-peq" id="estado" style="margin:0 0 10px">Buscando ' + (esEnvio ? 'mensajeros' : 'choferes') + ' cerca…' + (S.primera && !esEnvio ? ' Cogemos la 1.ª oferta a tu precio.' : '') + '</p>'
					+ '<div class="pa-ofertas" id="ofertas"></div></section>';
			},
			init: function (r) {
				var cont = $('#ofertas', r), n = 0, cogida = false;
				var precioActual = function () { return esEnvio ? precioEnvio() : precio(); };
				var tipoV = esEnvio ? 'mensajero' : S.tipo;
				var nombres = esEnvio ? [{ id: 'am', n: 'Alexis M.', e: '4,9', v: 410, col: 'moto', min: 3, mod: 0 }, { id: 'lr', n: 'Lisandra R.', e: '4,8', v: 122, col: 'moto', min: 5, mod: 0.1 }, { id: 'jc', n: 'Jorge C.', e: '4,6', v: 67, col: 'moto', min: 2, mod: 0.2 }] : CHOFERES;
				var anadir = function (c, forzarAcepta) {
					var p = precioActual(), mod = forzarAcepta ? 0 : c.mod;
					if (!forzarAcepta && p < (esEnvio ? justo('mensajero', ENVIO.ruta.km) : precioJ()) && mod === 0) { mod = 0.1; }
					var ofrece = r10(p * (1 + mod)), acepta = mod === 0;
					var el = document.createElement('article');
					el.className = 'p-oferta ' + (acepta ? 'p-oferta--acepta' : 'p-oferta--pide');
					el.innerHTML = '<div class="pa-oferta-av"><img src="' + veh(tipoV) + '" alt=""><b>' + iniciales(c.n) + '</b></div>'
						+ '<div class="pa-oferta-q"><b>' + c.n + '</b><span>' + ico('estrella-llena', 'p-ico--16') + c.e + ' · ' + c.v + ' viajes</span><span>Llega en ' + c.min + ' min · ' + c.col + '</span></div>'
						+ '<div><div class="p-oferta__precio">' + miles(ofrece) + '</div><div class="p-oferta__tipo">' + (acepta ? 'Acepta tu precio' : 'Pide +' + Math.round(mod * 100) + ' %') + '</div><div class="pa-oferta-seg" style="text-align:right;margin-top:6px" data-seg>60 s</div></div>'
						+ '<div class="pa-oferta-acc"><button class="p-btn p-btn--borde p-btn--chico" data-no>No</button><button class="p-btn p-btn--marca p-btn--chico" data-si>Aceptar · ' + miles(ofrece) + '</button></div>'
						+ '<i class="p-oferta__tiempo" aria-hidden="true"></i>';
					cont.insertBefore(el, cont.firstChild);
					var seg = 60, barra = $('.p-oferta__tiempo', el), s = $('[data-seg]', el);
					var tick = setInterval(function () { seg--; s.textContent = seg + ' s'; barra.style.transform = 'scaleX(' + (seg / 60) + ')'; if (seg <= 0) { clearInterval(tick); el.remove(); } }, 1000);
					timers.push(tick);
					$('[data-no]', el).onclick = function () { clearInterval(tick); el.remove(); };
					$('[data-si]', el).onclick = function () { elegir(c, ofrece); };
					$('#estado', r).textContent = (++n) + (n === 1 ? ' oferta' : ' ofertas') + '. Elige por precio, tiempo y estrellas.';
					if (S.primera && acepta && !cogida && !esEnvio) { cogida = true; T(function () { tostada('Cogimos la 1.ª oferta a ' + cup(ofrece)); elegir(c, ofrece); }, 900); }
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
					if (nuevo === p) { tostada('Ya está en el máximo (+50 %)', 'info'); return; }
					if (esEnvio) { S.envio.precio = nuevo; } else { S.precio = nuevo; } guardar();
					$('#tuya', r).textContent = cup(nuevo);
					tostada('Subiste a ' + cup(nuevo) + ': más choferes lo verán', 'flecha');
					T(function () { anadir({ id: 'x' + nuevo, n: esEnvio ? 'Yudith P.' : 'Osmany L.', e: '4,8', v: 176, col: esEnvio ? 'caja amarilla' : 'blanco', min: 3, mod: 0 }, true); }, 1500);
				};
			}
		};
	}
	SCR.buscando = pantallaOfertas('viaje');

	function oferta() { return S.oferta || { c: CHOFERES[0], precio: precio() }; }
	function tarjetaChofer(o, tipoV) {
		var t = NOMBRE_TIPO[tipoV];
		return '<div class="pa-chofer"><span class="pa-cara">' + iniciales(o.c.n) + '<span class="p-sello">' + ico('estrella-llena', 'p-ico--16') + o.c.e + '</span></span>'
			+ '<div><b style="font:700 17px/22px var(--letra)">' + o.c.n + '</b><div class="p-peq">' + t.n + ' ' + o.c.col + ' · ' + o.c.v + ' viajes</div><div class="p-peq">LOT al día ' + ico('check', 'p-ico--16') + '</div></div>'
			+ '<span class="pa-veh-g"><img src="' + veh(tipoV) + '" alt="" width="120" height="69" style="width:96px"></span></div>';
	}
	function hojaAyuda() {
		var h = document.createElement('div');
		h.innerHTML = '<div style="position:absolute;inset:0;z-index:10;background:var(--velo);animation:p-aparece var(--m2) both" data-cerrar></div>'
			+ '<section class="pa-hoja" style="z-index:11"><div class="p-hoja__asa"></div><p class="p-h2" style="margin:0 0 12px">¿Necesitas ayuda?</p>'
			+ '<a class="p-fila" href="tel:106"><span class="p-fila__ico" style="background:var(--error-suave);color:var(--error)">' + ico('telefono', 'p-ico--20') + '</span><span class="p-fila__txt"><b>Llamar a la policía (106)</b><span>Si estás en peligro</span></span></a>'
			+ '<button class="p-fila" data-cerrar><span class="p-fila__ico">' + ico('compartir', 'p-ico--20') + '</span><span class="p-fila__txt"><b>Avisar a Mamá (contacto de confianza)</b><span>Le llega tu viaje en vivo por WhatsApp</span></span></button>'
			+ '<button class="p-fila" data-cerrar><span class="p-fila__ico">' + ico('whatsapp', 'p-ico--20') + '</span><span class="p-fila__txt"><b>Hablar con Pa\'llá</b><span>Una persona te contesta</span></span></button></section>';
		marco.appendChild(h);
		$$('[data-cerrar]', h).forEach(function (x) { x.onclick = function () { h.remove(); if (x.tagName === 'BUTTON') { tostada('Hecho (ejemplo)'); } }; });
	}

	SCR.viene = {
		mapa: function () { var c = R.llega.c; var t = S.oferta ? S.tipo : S.tipo; return { ver: c, abajo: 520, pins: [['origen', ultimo(c), 'Tú']], mover: [['chofer', veh(t, 'arriba'), c, LIENZO ? 400000 : 45000, false]], ruta: c, rutaQuieta: true }; },
		html: function () {
			var o = oferta(), t = S.tipo;
			return '<div class="pa-arriba"><span></span><button class="pa-ayuda" id="ayuda">' + ico('escudo', 'p-ico--20') + 'Ayuda</button></div>'
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div>'
				+ '<div class="pa-eta"><div><p class="p-mini" style="margin:0 0 4px">Tu ' + PALABRA[GRUPO[t]] + ' viene</p><b id="eta">Llega en ' + o.c.min + ' min</b></div><div style="text-align:right"><b class="p-num" style="font:800 20px/1 var(--letra)">' + cup(o.precio) + '</b><div class="p-peq">Precio fijo · ' + (S.pago === 'transfer' ? 'Transfermóvil' : 'efectivo') + '</div></div></div>'
				+ '<div class="pa-barra" style="margin:12px 0 16px"><i id="barra" style="width:8%"></i></div>'
				+ tarjetaChofer(o, t)
				+ '<div class="pa-codigo" style="margin:16px 0 12px"><div><b class="p-num">4817</b><div class="p-peq" style="color:var(--tinta)">Dile este código al subir</div></div>' + ico('escudo') + '</div>'
				+ '<div class="pa-acciones"><a class="pa-acc" href="tel:+5353124567">' + ico('telefono') + 'Llamar</a><a class="pa-acc" href="#viene" id="wa">' + ico('whatsapp') + 'WhatsApp</a><button class="pa-acc" id="comp">' + ico('compartir') + 'Compartir</button></div>'
				+ '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px"><a class="p-btn p-btn--borde p-btn--chico" href="#inicio" style="color:var(--error)">Cancelar</a>' + demo('se subió', 'viaje') + '</div></section>';
		},
		init: function (r) {
			$('#ayuda', r).onclick = hojaAyuda;
			$('#comp', r).onclick = function () { tostada('Enlace del viaje copiado para tu familia'); };
			$('#wa', r).onclick = function (e) { e.preventDefault(); tostada('Abre WhatsApp con Yoandri (ejemplo)', 'whatsapp'); };
			var o = oferta(), seg = o.c.min * 60, tot = seg;
			I(function () { seg = Math.max(0, seg - 6); var m = Math.ceil(seg / 60); $('#eta', r).textContent = seg ? 'Llega en ' + m + ' min' : 'Tu chofer llegó'; $('#barra', r).style.width = (8 + 92 * (1 - seg / tot)) + '%'; }, 1000);
		}
	};

	SCR.viaje = {
		mapa: function () { var c = rutaViaje(); return { ver: c, abajo: 330, ruta: c, rutaQuieta: true, pins: [['destino', ultimo(c), 'Llegas ' + hora(4)]], mover: [['chofer', veh(S.tipo, 'arriba'), c, LIENZO ? 400000 : 40000, false]] }; },
		html: function () {
			var o = oferta();
			return '<div class="pa-arriba"><button class="pa-ayuda" id="comp" style="color:var(--tinta)">' + ico('compartir', 'p-ico--20') + 'Compartir</button><button class="pa-ayuda" id="ayuda">' + ico('escudo', 'p-ico--20') + 'Ayuda</button></div>'
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div>'
				+ '<div class="pa-eta"><div><p class="p-mini" style="margin:0 0 4px">En camino a ' + dest().n.split(' e/')[0] + '</p><b>Llegas a las ' + hora(4) + '</b></div><div style="text-align:right"><b class="p-num" style="font:800 20px/1 var(--letra)">' + cup(o.precio) + '</b><div class="p-peq">Fijo · no cambia</div></div></div>'
				+ '<div class="pa-barra" style="margin:12px 0 16px"><i id="barra" style="width:10%"></i></div>'
				+ tarjetaChofer(o, S.tipo)
				+ '<div style="display:flex;justify-content:flex-end;margin-top:12px">' + demo('llegamos', 'llegada') + '</div></section>';
		},
		init: function (r) {
			$('#ayuda', r).onclick = hojaAyuda;
			$('#comp', r).onclick = function () { tostada('Mamá ya ve tu viaje en vivo'); };
			var k = 10; I(function () { k = Math.min(100, k + 2.5); $('#barra', r).style.width = k + '%'; }, 1000);
		}
	};

	function estrellas(n) { var h = ''; for (var i = 1; i <= 5; i++) { h += '<button aria-label="' + i + ' estrellas" class="' + (i <= n ? 'is-on' : '') + '" data-e="' + i + '"><svg viewBox="0 0 24 24"><use href="../iconos.svg#estrella-llena"/></svg></button>'; } return '<div class="pa-estrellas">' + h + '</div>'; }
	function engancharEstrellas(r) { $$('[data-e]', r).forEach(function (b) { b.onclick = function () { var n = +b.dataset.e; S.estrellas = n; $$('[data-e]', r).forEach(function (x) { x.classList.toggle('is-on', +x.dataset.e <= n); }); }; }); }
	function bloquePago(monto, nombre) {
		return '<div class="pa-seg" role="group" aria-label="Forma de pago"><button data-pg="efectivo" aria-pressed="' + (S.pago !== 'transfer') + '">Efectivo</button><button data-pg="transfer" aria-pressed="' + (S.pago === 'transfer') + '">Transfermóvil</button></div>'
			+ '<div id="tm" class="p-tarjeta p-tarjeta--plana" style="display:' + (S.pago === 'transfer' ? 'block' : 'none') + '"><p class="p-peq" style="margin:0 0 4px">Número de ' + nombre + ' para Transfermóvil</p>'
			+ '<div style="display:flex;align-items:center;justify-content:space-between"><b class="p-num" style="font:800 22px/1 var(--letra);letter-spacing:.04em">5 312 4567</b><button class="p-btn p-btn--suave p-btn--chico" id="copiar" style="background:var(--fondo)">' + ico('copiar', 'p-ico--20') + 'Copiar</button></div>'
			+ '<p class="p-peq" style="margin:8px 0 0">Monto: ' + cup(monto) + '. ' + nombre + ' confirma cuando le llegue.</p></div>';
	}
	function engancharPago(r) {
		$$('[data-pg]', r).forEach(function (b) { b.onclick = function () { S.pago = b.dataset.pg; guardar(); $$('[data-pg]', r).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); $('#tm', r).style.display = S.pago === 'transfer' ? 'block' : 'none'; }; });
		var c = $('#copiar', r); if (c) { c.onclick = function () { tostada('Número copiado'); }; }
	}

	SCR.llegada = {
		html: function () {
			var o = oferta();
			return '<div class="pa-llena"><div class="pa-cuerpo" style="padding-top:28px">'
				+ '<div style="display:flex;align-items:center;gap:12px"><span class="p-fila__ico" style="background:var(--bien-suave);color:var(--bien)">' + ico('check') + '</span><div><p class="p-h2" style="margin:0">Llegaste a ' + dest().n.split(' e/')[0] + '</p><p class="p-peq" style="margin:0">' + hora(0) + ' · ' + km(kmViaje()) + ' km con ' + o.c.n + '</p></div></div>'
				+ '<div class="pa-monto"><p class="p-mini" style="margin:0 0 8px">A pagar a ' + o.c.n.split(' ')[0] + '</p><b>' + miles(o.precio) + '<small style="font-size:20px"> CUP</small></b><p class="p-peq" style="margin:8px 0 0">Lo acordado. No cambia.</p></div>'
				+ bloquePago(o.precio, o.c.n.split(' ')[0])
				+ '<p class="pa-seccion" style="text-align:center">¿Qué tal el viaje?</p>' + estrellas(S.estrellas || 5)
				+ '<div class="pa-chips" style="justify-content:center"><button class="p-chip" aria-pressed="true">Puntual</button><button class="p-chip">Amable</button><button class="p-chip">Buen vehículo</button><button class="p-chip">Manejó bien</button></div>'
				+ '<p class="pa-seccion">Propina (opcional, para ' + o.c.n.split(' ')[0] + ')</p><div class="pa-chips"><button class="p-chip">+10</button><button class="p-chip" aria-pressed="true">+20</button><button class="p-chip">+50</button><button class="p-chip">Nada</button></div>'
				+ '</div><div class="pa-pie"><a class="p-btn p-btn--marca p-btn--ancho" href="#viajes" id="listo">Listo</a></div></div>';
		},
		init: function (r) {
			engancharPago(r); engancharEstrellas(r);
			$$('.pa-chips', r).forEach(function (g, i) { $$('.p-chip', g).forEach(function (c) { c.onclick = function () { if (i === 1) { $$('.p-chip', g).forEach(function (x) { x.setAttribute('aria-pressed', x === c); }); } else { c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true'); } }; }); });
			$('#listo', r).onclick = function () { tostada('Gracias. Tu viaje quedó guardado.'); };
		}
	};

	SCR.viajes = {
		html: function () {
			var fila = function (ic, svc, t, d, pr, quien) { return '<div class="p-fila" style="align-items:flex-start;padding:14px 0"><span class="p-fila__ico" style="background:var(--' + svc + '-suave);color:var(--' + svc + ')">' + ico(ic, 'p-ico--20') + '</span><span class="p-fila__txt"><b>' + t + '</b><span>' + d + '</span><span>' + quien + '</span></span><span style="text-align:right"><b class="p-num" style="display:block;font:700 15px/20px var(--letra)">' + pr + '</b><a class="p-btn p-btn--suave p-btn--chico" href="#precio" style="min-height:40px;margin-top:6px;padding:0 12px;font-size:13px">Repetir</a></span></div>'; };
			return '<div class="pa-llena"><div class="pa-cab"><a class="pa-volver" href="#inicio" aria-label="Volver">' + ico('atras') + '</a><h1>Mis viajes</h1></div><div class="pa-cuerpo" style="gap:0">'
				+ '<p class="pa-seccion" style="margin:0 0 4px">Hoy</p>'
				+ fila('triciclo', 'tric', 'Coppelia', 'Triciclo Eléctrico · ' + hora(0), '100 CUP', 'Yoandri R. · le diste ★ 5')
				+ '<p class="pa-seccion" style="margin:16px 0 4px">Esta semana</p>'
				+ fila('coche', 'taxi', 'Obispo e/ Habana y Compostela', 'Taxi Básico · lunes 18:05', '1.740 CUP', 'Ariel V. · ★ 5')
				+ fila('paquete', 'mens', 'Envío a Hidalgo, Nuevo Vedado', 'Mensajero · lunes 10:20', '340 CUP', 'Alexis M. · foto de entrega')
				+ fila('triciclo', 'tric', 'Calle N e/ 23 y 25', 'Triciclo Bici · domingo 21:40', '70 CUP', 'Reinier S. · ★ 4')
				+ '<p class="p-peq" style="margin:20px 0 0">' + ico('guardado', 'p-ico--16') + ' Se guardan en tu móvil: los ves aunque no haya señal.</p>'
				+ '</div></div>';
		}
	};

	SCR.perfil = {
		html: function () {
			var t = localStorage.getItem('palla-tema') || 'auto';
			var op = function (v, n) { return '<button data-tema="' + v + '" aria-pressed="' + (t === v) + '">' + n + '</button>'; };
			var fila = function (i, b, s, h) { return '<a class="p-fila" href="' + (h || '#perfil') + '"><span class="p-fila__ico">' + ico(i, 'p-ico--20') + '</span><span class="p-fila__txt"><b>' + b + '</b>' + (s ? '<span>' + s + '</span>' : '') + '</span>' + ico('sigue', 'p-ico--20') + '</a>'; };
			return '<div class="pa-llena"><div class="pa-cab"><a class="pa-volver" href="#inicio" aria-label="Volver">' + ico('atras') + '</a><h1>Perfil</h1></div><div class="pa-cuerpo" style="gap:8px">'
				+ '<div style="display:flex;align-items:center;gap:14px;margin-bottom:8px"><span class="pa-cara" style="width:64px;height:64px;font-size:22px">LM</span><div><p class="p-h1" style="margin:0">Laura M.</p><p class="p-peq" style="margin:0">+53 5 312 4210 · ★ 4,8 como pasajera</p></div></div>'
				+ '<p class="pa-seccion">Mis lugares</p>' + fila('casa', 'Casa', 'Calle 19 e/ 4 y 6, Vedado') + fila('trabajo', 'Trabajo', 'Obispo e/ Habana y Compostela')
				+ '<p class="pa-seccion">Seguridad</p>' + fila('personas', 'Contactos de confianza', 'Mamá · le llega tu viaje si lo compartes') + fila('escudo', 'Ayuda en un viaje', 'Policía 106 y una persona de Pa\'llá')
				+ '<p class="pa-seccion">Pantalla</p><div class="pa-seg" style="grid-template-columns:1.5fr 1fr 1fr">' + op('auto', 'De noche') + op('claro', 'Claro') + op('oscuro', 'Oscuro') + '</div>'
				+ '<p class="p-peq" style="margin:0">«Oscuro de noche»: de 7 p. m. a 7 a. m. gasta menos batería y no deslumbra.</p>'
				+ '<p class="pa-seccion">Más</p>' + fila('efectivo', 'Pago preferido', S.pago === 'transfer' ? 'Transfermóvil' : 'Efectivo') + fila('lista', 'Mis viajes', '', '#viajes') + fila('sin-senal', 'Qué pasa sin conexión', '', '#sinconexion')
				+ '<a class="p-fila" href="#entrar" id="salir" style="color:var(--error)"><span class="p-fila__ico" style="color:var(--error)">' + ico('salir', 'p-ico--20') + '</span><span class="p-fila__txt"><b>Salir</b></span></a>'
				+ '</div></div>';
		},
		init: function (r) {
			$$('[data-tema]', r).forEach(function (b) { b.onclick = function () { localStorage.setItem('palla-tema', b.dataset.tema); location.reload(); }; });
			$('#salir', r).onclick = function () { localStorage.removeItem('palla-dentro'); };
		}
	};

	SCR.sinconexion = {
		mapa: function () { return { offline: true }; },
		html: function () {
			return '<div class="pa-banda" role="status">' + ico('sin-senal', 'p-ico--20') + '<span>Sin conexión. Lo guardado en tu móvil funciona.</span></div>'
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div>'
				+ '<div class="p-aviso p-aviso--marca" style="margin-bottom:12px">' + ico('reloj') + '<div><b>Tu pedido está guardado</b><br>Triciclo Eléctrico a Coppelia · 100 CUP. Sale solo cuando vuelva la señal; te avisamos.</div></div>'
				+ '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px"><a class="p-btn p-btn--suave p-btn--chico" href="#sinconexion">' + ico('whatsapp', 'p-ico--20') + 'Pedir por WhatsApp</a><a class="p-btn p-btn--suave p-btn--chico" href="tel:+5350000000">' + ico('telefono', 'p-ico--20') + 'Llamar</a></div>'
				+ '<p class="pa-seccion" style="margin:12px 0 0">Guardado en tu móvil</p>'
				+ '<a class="p-fila" href="#sinconexion"><span class="p-fila__ico">' + ico('casa', 'p-ico--20') + '</span><span class="p-fila__txt"><b>Casa</b><span>Calle 19 e/ 4 y 6, Vedado</span></span></a>'
				+ '<a class="p-fila" href="#sinconexion"><span class="p-fila__ico">' + ico('trabajo', 'p-ico--20') + '</span><span class="p-fila__txt"><b>Trabajo</b><span>Obispo e/ Habana y Compostela</span></span></a>'
				+ '<a class="p-fila" href="#viajes"><span class="p-fila__ico">' + ico('lista', 'p-ico--20') + '</span><span class="p-fila__txt"><b>Mis viajes</b><span>Los 4 últimos, con precio y chofer</span></span></a>'
				+ '<p class="p-peq" style="margin:8px 0 0">El mapa vuelve con la señal. Mientras, puedes escribir «23 y L» y pedir igual.</p>'
				+ '<a class="p-btn p-btn--borde p-btn--chico p-btn--ancho" href="#inicio" style="margin-top:12px">Volvió la señal (demo)</a></section>';
		}
	};

	// ---------- Mensajero (el cliente manda algo) ----------
	SCR.envio = {
		html: function () {
			var tam = function (k, i, n, s) { return '<button data-tam="' + k + '" aria-pressed="' + (S.envio.tam === k) + '">' + ico(i) + n + '<span>' + s + '</span></button>'; };
			return '<div class="pa-llena"><div class="pa-cab"><a class="pa-volver" href="#inicio" aria-label="Volver">' + ico('atras') + '</a><h1>Mandar algo</h1><span class="p-sello p-sello--mens" style="margin-right:8px">Mensajero</span></div><div class="pa-cuerpo">'
				+ '<div class="pa-od"><span class="pm-pin" style="top:19px"></span><span class="pm-pin pm-pin--destino" style="bottom:19px"></span>'
				+ '<label class="p-campo"><input value="' + ENVIO.de.n + ', ' + ENVIO.de.d + '" aria-label="Recoger en"></label>'
				+ '<label class="p-campo"><input value="' + ENVIO.a.n + '" aria-label="Llevar a"></label></div>'
				+ '<label class="pa-seccion" for="que">¿Qué mandas?</label><label class="p-campo"><input id="que" value="Llaves y un sobre"></label>'
				+ '<p class="pa-seccion">Tamaño</p><div class="pa-tamano">' + tam('mano', 'llave', 'Cabe en la mano', 'llaves, sobre') + tam('mochila', 'paquete', 'Mochila', 'hasta 10 kg') + tam('grande', 'caja', 'Grande', 'va en triciclo') + '</div>'
				+ '<div class="p-aviso p-aviso--aviso">' + ico('alerta') + '<span>Nada prohibido ni peligroso. Si mandas dinero, dilo: el mensajero lo sabrá antes de aceptar.</span></div>'
				+ '</div><div class="pa-pie"><a class="p-btn p-btn--marca p-btn--ancho" href="#envio-recibe">Seguir</a></div></div>';
		},
		init: function (r) { $$('[data-tam]', r).forEach(function (b) { b.onclick = function () { S.envio.tam = b.dataset.tam; guardar(); $$('[data-tam]', r).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }; }); }
	};

	SCR['envio-recibe'] = {
		html: function () {
			return '<div class="pa-llena"><div class="pa-cab"><a class="pa-volver" href="#envio" aria-label="Volver">' + ico('atras') + '</a><h1>¿Quién lo recibe?</h1></div><div class="pa-cuerpo">'
				+ '<label class="pa-seccion" for="rn">Nombre</label><label class="p-campo">' + ico('usuario', 'p-ico--20') + '<input id="rn" value="Marta"></label>'
				+ '<label class="pa-seccion" for="rt">Teléfono</label><div class="pa-tel"><span class="pref">+53</span><label class="p-campo"><input id="rt" inputmode="tel" value="5 312 4567"></label></div>'
				+ '<p class="p-peq" style="margin:-4px 0 0">Le llega por WhatsApp quién va y su código de entrega.</p>'
				+ '<p class="pa-seccion">¿Cobrar algo al entregar?</p><div class="pa-seg"><button data-c="0" aria-pressed="' + !S.envio.cobrar + '">No</button><button data-c="1" aria-pressed="' + !!S.envio.cobrar + '">Sí, cobrar</button></div>'
				+ '<div id="cob" style="display:' + (S.envio.cobrar ? 'flex' : 'none') + ';flex-direction:column;gap:8px"><label class="p-campo"><input inputmode="numeric" value="1.500" aria-label="Cuánto cobrar"><b>CUP</b></label><p class="p-peq" style="margin:0">El mensajero te lo pasa por Transfermóvil al momento.</p></div>'
				+ '<label class="pa-seccion" for="rnota">Nota (opcional)</label><label class="p-campo">' + ico('nota', 'p-ico--20') + '<input id="rnota" value="Apto. 3, tocar fuerte"></label>'
				+ '</div><div class="pa-pie"><a class="p-btn p-btn--marca p-btn--ancho" href="#envio-precio">Ver precio</a></div></div>';
		},
		init: function (r) { $$('[data-c]', r).forEach(function (b) { b.onclick = function () { S.envio.cobrar = b.dataset.c === '1'; guardar(); $$('[data-c]', r).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); $('#cob', r).style.display = S.envio.cobrar ? 'flex' : 'none'; }; }); }
	};

	SCR['envio-precio'] = {
		mapa: function () { var c = ENVIO.ruta.c; return { ruta: c, ver: c, abajo: 470, arriba: 70, pins: [['origen', c[0], 'Recoger'], ['destino', ultimo(c), 'Marta']] }; },
		html: function () {
			var j = justo('mensajero', ENVIO.ruta.km);
			return '<div class="pa-arriba"><a class="p-btn p-btn--redondo" href="#envio-recibe" aria-label="Volver">' + ico('atras') + '</a></div>'
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div>'
				+ '<div style="display:flex;align-items:center;gap:10px"><img src="' + veh('mensajero') + '" alt="" width="64" height="37"><div style="flex:1"><b>Llaves y un sobre</b><div class="p-peq">' + ENVIO.a.n + ' · ' + km(ENVIO.ruta.km) + ' km</div></div><span class="p-sello p-sello--mens">Mensajero</span></div>'
				+ '<div id="ctl">' + controlPrecio(j, Math.min(limites(j).max, Math.max(limites(j).min, precioEnvio()))) + '</div>'
				+ '<p class="p-peq" style="margin:0 0 12px">' + ico('camara', 'p-ico--16') + ' El mensajero hace una foto al entregar.</p>'
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
		mapa: function () { var c = ENVIO.ruta.c; return { ver: c, abajo: 470, ruta: c, rutaQuieta: true, pins: [['destino', ultimo(c), 'Marta · ' + hora(7)]], mover: [['m', veh('mensajero', 'arriba'), c, LIENZO ? 600000 : 60000, false]] }; },
		html: function () {
			var m = S.envio.mens || { n: 'Alexis M.', e: '4,9', v: 410, col: 'moto', min: 3 };
			return '<div class="pa-arriba"><a class="p-btn p-btn--redondo" href="#inicio" aria-label="Inicio">' + ico('atras') + '</a><button class="pa-ayuda" id="ayuda">' + ico('escudo', 'p-ico--20') + 'Ayuda</button></div>'
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div>'
				+ '<ol class="pa-pasos" style="margin:4px 0 8px"><li class="is-hecho"><span class="n">' + ico('check', 'p-ico--16') + '</span><div><b>Recogido</b><span>' + hora(-6) + ' en ' + ENVIO.de.n + '</span></div></li>'
				+ '<li class="is-ahora"><span class="n">2</span><div><b>En camino</b><span>Llega a las ' + hora(7) + '</span></div></li>'
				+ '<li><span class="n">3</span><div><b>Entregado</b><span>Con foto y el código de Marta</span></div></li></ol>'
				+ tarjetaChofer({ c: m, precio: precioEnvio() }, 'mensajero')
				+ '<div class="pa-codigo" style="margin:14px 0 12px"><div><b class="p-num">2905</b><div class="p-peq" style="color:var(--tinta)">Código de entrega: ya se lo mandamos a Marta</div></div>' + ico('paquete') + '</div>'
				+ '<div class="pa-acciones"><a class="pa-acc" href="tel:+5353124567">' + ico('telefono') + 'Llamar</a><button class="pa-acc" id="wa">' + ico('whatsapp') + 'WhatsApp</button><button class="pa-acc" id="comp">' + ico('compartir') + 'Compartir</button></div>'
				+ '<div style="display:flex;justify-content:flex-end;margin-top:12px">' + demo('entregado', 'envio-entregado') + '</div></section>';
		},
		init: function (r) { $('#ayuda', r).onclick = hojaAyuda; $('#comp', r).onclick = function () { tostada('Enlace de seguimiento copiado'); }; $('#wa', r).onclick = function () { tostada('Abre WhatsApp con el mensajero (ejemplo)', 'whatsapp'); }; }
	};

	var FOTO = '<svg class="pa-foto" viewBox="0 0 320 240" role="img" aria-label="Foto de entrega (dibujo de ejemplo)"><defs><linearGradient id="pf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9D3C4"/><stop offset="1" stop-color="#BDB5A3"/></linearGradient><linearGradient id="pp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3D6B5A"/><stop offset="1" stop-color="#2B4F42"/></linearGradient><linearGradient id="ps" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3EBD9"/><stop offset="1" stop-color="#D8CBAE"/></linearGradient></defs>'
		+ '<rect width="320" height="240" fill="url(#pf)"/><rect x="0" y="196" width="320" height="44" fill="#9C9381"/><rect x="96" y="28" width="128" height="170" rx="3" fill="url(#pp)"/><rect x="108" y="40" width="104" height="70" rx="2" fill="none" stroke="#2A4A3E" stroke-width="3"/><rect x="108" y="120" width="104" height="66" rx="2" fill="none" stroke="#2A4A3E" stroke-width="3"/><circle cx="204" cy="118" r="5" fill="#C9B26A"/><text x="160" y="22" text-anchor="middle" font-family="Archivo,Arial" font-weight="800" font-size="13" fill="#5E5747">3</text>'
		+ '<g transform="rotate(-6 160 200)"><rect x="128" y="176" width="72" height="44" rx="3" fill="url(#ps)" stroke="#B8A88A"/><path d="M128 186l36 16 36-16" fill="none" stroke="#B8A88A" stroke-width="2"/></g><ellipse cx="180" cy="226" rx="44" ry="6" fill="#000" opacity=".15"/>'
		+ '<rect x="10" y="10" width="118" height="24" rx="12" fill="rgba(0,0,0,.55)"/><text x="69" y="26" text-anchor="middle" font-family="Archivo,Arial" font-weight="700" font-size="11" fill="#fff">EJEMPLO · 18:19</text></svg>';

	SCR['envio-entregado'] = {
		html: function () {
			var m = S.envio.mens || { n: 'Alexis M.' };
			return '<div class="pa-llena"><div class="pa-cab"><a class="pa-volver" href="#envio-seguimiento" aria-label="Volver">' + ico('atras') + '</a><h1>Entregado</h1></div><div class="pa-cuerpo">'
				+ '<div class="p-aviso p-aviso--bien">' + ico('check') + '<span><b>Marta lo recibió a las ' + hora(0) + '.</b> Dijo el código 2905.</span></div>'
				+ FOTO + '<p class="p-peq" style="margin:-6px 0 0">Foto que hizo ' + m.n + ' al entregar.</p>'
				+ '<div style="display:flex;justify-content:space-between;align-items:baseline"><p class="p-h2" style="margin:0">A pagar</p><b class="p-num" style="font:800 28px/1 var(--letra);font-stretch:112%">' + cup(precioEnvio()) + '</b></div>'
				+ bloquePago(precioEnvio(), m.n.split(' ')[0])
				+ estrellas(5)
				+ '</div><div class="pa-pie"><a class="p-btn p-btn--marca p-btn--ancho" href="#viajes">Listo</a></div></div>';
		},
		init: function (r) { engancharPago(r); engancharEstrellas(r); }
	};

	// ---------- Chofer (app Pa'llá de Android) ----------
	function cabChofer(t, atras) {
		return '<div class="pa-cab">' + (atras ? '<a class="pa-volver" href="#' + atras + '" aria-label="Volver">' + ico('atras') + '</a>' : '<span style="width:12px"></span>')
			+ '<h1>' + t + '</h1><a class="pa-volver" href="#ch-perfil" aria-label="Mi perfil"><span class="pa-cara" style="width:36px;height:36px;font-size:12px">YR</span></a></div>';
	}

	SCR['ch-alta'] = {
		html: function () {
			var paso = function (c, n, b, s, extra) { return '<li class="' + c + '"><span class="n">' + (c === 'is-hecho' ? ico('check', 'p-ico--16') : n) + '</span><div style="flex:1"><b>' + b + '</b><span>' + s + '</span>' + (extra || '') + '</div></li>'; };
			var tipos = ['Bici', 'Eléctrico', 'Eléctrico XL', 'Carga', 'Moto', 'Mensajero', 'Taxi'].map(function (t) { return '<button class="p-chip" aria-pressed="' + (t === 'Eléctrico') + '">' + t + '</button>'; }).join('');
			return '<div class="pa-llena">' + cabChofer('Hazte chofer') + '<div class="pa-cuerpo">'
				+ '<div><p class="p-peq" style="margin:0 0 6px">2 de 4 · unos 5 minutos</p><div class="pa-barra"><i style="width:50%"></i></div></div>'
				+ '<ol class="pa-pasos">'
				+ paso('is-hecho', 1, 'Carné de identidad', 'Las dos caras · recibido')
				+ paso('is-hecho', 2, 'Selfie con tu carné', 'Que se vea tu cara y el carné · recibido')
				+ paso('is-ahora', 3, 'Foto del vehículo', 'De frente o de lado, con luz de día', '<a class="p-btn p-btn--tinta p-btn--chico" href="#ch-alta" style="margin-top:10px">' + ico('camara', 'p-ico--20') + 'Hacer la foto</a>')
				+ paso('', 4, 'Tipo de vehículo', 'Elige uno; luego plazas o kilos', '<div class="pa-chips" style="margin-top:10px">' + tipos + '</div>')
				+ '</ol><div class="p-aviso p-aviso--marca">' + ico('info') + '<span>Licencia y LOT: súbelas si las tienes (para taxi son obligatorias). Te avisamos por WhatsApp cuando estés aprobado.</span></div>'
				+ '</div><div class="pa-pie"><a class="p-btn p-btn--marca p-btn--ancho" href="#ch-conectar">Enviar para revisar</a></div></div>';
		},
		init: function (r) { $$('.pa-chips .p-chip', r).forEach(function (c) { c.onclick = function () { $$('.pa-chips .p-chip', r).forEach(function (x) { x.setAttribute('aria-pressed', x === c); }); }; }); }
	};

	SCR['ch-conectar'] = {
		html: function () {
			var on = S.chOn !== false;
			var op = function (id, b, s, v, extra) { return '<div class="pa-op"><div><b>' + b + '</b><span>' + s + '</span></div><button class="p-interruptor" role="switch" aria-checked="' + v + '" data-op="' + id + '" aria-label="' + b + '"' + (extra || '') + '></button></div>'; };
			return '<div class="pa-llena">' + cabChofer('Hola, Yoandri') + '<div class="pa-cuerpo">'
				+ '<div style="display:flex;justify-content:space-between;align-items:flex-end"><div><p class="p-mini" style="margin:0 0 6px">Hoy</p><span class="pa-cifra">1.240</span> <b>CUP</b></div><a class="p-btn p-btn--suave p-btn--chico" href="#ch-ganancias">' + ico('ganancias', 'p-ico--20') + '7 viajes</a></div>'
				+ '<button class="pa-conectar ' + (on ? 'is-on' : '') + '" id="con" aria-pressed="' + on + '">' + ico('encender') + '<span>' + (on ? 'En línea' : 'Conectarme') + '</span></button>'
				+ '<p class="p-peq" style="text-align:center;margin:-4px 0 0" id="con-t">' + (on ? 'Te llegan pedidos aunque la app esté cerrada.' : 'Toca para empezar a recibir pedidos.') + '</p>'
				+ '<div class="p-aviso p-aviso--bien">' + ico('ruta') + '<span><b>Mucha demanda</b> en Vedado y Centro Habana ahora.</span></div>'
				+ '<p class="pa-seccion">Qué acepto hoy</p><div>'
				+ op('pasaje', 'Pasaje', 'Triciclo Eléctrico · 4 plazas', true)
				+ op('envios', 'Envíos de clientes', 'Paquetes que caben en el triciclo', true)
				+ op('cv', 'Casa Viva', 'Solo si eres su mensajero · precio por municipio', false)
				+ '</div>' + (on ? '<a class="p-btn p-btn--marca p-btn--ancho" href="#ch-pedidos">Ver pedidos cerca (3)</a>' : '') + '</div></div>';
		},
		init: function (r) {
			$('#con', r).onclick = function () { S.chOn = S.chOn === false; guardar(); mostrar(true); };
			$$('[data-op]', r).forEach(function (b) { b.onclick = function () { b.setAttribute('aria-checked', b.getAttribute('aria-checked') !== 'true'); }; });
		}
	};

	SCR['ch-pedidos'] = {
		html: function () {
			var ped = function (id, pr, tipo, sello, cli, de, dist, a, kmv, nota) {
				var b = [0, 0.1, 0.2, 0.3].map(function (m, i) { var v = r10(pr * (1 + m)); return '<button class="' + (i ? '' : 'acepto') + '" data-v="' + v + '" data-p="' + id + '">' + (i ? miles(v) + '<small>+' + (m * 100) + ' %</small>' : 'Acepto<small>' + miles(v) + '</small>') + '</button>'; }).join('');
				return '<article class="pa-pedido" id="' + id + '"><div class="arriba"><div><span class="cuanto">' + miles(pr) + '</span> <b>CUP</b><div class="p-peq">' + cli + '</div></div><div style="text-align:right"><span class="p-sello p-sello--' + sello + '">' + tipo + '</span><div class="pa-oferta-seg" style="margin-top:8px" data-seg>45 s</div></div></div>'
					+ '<div class="od"><span class="pm-pin"></span><b>' + de + '</b><small>A ' + dist + ' de ti</small><span class="pm-pin pm-pin--destino"></span><b>' + a + '</b><small>Viaje de ' + kmv + '</small></div>'
					+ (nota ? '<div class="p-aviso p-aviso--marca" style="padding:10px 12px">' + ico('nota', 'p-ico--20') + '<span>«' + nota + '»</span></div>' : '')
					+ '<div class="pa-contra">' + b + '</div></article>';
			};
			return '<div class="pa-llena" style="background:var(--fondo-2)">' + cabChofer('Pedidos cerca', 'ch-conectar') + '<div class="pa-cuerpo" style="gap:12px">'
				+ '<p class="p-peq" style="margin:0;display:flex;align-items:center;gap:8px"><span class="pa-punto" style="background:var(--bien)"></span>En línea · un toque: acepto o pido más. Decir que no no baja tu nota.</p>'
				+ ped('p1', 100, 'Pasaje', 'tric', 'Laura · ★ 4,8 · 23 viajes', 'Vedado · Calle N e/ 23 y 25', '600 m', 'Vedado · 23 y L (Coppelia)', '0,8 km', 'Voy con una niña')
				+ ped('p2', 340, 'Envío', 'mens', 'Ernesto · ★ 5,0 · cabe en la mano', 'Vedado · Línea y Paseo', '1,1 km', 'Nuevo Vedado · Hidalgo', '4,0 km', '')
				+ ped('p3', 270, 'Pasaje', 'tric', 'Carlos · ★ 4,6 · 8 viajes', 'Vedado · 21 y H', '900 m', 'Habana Vieja · Obispo', '4,1 km', '')
				+ '</div></div>';
		},
		init: function (r) {
			var seg = 45; I(function () { seg = Math.max(0, seg - 1); $$('[data-seg]', r).forEach(function (s) { s.textContent = seg + ' s'; }); }, 1000);
			T(function () { var p = $('#p3', r); if (p) { p.classList.add('is-perdido'); $('.pa-contra', p).outerHTML = '<p class="p-peq" style="margin:0">Lo cogió otro chofer.</p>'; } }, LIENZO ? 600 : 7000);
			$$('[data-v]', r).forEach(function (b) {
				b.onclick = function () {
					var card = $('#' + b.dataset.p, r); card.classList.add('is-enviado');
					var v = +b.dataset.v;
					var aviso = document.createElement('div'); aviso.className = 'p-aviso p-aviso--marca'; aviso.innerHTML = ico('reloj') + '<span><b>Enviaste ' + cup(v) + '.</b> Esperando al cliente…</span>';
					card.appendChild(aviso);
					T(function () { aviso.className = 'p-aviso p-aviso--bien'; aviso.innerHTML = ico('check') + '<span><b>¡Aceptó ' + cup(v) + '!</b> Precio fijo. Ve a recoger.</span>'; S.chPrecio = v; S.chPaso = 'ir'; guardar(); T(function () { ir('ch-recoger'); }, 1100); }, 1800);
				};
			});
		}
	};

	SCR['ch-recoger'] = {
		mapa: function () { var c = R.llega.c; return { ruta: c, ver: c, abajo: 420, pins: [['origen', ultimo(c), 'Laura']], mover: [['yo-ch', veh('tric-electrico', 'arriba'), c, LIENZO ? 400000 : 30000, false]] }; },
		html: function () {
			var llegue = S.chPaso === 'codigo';
			return '<div class="pa-arriba"><a class="p-btn p-btn--redondo" href="#ch-pedidos" aria-label="Volver">' + ico('atras') + '</a><a class="pa-ayuda" href="#ch-recoger" style="color:var(--tinta);text-decoration:none">' + ico('navegar', 'p-ico--20') + 'Navegar</a></div>'
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div>'
				+ '<div class="pa-eta"><div><p class="p-mini" style="margin:0 0 4px">' + (llegue ? 'Ya llegaste' : 'Recoge a Laura · 3 min') + '</p><b style="font-size:22px">Calle N e/ 23 y 25</b><div class="p-peq">Vedado · 1,5 km de ti</div></div><div style="text-align:right"><b class="p-num" style="font:800 20px/1 var(--letra)">' + cup(S.chPrecio || 110) + '</b><div class="p-peq">Fijo · efectivo</div></div></div>'
				+ '<div class="p-aviso p-aviso--marca" style="margin:12px 0">' + ico('nota', 'p-ico--20') + '<span>«Voy con una niña» · portón verde</span></div>'
				+ (llegue
					? '<p class="pa-seccion" style="margin:4px 0 10px;text-align:center">Pide el código a Laura</p><div class="pa-cajas" style="margin-bottom:14px"><span>4</span><span>8</span><span>1</span><span class="is-act">7</span></div><a class="p-btn p-btn--marca p-btn--ancho" href="#ch-viaje">' + ico('check') + 'Recogí a Laura</a>'
					: '<div class="pa-acciones" style="grid-template-columns:1fr 1fr;margin-bottom:12px"><a class="pa-acc" href="tel:+5353124210">' + ico('telefono') + 'Llamar</a><button class="pa-acc" id="wa">' + ico('whatsapp') + 'WhatsApp</button></div><button class="p-btn p-btn--marca p-btn--ancho" id="llegue">Llegué</button>')
				+ '</section>';
		},
		init: function (r) {
			var l = $('#llegue', r); if (l) { l.onclick = function () { S.chPaso = 'codigo'; guardar(); mostrar(true); tostada('Le avisamos a Laura que llegaste'); }; }
			var w = $('#wa', r); if (w) { w.onclick = function () { tostada('WhatsApp con Laura (se abre al aceptar)', 'whatsapp'); }; }
			var c = $('a[href="#ch-viaje"]', r); if (c) { c.addEventListener('click', function () { S.chPaso = 'ir'; guardar(); }); }
		}
	};

	SCR['ch-viaje'] = {
		mapa: function () { var c = R.viaje.c; return { ruta: c, ver: c, abajo: 300, pins: [['destino', ultimo(c), 'Coppelia']], mover: [['yo-ch', veh('tric-electrico', 'arriba'), c, LIENZO ? 400000 : 30000, false]] }; },
		html: function () {
			return '<div class="pa-arriba"><span></span><a class="pa-ayuda" href="#ch-viaje" style="color:var(--tinta);text-decoration:none">' + ico('navegar', 'p-ico--20') + 'Navegar</a></div>'
				+ '<section class="pa-hoja"><div class="p-hoja__asa"></div>'
				+ '<div class="pa-eta"><div><p class="p-mini" style="margin:0 0 4px">Llevando a Laura</p><b style="font-size:22px">Coppelia, 23 y L</b><div class="p-peq">0,8 km · llegas a las ' + hora(3) + '</div></div><div style="text-align:right"><b class="p-num" style="font:800 20px/1 var(--letra)">' + cup(S.chPrecio || 110) + '</b><div class="p-peq">efectivo</div></div></div>'
				+ '<a class="p-btn p-btn--marca p-btn--ancho" href="#ch-cobrar" style="margin-top:16px">Terminé el viaje</a></section>';
		}
	};

	SCR['ch-cobrar'] = {
		html: function () {
			var v = S.chPrecio || 110;
			return '<div class="pa-llena">' + cabChofer('Cobrar', 'ch-viaje') + '<div class="pa-cuerpo">'
				+ '<div class="pa-monto"><p class="p-mini" style="margin:0 0 8px">Cobra a Laura · efectivo</p><b>' + miles(v) + '<small style="font-size:20px"> CUP</small></b><p class="p-peq" style="margin:8px 0 0">Lo acordado. Si te paga por Transfermóvil, espera el SMS del banco.</p></div>'
				+ '<a class="p-btn p-btn--marca p-btn--ancho" href="#ch-ganancias" id="cob">' + ico('check') + 'Cobrado</a>'
				+ '<p class="pa-seccion" style="text-align:center;margin-top:16px">¿Qué tal Laura?</p>' + estrellas(5)
				+ '<div class="pa-chips" style="justify-content:center"><button class="p-chip" aria-pressed="true">Puntual</button><button class="p-chip">Amable</button><button class="p-chip">Problema</button></div>'
				+ '<button class="p-btn p-btn--borde p-btn--chico" style="align-self:center" id="nopago">No me pagó</button></div></div>';
		},
		init: function (r) { engancharEstrellas(r); $('#cob', r).onclick = function () { tostada('Viaje terminado. +' + cup(S.chPrecio || 110)); }; $('#nopago', r).onclick = function () { tostada('Avisamos a Pa\'llá. Te llamamos.', 'info'); }; }
	};

	SCR['ch-ganancias'] = {
		html: function () {
			var dias = [['L', 980], ['M', 1420], ['X', 1340, 1], ['J', 0], ['V', 0], ['S', 0], ['D', 0]];
			var max = 1600;
			var barras = dias.map(function (d) { return '<div class="' + (d[2] ? 'is-hoy' : '') + '"><i style="height:' + Math.max(4, d[1] / max * 100) + '%"></i><span>' + d[0] + '</span></div>'; }).join('');
			return '<div class="pa-llena">' + cabChofer('Ganancias', 'ch-conectar') + '<div class="pa-cuerpo">'
				+ '<div class="pa-seg"><button aria-pressed="true">Hoy</button><button>Semana</button></div>'
				+ '<div><p class="p-mini" style="margin:0 0 6px">Hoy, miércoles</p><span class="pa-cifra">1.340</span> <b>CUP</b><p class="p-peq" style="margin:6px 0 0">8 viajes · 5 h 10 min en línea · ★ 4,9</p></div>'
				+ '<div class="p-tarjeta p-tarjeta--plana"><div style="display:flex;justify-content:space-between"><b>Esta semana</b><b class="p-num">3.740 CUP</b></div><div class="pa-barras">' + barras + '</div></div>'
				+ '<div class="p-aviso p-aviso--bien">' + ico('check') + '<span><b>Comisión: 0 %.</b> En el piloto y los 2 meses siguientes te quedas todo.</span></div>'
				+ '<p class="pa-seccion">Últimos viajes</p>'
				+ '<div class="p-fila"><span class="p-fila__ico">' + ico('triciclo', 'p-ico--20') + '</span><span class="p-fila__txt"><b>Coppelia</b><span>' + hora(0) + ' · Laura · efectivo</span></span><b class="p-num">' + cup(S.chPrecio || 110) + '</b></div>'
				+ '<div class="p-fila"><span class="p-fila__ico">' + ico('paquete', 'p-ico--20') + '</span><span class="p-fila__txt"><b>Envío a Nuevo Vedado</b><span>16:05 · Transfermóvil</span></span><b class="p-num">370 CUP</b></div>'
				+ '<a class="p-fila" href="#ch-deuda"><span class="p-fila__ico">' + ico('moneda', 'p-ico--20') + '</span><span class="p-fila__txt"><b>Lo que debo a Pa\'llá</b><span>Hoy: nada (piloto)</span></span>' + ico('sigue', 'p-ico--20') + '</a>'
				+ '</div></div>';
		}
	};

	SCR['ch-deuda'] = {
		html: function () {
			var tope = 2000, debe = 784;
			return '<div class="pa-llena">' + cabChofer('Lo que debo a Pa\'llá', 'ch-ganancias') + '<div class="pa-cuerpo">'
				+ '<div class="p-aviso p-aviso--marca">' + ico('info') + '<span><b>Hoy no debes nada:</b> estás en el piloto (0 %). Esto es un ejemplo de cómo se verá después, con el 8 %.</span></div>'
				+ '<div><p class="p-mini" style="margin:0 0 6px">Semana del 2 al 8 de nov. (ejemplo)</p><span class="pa-cifra">' + miles(debe) + '</span> <b>CUP</b><p class="p-peq" style="margin:6px 0 0">8 % de 9.800 CUP en viajes · pagar antes del lunes 9</p></div>'
				+ '<div><div class="pa-medidor"><i style="width:' + (debe / tope * 100) + '%"></i></div><div class="pa-regla-txt" style="margin-top:8px"><span>Debes ' + cup(debe) + '</span><span>Tope ' + cup(tope) + '</span></div></div>'
				+ '<div class="p-aviso p-aviso--aviso">' + ico('alerta') + '<span>Si pasas de <b>' + cup(tope) + '</b> sin pagar, se pausan <b>solo tus viajes en efectivo</b>. Los de Transfermóvil siguen. Te avisamos 2 días antes.</span></div>'
				+ '<p class="pa-seccion">Cómo pagar (una vez por semana)</p><ol class="pa-pasos">'
				+ '<li><span class="n">1</span><div><b>Abre Transfermóvil</b><span>Pagos → Transferencia</span></div></li>'
				+ '<li><span class="n">2</span><div><b>Tarjeta de Pa\'llá</b><span class="p-num">9205 •••• •••• 0417 (ejemplo)</span></div></li>'
				+ '<li><span class="n">3</span><div><b>Monto: ' + cup(debe) + '</b><span>En la nota pon tu código: CH-0417</span></div></li></ol>'
				+ '<p class="p-peq" style="margin:0">Sin fondo, sin saldo y sin recargas. El SMS del banco basta: lo marcamos como pagado.</p>'
				+ '</div><div class="pa-pie"><a class="p-btn p-btn--marca p-btn--ancho" href="#ch-deuda" id="tm">' + ico('transfer') + 'Abrir Transfermóvil</a></div></div>';
		},
		init: function (r) { $('#tm', r).onclick = function (e) { e.preventDefault(); tostada('Abriría Transfermóvil (ejemplo)', 'transfer'); }; }
	};

	SCR['ch-perfil'] = {
		html: function () {
			var doc = function (i, b, s, ok) { return '<div class="pa-doc"><span class="mini">' + ico(i) + '</span><div><b>' + b + '</b><span>' + s + '</span></div>' + (ok ? '<span class="p-sello p-sello--bien">' + ico('check', 'p-ico--16') + 'Bien</span>' : '<span class="p-sello p-sello--aviso">Falta</span>') + '</div>'; };
			return '<div class="pa-llena">' + cabChofer('Mi perfil', 'ch-conectar') + '<div class="pa-cuerpo">'
				+ '<div style="display:flex;align-items:center;gap:14px"><span class="pa-cara" style="width:64px;height:64px;font-size:22px">YR</span><div><p class="p-h1" style="margin:0">Yoandri R.</p><p class="p-peq" style="margin:0">★ 4,9 · 212 viajes · desde oct. 2026</p></div></div>'
				+ '<div class="p-tarjeta p-tarjeta--plana" style="display:flex;align-items:center;gap:12px"><img src="' + veh('tric-electrico') + '" alt="" width="132" height="76"><div><b>Triciclo Eléctrico</b><div class="p-peq">Azul · 4 plazas · techo</div><div class="p-peq">Chasis LJ5…2214 (ejemplo)</div></div></div>'
				+ '<p class="pa-seccion">Papeles</p>'
				+ doc('carne', 'Carné de identidad', 'Revisado', true) + doc('selfie', 'Selfie con carné', 'Revisado', true) + doc('camara', 'Foto del vehículo', 'Revisada', true)
				+ doc('nota', 'LOT temporal', 'Vale hasta el 31-dic-2026', true) + doc('llave', 'Licencia A', 'Opcional en triciclo', false)
				+ '<p class="p-peq" style="margin:4px 0 0">El cliente ve tu nombre, tus estrellas, tu vehículo y, para pagarte, tu número de Transfermóvil. Antes de aceptar, nadie ve el teléfono de nadie.</p>'
				+ '<a class="p-btn p-btn--borde p-btn--ancho p-btn--chico" href="#ch-deuda">' + ico('moneda', 'p-ico--20') + 'Lo que debo a Pa\'llá</a></div></div>';
		}
	};

	// =====================================================================================
	// MOTOR: mostrar pantalla + mapa
	// =====================================================================================
	var actual = null;
	function limpiar() {
		timers.forEach(function (t) { if (t && t.off) { t.off(); } else { clearTimeout(t); clearInterval(t); } });
		timers = [];
		$$('.pa-tostada').forEach(function (t) { t.remove(); });
	}
	function mostrar(mismo) {
		var id = decodeURIComponent(location.hash.slice(1)) || 'carga';
		if (!SCR[id]) { id = 'inicio'; }
		limpiar();
		var s = SCR[id]; actual = id;
		pant.innerHTML = s.html();
		marco.classList.toggle('sin-mapa', !s.mapa || SIN_MAPA);
		marco.classList.toggle('sin-red', !!(s.mapa && s.mapa().offline));
		if (s.init) { s.init(pant); }
		$$('#menu a').forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + id); });
		var meta = (window.PPANTALLAS || []).filter(function (p) { return p.id === id; })[0];
		document.title = (meta ? meta.t + ' · ' : '') + 'Pa\'llá · prototipo';
		if (s.mapa && !SIN_MAPA) { ponerMapa(id, s.mapa(), mismo); }
		if (!mismo) { pant.scrollTop = 0; }
	}
	function ponerMapa(id, cfg, mismo) {
		if (cfg.offline) { return; }
		var tema = document.documentElement.dataset.tema;
		PMapa.iniciar(mapaEl, tema).then(function (m) {
			if (!m || actual !== id) { return; }
			PMapa.limpiar();
			var hoja = $('.pa-hoja', pant);
			var abajo = hoja ? hoja.offsetHeight : (cfg.abajo || 0);
			if (cfg.ruta) { PMapa.ruta(cfg.ruta, !(cfg.rutaQuieta || mismo)); }
			(cfg.pins || []).forEach(function (p) { PMapa.pin(p[0], p[1], p[2]); });
			(cfg.mover || []).forEach(function (v) { PMapa.mover(v[0], v[1], v[2], v[3], v[4]); });
			if (cfg.zoom) { m.jumpTo({ center: cfg.ver[0], zoom: cfg.zoom, padding: { top: 0, bottom: abajo, left: 0, right: 0 } }); }
			else if (cfg.ver) { PMapa.ver(cfg.ver, abajo, cfg.arriba); }
			if (cfg.listo) { cfg.listo(); }
		});
	}

	// Menú lateral (solo en el ordenador)
	var menu = $('#menu');
	if (menu && window.PPANTALLAS) {
		var h = '<div class="marca">Pa\'llá</div><p class="p-peq">Prototipo · datos de ejemplo</p>', g = '';
		PPANTALLAS.forEach(function (p) { if (p.g !== g) { g = p.g; h += '<h3>' + g + '</h3>'; } h += '<a href="#' + p.id + '">' + p.t + '</a>'; });
		menu.innerHTML = h + '<h3>Tema</h3><a href="?tema=claro' + location.hash + '">Claro</a><a href="?tema=oscuro' + location.hash + '">Oscuro</a>';
	}

	window.addEventListener('hashchange', function () { mostrar(); });
	mostrar();
	// Precarga suave del mapa cuando la primera pantalla ya se ve (regla de velocidad)
	if (!SIN_MAPA) { setTimeout(function () { PMapa.iniciar(mapaEl, document.documentElement.dataset.tema); }, 300); }
})();
