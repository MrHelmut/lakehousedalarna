import assert from 'node:assert/strict';
import {proposalCard} from '../stad/proposals.mjs';
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.textContent='';}
 append(...els){this.children.push(...els);}
 replaceChildren(...els){this.children=[...els];}
 setAttribute(){}
 querySelectorAll(tag){return this.children.flatMap(e=>e instanceof Element?[...(e.tag===tag?[e]:[]),...e.querySelectorAll(tag)]:[]);}
 querySelector(tag){return this.querySelectorAll(tag)[0]||null;}
}
globalThis.document={createElement:tag=>new Element(tag)};
let reloaded=false;globalThis.location={reload:()=>{reloaded=true;}};
const b={id:'original-id',departure:'2026-10-18',status:'confirmed'},p={day:'2026-10-20',start:'09:00',end:'12:00',message:'Ny tid',status:'pending',scheduleKey:'same',updatedAt:{toMillis:()=>1}};
const notes={text:'Originalanteckning\nBryt strömmen och vänta 3 minuter'};
const store={bookings:{'original-id':{...b}},cleaningProposals:{'original-id':p},cleaningInstructions:{'original-id':notes}};
const doc=(db,c,id)=>({c,id}),snapshot=r=>({exists:()=>!!store[r.c]?.[r.id],data:()=>store[r.c]?.[r.id]});
let listener,errorListener,stopped=false,states=[];const writes=[];
const ctx={db:{},doc,collection:(db,c)=>({c}),getDoc:async r=>snapshot(r),getDocs:async r=>({docs:Object.entries(store[r.c]).map(([id,data])=>({id,data:()=>data}))}),onSnapshot:(r,cb,err)=>{listener=()=>cb(snapshot(r));errorListener=err;return ()=>stopped=true;},runTransaction:async(db,fn)=>fn({get:async r=>snapshot(r),update:(r,v)=>{writes.push(r.c);store[r.c][r.id]={...store[r.c][r.id],...v};}}),serverTimestamp:()=>({toMillis:()=>2}),uid:'owner',role:'owner',nextStay:()=>null,scheduleKey:()=> 'same',today:()=> '2026-10-19',onState:p=>states.push(p),onError:()=>states.push('error')};
const card=new Element('article');const handle=proposalCard(card,b,ctx);listener();
assert.equal(states.at(-1).status,'pending');
const approve=card.querySelectorAll('button').find(b=>b.textContent==='Godkänn ny tid');assert.ok(approve);
await approve.onclick();assert.equal(reloaded,true);assert.equal(store.bookings['original-id'].cleaningDate,'2026-10-20');assert.equal(store.cleaningProposals['original-id'].status,'approved');assert.strictEqual(store.cleaningInstructions['original-id'],notes);assert.deepEqual(writes,['bookings','cleaningProposals']);
errorListener();assert.equal(states.at(-1),'error');handle.stop();assert.equal(stopped,true);
console.log('PASS: live proposal displayed, owner approval changes existing job only, notes untouched, subscription errors and cleanup');
