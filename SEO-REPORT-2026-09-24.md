# SEO, AI-sök och direktförfrågningar — 24 september 2026

## Genomfört
- Tre nya landningssidor: engelsk sommar, engelsk vinter och tysk vinter. Befintlig tysk sommarsida har behållit sin URL och huvudsakliga innehållsstruktur.
- Startsidan, huset och bokningssidan behåller design, bilder och bokningsfunktion. Diskreta säsongslänkar i sidfoten kopplar sidorna till varandra.
- Alla landningssidor leder primärt till den egna bokningsförfrågan, även för förstagångsgäster. Airbnb är ett sekundärt alternativ; befintliga verkliga gästrecensioner länkas från sidorna.
- Vinterinnehållet förklarar att huset inte är ski-in/ski-out. Bjursås cirka 20 minuter, Romme cirka 40 minuter, Falun/Lugnet cirka 25 minuter och Stockholm/Arlanda cirka tre timmar kommer från befintliga sidor. Tiderna anges som ungefärliga och väderberoende; inga nya exakta reseavstånd har räknats fram.
- Bildbeskrivningar som tidigare låg kvar på engelska i svenska/tyska galleriet är översatta. Inga bilder har bytts på befintliga sidor.

## Nya och uppdaterade metadata

### [sweden-lake-house.html](https://lakehousedalarna.com/sweden-lake-house.html)

**Title:** Lake House in Sweden with Private Beach & Sauna | Dalarna

**Meta description:** Stay beside Lake Rogsjön in Dalarna: a private beach, sauna, boat and SUP, three bedrooms and space for six. Plan your Swedish summer and enquire directly.

### [de/ferienhaus-schweden.html](https://lakehousedalarna.com/de/ferienhaus-schweden.html)

**Title:** Ferienhaus in Schweden am See mit Sauna & Strand | Dalarna

**Meta description:** Privates Ferienhaus am Rogsjön in Dalarna: Sandstrand, Sauna, Boot und SUP. Drei Schlafzimmer für bis zu sechs Gäste. Sommerurlaub planen und direkt anfragen.

### [ski-holiday-sweden.html](https://lakehousedalarna.com/ski-holiday-sweden.html)

**Title:** Family Ski Holiday in Sweden | Lake House in Dalarna

**Meta description:** Combine family skiing at Bjursås with a private lakeside house near Falun. Three bedrooms, sauna and space for six. Not ski-in/ski-out; enquire directly.

### [de/skiurlaub-schweden.html](https://lakehousedalarna.com/de/skiurlaub-schweden.html)

**Title:** Skiurlaub in Schweden | Ferienhaus in Dalarna mit Sauna

**Meta description:** Familien-Skiurlaub mit privatem Ferienhaus am Rogsjön: drei Schlafzimmer, Sauna und Platz für sechs. Bjursås ca. 20 Autominuten entfernt. Direkt anfragen.

## Teknisk SEO och AI-läsbarhet

- Sitemap innehåller nu 13 kanoniska sidor. Nya sidor får rätt språkpar och x-default; språkparningen är ömsesidig både i HTML och sitemap.
- Separata canonical-URL:er och unika metadata skiljer sommar, vinter, husets detaljer och bokningsflöde åt. Og:url har kompletterats där den saknades; delningsrubrik, beskrivning och bild finns på de nya sidorna.
- Den tyska sommarsidans fristående VacationRental-schema har ersatts med samma WebSite/LodgingBusiness/WebPage-modell som övriga sajten. Tidigare precisionsuppgifter om koordinater, incheckningstid och språk som inte verifierades i denna granskning har inte förts över. Inga nya betyg, recensioner, erbjudanden eller priser har lagts i schema.
- Gemensam identitet för Lake House Dalarna/Solsidan Dalarna, sakliga egenskaper, kapacitet och storlek gör informationen konsekvent. FAQ-schema hämtas ur synliga frågor och svar. Viktiga fakta finns i statisk HTML även utan JavaScript.
- Robots.txt tillåter redan sökrobotar och OAI-SearchBot. Den har behållits, liksom befintliga språk-redirects och Search Console-verifiering. Inga specialfiler eller påstådda AI-rankingtrick har lagts till.
- Samtliga interna länkar, ankarlänkar och lokala bild-/skriptadresser i de 13 sidorna är kontrollerade. Ingen landningssida är isolerad. Externa leverantörers öppettider och indexeringsstatus har inte verifierats via deras konton.

## Direktbokning och mätning

Flödet är lediga datum/pris → bokningsförfrågan → personlig granskning → personlig bokningsbekräftelse. Nya gäster är uttryckligen välkomna att skicka direktförfrågan. Ingen automatisk bokning eller betalning har införts. De tidigare godkända prisreglerna är oförändrade.

Web3Forms är förberett men saknar fortfarande användarens publika accessnyckel. Den nuvarande mejlvägen är därför kvar och tydligt beskriven. Faktisk leverans via Web3Forms har inte testats mot mottagarens inkorg.

| Event | Vad det betyder |
|---|---|
| click_check_availability | Klick till egen bokningssida |
| start_booking_request | Första datumval eller formulärinteraktion per sidvisning |
| submit_booking_request | Formulärtjänsten har accepterat förfrågan; aktiveras när Web3Forms används |
| click_airbnb | Klick till Airbnb, inklusive recensioner |
| click_whatsapp | Klick till WhatsApp |

Alla dessa event kräver befintligt Analytics-samtycke. Inga namn, kontaktuppgifter, datum eller meddelanden skickas som eventparametrar. GA4-ID, konfiguration och egenskapsinställningar är oförändrade. Befintliga booking_click/airbnb_click/contact_click är kvar för kontinuitet. WhatsApp skickar endast click_whatsapp; det tidigare namnet whatsapp_click ersattes för att undvika dubbla WhatsApp-event. Historiska rapporter behöver jämföra båda namnen över ändringsdatumet. booking_request_email_handoff betyder bara att mejlappen öppnades, inte att en förfrågan mottagits. Ingen förfrågan räknas som en bekräftad bokning.

## Kontroller

- test_discovery.py: 13 indexerbara kanoniska sidor, exakt en H1 per sida, hreflang i båda riktningarna, ankarlänkar, lokala resurser, alt-texter, inga orphan pages, matchande FAQ-schema.
- test_languages.py och test_seo.py: befintliga språkversioner, metadata, schema och sökrobotåtkomst.
- test_pricing.cjs och test_booking_request.cjs: tidigare prisregler inklusive månadsrabatt/undantag, tillgänglighet, formulärvalidering och simulerad leverans/felhantering. Inga testmejl skickades.
- test_consent.cjs: befintligt samtycke och event samt ett enda click_whatsapp per klick.
- Visuell kontroll: engelska sommar-/vintersidor på dator och tyska sommar-/vintersidor på mobil. Menyplacering och kontrast på interna länkar korrigerades. Mobilens dokumentbredd överskred inte visningsbredden i den kontrollerade vintersidan.

## Ändrade filer

- `BOOKING-REQUEST.md`
- `SEO-REPORT-2026-09-24.md`
- `analytics-consent.js`
- `booking.html`
- `content/de-summer.html`
- `de/buchen/index.html`
- `de/ferienhaus-schweden.html`
- `de/ferienhaus/index.html`
- `de/index.html`
- `de/skiurlaub-schweden.html`
- `en/booking/index.html`
- `en/house/index.html`
- `en/index.html`
- `house.html`
- `i18n.js`
- `index.html`
- `scripts/build_landing_pages.py`
- `scripts/build_languages.py`
- `scripts/seo_markup.py`
- `scripts/test_consent.cjs`
- `scripts/test_discovery.py`
- `sitemap.xml`
- `ski-holiday-sweden.html`
- `style.css`
- `sv/boka/index.html`
- `sv/huset/index.html`
- `sv/index.html`
- `sweden-lake-house.html`

## Rekommenderade nästa steg — inte genomförda

1. Skicka den publika Web3Forms-nyckeln, aktivera tjänsten och verifiera ett riktigt test i inkorgen. Markera därefter submit_booking_request som nyckelhändelse i GA4.
2. Skicka den uppdaterade sitemap-adressen till Google Search Console och Bing Webmaster Tools och begär indexering för de tre nya sidorna. Kontoåtkomst/indexering ingick inte i denna publicering.
3. Följ impressions, sökfrågor, klick/CTR, engagerade besök och förfrågningar per landningssida, språk och land. Jämför under flera veckor; någon trafik- eller rankingökning kan ännu inte bekräftas.
4. Koppla senare manuellt godkända bokningar till inkomna förfrågningar. Mät inte en skickad förfrågan som en färdig bokning.
5. Först efter mätdata: överväg ytterligare språk eller innehåll. Ingen större redesign eller fler sidor utöver uppdraget har gjorts.

## Underlag

- Sakuppgifter: befintliga index.html, house.html och de/ferienhaus-schweden.html samt aktuella godkända bokningsregler.
- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features). Google anger att vanlig teknisk SEO och användbart innehåll är grunden; särskild AI-schema krävs inte. Indexering och synlighet är inte garanterade.
- [OpenAI: sökrobotar](https://developers.openai.com/api/docs/bots). Befintlig tillåtelse för OAI-SearchBot är kvar.
