const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const root=require('path').resolve(__dirname,'..');
const amount={textContent:''},note={textContent:''};
const box={hidden:true,querySelector:s=>s==='[data-euro-amount]'?amount:note};
const c={window:{},document:{querySelector:()=>box},Intl};
vm.runInNewContext(fs.readFileSync(root+'/euro-estimate.js','utf8'),c);
const f=c.window.lakeHouseEuro;
assert.equal(f.convert(32132,'de'),2920);
for(const lang of ['en','de']){f.render(32132,lang);assert.equal(box.hidden,false);assert.match(amount.textContent,/2[,.]920 EUR/);assert.match(note.textContent,/1 EUR = 11 SEK/)}
f.render(32132,'sv');assert.equal(box.hidden,true);
for(const value of [null,0,-5,NaN,Infinity]){f.render(value,'de');assert.equal(box.hidden,true)}
f.render(11000,'en');assert.match(amount.textContent,/1,000 EUR/);
console.log('PASS: fixed SEK/11 conversion, rounding, EN/DE, SV hidden, changed totals, invalid inputs, no network dependency.');
