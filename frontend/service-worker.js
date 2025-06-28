const CACHE_NAME = 'cat-detector-v7';
// Cache assets relative to the service worker scope so it works when the
// application is served from a subfolder (e.g. GitHub Pages).
const ASSETS = [
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './squeezenet1_1.onnx',
  './offline.html'
];
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  clients.claim();
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(resp => {
      return resp || fetch(e.request).catch(() => caches.match('./offline.html'));
    })
  );
});
