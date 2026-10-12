export function cleaningMail(booking, cleaning) {
  const format = value => new Date(value+'T12:00:00').toLocaleDateString('sv-SE');
  return {
    access_key: '76b6737b-f408-448b-b29d-bba9aa1a4a43',
    subject: 'Städning klar · Lake House Dalarna · '+format(booking.cleaningDate||booking.departure),
    from_name: 'Lake House Dalarna · Städportal',
    message: [
      'Städningen har markerats klar i städportalen.',
      'Städtillfälle: '+format(booking.cleaningDate||booking.departure),
      'Markerad klar: '+cleaning.doneAt.toDate().toLocaleString('sv-SE',{timeZone:'Europe/Stockholm'})+' (svensk tid)',
      'Alla åtta områden är markerade klara.',
      '', 'Anteckning:', cleaning.note?.trim()||'Ingen anteckning.',
      '', 'Se aktuell status: https://lakehousedalarna.com/stad/',
      'Om klarmarkeringen senare ändras är statusen i portalen den aktuella.'
    ].join('\n')
  };
}
export async function sendCleaningMail(payload, request=fetch) {
  const response=await request('https://api.web3forms.com/submit',{
    method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)
  });
  const result=await response.json();
  if(!response.ok||result.success!==true)throw new Error('mail-not-accepted');
}
