const CACHE_NAME = 'nabung-v1';
const ASSETS = [
  '/', '/index.html', '/style.css', '/app.js',
  '/icon-192.png', '/icon-512.png', '/manifest.json'
];

self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(()=>{}));
});
self.addEventListener('activate', e=>{
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', e=>{
  const req = e.request;
  e.respondWith(caches.match(req).then(r=> r || fetch(req).then(resp=>{
    // update cache for GET
    if (req.method === 'GET') {
      caches.open(CACHE_NAME).then(cache=>cache.put(req, resp.clone()));
    }
    return resp;
  }).catch(()=> caches.match('/index.html'))));
});
