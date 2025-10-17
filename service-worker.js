const CACHE_NAME = 'nabung-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k=> k !== CACHE_NAME).map(k=> caches.delete(k))
    )).then(()=> self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // network-first for app shell updates, fallback to cache
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then(resp => {
      // update cache in background
      const clone = resp.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      return resp;
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});
