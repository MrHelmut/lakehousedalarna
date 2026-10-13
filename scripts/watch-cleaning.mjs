import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function isHealthy(value,now=Date.now()) {
 const time=Date.parse(value?.fields?.lastSuccess?.timestampValue);
 return Number.isFinite(time)&&now-time<2*3600000&&now-time>=-300000;
}
export async function check({request=fetch,test=false,stateFile='.cleaning-watch/state.json'}={}) {
 let previous={};try{previous=JSON.parse(await fs.readFile(stateFile,'utf8'));}catch{}
 const now=Date.now();let healthy=false;
 try {
  const response=await request('https://firestore.googleapis.com/v1/projects/lake-house-dalarna-cleaning/databases/(default)/documents/health/notifications',{signal:AbortSignal.timeout(20000)});
  healthy=response.ok&&isHealthy(await response.json(),now);
 }catch{}
 const notify=test||(!healthy&&(!previous.alertAt||now-previous.alertAt>=86400000))||(healthy&&previous.unhealthy);
 if(notify){
  const response=await request('https://api.web3forms.com/submit',{
   method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},signal:AbortSignal.timeout(20000),
   body:JSON.stringify({access_key:'76b6737b-f408-448b-b29d-bba9aa1a4a43',from_name:'Lake House Dalarna · Driftkontroll',
    subject:test?'TEST: Oberoende driftkontroll för städportalen':healthy?'Städautomatiken fungerar igen':'Kontrollera städautomatiken · Lake House Dalarna',
    message:test?'Detta är ett test av reservlarmet från GitHub. Ingen bokning eller städstatus har ändrats.':healthy?'Driftkontrollen får åter aktuella livstecken från automatiken.':'Städautomatiken har inte kunnat bekräftas fungera under de senaste två timmarna. Kontrollera portalen och kontakta städaren direkt om ett tillfälle är nära. Ingen bokning har ändrats av driftkontrollen.\nhttps://lakehousedalarna.com/stad/'})});
  const result=await response.json();if(!response.ok||result.success!==true)throw Error('Reservlarmet accepterades inte av mejltjänsten');
 }
 if(!test){await fs.mkdir('.cleaning-watch',{recursive:true});await fs.writeFile(stateFile,JSON.stringify({unhealthy:!healthy,alertAt:healthy?null:notify?now:previous.alertAt}));}
 console.log(test?'Testlarm accepterat av mejltjänsten':healthy?'Driftkontroll OK':'Driftkontroll: saknat eller för gammalt livstecken');
 return {healthy,notified:notify};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await check({test:process.argv.includes('--test')});
