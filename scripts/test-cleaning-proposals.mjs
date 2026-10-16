import assert from 'node:assert/strict';import {proposalError} from '../stad/proposal-model.mjs';
const b={departure:'2026-10-25'},next={arrival:'2026-10-27'},p={day:'2026-10-26',start:'09:00',end:'12:00',message:'Måndag istället'};
assert.equal(proposalError(b,next,p,'2026-10-16'),'');
for(const patch of [{day:'2026-10-24'},{day:'2026-10-25',start:'10:00'},{day:'2026-10-27',end:'15:00'},{day:'2026-10-28'},{end:'08:00'},{day:'2026-02-30'},{start:'25:00'},{message:'x'.repeat(1001)}])assert.ok(proposalError(b,next,{...p,...patch},'2026-10-16'));
assert.equal(proposalError(b,next,{...p,day:'2026-10-27',end:'14:59'},'2026-10-16'),'');
assert.equal(proposalError({source:'standalone-cleaning'},null,p,'2026-10-16'),'');
console.log('PASS: date validity, checkout, arrival, end time, past day, standalone and message limits');
