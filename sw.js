// 🧭 خط اليوم — offline cache (the page itself; data lives in localStorage + Apps Script)
const C = 'jena-line-v1';
const FILES = ['./', './index.html', './manifest.json', 'https://telegram.org/js/telegram-web-app.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => Promise.all(FILES.map(f => c.add(new Request(f, { mode: f.startsWith('http') ? 'no-cors' : 'same-origin' })).catch(() => null))))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.hostname.endsWith('script.google.com') || u.hostname.endsWith('googleusercontent.com')) return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(u.origin === location.origin ? new Request(u.pathname) : e.request, cp)).catch(() => {}); return r; })
    .catch(() => caches.match(u.origin === location.origin ? new Request(u.pathname) : e.request).then(r => r || caches.match('./index.html'))));
});
