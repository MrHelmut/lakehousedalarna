/* Optional display currency only. Booking, payment and emails remain in SEK. */
(() => {
    let reference = null;
    function convert(total, language, rate, now = Date.now()) {
        if (!['en', 'de'].includes(language) || !Number.isFinite(total) || total <= 0) return null;
        if (!rate || !/^\d{4}-\d{2}-\d{2}$/.test(rate.date) || !Number.isFinite(rate.sekPerEur) || rate.sekPerEur < 5 || rate.sekPerEur > 20) return null;
        const age = now - Date.parse(rate.date + 'T00:00:00Z');
        if (!Number.isFinite(age) || age < -86400000 || age > 14 * 86400000) return null;
        return Math.round(total / rate.sekPerEur / 10) * 10;
    }
    function render(total, language) {
        const box = document.querySelector('[data-euro-estimate]');
        if (!box) return;
        const euro = convert(total, language, reference);
        box.hidden = euro === null;
        if (euro === null) return;
        const locale = language === 'de' ? 'de-DE' : 'en-GB';
        const amount = new Intl.NumberFormat(locale, {maximumFractionDigits:0}).format(euro);
        const date = new Intl.DateTimeFormat(locale, {day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(reference.date + 'T00:00:00Z'));
        box.querySelector('[data-euro-amount]').textContent = `≈ ${amount} EUR`;
        box.querySelector('[data-euro-note]').textContent = language === 'de'
            ? `Unverbindlicher Richtwert. Zahlung in SEK. EZB-Referenzkurs vom ${date}; Ihr Bankkurs kann abweichen.`
            : `Approximate amount. Payment in SEK. ECB reference rate dated ${date}; your bank’s rate may differ.`;
    }
    window.lakeHouseEuro = {convert, render};
    fetch('/exchange-rate.json', {cache:'no-cache', credentials:'omit'})
        .then(response => response.ok ? response.json() : null)
        .then(rate => {reference = rate; window.dispatchEvent(new Event('lakehouse-euro-ready'));})
        .catch(() => { /* Keep SEK fully functional if the optional reference is unavailable. */ });
})();
