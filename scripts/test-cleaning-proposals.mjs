import assert from 'node:assert/strict';import {proposalError} from '../stad/proposal-model.mjs';
const b={departure:'2026-10-25'},next={arrival:'2026-10-27'},p={day:'2026-10-26',start:'09:00',end:'12:00',message:'Måndag istället'};
assert.equal(proposalError(b,next,p,'2026-10-16'),'');
for(const patch of [{day:'2026-10-24'},{day:'2026-10-25',start:'10:00'},{day:'2026-10-27',end:'15:00'},{day:'2026-10-28'},{end:'08:00'},{day:'2026-02-30'},{start:'25:00'},{message:'x'.repeat(1001)}])assert.ok(proposalError(b,next,{...p,...patch},'2026-10-16'));
assert.equal(proposalError(b,next,{...p,day:'2026-10-27',end:'14:59'},'2026-10-16'),'');
assert.equal(proposalError({source:'standalone-cleaning'},null,p,'2026-10-16'),'');
console.log('PASS: date validity, checkout, arrival, end time, past day, standalone and message limits');

import {jobSection} from '../stad/proposal-model.mjs';
assert.equal(jobSection({departure:'2026-10-18'},null,'2026-10-19'),'history');
assert.equal(jobSection({departure:'2026-10-18'},{status:'pending',day:'2026-10-20'},'2026-10-19'),'pending');
assert.equal(jobSection({departure:'2026-10-25'},{status:'pending'},'2026-10-19'),'pending');
assert.equal(jobSection({departure:'2026-10-18',cleaningDate:'2026-10-19'},null,'2026-10-19'),'upcoming');
assert.equal(jobSection({departure:'2026-10-18',cleaningDate:'2026-10-20'},{status:'approved'},'2026-10-19'),'upcoming');
console.log('PASS: past jobs retained, pending proposals visible regardless of original date, rescheduled jobs use approved date');
