const APP_VERSION = '<<PROJECT_VERSION>>';
const CACHE_NAME = '<<PROJECT_NAME>>-' + APP_VERSION;
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-72.svg',
  '/icons/icon-96.svg',
  '/icons/icon-128.svg',
  '/icons/icon-144.svg',
  '/icons/icon-152.svg',
  '/icons/icon-192.svg',
  '/icons/icon-384.svg',
  '/icons/icon-512.svg',
  '/icons/maskable-192.svg',
  '/icons/maskable-512.svg',
  '/icons/badge-96.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => undefined);
          return response;
        })
        .catch(async () => (await caches.match(request)) || Response.error()),
    );
    return;
  }

  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => undefined);
          return response;
        });
      }),
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : { title: '<<PROJECT_TITLE>>', body: 'You have a new notification.' };
  const title = payload.title || '<<PROJECT_TITLE>>';
  const options = {
    body: payload.body || 'You have a new notification.',
    icon: '/icons/icon-192.svg',
    badge: '/icons/badge-96.svg',
    data: {
      url: payload.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  const targetUrl = event.notification.data?.url || '/';
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate?.(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});
