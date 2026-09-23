/* Cache only this app's static shell. Never cache the shared register API. */
const CACHE='swap-meet-shell-v6';
const FILES=['./','./index.html','./styles.css?v=6','./sync.js?v=6','./app.js?v=6','./manifest.webmanifest','./icons/icon.svg','./icons/apple-touch-icon.png','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('swap-meet-shell-')&&key!==CACHE).map(key=>caches.delete(key)))));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok&&response.type==='basic'){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
    return response;
  }).catch(()=>caches.match(event.request).then(cached=>cached||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
