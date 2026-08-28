const CACHE = "nexo-brand-v2";
const BRAND = [
  "/brand/nexo-logo.png",
  "/brand/nexo-symbol.png",
  "/brand/nexo-icon-192.png",
  "/brand/nexo-icon-512.png",
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(BRAND)));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  if (new URL(event.request.url).pathname.startsWith("/brand/"))
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
