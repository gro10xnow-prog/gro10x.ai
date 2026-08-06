// 📱 PURPLEOS PWA SERVICE WORKER (Module C9)
const CACHE_NAME = 'purpleos-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/admin',
  '/team',
  '/partners',
  '/css/tokens.css',
  '/css/components.css',
  '/css/shell.css',
  '/css/styles.css',
  '/css/landing.css',
  '/css/pwa.css',
  '/js/shell.js',
  '/js/components.js',
  '/js/formatters.js',
  '/js/landing.js',
  '/js/partners.js',
  '/js/team.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      });
    }).catch(() => {
      return caches.match('/');
    })
  );
});
