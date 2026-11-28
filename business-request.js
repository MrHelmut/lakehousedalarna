(function () {
  'use strict';
  function payload(data, accessKey) {
    const value = key => String(data.get(key) || '').trim();
    return {
      access_key: accessKey,
      subject: 'Företagsförfrågan – Lake House Dalarna',
      from_name: 'Lake House Dalarna företagsförfrågan',
      name: value('contact'), email: value('email'), phone: value('phone'),
      company: value('company'), arrival: value('arrival'), departure: value('departure'),
      guests: value('guests'), request_type: 'business_quote', botcheck: false,
      message: [
        'FÖRETAGSFÖRFRÅGAN – personlig offert, ingen bokning eller prisberäkning.',
        `Företag: ${value('company')}`, `Kontaktperson: ${value('contact')}`,
        `Önskad start: ${value('arrival')}`, `Önskat slut: ${value('departure')}`,
        `Antal personer: ${value('guests')}`, `Övernattning: ${value('overnight')}`,
        `Upplägg och önskemål: ${value('message')}`,
        'Datum, upplägg, pris och befintliga bokningsvillkor måste bekräftas personligen.'
      ].join('\n')
    };
  }
  async function send(data, fetcher, signal) {
    const response = await fetcher('https://api.web3forms.com/submit', {
      method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify(data), signal
    });
    const result = await response.json();
    if (!response.ok || result.success !== true) throw new Error('Receipt not confirmed');
  }
  if (typeof module !== 'undefined') module.exports = {payload, send};
  if (typeof document === 'undefined') return;
  const form = document.querySelector('[data-business-request]');
  if (!form) return;
  const start = form.elements.arrival, end = form.elements.departure;
  const status = form.querySelector('[role="status"]');
  const button = form.querySelector('[type="submit"]');
  let sending = false, complete = false;
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  start.min = end.min = date;
  function validateDates() {
    end.min = start.value || date;
    end.setCustomValidity(end.value && start.value && (end.value < start.value || (form.elements.overnight.value === 'Ja' && end.value === start.value)) ? 'Välj ett slutdatum efter starten för övernattning.' : '');
  }
  form.addEventListener('change', validateDates);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || complete || form.elements.botcheck.checked) return;
    validateDates();
    if (!form.reportValidity()) return;
    if (!['lakehousedalarna.com','www.lakehousedalarna.com'].includes(location.hostname)) {
      status.textContent = 'Förhandsvisning: formuläret är korrekt ifyllt. Ingen förfrågan har skickats.';
      return;
    }
    if (!window.lakeBookingForm?.accessKey) {
      status.textContent = 'Formuläret är tillfälligt otillgängligt. Kontakta oss via mejllänken nedan.';
      return;
    }
    sending = true; button.disabled = true;
    status.textContent = 'Skickar er företagsförfrågan …';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      await send(payload(new FormData(form), window.lakeBookingForm.accessKey), window.fetch.bind(window), controller.signal);
      complete = true;
      status.textContent = 'Tack! Vi har tagit emot er företagsförfrågan och återkommer personligen med tillgänglighet och offert. Ingen bokning är bekräftad.';
    } catch {
      status.textContent = 'Vi kunde inte bekräfta att förfrågan kom fram. Uppgifterna finns kvar. Försök igen eller kontakta oss via mejllänken nedan.';
    } finally {
      clearTimeout(timer); sending = false; button.disabled = complete;
    }
  });
})();
