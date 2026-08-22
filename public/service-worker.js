// 📱 PURPLEOS PWA SERVICE WORKER (Module C9 & Crew Offline-First)
const CACHE_NAME = 'purpleos-cache-v2';
const CREW_CACHE = 'purpleos-crew-v1';

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

const CREW_ASSETS_TO_CACHE = [
  '/crew',
  '/crew/',
  '/crew/index.html',
  '/crew/api.js',
  '/crew/crew.js',
  '/crew/sse.js',
  '/crew/modules/home.js',
  '/crew/modules/tasks.js',
  '/crew/modules/earnings.js',
  '/crew/modules/leaves.js',
  '/crew/modules/eod.js',
  '/crew/modules/expenses.js',
  '/crew/modules/deliverables.js',
  '/crew/modules/calendar.js',
  '/crew/modules/tickets.js',
  '/crew/modules/leaderboard.js',
  '/crew/modules/profile.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE).catch(() => {})),
      caches.open(CREW_CACHE).then((cache) => cache.addAll(CREW_ASSETS_TO_CACHE).catch(() => {}))
    ]).then(() => self.skipWaiting())
  );
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

  const url = new URL(event.request.url);

  // Crew App routes: Stale-While-Revalidate / Cache-First strategy
  if (url.pathname.startsWith('/crew')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CREW_CACHE).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return networkResponse;
        }).catch(() => null);

        return cachedResponse || fetchPromise || caches.match('/crew/index.html') || caches.match('/crew');
      })
    );
    return;
  }

  // Other routes
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
