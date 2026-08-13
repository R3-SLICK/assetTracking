/* Caches the app on first visit so every tap after that works with no signal. */

const CACHE = 'gear-cage-v1';
const SHELL = ['./', './index.html'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Ignore the ?id= on the tag URL — every tag serves the same page.
  const url = new URL(event.request.url);
  const shellRequest = url.origin === location.origin ? new Request(url.pathname) : event.request;

  event.respondWith(
    caches.match(shellRequest).then(hit => hit || fetch(event.request).then(res => {
      if (res.ok && url.origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(shellRequest, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
