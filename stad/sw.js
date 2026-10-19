// Cache only public installation assets. Never cache bookings, notes, auth, or Firebase requests.
const CACHE='stad-public-v1';
const PUBLIC=['offline.html','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PUBLIC)));self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('stad-public-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match(new URL('offline.html',self.registration.scope))));return;}
 if(PUBLIC.some(path=>url.href===new URL(path,self.registration.scope).href))event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
