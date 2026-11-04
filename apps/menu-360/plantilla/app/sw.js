// Guarda la app en el móvil: la segunda vez abre al instante, aunque la conexión sea mala.
// Al cambiar precios o archivos, sube VERSION para que los móviles bajen lo nuevo.
var VERSION = "{{SLUG}}-{{VERSION}}";
var BASE = [
  "./", "index.html", "styles.css", "app.js", "menu.js", "manifest.webmanifest",
  "fonts/anton.woff2", "fonts/inter.woff2", "img/logo.webp",
  {{SW_ESTUDIO}}
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // la página para el dueño (video y descargas) va siempre directa a la red
  if (new URL(req.url).pathname.indexOf("/propuesta/") !== -1) return;
  var esTexto = req.mode === "navigate" || /\.(html|js|css)$/.test(new URL(req.url).pathname);
  if (esTexto) {
    // primero la red (para ver precios nuevos); si no hay red, lo guardado
    e.respondWith(fetch(req).then(function (r) {
      var copia = r.clone();
      caches.open(VERSION).then(function (c) { c.put(req, copia); });
      return r;
    }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match("index.html"); }); }));
  } else {
    // fotos, giros y letras: lo guardado primero (ahorra datos)
    e.respondWith(caches.match(req).then(function (g) {
      return g || fetch(req).then(function (r) {
        var copia = r.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copia); });
        return r;
      });
    }));
  }
});
