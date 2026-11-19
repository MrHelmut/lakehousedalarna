"""Check crawlable translations, metadata, reciprocal alternates and local targets."""
import json,re,sys
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
from finalize_languages import CLUSTERS,BASE
R=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self,s):super().__init__();self.tags=[];self.feed(s)
 def handle_starttag(self,t,a):self.tags.append((t,dict(a)))
count=0
for cluster in CLUSTERS:
 for lang,route in cluster.items():
  p=R/route/'index.html' if route.endswith('/') else R/route
  raw=p.read_text(encoding='utf-8');tags=Page(raw).tags;count+=1
  assert [a['href'] for t,a in tags if t=='link' and a.get('rel')=='canonical']==[BASE+route],route
  alts={a['hreflang']:a['href'] for t,a in tags if t=='link' and a.get('hreflang')}
  assert alts=={**{l:BASE+v for l,v in cluster.items()},'x-default':BASE+cluster['en']},(route,alts)
  assert 'noindex' not in raw.lower(),route
  assert next(a['lang'] for t,a in tags if t=='html')==lang,route
  if lang=='nl-NL':
   assert any(t=='a' and a.get('href')=='/'+cluster['en'] for t,a in tags),(route,'English language switch missing')
  for t,a in tags:
   for k in ['href','src','poster']:
    v=a.get(k,'');parts=urlsplit(v)
    if not v or not v.startswith('/') or v.startswith('//'):continue
    target=R/unquote(parts.path).lstrip('/')
    assert target.exists(),(route,v)
   if lang=='nl-NL' and t=='a' and not a.get('lang') and not a.get('data-language'):
    assert not re.match(r'^/(en/|privacy/en)',a.get('href','')),(route,'English internal link',a)
  if not route.startswith('privacy/'):
   for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>',raw,re.S):
    graph=json.loads(block)['@graph'];page=next(n for n in graph if n['@type']=='WebPage')
    assert page['url']==BASE+route,(route,page)
    assert page['inLanguage']==lang,(route,page)
d=json.loads((R/'content/nl.json').read_text(encoding='utf-8'))
for k,v in d.items():assert sorted(re.findall(r'\{\w+\}',k))==sorted(re.findall(r'\{\w+\}',v)),k
sys.path.insert(0,str(R/'scripts'))
from build_dutch import Dutch
for src in ['index.html','house.html','booking.html','scripts/explore/en.html','privacy/en.html','sweden-lake-house.html','ski-holiday-sweden.html']:
 p=Dutch(d);p.feed((R/src).read_text(encoding='utf-8'))
 missing=sorted(set(p.keys)-set(d));assert not missing,(src,missing)
print(f'PASS: {count} pages, self canonicals, complete reciprocal hreflang, nl-NL, local links/assets, schema, translation coverage and placeholders.')
