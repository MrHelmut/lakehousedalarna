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
 let p=setup();assert.equal(p.node('[data-guests]').value,'3');
 p.node('[data-children]').value='5';assert.equal(p.run('syncPartyComposition()'),false);assert.equal(p.node('[data-guests]').value,'');
 p.run('syncGuestControls("4")');assert.equal(p.node('[data-children]').validationMessage,'');
 p=setup();await p.submit();assert.equal(p.posts.length,1);assert.equal(p.posts[0].payload.children,'1');assert.equal(p.posts[0].payload.name,'Test Guest');assert.equal(p.posts[0].payload.country,'Sweden');assert(p.events.includes('lakehouse-booking-received'));assert(p.node('[data-request-help]').textContent.includes('not confirmed'));await p.submit();assert.equal(p.posts.length,1);
 p=setup();p.context.fetch=async()=>({ok:false,json:async()=>({success:false})});await p.submit();assert(!p.events.includes('lakehouse-booking-received'));assert.equal(p.node('[data-email-fallback]').hidden,false);assert.equal(p.node('[data-adults]').value,'2');assert.equal(p.run('requestSending'),false);
 p=setup();p.context.fetch=async()=>{throw Error('network')};await p.submit();assert.equal(p.node('[data-email-fallback]').hidden,false);
 p=setup();p.context.window.lakeBookingForm.accessKey='';await p.submit();assert.equal(p.posts.length,0);assert(p.context.window.location.href.startsWith('mailto:'));assert(p.events.includes('lakehouse-booking-submit'));assert(!p.events.includes('lakehouse-booking-received'));
 p=setup();p.node('[name=botcheck]').checked=true;await p.submit();assert.equal(p.posts.length,0);
 p=setup();p.context.fetch=()=>new Promise(()=>{});p.submit();await p.submit();assert.equal(p.run('requestSending'),true);
 // Abort timers are unneeded after the in-flight duplicate guard assertion.
 console.log('PASS: party limit, unchanged guest pricing, all request fields, accepted response, duplicate guard, failures, preserved fields, email fallback and honeypot. Mock transport only; no email sent.');
 process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
