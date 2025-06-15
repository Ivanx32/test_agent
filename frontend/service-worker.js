const CACHE_NAME = 'cat-detector-cache-v4';
// Cache assets relative to the service worker scope so it works when the
// application is served from a subfolder (e.g. GitHub Pages).
const ASSETS = [
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './squeezenet1_1.onnx'
];
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
