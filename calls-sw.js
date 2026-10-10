var C='jc-calls-v1';
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.add('calls.html');}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',function(e){
  var u=new URL(e.request.url);
  if(u.pathname.slice(-10)!=='calls.html')return;
  e.respondWith(fetch(e.request).then(function(r){var cp=r.clone();caches.open(C).then(function(c){c.put('calls.html',cp);});return r;}).catch(function(){return caches.match('calls.html');}));
});
