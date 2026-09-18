from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
routes={'en':['en/','en/house/','en/booking/'],'sv':['sv/','sv/huset/','sv/boka/'],'de':['de/','de/ferienhaus/','de/buchen/']}
class Check(HTMLParser):
    def __init__(self): super().__init__();self.tags=[]
    def handle_starttag(self,t,a): self.tags.append((t,dict(a)))
for lang,paths in routes.items():
    for index,path in enumerate(paths):
        raw=(ROOT/path/'index.html').read_text(encoding='utf-8');p=Check();p.feed(raw)
        assert ('html',{'lang':lang,'data-static-language':lang,'data-page-source':['index.html','house.html','booking.html'][index]}) in p.tags
        canonical=[a['href'] for t,a in p.tags if t=='link' and a.get('rel')=='canonical']
        assert canonical==['https://lakehousedalarna.com/'+path],canonical
        alternates={a['hreflang']:a['href'] for t,a in p.tags if a.get('hreflang')}
        for l in routes: assert alternates[l]=='https://lakehousedalarna.com/'+routes[l][index]
        for t,a in p.tags:
            for key in ['src','href','poster','data-full']:
                val=a.get(key,'')
                if not val or val.startswith(('#','http','mailto:','tel:','data:')): continue
                assert val.startswith('/'),(path,key,val)
                target=ROOT/unquote(urlsplit(val).path).lstrip('/')
                assert target.exists(),(path,val)
        assert raw.count('data-language-switcher')==1
ET.parse(ROOT/'sitemap.xml')
print('PASS: 9 static pages, canonical, reciprocal languages, local assets and links, language controls, sitemap.')
