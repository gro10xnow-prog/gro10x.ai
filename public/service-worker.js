// 📱 GRO10X PWA SERVICE WORKER v4.0 (Network-First with offline fallback)
const CACHE_NAME = 'gro10x-cache-v4';
const CREW_CACHE = 'gro10x-crew-v4';

const ASSETS_TO_CACHE = [
  '/',
  '/admin',
  '/app',
  '/app/',
  '/dbm',
  '/dbm/',
  '/dbm/dbm-portal.js',
  '/dbm/api.js',
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
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== CREW_CACHE) {
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

  // Network-first strategy for app and modules to prevent stale UI caching
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
