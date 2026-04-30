// Service Worker — Regras de Jogo Handebol Indoor
// SDInformática — Profª Synthia Duarte

const CACHE_NAME = 'handball-arbitro-v8';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Firebase CDN — necessário para validação do código de acesso
const FIREBASE_CDN = [
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cachear assets locais
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Cacheando assets locais');
        return cache.addAll(ASSETS);
      }),
      // Cachear Firebase CDN
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Cacheando Firebase CDN');
        return Promise.allSettled(
          FIREBASE_CDN.map(url =>
            fetch(url).then(r => { if(r.ok) cache.put(url, r); })
          )
        );
      })
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cachear respostas válidas (locais E CDN externo)
        if (response && response.status === 200 &&
           (response.type === 'basic' || response.type === 'cors')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
