const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const root=require('path').join(__dirname,'../stad/');
const manifest=JSON.parse(fs.readFileSync(root+'manifest.webmanifest'));
assert.equal(manifest.scope,'/stad/');assert.equal(manifest.start_url,'/stad/');assert.equal(manifest.display,'standalone');
for(const icon of manifest.icons){const b=fs.readFileSync(root+icon.src);assert.equal(`${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`,icon.sizes);}
const handlers={};let cached=[],network=0,offline=false;
const context={URL,self:{location:{origin:'https://example.test'},registration:{scope:'https://example.test/stad/'},clients:{claim:async()=>{}},skipWaiting(){},addEventListener:(n,cb)=>handlers[n]=cb},caches:{open:async()=>({addAll:async paths=>cached=paths}),keys:async()=>[],match:async()=>({offline:true})},fetch:async()=>{network++;if(offline)throw Error('offline');return {online:true}}};
vm.runInNewContext(fs.readFileSync(root+'sw.js','utf8'),context);
(async()=>{let pending;handlers.install({waitUntil:p=>pending=p});await pending;
assert(cached.every(p=>p==='offline.html'||p.startsWith('icons/')));
function request(url,mode='cors',method='GET'){let response;handlers.fetch({request:{url,mode,method},respondWith:p=>response=p});return response;}
assert.equal(request('https://firestore.googleapis.com/private'),undefined);
assert.equal(request('https://example.test/stad/firebase-config.json'),undefined);
assert.equal(request('https://example.test/stad/','navigate','POST'),undefined);
assert.equal((await request('https://example.test/stad/','navigate')).online,true);
offline=true;assert.equal((await request('https://example.test/stad/','navigate')).offline,true);
assert(fs.readFileSync(root+'portal.js','utf8').includes('setPersistence(auth,browserLocalPersistence)'));
console.log('PASS: manifest, icon dimensions, persistent auth selection, public-only cache, offline fallback, Firebase and write requests untouched');})();

