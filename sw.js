// sw.js - network-first cache + Web Push with sound/vibration
const CACHE = 'meowmeow-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Only cache our own files. Leave Firebase, TURN, Cloudinary etc. alone.
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});

self.addEventListener('push', (event) => {
  // Firebase Cloud Messaging wraps the payload: { notification: {...}, data: {...}, fcmOptions: {...} }
  // A plain Web Push payload is flat: { title, body }. Handle both.
  let payload = {};
  try {
    if (event.data) payload = event.data.json();
  } catch (e) {
    payload = { body: event.data ? event.data.text() : '' };
  }
  const n = payload.notification || {};
  const d = payload.data || {};

  const title = n.title || d.title || payload.title || "Mintlow's Messenger";
  const body = n.body || d.body || payload.body || 'New message received!';
  // Page's foreground notifications use tag = title, so match that to avoid duplicates
  const tag = n.tag || d.tag || payload.tag || title;
  const url = d.url || (payload.fcmOptions && payload.fcmOptions.link) || n.click_action || self.registration.scope;

  // Resolve paths against the SW scope so it works on GitHub Pages sub-paths (/repo/)
  const icon = n.icon || d.icon || new URL('icon-192.png', self.registration.scope).href;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: new URL('icon-192.png', self.registration.scope).href,
      vibrate: [200, 100, 200, 100, 200],
      tag,                // same tag = replaces older one...
      renotify: true,     // ...but still buzzes/sounds again
      data: { url }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || self.registration.scope;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
