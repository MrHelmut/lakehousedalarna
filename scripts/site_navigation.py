"""Shared, translated navigation for core pages and destination guides."""
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ROUTES={'sv':'sv/upplev-dalarna/','en':'en/explore-dalarna/','de':'de/dalarna-entdecken/'}
CORE={'sv':['sv/','sv/huset/','sv/boka/'],'en':['en/','en/house/','en/booking/'],'de':['de/','de/ferienhaus/','de/buchen/']}
def nav(lang,page):
 labels={'sv':['Hem','Galleri','Huset','Upplev Dalarna'],'en':['Home','Gallery','The House','Explore Dalarna'],'de':['Startseite','Galerie','Das Haus','Dalarna entdecken']}[lang]
 links=['/'+CORE[lang][0]+'#home','/'+CORE[lang][0]+'#gallery','/'+CORE[lang][1],'/'+ROUTES[lang]]
 active={0:0,1:2,3:3}.get(page)
 menu=''.join(f'<a href="{url}"'+(' aria-current="page"' if i==active else '')+f'>{labels[i]}</a>' for i,url in enumerate(links))
 langs=''.join(f'<a href="/{ROUTES[l] if page==3 else CORE[l][page]}" lang="{l}" hreflang="{l}"'+(' aria-current="true"' if l==lang else '')+f'>{l.upper()}</a>' for l in CORE)
 return f'<nav class="navbar site-navbar" aria-label="{dict(sv="Huvudmeny",en="Main navigation",de="Hauptnavigation")[lang]}"><a class="site-brand" href="/{lang}/">Lake House Dalarna<small>SOLSIDAN DALARNA</small></a><div class="site-menu">{menu}</div><div class="site-languages" data-language-switcher aria-label="Language">{langs}</div></nav>'
def apply(page,lang,kind):
 if kind==3:
  page=re.sub(r'<header>.*?</header>',lambda m:'<header class="guide-header">'+nav(lang,kind)+'</header>',page,flags=re.S)
 else:
  page=re.sub(r'<nav class="navbar(?: site-navbar)?".*?</nav>',lambda m:nav(lang,kind),page,count=1,flags=re.S)
 page=page.replace('/en/explore-dalarna/','/'+ROUTES[lang]) if kind!=3 else page
 if '/site-navigation.css' not in page:page=page.replace('</head>','<link rel="stylesheet" href="/site-navigation.css?v=20261106"></head>')
 return page
def build():
 for lang,paths in CORE.items():
  for kind,route in enumerate(paths+[ROUTES[lang]]):
   p=ROOT/route/'index.html';p.write_text(apply(p.read_text(encoding='utf-8'),lang,kind),encoding='utf-8')
