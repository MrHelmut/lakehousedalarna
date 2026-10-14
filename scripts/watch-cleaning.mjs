import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const HOUR=3600000;
export function healthProblems(value,now=Date.now()) {
 const fresh=(raw,age)=>{const t=Date.parse(raw);return Number.isFinite(t)&&now-t<age&&now-t>=-300000;};
 const fields=value?.fields||{}, problems=[];
 if(!fresh(fields.lastSuccess?.timestampValue,6*HOUR))problems.push('Mejlkontrollen har inte slutförts på minst sex timmar.');
 if(fields.monitorVersion?.integerValue==='2'&&!fresh(fields.syncLastSuccess?.timestampValue,18*HOUR))problems.push('Airbnb-importen har inte slutförts på minst 18 timmar.');
 return problems;
}
export function isHealthy(value,now=Date.now()){return healthProblems(value,now).length===0;}
export async function check({request=fetch,test=false,stateFile='.cleaning-watch/state.json',now=Date.now()}={}) {
 let previous={};try{previous=JSON.parse(await fs.readFile(stateFile,'utf8'));}catch{}
 let known=false,problems=[];
 try {
  const response=await request('https://firestore.googleapis.com/v1/projects/lake-house-dalarna-cleaning/databases/(default)/documents/health/notifications',{signal:AbortSignal.timeout(20000)});
  if(response.ok){const value=await response.json();if(value?.fields){known=true;problems=healthProblems(value,now);}}
 }catch{}
 const healthy=known&&problems.length===0;
 const firstFailureAt=healthy?null:(previous.firstFailureAt??now);
 const overdue=known?problems.length>0:now-firstFailureAt>=6*HOUR;
 const recovery=healthy&&!!previous.alertAt;
 const notify=test||(overdue&&!previous.alertAt)||recovery;
 if(notify){
  const response=await request('https://api.web3forms.com/submit',{
   method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},signal:AbortSignal.timeout(20000),
   body:JSON.stringify({access_key:'76b6737b-f408-448b-b29d-bba9aa1a4a43',from_name:'Lake House Dalarna · Driftkontroll',
    subject:test?'TEST: Oberoende driftkontroll för städportalen':healthy?'Städautomatiken fungerar igen':'Kontrollera städautomatiken · Lake House Dalarna',
    message:test?'Detta är ett test av reservlarmet från GitHub. Ingen bokning eller städstatus har ändrats.':healthy?'Driftkontrollen får åter aktuella livstecken från både mejlkontroll och kalenderimport.':(known?problems.join('\n'):'Driftkontrollen har inte kunnat läsa automatikens status på minst sex timmar.')+'\nAutomatiska återförsök fortsätter. Kontrollera portalen och kontakta städaren direkt om ett tillfälle är nära. Detta är ett samlat larm för avbrottet, inte ett nytt mejl för varje misslyckat försök.\nhttps://lakehousedalarna.com/stad/'})});
  const result=await response.json();if(!response.ok||result.success!==true)throw Error('Reservlarmet accepterades inte av mejltjänsten');
 }
 if(!test){await fs.mkdir(path.dirname(stateFile),{recursive:true});await fs.writeFile(stateFile,JSON.stringify({unhealthy:!healthy,firstFailureAt,alertAt:healthy?null:notify?now:previous.alertAt}));}
 console.log(test?'Testlarm accepterat av mejltjänsten':healthy?'Driftkontroll OK':'Driftkontroll: återförsök pågår');
 return {healthy,notified:notify};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await check({test:process.argv.includes('--test')});
