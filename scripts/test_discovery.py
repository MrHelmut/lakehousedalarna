from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote,urljoin
import xml.etree.ElementTree as ET
import re,json,html
R=Path(__file__).resolve().parents[1];B='https://lakehousedalarna.com/'
class Tags(HTMLParser):
 def __init__(self,text):super().__init__();self.tags=[];self.feed(text)
 def handle_starttag(self,t,a):self.tags.append((t,dict(a)))
xml=ET.parse(R/'sitemap.xml');ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'};urls=[n.text for n in xml.findall('.//s:loc',ns)];assert len(urls)==13
pages={};incoming={u:set() for u in urls}
for url in urls:
 rel=url.removeprefix(B);f=R/rel/('index.html' if rel.endswith('/') else '') if rel.endswith('/') else R/rel
 raw=f.read_text(encoding='utf-8');tags=Tags(raw).tags;pages[url]=(raw,tags)
 assert len(re.findall(r'<h1(?:\s[^>]*)?>',raw))==1,url
 assert 'noindex' not in raw.lower(),url
 assert not re.search(r'new guests should|only for returning|estimates for returning guests',raw,re.I),url
 assert [a['href'] for t,a in tags if a.get('rel')=='canonical']==[url]
 assert any(a.get('property')=='og:url' and a.get('content')==url for t,a in tags),url
 for t,a in tags:
  if t=='img':assert a.get('alt','').strip(),(url,'missing alt')
  for k in ['href','src','poster']:
   val=a.get(k,'');absurl=urljoin(url,val);parts=urlsplit(absurl)
   if not val or parts.netloc!='lakehousedalarna.com' or parts.scheme not in ('http','https'):continue
   target=R/unquote(parts.path).lstrip('/');assert target.exists(),(url,val)
   if absurl.split('#')[0] in incoming:incoming[absurl.split('#')[0]].add(url)
   if parts.fragment:
    if target.is_dir():target=target/'index.html'
    if target.suffix=='.html':assert re.search(r'id=[\"\']'+re.escape(parts.fragment)+r'[\"\']',target.read_text(encoding='utf-8')),(url,val,'fragment')
 scripts=re.findall(r'<script type="application/ld\+json">(.*?)</script>',raw,re.S)
 assert len(scripts)==1,url
 graph=json.loads(scripts[0])['@graph'];assert next(n for n in graph if n['@type']=='WebPage')['url']==url
 clean=html.unescape(re.sub('<[^>]+>',' ',raw));clean=re.sub(r'\s+',' ',clean)
 for n in graph:
  assert 'aggregateRating' not in n
  if n['@type']=='FAQPage':
   for qa in n['mainEntity']:
    assert qa['name'] in clean,(url,qa['name'])
    assert re.sub(r'\s+',' ',qa['acceptedAnswer']['text']) in clean,url
for url,(raw,tags) in pages.items():
 for t,a in tags:
  if a.get('hreflang') and a['hreflang']!='x-default':
   alt=a['href'];assert alt in pages,(url,alt)
   assert any(b.get('href')==url and b.get('hreflang') for _,b in pages[alt][1]),(url,'nonreciprocal')
 assert incoming[url]-{url},(url,'orphan')
for rel in ['ski-holiday-sweden.html','de/skiurlaub-schweden.html']:
 raw=(R/rel).read_text(encoding='utf-8');assert 'ski-in/ski-out' in raw.lower();assert '20' in raw and '40' in raw
assert 'click_whatsapp' in (R/'analytics-consent.js').read_text(encoding='utf-8')
print('PASS: 13 indexable canonical pages, one H1, local assets/links/fragments, alt text, reciprocal hreflang, no orphans, matching FAQ schema and seasonal disclosures.')
