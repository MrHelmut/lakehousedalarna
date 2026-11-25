// Public incident contains service status only, never guest details or credentials.
const title='Städautomatik: driftkontroll behöver åtgärd';
const marker='<!-- lakehouse-cleaning-watch -->';
export async function incident({request=fetch,healthy=false,token=process.env.GITHUB_TOKEN,repo=process.env.GITHUB_REPOSITORY}={}) {
 if(!token||!repo)throw Error('Reservlarm saknar GitHub-anslutning');
 const api=async(endpoint,method='GET',body)=>{
  const r=await request('https://api.github.com/repos/'+repo+endpoint,{method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error('Reservlarm till GitHub misslyckades, HTTP '+r.status);
  return r.status===204?null:r.json();
 };
 const found=await api('/issues?state=open&per_page=100');
 const existing=found.find(i=>!i.pull_request&&i.title===title&&i.body?.includes(marker));
 if(healthy){if(existing)await api('/issues/'+existing.number,'PATCH',{state:'closed',state_reason:'completed'});return;}
 if(!existing)await api('/issues','POST',{title,body:marker+'\nDriftkontrollen saknar aktuella livstecken från städautomatiken eller dess Airbnb-import. Reservmejlet kunde inte levereras. Kontrollera driftstatus i städportalen. Automatiska återförsök fortsätter.\n\nDetta är ett samlat ärende för avbrottet och stängs när kontrollerna är aktuella igen.\n\nhttps://lakehousedalarna.com/stad/',assignees:['MrHelmut']});
}
