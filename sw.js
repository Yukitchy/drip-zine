// Offline shell. Network-first (so updates land on the next load), cache fallback when offline.
const V = 'dz-v2';
const SHELL = ['./', './index.html', './style.css', './app.js', './brew.js', './data.js', './manifest.webmanifest', './icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(e.request, cp)); return res; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
