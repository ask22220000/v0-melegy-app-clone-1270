// Melegy PWA Service Worker — Network-First, auto-update on every deploy
// Cache name includes a build timestamp so every new deploy = new cache = instant update
const CACHE_VERSION = '__MELEGY_BUILD_' + (self.__BUILD_ID || Date.now()) + '__';
const CACHE_NAME = 'melegy-v' + CACHE_VERSION;

// Routes that must NEVER be served from cache
const NETWORK_ONLY_PATTERNS = [
  /^\/api\//,
  /^\/auth\//,
];

// Only cache these truly static assets (images/icons/fonts — they don't change with code)
const IMMUTABLE_PATTERNS = [
  /\/images\//,
  /\/icons\//,
  /\/fonts\//,
];

// ── Message: client can trigger skipWaiting directly ──────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Install: activate immediately, skip waiting ────────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting(); // activate new SW immediately on every deploy
});

// ── Activate: delete ALL old caches, claim all clients ────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all([
        self.clients.claim(),
        ...keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ])
    ).then(() => {
      // Tell all open tabs to reload so they get the latest code
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED' });
        });
      });
    })
  );
});

// ── Fetch handler ──────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (url.origin !== self.location.origin) return;
  if (request.method !== 'GET') return;

  // API / auth: always network, never cache
  const isNetworkOnly = NETWORK_ONLY_PATTERNS.some((p) => p.test(url.pathname));
  if (isNetworkOnly) {
    event.respondWith(fetch(request));
    return;
  }

  // Immutable assets (images/icons/fonts): Cache-First — these never change
  const isImmutable = IMMUTABLE_PATTERNS.some((p) => p.test(url.pathname));
  if (isImmutable) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else (HTML pages, JS, CSS): Network-First — always get fresh code
  // Falls back to cache only if offline
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Update cache with latest version in background
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        // Offline fallback: serve from cache if available
        caches.match(request).then((cached) => cached || caches.match('/').then((r) => r || Response.error()))
      )
  );
});
