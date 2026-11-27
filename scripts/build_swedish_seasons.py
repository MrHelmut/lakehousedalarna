"""Swedish equivalents of the existing summer and winter landing pages."""
from pathlib import Path
from html import escape as e
import re
from seo_markup import add_markup

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://lakehousedalarna.com/'
PAGES = [
    dict(route='sv/semesterhus-vid-sjo/', title='Semesterhus vid sjö i Dalarna med bastu | Lake House Dalarna',
         description='Hyr hela huset vid Rogsjön nära Falun. Egen sandstrand, bastu, tre sovrum och plats för sex gäster. Planera sommar, vår eller höst och fråga direkt.',
         h1='Semesterhus vid sjö i Dalarna', tag='SOMMAR OCH LUGNA DAGAR VID SJÖN', image='images/hero.png',
         intro='Vakna med utsikt över Rogsjön, samlas på terrassen och avsluta dagen i er egen bastu. Lake House Dalarna, även känt som Solsidan Dalarna, är ett privat semesterhus nära Falun för familjer och mindre sällskap.',
         sections=[
             ('Egen sandstrand och plats att vara tillsammans', 'Den privata sandstranden ligger omkring 25 meter från huset. Här kan ni bada, ta en tur med SUP eller tillbringa dagen med utsikt över vattnet. Båt och flytvästar ingår; gäster betalar för använd bensin och fyller på före avresa. Barn behöver tillsyn nära sjön.'),
             ('Hela huset för upp till sex gäster', 'Ni hyr hela huset med cirka 200 m², tre sovrum, kök och gemensamma ytor. Bastu och relax finns i huset. Tvättmaskin underlättar längre vistelser, barnstol finns och spjälsäng kan efterfrågas. Högst sex gäster gäller totalt, inklusive barn.'),
             ('Vår och höst vid Rogsjön', 'En vistelse vid sjön behöver inte kretsa kring bad. Under vår och höst kan ni kombinera utflykter i Dalarna med gemensam matlagning, sjöutsikt och bastukvällar. Välj aktiviteter efter väder och årstid. Kalendern visar vilka datum som går att fråga om; vi bekräftar alltid tillgängligheten personligen.'),
             ('Utflykter och resan hit', 'Falun ligger ungefär 25 minuter bort med bil. Stockholm och Arlanda ligger omkring tre timmars bilresa från huset. Restiderna är ungefärliga och påverkas av trafik och väder. Bil underlättar utflykter i området.')],
         faqs=[('Hyr vi hela huset?', 'Ja. Hela huset är för ert sällskap, med tre sovrum och plats för högst sex gäster inklusive barn.'),
               ('Finns bastu och egen strand?', 'Ja. Huset har privat bastu och relax. Den privata sandstranden ligger omkring 25 meter från huset vid Rogsjön.'),
               ('Kan vi komma under vår eller höst?', 'Ja, när kalendern medger det. Skicka önskade datum och antal gäster så bekräftar vi tillgänglighet och slutpris personligen.'),
               ('Hur bokar vi direkt?', 'Välj datum och gäster på bokningssidan och skicka en förfrågan. Ingen betalning görs då. Vistelsen är bekräftad först när ni har fått vår personliga bokningsbekräftelse.')]),
    dict(route='sv/skidsemester-dalarna/', title='Skidsemester i Dalarna med eget hus och bastu | Lake House Dalarna',
         description='Bo vid Rogsjön nära Falun och kombinera skidåkning i Bjursås med eget hus, bastu och tre sovrum för sex gäster. Se datum och fråga om er vintervistelse.',
         h1='Skidsemester i Dalarna med eget hus och bastu', tag='VINTER VID ROGSJÖN', image='images/site/frozen-lake.jpg',
         intro='Skiddagar tillsammans och lugna kvällar vid sjön. På Lake House Dalarna bor ni i ett eget hus med bastu, kamin och sjöutsikt, med plats för upp till sex gäster i tre sovrum.',
         sections=[
             ('Bjursås på dagen, bastu på kvällen', 'Bjursås Berg & Sjö ligger omkring 20 minuter bort med bil. Huset ligger vid Rogsjön och ni behöver bil till skidområdet. Efter en dag ute finns kök, matplats och vardagsrum för en gemensam kväll i huset.'),
             ('Planera skidåkningen efter förhållandena', 'Romme Alpin ligger ungefär 40 minuter bort med bil och Lugnet i Falun omkring 25 minuter. Sörskog är också ett lokalt alternativ för längdskidåkning. Kontrollera öppettider, snöläge, skidlektioner och uthyrning hos respektive anläggning innan ni planerar dagen. Räkna med extra restid vid vinterväglag.'),
             ('Vinterdagar även utan skidor', 'Låt bastu, gemensam matlagning och utsikten över sjön bli en del av vistelsen. Snö och bärig naturis kan inte garanteras. En frusen yta betyder inte att sjön är säker att beträda; aktuella isförhållanden måste bedömas innan någon går ut på isen.'),
             ('Utrymme för familjen', 'Huset har omkring 200 m², tre sovrum och tvättmaskin. Högst sex gäster gäller totalt, inklusive barn. Ni hyr hela huset och får ett uppskattat totalpris på bokningssidan. Städning och sängkläder ingår i det visade totalpriset.')],
         faqs=[('Ligger huset vid skidbacken?', 'Nej. Huset ligger vid Rogsjön. Bil behövs för att ta sig till skidområdena; Bjursås ligger omkring 20 minuter bort.'),
               ('Är snö och skridskoåkning garanterade?', 'Nej. Snö och naturis beror på vädret. Sjön får bara användas när aktuella isförhållanden har bedömts som säkra.'),
               ('Hur många kan bo i huset?', 'Huset har tre sovrum och tar emot högst sex gäster totalt, inklusive barn.'),
               ('Kan vi skicka en direktförfrågan som nya gäster?', 'Ja. Både nya och återkommande gäster kan fråga direkt. Vi granskar förfrågan personligen och bekräftar vistelsen separat.')])
]

def build():
    template = (ROOT/'sv/foretagsvistelse/index.html').read_text(encoding='utf-8')
    header = template[template.index('<body'):template.index('<main>')]
    links = '<a href="/sv/semesterhus-vid-sjo/">Sommar, vår och höst vid sjön</a><a href="/sv/skidsemester-dalarna/">Skidsemester i Dalarna</a><a href="/sv/foretagsvistelse/">Företagsvistelser</a><a href="/sv/upplev-dalarna/">Upplev Dalarna</a>'
    for page in PAGES:
        url = BASE + page['route']
        head = template[:template.index('</head>')]
        head = re.sub(r'<script type="application/ld\+json">.*?</script>', '', head, flags=re.S)
        head = re.sub(r'<link\b[^>]*hreflang=[^>]+>', '', head)
        head = re.sub(r'<link rel="preload" as="image" href="[^"]*">', '<link rel="preload" as="image" href="/'+page['image']+'">', head)
        head = re.sub(r'<title>.*?</title>', '<title>'+e(page['title'])+'</title>', head)
        for attr, value in [('name="description"', page['description']), ('property="og:title"', page['title']), ('property="og:description"', page['description']), ('property="og:url"', url), ('property="og:image"', BASE+page['image'])]:
            head = re.sub(r'<meta '+attr+r' content="[^"]*">', '<meta '+attr+' content="'+e(value, quote=True)+'">', head)
        head = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="'+url+'">', head) + '</head>'
        sections = ''.join('<section class="seo-section"><div class="seo-intro"><h2>'+e(h)+'</h2><p>'+e(p)+'</p></div></section>' for h,p in page['sections'])
        faq = '<section class="seo-section"><h2>Vanliga frågor</h2><div class="seo-faq">'+''.join('<h3>'+e(q)+'</h3><p>'+e(a)+'</p>' for q,a in page['faqs'])+'</div></section>'
        body = f'''<main><section class="seo-hero" style="background-image:url('/{page['image']}')"><div class="seo-hero-overlay"></div><div class="seo-hero-content"><p class="welcome">{e(page['tag'])}</p><h1>{e(page['h1'])}</h1><p>{e(page['intro'])}</p><div class="hero-buttons"><a class="primary-btn" href="/sv/boka/">Se lediga datum och pris</a><a class="secondary-btn" href="/sv/huset/">Se huset och sovplatserna</a></div></div></section>{sections}<section class="seo-section"><h2>Planera er vistelse</h2><p>Välj datum och antal gäster för ett uppskattat totalpris. Skicka sedan en personlig förfrågan. Ingen betalning görs när ni frågar, och vistelsen är bekräftad först när ni har fått vår personliga bokningsbekräftelse.</p><a class="primary-btn" href="/sv/boka/">Se datum och skicka förfrågan</a></section>{faq}<section class="seo-section"><h2>Utforska er vistelse</h2><div class="footer-links">{links}</div></section></main><footer><div class="footer-content"><h2>Lake House Dalarna</h2><p>Solsidan Dalarna · Rogsjön · Falun</p><div class="footer-links"><a href="/sv/">Hem</a><a href="/sv/huset/">Huset</a><a href="/sv/boka/">Lediga datum och pris</a></div><p class="copyright">© 2026 Lake House Dalarna</p></div></footer><script src="/navigation.js?v=20260917-nav-spacing"></script></body></html>'''
        result = add_markup(head+header+body, 'sv', url, page['title'], page['description'])
        dest = ROOT/page['route']/'index.html'
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(result, encoding='utf-8')
    for file in (ROOT/'sv').rglob('index.html'):
        text = file.read_text(encoding='utf-8')
        for old,new in [('sweden-lake-house.html','sv/semesterhus-vid-sjo/'),('ski-holiday-sweden.html','sv/skidsemester-dalarna/')]:
            text = re.sub(r'<a\b[^>]*>', lambda m: m[0].replace('href="/'+old+'"','href="/'+new+'"') if not re.search(r'\blang=',m[0]) else m[0], text)
        file.write_text(text, encoding='utf-8')

if __name__ == '__main__':
    build()
