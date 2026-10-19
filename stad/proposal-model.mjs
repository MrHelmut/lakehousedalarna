export function proposalError(b,next,p,today){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(p.day||'')||!Number.isFinite(Date.parse(p.day+'T00:00:00Z'))||new Date(p.day+'T00:00:00Z').toISOString().slice(0,10)!==p.day)return 'Välj en giltig dag.';
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.start||'')||!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.end||''))return 'Ange starttid och beräknad sluttid.';
 if(p.day<today)return 'Välj idag eller en senare dag.';
 if(p.end<=p.start)return 'Sluttiden måste vara efter starttiden samma dag.';
 if(b.source!=='standalone-cleaning'&&(p.day<b.departure||(p.day===b.departure&&p.start<(b.cleaningStart||'11:00'))))return 'Städningen kan inte börja före utcheckningen.';
 if(next&&(p.day>next.arrival||(p.day===next.arrival&&p.end>='15:00')))return 'Städningen måste vara klar före nästa gästs ankomst kl. 15.00.';
 if((p.message||'').length>1000)return 'Meddelandet får vara högst 1000 tecken.';
 return '';
}
export function proposalMatches(b,p){return p?.status==='approved'&&b.cleaningDate===p.day&&b.cleaningTime===p.start+'–'+p.end;}

export function jobSection(b,p,today,cleaning){return cleaning?.doneAt?'history':p?.status==='pending'?'pending':'upcoming';}

export function cleaningStatus(b,c,p,cleaning,key){
 if(cleaning?.doneAt)return {kind:'done',label:'Städning klar'};
 if(p?.status==='pending')return {kind:'pending',label:'Ny tid föreslagen – väntar på Alexander'};
 if(proposalMatches(b,p))return {kind:'confirmed',label:'Ny städtid godkänd av Alexander'};
 if(c&&c.scheduleKey!==key)return {kind:'changed',label:'Planeringen har ändrats – nytt svar behövs',detail:c.accepted?'Städaren hade bekräftat den tidigare planeringen.':'Städaren hade avböjt den tidigare planeringen.'};
 if(c?.accepted)return {kind:'confirmed',label:'Bekräftat av städaren'};
 if(c?.accepted===false)return {kind:'declined',label:'Städaren kan inte – ny tid behövs'};
 return {kind:'waiting',label:'Inväntar städarens svar'};
}
