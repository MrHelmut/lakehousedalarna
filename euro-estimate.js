/* Optional display currency only. Booking, payment and emails remain in SEK. */
(() => {
    const sekPerEur = 11; // Fixed indicative rate approved by the owner; reviewed monthly.
    function convert(total, language) {
        if (!['en', 'de'].includes(language) || !Number.isFinite(total) || total <= 0) return null;
        return Math.round(total / sekPerEur / 10) * 10;
    }
    function render(total, language) {
        const box = document.querySelector('[data-euro-estimate]');
        if (!box) return;
        const euro = convert(total, language);
        box.hidden = euro === null;
        if (euro === null) return;
        const locale = language === 'de' ? 'de-DE' : 'en-GB';
        const amount = new Intl.NumberFormat(locale, {maximumFractionDigits:0}).format(euro);
        box.querySelector('[data-euro-amount]').textContent = `≈ ${amount} EUR`;
        box.querySelector('[data-euro-note]').textContent = language === 'de'
            ? `Unverbindlicher Richtwert bei 1 EUR = 11 SEK. Zahlung in SEK; Ihr Bankkurs kann abweichen.`
            : `Approximate amount at 1 EUR = 11 SEK. Payment in SEK; your bank’s rate may differ.`;
    }
    window.lakeHouseEuro = {convert, render};
})();
