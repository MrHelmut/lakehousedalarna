const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const root=path.resolve(__dirname,'..');
function setup(){
 const nodes=new Map(),events=[],posts=[];
 const el=()=>({value:'',textContent:'',dataset:{},hidden:true,checked:false,disabled:false,handlers:{},children:[],setAttribute(){},setCustomValidity(x){this.validationMessage=x},reportValidity(){return true},querySelector(s){return node(s)},addEventListener(n,f){this.handlers[n]=f},appendChild(x){this.children.push(x)},classList:{contains(){return false},add(){},remove(){}}});
 const node=s=>{if(!nodes.has(s))nodes.set(s,el());return nodes.get(s)};
 const values={first_name:'Test',last_name:'Guest',guest_email:'guest@example.com',guest_phone:'+46123456',country:'Sweden',adults:'2',children:'1',guests:'3',check_in:'2027-04-01',check_out:'2027-04-04',message:'Test family request'};
 const context=vm.createContext({window:{location:{href:''},addEventListener(){},dispatchEvent(e){events.push(e.type)},lakeBookingForm:{accessKey:'test-public-key'}},document:{querySelector:node,querySelectorAll(){return[]},createElement:el},Intl,Date,Set,URLSearchParams,console,Event,AbortController,setTimeout,clearTimeout,FormData:class{get(k){return values[k]}},fetch:async(url,options)=>{posts.push({url,payload:JSON.parse(options.body)});return {ok:true,json:async()=>({success:true})}}});
 vm.runInContext(fs.readFileSync(path.join(root,'pricing-data.js'),'utf8'),context);
 const source=fs.readFileSync(path.join(root,'booking.js'),'utf8');vm.runInContext(source.slice(0,source.lastIndexOf('\nupdateHelpTextDefault();')),context);
 const run=s=>vm.runInContext(s,context);
 run('availabilityLoaded=true;coverageStart="2026-09-01";coverageEnd="2028-09-01";');
 node('[data-check-in]').value=values.check_in;node('[data-check-out]').value=values.check_out;node('[data-adults]').value='2';node('[data-children]').value='1';run('syncPartyComposition()');
 const submit=()=>node('[data-booking-request-form]').handlers.submit({preventDefault(){}});
 return {node,context,run,events,posts,submit};
}
(async()=>{
 let p=setup();
 p.run('selectDate("2027-04-10"); selectDate("2027-04-12")');
 assert(!p.events.includes('lakehouse-booking-start'));
 assert.equal(p.events.filter(e=>e==='lakehouse-booking-dates-selected').length,1);
 p.run('handleRequestInteraction({target:{name:"adults",value:"2"}})');
 assert(!p.events.includes('lakehouse-booking-start'));
 p.run('handleRequestInteraction({target:{name:"first_name",value:" "}})');
 assert(!p.events.includes('lakehouse-booking-start'));
 p.run('handleRequestInteraction({target:{name:"first_name",value:"Test"}}); handleRequestInteraction({target:{name:"guest_email",value:"test@example.com"}})');
 assert.equal(p.events.filter(e=>e==='lakehouse-booking-start').length,1);
 p=setup();assert.equal(p.node('[data-guests]').value,'3');
 p.node('[data-children]').value='5';assert.equal(p.run('syncPartyComposition()'),false);assert.equal(p.node('[data-guests]').value,'');
 p.run('syncGuestControls("4")');assert.equal(p.node('[data-children]').validationMessage,'');
 p=setup();await p.submit();assert.equal(p.posts.length,1);assert.equal(p.posts[0].payload.children,'1');assert.equal(p.posts[0].payload.name,'Test Guest');assert.equal(p.posts[0].payload.country,'Sweden');assert(p.events.includes('lakehouse-booking-received'));assert(p.node('[data-request-help]').textContent.includes('not confirmed'));await p.submit();assert.equal(p.posts.length,1);
 p=setup();p.context.fetch=async()=>({ok:false,json:async()=>({success:false})});await p.submit();assert(!p.events.includes('lakehouse-booking-received'));assert.equal(p.node('[data-email-fallback]').hidden,false);assert.equal(p.node('[data-adults]').value,'2');assert.equal(p.run('requestSending'),false);
 p=setup();p.context.fetch=async()=>{throw Error('network')};await p.submit();assert.equal(p.node('[data-email-fallback]').hidden,false);
 p=setup();p.context.window.lakeBookingForm.accessKey='';await p.submit();assert.equal(p.posts.length,0);assert(p.context.window.location.href.startsWith('mailto:'));assert(p.events.includes('lakehouse-booking-submit'));assert(!p.events.includes('lakehouse-booking-received'));
 p=setup();p.node('[name=botcheck]').checked=true;await p.submit();assert.equal(p.posts.length,0);
 p=setup();
 p.node('[data-check-in]').value='2027-02-21';
 p.node('[data-check-out]').value='2027-02-28';
 p.node('[data-promo-code]').value=' skidvm ';
 p.run('applyPromoCode()');
 const vmStay = p.run('getStayEstimate("2027-02-21","2027-02-28",6)');
 assert.equal(vmStay.promoCode,'SKIDVM');
 assert.equal(vmStay.total, Math.round(vmStay.totalBeforePromo * 90) / 100);
 assert.equal(p.run('getStayEstimate("2027-03-02","2027-03-09",6).promoCode'),'SKIDVM');
 for (const [start,end] of [['2027-02-20','2027-02-27'],['2027-03-03','2027-03-10'],['2027-02-21','2027-02-27']]) {
   assert.equal(p.run('getStayEstimate(' + JSON.stringify(start) + ',' + JSON.stringify(end) + ',6).promoCode'),'');
 }
 assert.match(p.node('[data-promo-status]').textContent,/SKIDVM/);
 p.context.FormData=class extends p.context.FormData {
   get(key) {
     if (key === 'check_in') return '2027-02-21';
     if (key === 'check_out') return '2027-02-28';
     return super.get(key);
   }
 };
 await p.submit();
 assert.match(p.posts[0].payload.message,/Rabattkod: SKIDVM/);
 assert.match(p.posts[0].payload.message,/Beräknat totalpris efter rabatt/);
 console.log('PASS: SKIDVM date limits, 10% total discount and booking request payload.');
 // Dutch path: same price and payload, translated success/failure and fallback email.
 const nl=JSON.parse(fs.readFileSync(path.join(root,'content/nl.json'),'utf8'));
 const dutch=p=>{p.context.window.siteI18n={getCurrentLanguage:()=> 'nl',t:(s,args={})=>Object.entries(args).reduce((v,[k,x])=>v.replaceAll('{'+k+'}',x),nl[s]||s)};return p};
 p=dutch(setup());assert.equal(p.run('getStayEstimate("2027-04-01","2027-04-04",3).total'),11374);
 assert.equal(p.run('guestLabel(3)'), '3 gasten');assert.equal(p.run('nightLabel(1)'), '1 nacht');
 await p.submit();assert.equal(p.posts.length,1);assert.match(p.posts[0].payload.message,/Hallo Alexander/);assert.match(p.node('[data-request-help]').textContent,/nog niet bevestigd/);
 p=dutch(setup());p.context.fetch=async()=>({ok:false,json:async()=>({success:false})});await p.submit();assert.match(p.node('[data-request-help]').textContent,/niet bevestigen/);assert.equal(p.node('[data-email-fallback]').hidden,false);
 p=dutch(setup());p.context.window.lakeBookingForm.accessKey='';await p.submit();assert.match(decodeURIComponent(p.context.window.location.href),/Boekingsaanvraag.*Aankomst:/s);
 console.log('PASS: Dutch totals, guest/night labels, request payload, success, failure and email fallback.');
 p=setup();p.context.fetch=()=>new Promise(()=>{});p.submit();await p.submit();assert.equal(p.run('requestSending'),true);
 // Abort timers are unneeded after the in-flight duplicate guard assertion.
 console.log('PASS: party limit, unchanged guest pricing, all request fields, accepted response, duplicate guard, failures, preserved fields, email fallback and honeypot. Mock transport only; no email sent.');
 process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
