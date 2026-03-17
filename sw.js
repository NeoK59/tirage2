/* Tirage au Sort — Service Worker tirage-v5 */
const CACHE = 'tirage-v5';
const FONTS = 'tirage-fonts-v1';
const APP_HTML = self.registration.scope;

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll([APP_HTML]).catch(() => {})
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if(u.hostname.includes('fonts.g')){
    e.respondWith(caches.open(FONTS).then(c =>
      c.match(e.request).then(r => r || fetch(e.request).then(nr => { c.put(e.request, nr.clone()); return nr; }))
    )); return;
  }
  if(u.hostname === 'api.qrserver.com'){
    e.respondWith(caches.open(CACHE).then(c =>
      fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; }).catch(() => c.match(e.request))
    )); return;
  }
  if(e.request.mode === 'navigate' || u.pathname === new URL(APP_HTML).pathname){
    e.respondWith(caches.open(CACHE).then(c =>
      c.match(e.request.url.split('?')[0]).then(cached => {
        const net = fetch(e.request).then(r => { if(r.ok) c.put(e.request.url.split('?')[0], r.clone()); return r; }).catch(() => cached);
        return cached || net;
      })
    )); return;
  }
});

self.addEventListener('message', e => { if(e.data === 'skipWaiting') self.skipWaiting(); });
