"""Build a quiet Swedish business-stay page using the site's existing design."""
import re, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
ROUTE = 'sv/foretagsvistelse/'
URL = 'https://lakehousedalarna.com/' + ROUTE
TITLE = 'Ledningsgrupp med övernattning nära Falun | Lake House Dalarna'
DESCRIPTION = 'Samla en liten ledningsgrupp vid Rogsjön i Dalarna. Eget hus med tre sovrum, gemensamma ytor och bastu. Personlig förfrågan för upp till sex gäster.'

def build():
    template = (ROOT/'sv/boende-skid-vm-falun-2027/index.html').read_text(encoding='utf-8')
    head = template[:template.index('</head>')]
    head = re.sub(r'<script type="application/ld\+json">.*?</script>', '', head, flags=re.S)
    head = re.sub(r'<link\b[^>]*hreflang=[^>]+>', '', head)
    head = re.sub(r'<title>.*?</title>', '<title>'+TITLE+'</title>', head)
    for attr, value in [('name="description"',DESCRIPTION),('property="og:title"',TITLE),('property="og:description"',DESCRIPTION),('property="og:url"',URL)]:
        head = re.sub(r'<meta '+attr+r' content="[^"]*">', '<meta '+attr+' content="'+value+'">', head)
    head = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="'+URL+'">', head)
    head = head.replace('winter-sunset-2026.webp', 'living-dining.jpg')
    graph = {'@context':'https://schema.org','@graph':[{'@type':'WebPage','@id':URL+'#webpage','url':URL,'name':TITLE,'description':DESCRIPTION,'inLanguage':'sv','about':{'@id':'https://lakehousedalarna.com/#lodging'}}]}
    head += '<script type="application/ld+json">'+json.dumps(graph,ensure_ascii=False)+'</script></head>'
    header = template[template.index('<body'):template.index('<main>')]
    # This page has no equivalent translations yet: don't suggest unrelated pages as alternates.
    header = re.sub(r'<div\b[^>]*data-language-switcher[^>]*>.*?</div>', '', header, flags=re.S)
    body = '''
<main>
<section class="seo-hero" style="background-image:url('/images/site/living-dining.jpg')">
<div class="seo-hero-overlay"></div><div class="seo-hero-content">
<p class="welcome">FÖRETAGS VISTELSE VID ROGSJÖN</p>
<h1>Tid att tänka tillsammans</h1>
<p>Samla en liten ledningsgrupp i ett eget hus vid sjön. Här finns plats för samtal runt matbordet, gemensamma måltider och en lugn kväll i bastun.</p>
<div class="hero-buttons"><a class="primary-btn vm-cta" href="/sv/boka/">Se datum och skicka förfrågan</a></div>
</div></section>
<section class="seo-section"><div class="seo-intro">
<h2>En mindre grupp, hela huset för er själva</h2>
<p>Lake House Dalarna ligger vid Rogsjön, cirka 25 minuter från Falun. Huset har omkring 200 m², tre sovrum, kök, matplats och vardagsrum med sjöutsikt. Här kan ni varva ert eget arbetsupplägg med pauser ute och tid tillsammans.</p>
<p>Huset tar emot högst sex gäster. Tre sovrum betyder att alla inte kan få eget rum. Se sovplatserna och bedöm tillsammans med oss om fördelningen passar er grupp.</p>
<p><a href="/sv/huset/">Se huset och sovplatserna →</a></p>
</div></section>
<section class="seo-section"><div class="seo-feature-grid">
<article><img src="/images/site/living-dining.jpg" alt="Matplats och vardagsrum med sjöutsikt" loading="lazy" decoding="async"><h2>Samtal med utrymme</h2><p>Samlas runt matbordet och ge plats åt frågor som behöver mer tid än vardagen brukar tillåta.</p></article>
<article><img src="/images/site/sauna-relax.jpg" alt="Bastu och relax i huset" loading="lazy" decoding="async"><h2>En lugn kväll tillsammans</h2><p>Avsluta dagen med gemensam matlagning, utsikt över sjön och en stund i bastun.</p></article>
<article><img src="/images/site/terrace-lake.jpg" alt="Terrass vid Rogsjön" loading="lazy" decoding="async"><h2>Vardagar och säsongsskiften</h2><p>Utforska en vistelse under vår eller höst, eller några vardagar när kalendern passar er. Aktuell tillgänglighet och pris finns på bokningssidan.</p></article>
</div></section>
<section class="seo-section"><div class="seo-intro">
<h2>Planera upplägget med oss</h2>
<p>Berätta vilka ni är, önskade datum, antal gäster och vad ni vill få ut av vistelsen. Om ni behöver särskild mötesutrustning, uppkoppling för videomöten eller andra arrangemang, stäm av det med oss innan ni bokar.</p>
<p>Vistelsen gäller boende i huset. Vi utlovar inget konferenspaket, catering eller särskild mötesservice. Samma husregler gäller som vid övriga vistelser: inga fester eller större sammankomster.</p>
<h2>Personlig förfrågan och bekräftelse</h2>
<p>Välj datum och antal gäster för ett uppskattat totalpris inklusive städning och sängkläder. Beskriv ert upplägg i förfrågan. Vi svarar personligen med tillgänglighet, slutpris och bokningsvillkor.</p>
<p>Ingen betalning görs när ni skickar förfrågan. Vistelsen är bekräftad först när ni har fått vår personliga bokningsbekräftelse.</p>
<div class="vm-booking-actions"><a class="primary-btn vm-cta" href="/sv/boka/">Se lediga datum och pris</a></div>
</div></section>
</main>
<footer><div class="footer-content"><h2>Lake House Dalarna</h2><p>Solsidan Dalarna · Rogsjön · Falun</p><div class="footer-links"><a href="/sv/">Hem</a><a href="/sv/huset/">Huset</a><a href="/sv/boka/">Lediga datum och pris</a><a href="/privacy/sv.html" data-privacy-link>Integritet</a></div><p class="copyright">© 2026 Lake House Dalarna</p></div></footer><script src="/navigation.js?v=20260917-nav-spacing"></script></body></html>
'''.replace('FÖRETAGS VISTELSE','FÖRETAGSVISTELSE')
    dest = ROOT/ROUTE/'index.html'; dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(head+header+body,encoding='utf-8')
    for path in ['sv/index.html','sv/huset/index.html']:
        file = ROOT/path; text = file.read_text(encoding='utf-8')
        if 'href="/'+ROUTE+'"' not in text:
            text = text.replace('<div class="footer-links">','<div class="footer-links"><a href="/'+ROUTE+'">Företagsvistelser</a>',1)
        file.write_text(text,encoding='utf-8')
    sitemap = ROOT/'sitemap.xml'; text = sitemap.read_text(encoding='utf-8')
    if '<loc>'+URL+'</loc>' not in text:
        text = text.replace('</urlset>','<url><loc>'+URL+'</loc></url></urlset>')
    sitemap.write_text(text,encoding='utf-8')

if __name__ == '__main__': build()
