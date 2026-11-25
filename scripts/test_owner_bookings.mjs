import assert from 'node:assert/strict';
import {validateBooking,validDate,publicRange} from '../stad/owner-bookings.mjs';
const base={id:'owner-test',source:'direct-portal',status:'reserved',arrival:'2027-04-01',departure:'2027-04-04',guestName:'Test',guests:'2'};
for(const status of ['reserved','confirmed','blocked']){
 assert.equal(validateBooking({...base,status}).status,status);
 assert.deepEqual(publicRange({...base,status}),{start:'2027-04-01',end:'2027-04-04',active:true});
}
assert.equal(publicRange({...base,status:'cancelled'}).active,false);
assert.equal(validDate('2027-02-29'),false);assert.equal(validDate('2028-02-29'),true);assert.equal(validDate('2027-13-01'),false);
for(const patch of [{departure:base.arrival},{departure:'2027-03-31'},{guestName:' '},{guests:'7'},{guests:'0'},{status:'unknown'}])assert.throws(()=>validateBooking({...base,...patch}));
assert.doesNotThrow(()=>validateBooking({...base,status:'blocked',guestName:'',guests:''}));
for(const status of ['reserved','confirmed','blocked'])assert.throws(()=>validateBooking(base,[{...base,id:'different',status}]));
assert.doesNotThrow(()=>validateBooking(base,[{...base,id:'different',status:'cancelled'}]));
assert.doesNotThrow(()=>validateBooking(base,[{...base,id:'different',source:'standalone-cleaning'}]));
assert.doesNotThrow(()=>validateBooking(base,[{...base,arrival:base.departure,departure:'2027-04-07'}]));
assert.doesNotThrow(()=>validateBooking(base,[base],base.id));
console.log('PASS: holds, confirmation, blocks, cancellation, real dates, party limit, overlap and adjacent stays.');
