"""Regression checks for VM landing pages and their booking hand-off."""
from pathlib import Path
import json,re,sys,html
from html.parser import HTMLParser
from urllib.parse import urlsplit
from build_vm import ROUTES,BOOK
R=Path(__file__).resolve().parents[1]
data=json.loads((R/'content/vm-2027.json').read_text(encoding='utf-8'))
class Page(HTMLParser):
 def __init__(self,s):super().__init__();self.tags=[];self.feed(s)
 def handle_starttag(self,t,a):self.tags.append((t,dict(a)))
for lang,route in ROUTES.items():
 raw=(R/route/'index.html').read_text(encoding='utf-8');tags=Page(raw).tags
 assert len([t for t,a in tags if t=='h1'])==1
 assert 'noindex' not in raw and 'Förslag' not in raw
 assert any(t=='script' and a.get('src','').startswith('/analytics-consent.js') for t,a in tags)
 assert any(t=='a' and a.get('href')=='/'+BOOK[lang]+'?month=2027-02#availability' for t,a in tags)
 assert all(any(t=='a' and a.get('href')=='/'+r for t,a in tags) for r in ROUTES.values())
 for t,a in tags:
  for key in ['href','src']:
   val=a.get(key,'')
   if val.startswith('/'):
    assert (R/urlsplit(val).path.lstrip('/')).exists(),(route,val)
   if val.startswith('#'):assert f'id="{val[1:]}"' in raw,(route,val)
 graph=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',raw,re.S)[1])['@graph']
 faq=next(x for x in graph if x['@type']=='FAQPage')['mainEntity']
 assert [[x['name'],x['acceptedAnswer']['text']] for x in faq]==data[lang]['faq']
 visible=[[html.unescape(q),html.unescape(a)] for q,a in re.findall(r'<summary>(.*?)</summary><p>(.*?)</p>',raw,re.S)]
 assert visible==data[lang]['faq']
 home=(R/lang/'index.html').read_text(encoding='utf-8')
 assert f'href="/{route}"' in home
 assert '/stad/' not in raw
print('PASS: four VM pages, single heading, translated navigation, booking hand-off, consent analytics, local links and matching visible/schema FAQ.')
