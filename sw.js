// Minimal service worker: network first, falls back to cache if offline.
const CACHE = 'meowmeow-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Added: Listen for push notification events
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'MeowMeow', body: 'New notification received!' };

  const options = {
    body: data.body,
    icon: 'icon-192.png',
    badge: 'icon-192.png'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
