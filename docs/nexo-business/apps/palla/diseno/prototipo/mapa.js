/* Pa'llá · mapa propio del prototipo. Mismo mapa de Cuba del VPS (Protomaps + MapLibre 4.7.1 + pmtiles 4.3.0) con un
 * estilo minimalista nuevo (claro y oscuro). Regla de velocidad: la pantalla nunca espera al mapa. Si no carga, se queda
 * el fondo suave y todo sigue funcionando.
 * PMapa.iniciar(el, tema) → Promise<map|null> · PMapa.ruta(coords, animar) · PMapa.pin(tipo, p, etiqueta)
 * PMapa.vehiculo(id, img, p, rumbo) · PMapa.mover(id, coords, ms, vuelta) · PMapa.ver(pts, abajo) · PMapa.limpiar()
 * PMapa.calle([lon,lat]) → Promise<nombre> · p = [lon, lat] (como MapLibre). */
(function () {
	'use strict';
	var GL = 'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/';
	var PMT = 'https://cdn.jsdelivr.net/npm/pmtiles@4.3.0/dist/pmtiles.js';
	var SRV = 'https://179-236-242-212.sslip.io';
	var TILES = SRV + '/mapa/cuba-20261031.pmtiles';
	var RUTA = SRV + '/route/v1/driving/';
	var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
	var map = null, gl = null, tema = 'claro', marcas = {}, anims = {}, rutaAnim = null, listo = null;

	var C = {
		claro: { tierra: '#F3F2EE', verde: '#E3EBDD', agua: '#CFE0E8', casas: '#E8E6E0', calle: '#FFFFFF', borde: '#E3E1DA', grande: '#FFFFFF', bordeG: '#D8D5CB', texto: '#8E8C85', halo: '#F3F2EE', barrio: '#A3A199', ruta: '#0E0E0E', rutaB: '#FFFFFF' },
		oscuro: { tierra: '#141518', verde: '#16201A', agua: '#0C1A22', casas: '#1B1C20', calle: '#24262B', borde: '#1A1B1F', grande: '#2D2F35', bordeG: '#1A1B1F', texto: '#6E7076', halo: '#141518', barrio: '#5D5F65', ruta: '#FFC21A', rutaB: '#0F0F10' }
	};

	function tag(kind, attrs) {
		return new Promise(function (ok, fail) {
			var n = document.createElement(kind);
			Object.keys(attrs).forEach(function (k) { n[k] = attrs[k]; });
			n.onload = ok; n.onerror = function () { fail(new Error('mapa')); };
			document.head.appendChild(n);
		});
	}

	function estilo() {
		var c = C[tema];
		var nombre = ['coalesce', ['get', 'name:es'], ['get', 'name']];
		var via = function (k) { return ['all', ['==', ['get', 'kind'], k], ['!', ['boolean', ['get', 'is_tunnel'], false]]]; };
		var ancho = function (s) { return ['interpolate', ['exponential', 1.6], ['zoom']].concat(s); };
		// Calles finas: menos ancho que un mapa normal, sin colores de carretera.
		var vias = [
			['minor_road', 13, c.calle, c.borde, [13, 0.3, 15, 2, 16, 4.5, 18, 16]],
			['medium_road', 11, c.calle, c.borde, [11, 0.4, 13, 1.2, 15, 3.2, 16, 6, 18, 20]],
			['major_road', 9, c.grande, c.bordeG, [9, 0.4, 12, 1.4, 15, 4.5, 16, 8, 18, 24]],
			['highway', 6, c.grande, c.bordeG, [6, 0.4, 10, 1.2, 15, 5.5, 16, 10, 18, 28]]
		];
		var capas = [
			{ id: 'fondo', type: 'background', paint: { 'background-color': c.tierra } },
			{ id: 'tierra', type: 'fill', source: 'cuba', 'source-layer': 'earth', paint: { 'fill-color': c.tierra } },
			{ id: 'verde', type: 'fill', source: 'cuba', 'source-layer': 'landuse', filter: ['in', ['get', 'kind'], ['literal', ['park', 'garden', 'grass', 'wood', 'forest', 'cemetery', 'recreation_ground', 'pitch', 'golf_course', 'zoo']]], paint: { 'fill-color': c.verde } },
			{ id: 'agua', type: 'fill', source: 'cuba', 'source-layer': 'water', filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]], paint: { 'fill-color': c.agua } },
			{ id: 'casas', type: 'fill', source: 'cuba', 'source-layer': 'buildings', minzoom: 15, paint: { 'fill-color': c.casas, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 15, 0, 16, 1] } }
		];
		vias.forEach(function (r) { capas.push({ id: 'b-' + r[0], type: 'line', source: 'cuba', 'source-layer': 'roads', minzoom: r[1], filter: via(r[0]), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': r[3], 'line-gap-width': ancho(r[4]), 'line-width': 1 } }); });
		vias.forEach(function (r) { capas.push({ id: 'c-' + r[0], type: 'line', source: 'cuba', 'source-layer': 'roads', minzoom: r[1], filter: via(r[0]), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': r[2], 'line-width': ancho(r[4]) } }); });
		capas.push(
			{ id: 'ruta-borde', type: 'line', source: 'ruta', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.rutaB, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 6, 16, 10] } },
			{ id: 'ruta', type: 'line', source: 'ruta', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.ruta, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 3, 16, 5.5] } },
			{ id: 'calles', type: 'symbol', source: 'cuba', 'source-layer': 'roads', minzoom: 15, filter: ['all', ['has', 'name'], ['in', ['get', 'kind'], ['literal', ['minor_road', 'medium_road', 'major_road', 'highway']]]], layout: { 'symbol-placement': 'line', 'text-field': nombre, 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 15, 10, 17, 12] }, paint: { 'text-color': c.texto, 'text-halo-color': c.halo, 'text-halo-width': 1.4 } },
			{ id: 'barrios', type: 'symbol', source: 'cuba', 'source-layer': 'places', minzoom: 12, maxzoom: 16.5, filter: ['in', ['get', 'kind'], ['literal', ['neighbourhood', 'macrohood']]], layout: { 'text-field': nombre, 'text-font': ['Noto Sans Medium'], 'text-size': 11, 'text-transform': 'uppercase', 'text-letter-spacing': 0.12, 'text-max-width': 8 }, paint: { 'text-color': c.barrio, 'text-halo-color': c.halo, 'text-halo-width': 1.2 } }
		);
		return {
			version: 8, glyphs: SRV + '/mapa/fonts/{fontstack}/{range}.pbf',
			sources: { cuba: { type: 'vector', url: 'pmtiles://' + TILES, attribution: '© OpenStreetMap' }, ruta: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } },
			layers: capas
		};
	}

	function iniciar(el, t) {
		tema = t === 'oscuro' ? 'oscuro' : 'claro';
		if (listo) { return listo; }
		listo = Promise.all([
			tag('link', { rel: 'stylesheet', href: GL + 'maplibre-gl.min.css' }),
			window.maplibregl ? 0 : tag('script', { src: GL + 'maplibre-gl.min.js' }),
			window.pmtiles ? 0 : tag('script', { src: PMT })
		]).then(function () {
			gl = window.maplibregl;
			gl.addProtocol('pmtiles', new window.pmtiles.Protocol().tile);
			map = new gl.Map({ container: el, style: estilo(), center: [-82.3812, 23.1402], zoom: 15, minZoom: 9, maxZoom: 18, maxBounds: [[-83.2, 22.6], [-81.6, 23.4]], attributionControl: false, dragRotate: false, pitchWithRotate: false, pixelRatio: Math.min(window.devicePixelRatio || 1, 2), fadeDuration: 150 });
			map.touchZoomRotate.disableRotation();
			map.addControl(new gl.AttributionControl({ compact: true }), 'bottom-left');
			return new Promise(function (ok) {
				var hecho = false; var fin = function () { if (!hecho) { hecho = true; el.classList.add('is-listo'); ok(map); } };
				map.once('load', fin); setTimeout(fin, 6000);
			});
		}).catch(function () { return null; });
		return listo;
	}

	// ---- Ruta: se dibuja de origen a destino (≈ 600 ms) ----
	function ponerRuta(coords) {
		var s = map && map.getSource('ruta'); if (!s) { return; }
		s.setData({ type: 'FeatureCollection', features: coords && coords.length > 1 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }] : [] });
	}
	function ruta(coords, animar) {
		if (!map) { return; }
		if (rutaAnim) { cancelAnimationFrame(rutaAnim); rutaAnim = null; }
		if (!coords || animar === false || quieto) { ponerRuta(coords); return; }
		var largo = medir(coords), t0 = performance.now(), ms = 600;
		var paso = function (t) {
			var k = Math.min(1, (t - t0) / ms); k = 1 - Math.pow(1 - k, 3);
			ponerRuta(cortar(coords, largo, k));
			if (k < 1) { rutaAnim = requestAnimationFrame(paso); } else { rutaAnim = null; }
		};
		rutaAnim = requestAnimationFrame(paso);
	}

	// ---- Distancias y rumbo ----
	function dist(a, b) { var x = (b[0] - a[0]) * Math.cos((a[1] + b[1]) * Math.PI / 360), y = b[1] - a[1]; return Math.sqrt(x * x + y * y) * 111320; }
	function medir(c) { var acc = [0]; for (var i = 1; i < c.length; i++) { acc.push(acc[i - 1] + dist(c[i - 1], c[i])); } c._acc = acc; return acc[acc.length - 1]; }
	function rumbo(a, b) { var x = (b[0] - a[0]) * Math.cos(a[1] * Math.PI / 180), y = b[1] - a[1]; return (Math.atan2(x, y) * 180 / Math.PI + 360) % 360; }
	function punto(c, d) {
		var acc = c._acc || (medir(c), c._acc);
		for (var i = 1; i < c.length; i++) {
			if (acc[i] >= d) { var f = (d - acc[i - 1]) / ((acc[i] - acc[i - 1]) || 1); return { p: [c[i - 1][0] + (c[i][0] - c[i - 1][0]) * f, c[i - 1][1] + (c[i][1] - c[i - 1][1]) * f], r: rumbo(c[i - 1], c[i]), i: i }; }
		}
		var n = c.length; return { p: c[n - 1], r: rumbo(c[n - 2], c[n - 1]), i: n - 1 };
	}
	function cortar(c, largo, k) { var q = punto(c, largo * k); return c.slice(0, q.i).concat([q.p]); }
	function suave(a, b, f) { var d = ((b - a + 540) % 360) - 180; return (a + d * f + 360) % 360; }

	// ---- Marcas ----
	function marca(id, html, p, ancla, rot) {
		if (!map) { return null; }
		var m = marcas[id];
		if (!m) {
			var el = document.createElement('div'); el.className = 'pm-marca pm-' + id.split(':')[0]; el.innerHTML = html;
			m = marcas[id] = new gl.Marker({ element: el, anchor: ancla || 'center', rotationAlignment: rot ? 'map' : 'viewport' }).setLngLat(p).addTo(map);
		} else { m.setLngLat(p); }
		return m;
	}
	function pin(tipo, p, etiqueta) {
		var html = '<span class="pm-pin pm-pin--' + tipo + '"></span>' + (etiqueta ? '<span class="pm-etq">' + etiqueta + '</span>' : '');
		var id = 'pin:' + tipo;
		if (marcas[id]) { marcas[id].remove(); delete marcas[id]; }
		if (p) { marca(id, html, p, 'center'); }
	}
	function vehiculo(id, img, p, r) {
		var m = marca('veh:' + id, '<img src="' + img + '" alt="" width="20" height="40">', p, 'center', true);
		if (m) { m.setRotation(r || 0); m._r = r || 0; }
		return m;
	}
	// Mueve un vehículo por la calle, suave y girando con ella. ms = lo que tarda todo el camino.
	function mover(id, img, coords, ms, vuelta) {
		if (!map || !coords || coords.length < 2) { return; }
		var largo = medir(coords), m = vehiculo(id, img, coords[0], rumbo(coords[0], coords[1])), t0 = performance.now();
		if (anims[id]) { cancelAnimationFrame(anims[id]); }
		if (quieto) { var q = punto(coords, largo * 0.35); m.setLngLat(q.p); m.setRotation(q.r); return; }
		var paso = function (t) {
			var k = (t - t0) / ms;
			if (k >= 1) { if (vuelta) { t0 = t; k = 0; } else { k = 1; } }
			var q = punto(coords, largo * k);
			m.setLngLat(q.p); m._r = suave(m._r, q.r, 0.12); m.setRotation(m._r);
			if (k < 1 || vuelta) { anims[id] = requestAnimationFrame(paso); }
		};
		anims[id] = requestAnimationFrame(paso);
	}
	function limpiar() {
		Object.keys(anims).forEach(function (k) { cancelAnimationFrame(anims[k]); }); anims = {};
		Object.keys(marcas).forEach(function (k) { marcas[k].remove(); }); marcas = {};
		ruta(null);
	}
	function ver(pts, abajo, arriba) {
		if (!map || !pts || !pts.length) { return; }
		var pad = { top: (arriba || 90), bottom: (abajo || 0) + 30, left: 40, right: 40 };
		if (pts.length === 1) { map.easeTo({ center: pts[0], zoom: 16, padding: pad, duration: quieto ? 0 : 400 }); return; }
		var b = new gl.LngLatBounds(pts[0], pts[0]); pts.forEach(function (p) { b.extend(p); });
		map.fitBounds(b, { padding: pad, maxZoom: 16.2, duration: quieto ? 0 : 450 });
	}
	// Nombre de la calle más cercana (con nuestro motor de rutas): para «Fijar en el mapa».
	function calle(p) {
		var u = RUTA + p[0] + ',' + p[1] + ';' + p[0] + ',' + p[1] + '?overview=false';
		return fetch(u, { credentials: 'omit' }).then(function (r) { return r.json(); }).then(function (d) { return (d.waypoints && d.waypoints[0] && d.waypoints[0].name) || ''; }).catch(function () { return ''; });
	}
	// Ruta en vivo por calles (si falla, la que ya traemos guardada).
	function pedirRuta(a, b) {
		return fetch(RUTA + a[0] + ',' + a[1] + ';' + b[0] + ',' + b[1] + '?overview=full&geometries=geojson', { credentials: 'omit' })
			.then(function (r) { return r.json(); }).then(function (d) { return d.routes[0].geometry.coordinates; });
	}

	window.PMapa = { iniciar: iniciar, ruta: ruta, pin: pin, vehiculo: vehiculo, mover: mover, limpiar: limpiar, ver: ver, calle: calle, pedirRuta: pedirRuta, mapa: function () { return map; } };
})();
