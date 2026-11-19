"""Apply reciprocal alternates and sitemap entries to every public language cluster."""
from pathlib import Path
import re,json,html
from urllib.parse import quote
ROOT=Path(__file__).resolve().parents[1];BASE='https://lakehousedalarna.com/'
CLUSTERS=[
 {'en':'en/','sv':'sv/','de':'de/','nl-NL':'nl/'},
 {'en':'en/house/','sv':'sv/huset/','de':'de/ferienhaus/','nl-NL':'nl/het-huis/'},
 {'en':'en/booking/','sv':'sv/boka/','de':'de/buchen/','nl-NL':'nl/boeken/'},
 {'en':'en/explore-dalarna/','sv':'sv/upplev-dalarna/','de':'de/dalarna-entdecken/','nl-NL':'nl/ontdek-dalarna/'},
 {'en':'sweden-lake-house.html','de':'de/ferienhaus-schweden.html','nl-NL':'nl/vakantiehuis-zweden/'},
 {'en':'ski-holiday-sweden.html','de':'de/skiurlaub-schweden.html','nl-NL':'nl/skivakantie-zweden/'},
 {'en':'privacy/en.html','sv':'privacy/sv.html','de':'privacy/de.html','nl-NL':'privacy/nl.html'}]
def build():
 from seo_markup import add_markup
 urls=[]
 for cluster in CLUSTERS:
  alts={**cluster,'x-default':cluster['en']}
  head=''.join(f'<link rel="alternate" hreflang="{l}" href="{BASE+p}">' for l,p in alts.items())
  xml=''.join(f'<xhtml:link rel="alternate" hreflang="{l}" href="{BASE+p}"/>' for l,p in alts.items())
  for lang,route in cluster.items():
   p=ROOT/route/('index.html') if route.endswith('/') else ROOT/route
   text=p.read_text(encoding='utf-8')
   text=re.sub(r'((?:src|href)="/?(?:i18n|booking|analytics-consent|euro-estimate|house-photos|seo)\.js|href="/site-navigation\.css)(?:\?[^"<>]*)?"',r'\1?v=20261119-nl"',text)
   text=re.sub(r'<link\b[^>]*hreflang=[^>]+>','',text)
   text=text.replace('</head>',head+'</head>')
   if lang=='nl-NL':
    text=re.sub(r'https://wa.me/(\d+)\?text=[^"<>]*',lambda m:'https://wa.me/'+m[1]+'?text='+quote('Hallo! Ik ben geïnteresseerd in een verblijf bij Lake House Dalarna en heb een vraag.'),text)
    for src,dst in [('privacy/en.html','privacy/nl.html'),('sweden-lake-house.html','nl/vakantiehuis-zweden/'),('ski-holiday-sweden.html','nl/skivakantie-zweden/')]:
     text=re.sub(r'<a\b[^>]*>',lambda m:m[0] if re.search(r'\blang=',m[0]) else m[0].replace('href="/'+src+'"','href="/'+dst+'"'),text)
   if 'explore-dalarna/' in cluster['en']:
    desc=html.unescape(re.search('name="description" content="([^"]+)"',text)[1]);title=html.unescape(re.search('<title>(.*?)</title>',text)[1])
    text=text.replace('</head>',f'<meta property="og:title" content="{html.escape(title,quote=True)}"><meta property="og:description" content="{html.escape(desc,quote=True)}"><meta property="og:url" content="{BASE+route}"><meta property="og:locale" content="{dict(en="en_GB",sv="sv_SE",de="de_DE",**{"nl-NL":"nl_NL"})[lang]}"></head>')
    text=add_markup(text,lang,BASE+route,title,desc)
   if 'privacy/' in route:
    nav='<nav class="privacy-languages">'+''.join(f'<a href="/{v}" lang="{k}">{dict(en="English",sv="Svenska",de="Deutsch",**{"nl-NL":"Nederlands"})[k]}</a>' for k,v in cluster.items())+'</nav>'
    text=re.sub(r'<nav class="privacy-languages">.*?</nav>',lambda m:nav,text,flags=re.S)
   if cluster['en'] in ['sweden-lake-house.html','ski-holiday-sweden.html']:
    # Add the equivalent Dutch page to existing seasonal language controls.
    target=cluster['nl-NL'];link=f'<a href="/{target}" lang="nl-NL" aria-label="Nederlands"><small>NL</small></a>'
    text=re.sub(r'(<div class="language-switcher"[^>]*>)(.*?)(</div>)',lambda m:m[1]+m[2]+link+m[3],text,count=1,flags=re.S)
   p.write_text(re.sub(r'(?m)^[ \t]+$','',text),encoding='utf-8')
   urls.append(f'<url><loc>{BASE+route}</loc>{xml}</url>')
 (ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+''.join(urls)+'</urlset>',encoding='utf-8')
