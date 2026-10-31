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

// Push notification listener with vibration and safe fallbacks
self.addEventListener('push', (event) => {
  let data = { title: 'Minty Messenger', body: 'New message received!' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data.body = event.data ? event.data.text() : 'New notification received!';
  }

  const options = {
    body: data.body || 'New message received!',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    // Vibrate pattern: vibrate 200ms, pause 100ms, vibrate 200ms
    vibrate: [200, 100, 200] 
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Minty Messenger', options)
  );
});
