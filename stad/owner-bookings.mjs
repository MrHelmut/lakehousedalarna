export const activeStates=['reserved','confirmed','blocked'];
export function validDate(value){const d=new Date(value+'T12:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;}
export function validateBooking(b,others=[],id=''){
 if(!validDate(b.arrival)||!validDate(b.departure)||b.arrival>=b.departure)throw Error('Välj ett startdatum och ett senare slutdatum.');
 if(!activeStates.includes(b.status))throw Error('Välj bokning, reservation eller blockering.');
 if(b.status!=='blocked'&&(!b.guestName.trim()||!/^([1-6])$/.test(b.guests)))throw Error('Ange gästens namn och 1–6 personer.');
 if(others.some(x=>x.id!==id&&x.source!=='standalone-cleaning'&&activeStates.includes(x.status)&&x.arrival<b.departure&&x.departure>b.arrival))throw Error('Datumen överlappar en befintlig bokning, reservation eller blockering.');
 return b;
}
export function publicRange(b){return {start:b.arrival,end:b.departure,active:activeStates.includes(b.status)};}
export function mountOwnerBookings(parent,{db,auth,doc,collection,getDocs,runTransaction,onSnapshot,serverTimestamp,onSaved=()=>{}}){
 const box=document.createElement('section');box.className='owner-bookings';box.dataset.ownerOnly='true';
 box.innerHTML='<h2>Egna bokningar och blockeringar</h2><p>Reservation spärrar datum utan städning. Bekräftad bokning skapar städtillfälle vid utcheckning. Blockering spärrar bara kalendern.</p><p><strong>Airbnb:</strong> spärra även datumen där när du sparar här. Den här funktionen ändrar hemsidans kalender och städplanering, inte Airbnbs kalender.</p><details><summary>Lägg till bokning eller blockering</summary><form><label>Typ<select name="status"><option value="reserved">Reservation – inväntar bekräftelse</option><option value="confirmed">Bekräftad bokning</option><option value="blocked">Blockering – ingen städning</option></select></label><label>Från / incheckning<input name="arrival" type="date" required></label><label>Till / utcheckning (ledig igen)<input name="departure" type="date" required></label><label>Gästens namn<input name="guestName" maxlength="60"></label><label>Antal personer<input name="guests" type="number" min="1" max="6" value="2"></label><label>Språk på välkomstlappen<select name="noteLanguage"><option value="sv">Svenska</option><option value="en">Engelska</option><option value="de">Tyska</option></select></label><button>Spara</button></form></details><p role="status"></p><div class="owner-booking-list"></div>';
 parent.prepend(box);const form=box.querySelector('form'),feedback=box.querySelector('[role=status]'),list=box.querySelector('.owner-booking-list');let saving=false,loaded=false,entries=[];
 const names={reserved:'Reserverad',confirmed:'Bekräftad',blocked:'Blockerad',cancelled:'Avbokad / hävd'};
 function busy(value){saving=value;box.querySelectorAll('button,input,select').forEach(b=>b.disabled=value);if(!value)form.elements.status.onchange();}
 form.elements.status.onchange=()=>{const blocked=form.elements.status.value==='blocked';for(const key of ['guestName','guests','noteLanguage']){form.elements[key].closest('label').hidden=blocked;form.elements[key].disabled=blocked;}};
 async function save(id,input,expected){
  if(saving||!loaded)return;busy(true);feedback.textContent='Sparar…';
  try{
   await runTransaction(db,async tx=>{
    const lock=doc(db,'ownerBookingLocks','main'),before=await tx.get(lock),ref=doc(db,'bookings',id),existing=await tx.get(ref);
    if(expected&&(!existing.exists()||existing.data().status!==expected))throw Error('Bokningen har ändrats på en annan enhet. Kontrollera listan och försök igen.');
    if(!expected&&existing.exists())throw Error('Posten finns redan. Ladda om sidan.');
    const b=expected?{...existing.data(),status:input.status}:input;
    if(b.source!=='direct-portal')throw Error('Endast poster skapade här kan ändras här.');
    if(b.status!=='cancelled'){
     const snapshot=await getDocs(collection(db,'bookings'));
     validateBooking(b,snapshot.docs.map(d=>({id:d.id,...d.data()})),id);
     if(!expected){
     const r=await fetch('/availability.json?v='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Kalendern kunde inte kontrolleras. Försök igen.');const calendar=await r.json();
     if(!Number.isFinite(Date.parse(calendar.updated_at))||!Array.isArray(calendar.booked_dates)||Date.now()-Date.parse(calendar.updated_at)>48*3600000)throw Error('Kalendern behöver uppdateras innan nya datum kan sparas.');
     if(!expected&&(b.arrival<calendar.coverage_start||b.departure>calendar.coverage_end))throw Error('Datumen ligger utanför kalenderns kontrollerade period.');
     if(calendar.booked_dates.some(day=>day>=b.arrival&&day<b.departure)||(calendar.blocked_ranges||[]).some(r=>r.start<b.departure&&r.end>b.arrival))throw Error('Kalendern visar upptagna datum i perioden. Kontrollera Airbnb och befintliga blockeringar.');
     }
    }
    const patch={...b,updatedAt:serverTimestamp(),updatedBy:auth.currentUser.uid};
    tx.set(ref,patch);tx.set(doc(db,'ownerAvailability',id),publicRange(b));tx.set(lock,{revision:(before.exists()?before.data().revision:0)+1});
   });
   feedback.textContent=input.status==='cancelled'?'Avbokad / hävd här. Anteckningar och historik är kvar. Andra spärrar, även på Airbnb, ligger kvar tills de ändras separat.':'Sparat. Hemsidans kalender läser spärren direkt. Kom ihåg att kontrollera samma datum på Airbnb.';
   if(!expected){form.reset();form.elements.status.onchange();form.closest('details').open=false;}
   onSaved(expected?null:form);
  }catch(e){feedback.textContent=e.message||'Kunde inte spara. Dina uppgifter finns kvar. Försök igen.';}finally{busy(false);}
 }
 form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;const b=Object.fromEntries(new FormData(form));b.guestName=(b.guestName||'').trim();b.source='direct-portal';b.address='Harnäsudden 26';if(b.status==='blocked'){b.guestName='';b.guests='';b.noteLanguage='sv';}save('owner-'+crypto.randomUUID(),b);};
 const stop=onSnapshot(collection(db,'bookings'),snap=>{loaded=true;entries=snap.docs.map(d=>({id:d.id,...d.data()})).filter(b=>b.source==='direct-portal').sort((a,b)=>a.arrival.localeCompare(b.arrival));list.replaceChildren();
  if(!entries.length){list.textContent='Inga egna poster har lagts till här ännu. Tidigare bokningar och anteckningar finns kvar i städplaneringen.';return;}
  for(const b of entries){const card=document.createElement('article'),text=document.createElement('p');text.textContent=names[b.status]+' · '+b.arrival+'–'+b.departure+(b.guestName?' · '+b.guestName:'');card.append(text);
   function action(label,status){const button=document.createElement('button');button.type='button';button.textContent=label;button.disabled=saving;button.onclick=()=>{if(card.querySelector('.confirm-action'))return;const confirmation=document.createElement('div');confirmation.className='confirm-action';const explanation=document.createElement('p');explanation.textContent=label+' för '+b.arrival+'–'+b.departure+'? Anteckningar och historik behålls.';const yes=document.createElement('button'),no=document.createElement('button');yes.type=no.type='button';yes.textContent='Ja, '+label.toLowerCase();no.textContent='Avbryt';no.className='secondary';yes.onclick=()=>save(b.id,{status},b.status);no.onclick=()=>confirmation.remove();confirmation.append(explanation,yes,no);card.append(confirmation);yes.focus();};card.append(button);}
   if(b.status==='reserved')action('Bekräfta bokning','confirmed');if(activeStates.includes(b.status))action(b.status==='blocked'?'Häv blockering':'Avboka / släpp reservation','cancelled');list.append(card);
  }
 },()=>{loaded=false;feedback.textContent='Egna bokningar kunde inte hämtas. Ladda om sidan innan du sparar.';});
 return ()=>{stop();box.remove();};
}
