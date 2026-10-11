const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const root=require('path').resolve(__dirname,'..');
const amount={textContent:''},note={textContent:''};
const box={hidden:true,querySelector:s=>s==='[data-euro-amount]'?amount:note};
let ready;
const rate={date:'2026-10-09',sekPerEur:11.1675};
class Clock extends Date {static now(){return Date.parse('2026-10-11T12:00:00Z')}}
const c={window:{dispatchEvent(){ready=true}},document:{querySelector:()=>box},Date:Clock,Intl,Event,fetch:async()=>({ok:true,json:async()=>rate})};
vm.runInNewContext(fs.readFileSync(root+'/euro-estimate.js','utf8'),c);
(async()=>{await new Promise(r=>setImmediate(r));const f=c.window.lakeHouseEuro;
assert.equal(ready,true);assert.equal(f.convert(32132,'de',rate),2880);
for(const lang of ['en','de']){f.render(32132,lang);assert.equal(box.hidden,false);assert.match(amount.textContent,/2[,.]880 EUR/);assert.match(note.textContent,/SEK/)}
f.render(32132,'sv');assert.equal(box.hidden,true);
f.render(null,'de');assert.equal(box.hidden,true);
assert.equal(f.convert(32132,'de',{...rate,date:'2026-09-01'}),null);
assert.equal(f.convert(32132,'de',{...rate,sekPerEur:0}),null);
assert.equal(f.convert(32132,'de',null),null);
assert.equal(f.convert(32132,'en',{...rate,date:'2026-10-20'}),null);
f.render(11000,'en');assert.match(amount.textContent,/990 EUR/);
console.log('PASS: conversion direction, rounding, languages, new totals, invalid selections, missing/stale/future reference.');})();
