// Billete Seguro: guarda la app en el teléfono para que la guía funcione sin internet.
// Al cambiar cualquier archivo, sube VERSION para que los teléfonos bajen la nueva.
const VERSION = "bs-3";
const APP = ["./", "index.html", "styles.css", "app.js", "billetes.js", "logo-casa-viva.svg", "icon.svg", "manifest.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return; // la IA (POST) siempre va a la red
  const u = new URL(req.url);
  const propio = u.origin === location.origin;
  const fuentes = u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com";
  if (!propio && !fuentes) return;
  // Primero la red (para tener lo último); sin internet, lo guardado.
  e.respondWith(
    fetch(req).then(res => {
      if ((res.status === 200 && !u.pathname.endsWith(".mp4")) || res.type === "opaque") { const copia = res.clone(); caches.open(VERSION).then(c => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html")))
  );
});
