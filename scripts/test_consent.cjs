const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const root=process.argv[2]||require('path').resolve(__dirname,'..');
const code=fs.readFileSync(require('path').join(root,'analytics-consent.js'),'utf8'),KEY='lakehouse-consent-v1',ID='G-MN82629B7R';
function page({saved,lang='sv',path='/sv/',storageFails=false}={}){
 const writes=[],scripts=[],listeners={},winListeners={},elements=[],store=new Map(saved?[[KEY,saved]]:[]);
 class Element{constructor(tag){this.tagName=tag.toUpperCase();this.dataset={};this.hidden=false;this.classList={contains:()=>false};elements.push(this);}setAttribute(){}append(...x){}prepend(){}focus(){}scrollIntoView(){}getBoundingClientRect(){return {bottom:this.hidden?0:100}}querySelector(){return new Element('button')}closest(sel){return sel==='button,a'?this:null}hasAttribute(a){return a==='data-cookie-settings'&&this.settings}addEventListener(){} }
 const doc={readyState:'complete',documentElement:{lang,style:{setProperty(){}}},body:new Element('body'),head:{appendChild:x=>scripts.push(x.src)},activeElement:null,referrer:'https://www.google.com/search?q=private',createElement:t=>new Element(t),querySelector:()=>new Element('footer'),querySelectorAll:()=>[],addEventListener:(n,f)=>listeners[n]=f};
 Object.defineProperty(doc,'cookie',{get:()=> '_ga=existing; _ga_MN82629B7R=test; other=keep',set:v=>writes.push(v)});
 const window={addEventListener:(n,f)=>winListeners[n]=f};
 const ctx={window,document:doc,location:{pathname:path,origin:'https://lakehousedalarna.com',hostname:'lakehousedalarna.com',href:'https://lakehousedalarna.com'+path,search:'?email=secret%40example.com&utm_source=instagram&utm_medium=social'},localStorage:{getItem:k=>{if(storageFails)throw Error();return store.get(k)},setItem:(k,v)=>{if(storageFails)throw Error();store.set(k,v)}},URL,URLSearchParams,Date,ResizeObserver:class{observe(){}}};
 vm.runInNewContext(code,ctx);
 const click=(choice,url)=>{const e=new Element(url?'a':'button');if(url)e.href=url;else e.dataset.choice=choice;listeners.click({target:e});};
 return {window,doc,writes,scripts,store,click,winListeners,elements};
}
let p=page();assert.equal(p.scripts.length,0);assert(p.writes.every(x=>x.includes('Max-Age=0')));
p.click('declined');assert.equal(p.scripts.length,0);assert.equal(JSON.parse(p.store.get(KEY)).choice,'declined');
p=page({saved:p.store.get(KEY),lang:'de',path:'/de/'});assert.equal(p.scripts.length,0);assert(p.elements.some(e=>e.innerHTML?.includes('Ablehnen')));
p.click('accepted');assert.equal(p.scripts.length,1);assert.equal(p.window['ga-disable-'+ID],false);
let config=p.window.dataLayer.find(x=>x[0]==='config')[2];assert(!config.page_location.includes('?'));assert(!config.page_referrer.includes('private'));assert.equal(config.campaign_source,'instagram');assert.equal(config.cookie_update,false);
for(const [url,event] of [['/de/buchen/','booking_click'],['https://airbnb.com/h/solsidan-dalarna','airbnb_click'],['https://airbnb.se/rooms/123','airbnb_click'],['https://wa.me/123?text=private','click_whatsapp'],['mailto:private@example.com?body=secret','contact_click']]){p.click(null,new URL(url,'https://lakehousedalarna.com').href);assert.equal(p.window.dataLayer.at(-1)[1],event);assert(!JSON.stringify(p.window.dataLayer.at(-1)).includes('private'));}
p.click('accepted');assert.equal(p.scripts.length,1);
p.click('declined');assert.equal(p.window['ga-disable-'+ID],true);let count=p.window.dataLayer.length;p.click(null,'https://airbnb.com/h/example');assert.equal(p.window.dataLayer.length,count);
assert(p.writes.every(x=>!x.startsWith('other=')));
p=page({saved:JSON.stringify({version:1,choice:'accepted',time:Date.now()-181*86400000})});assert.equal(p.scripts.length,0);
p=page({saved:JSON.stringify({version:1,choice:'accepted',time:Date.now()})});assert.equal(p.scripts.length,1);assert.equal(p.window.dataLayer[0][1],'default');assert.equal(p.window.dataLayer[0][2].analytics_storage,'denied');assert.equal(p.window.dataLayer[1][2].ad_storage,'denied');
p=page({saved:'invalid'});assert.equal(p.scripts.length,0);
p=page({storageFails:true});assert.equal(p.scripts.length,0);p.click('accepted');assert.equal(p.scripts.length,1);
p=page({path:'/'});assert.equal(p.scripts.length,0);
console.log('PASS: default/decline blocking, persistence, expiry, invalid storage, consent order, single tag, all click events, no contact/query data, revocation, language, redirect exclusion. Uses simulated DOM; live Google receipt tested separately.');

p=page();let before=p.window.dataLayer.length;
p.winListeners['lakehouse-booking-start']();p.winListeners['lakehouse-booking-submit']();
assert.equal(p.window.dataLayer.length,before);
p.click('accepted');
p.winListeners['lakehouse-booking-start']();assert.equal(p.window.dataLayer.at(-1)[1],'start_booking_request');
p.winListeners['lakehouse-booking-submit']();assert.equal(p.window.dataLayer.at(-1)[1],'booking_request_email_handoff');
assert.equal(p.window.dataLayer.at(-1)[2].delivery_status,'handoff');
p.click(null,'https://lakehousedalarna.com/en/booking/');
p.click(null,'https://airbnb.com/h/solsidan-dalarna');
for(const event of ['click_check_availability','click_airbnb','booking_click','airbnb_click'])assert(p.window.dataLayer.some(x=>x[0]==='event'&&x[1]===event));
console.log('PASS: new funnel events preserve legacy events, consent and explicit email handoff status.');

p.winListeners['lakehouse-booking-received']();assert.equal(p.window.dataLayer.at(-1)[1],'submit_booking_request');assert.equal(p.window.dataLayer.at(-1)[2].delivery_status,'received');

let whatsappBefore=p.window.dataLayer.filter(x=>x[0]==='event'&&x[1]==='click_whatsapp').length;
p.click(null,'https://wa.me/46703021094');
assert.equal(p.window.dataLayer.filter(x=>x[0]==='event'&&x[1]==='click_whatsapp').length,whatsappBefore+1);
assert(!p.window.dataLayer.some(x=>x[0]==='event'&&x[1]==='whatsapp_click'));
console.log('PASS: one canonical click_whatsapp event per click, no duplicate WhatsApp alias.');
