export function serviceRows(health, availability, now=Date.now()) {
 const fields=health?.fields||{};
 const row=(label,value,hours)=>{
  const stamp=Date.parse(value), valid=Number.isFinite(stamp), fresh=valid&&now-stamp<hours*3600000&&stamp<=now+300000;
  return {label,value,ok:fresh,text:!valid?'Kunde inte kontrolleras':fresh?'Uppdaterad':'Behöver kontrolleras'};
 };
 return [row('Städaviseringar',fields.lastSuccess?.timestampValue,6),row('Airbnb till städplaneringen',fields.syncLastSuccess?.timestampValue,18),row('Hemsidans kalender',availability?.updated_at||availability?.updatedAt,24)];
}
export function mountServiceStatus(parent) {
 const box=document.createElement('details');box.className='service-status';
 const title=document.createElement('summary'),body=document.createElement('div'),button=document.createElement('button');
 title.textContent='Kontrollerar automatiken…';button.type='button';button.className='secondary';button.textContent='Kontrollera igen';
 const help=document.createElement('p');help.textContent='Automatiken körs i molnet även när datorn är avstängd. Städaren får högst ett sammanfattningsmejl per dag och Alexander högst två. Sparade ändringar syns direkt i portalen.';
 box.append(title,body,help,button);parent.prepend(box);
 async function refresh(){button.disabled=true;
  const get=async url=>{try{const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)});return r.ok?await r.json():null;}catch{return null;}};
  const [health,calendar]=await Promise.all([get('https://firestore.googleapis.com/v1/projects/lake-house-dalarna-cleaning/databases/(default)/documents/health/notifications'),get('/availability.json')]);
  const rows=serviceRows(health,calendar);body.replaceChildren();
  for(const row of rows){const p=document.createElement('p');p.textContent=row.label+': '+row.text+(Number.isFinite(Date.parse(row.value))?' · '+new Date(row.value).toLocaleString('sv-SE',{timeZone:'Europe/Stockholm'}):'');body.append(p);}
  const ok=rows.every(r=>r.ok);title.textContent=ok?'Automatiken är uppdaterad':'Automatiken behöver kontrolleras';box.classList.toggle('service-warning',!ok);button.disabled=false;
 }
 button.onclick=refresh;refresh();const timer=setInterval(refresh,300000);return ()=>{clearInterval(timer);box.remove();};
}
