// Service worker: network-first para el HTML (datos frescos), cache-first para librerías CDN.
const CACHE = "finanzas-v1";

self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = e.request.url;
  if (e.request.method !== "GET") return;
  if (url.includes("cdnjs.cloudflare.com")) {
    // librerías versionadas: cache-first
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const cp = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
        return res;
      }))
    );
  } else {
    // HTML y datos: network-first con fallback a caché (offline)
    e.respondWith(
      fetch(e.request).then(res => {
        const cp = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
        return res;
      }).catch(() => caches.match(e.request))
    );
  }
});
