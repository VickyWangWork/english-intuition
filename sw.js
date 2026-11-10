// English Intuition offline cache. Bump VERSION when any file changes.
const VERSION = "ei-2026-11-10-03";
const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest", "./pack.json", "./config.js", "./vendor/supabase.js", "./icon-180.png", "./icon-192.png", "./icon-512.png",
  "./fonts/charis-sil-latin-400-italic.woff2",  "./fonts/charis-sil-latin-400-normal.woff2",  "./fonts/charis-sil-latin-700-normal.woff2",  "./fonts/charis-sil-latin-ext-400-italic.woff2",  "./fonts/charis-sil-latin-ext-400-normal.woff2",  "./fonts/charis-sil-latin-ext-700-normal.woff2",  "./fonts/instrument-sans-latin-400-normal.woff2",  "./fonts/instrument-sans-latin-500-normal.woff2",  "./fonts/instrument-sans-latin-600-normal.woff2",
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return; // AI calls go straight to the network
  if (req.mode === "navigate") {
    // Try the network briefly so updates arrive; fall back to the saved copy when offline or slow.
    e.respondWith((async () => {
      const cached = await caches.match("./index.html");
      try {
        const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put("./index.html", cp)); } return r; });
        if (!cached) return await net;
        return await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error("slow")), 2500))]);
      } catch { return cached || Response.error(); }
    })());
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); }
    return r;
  })));
});
