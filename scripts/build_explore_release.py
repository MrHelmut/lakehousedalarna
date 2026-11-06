"""Build the three destination guides and link them from the core site."""
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
ROUTES = {'sv':'sv/upplev-dalarna/', 'en':'en/explore-dalarna/', 'de':'de/dalarna-entdecken/'}
PREVIEWS = {'sv':'upplev-dalarna-preview.html','en':'explore-dalarna-preview.html','de':'dalarna-entdecken-preview.html'}
LABELS = {'sv':'Upplev Dalarna','en':'Explore Dalarna','de':'Dalarna entdecken'}
BASE = 'https://lakehousedalarna.com/'
def build():
    alternate = ''.join(f'<link rel="alternate" hreflang="{l}" href="{BASE+r}">' for l,r in ROUTES.items()) + f'<link rel="alternate" hreflang="x-default" href="{BASE+ROUTES["en"]}">'
    for lang,route in ROUTES.items():
        page=(ROOT/'scripts/explore'/f'{lang}.html').read_text(encoding='utf-8')
        page=re.sub(r'<meta name="robots"[^>]*>', '', page)
        page=re.sub(r'<title>.*?</title>',f'<title>{LABELS[lang]} | Lake House Dalarna</title>',page)
        page=re.sub(r'<div class="preview">.*?</div>','',page)
        page=page.replace('/explore-preview.css','/explore.css')
        for l,old in PREVIEWS.items():page=page.replace('/'+old,'/'+ROUTES[l])
        page=page.replace('data-preview-language','data-guide-language')
        page=re.sub(r'(<details class="credits"><summary>).*?(</summary>)',r'\g<1>'+{'sv':'Bildkällor','en':'Photo credits','de':'Bildnachweise'}[lang]+r'\2',page)
        page=re.sub(r'(<details class="credits"><summary>.*?</summary>)<p>.*?</p>',r'\1',page)
        page=re.sub(r' · (?:endast förhandsvisning, publiceringsrätt ej klarerad|preview only, publication rights not cleared|nur Vorschau, Veröffentlichungsrechte nicht geklärt)','',page)
        page=page.replace('</head>',f'<link rel="canonical" href="{BASE+route}">{alternate}</head>')
        target=ROOT/route/'index.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(page,encoding='utf-8')
        for core in {'sv':['sv/index.html','sv/huset/index.html','sv/boka/index.html'],'en':['en/index.html','en/house/index.html','en/booking/index.html'],'de':['de/index.html','de/ferienhaus/index.html','de/buchen/index.html']}[lang]:
            path=ROOT/core;text=path.read_text(encoding='utf-8')
            if 'data-explore-link' not in text:
                text=text.replace('</footer>',f'<p data-explore-link><a href="/{route}">{LABELS[lang]} →</a></p></footer>',1)
                path.write_text(text,encoding='utf-8')
    path=ROOT/'sitemap.xml';xml=path.read_text(encoding='utf-8')
    for route in ROUTES.values():
        if f'<loc>{BASE+route}</loc>' not in xml:xml=xml.replace('</urlset>',f'<url><loc>{BASE+route}</loc></url></urlset>')
    path.write_text(xml,encoding='utf-8')
if __name__=='__main__':build()
