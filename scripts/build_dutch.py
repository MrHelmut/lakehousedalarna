"""Translate supplementary pages using reviewed content/nl.json; keep shared layouts."""
import json,re,html
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
MAP={'en/':'nl/','en/house/':'nl/het-huis/','en/booking/':'nl/boeken/','en/explore-dalarna/':'nl/ontdek-dalarna/','sweden-lake-house.html':'nl/vakantiehuis-zweden/','ski-holiday-sweden.html':'nl/skivakantie-zweden/','privacy/en.html':'privacy/nl.html'}
class Dutch(HTMLParser):
 def __init__(self,d):super().__init__(convert_charrefs=True);self.d=d;self.out=[];self.stack=[];self.keys=[]
 def translate(self,s):
  k=re.sub(r'\s+',' ',html.unescape(s)).strip()
  if k and re.search('[A-Za-z]',k):self.keys.append(k)
  return re.match(r'^\s*',s)[0]+self.d.get(k,k)+re.search(r'\s*$',s)[0] if k else s
 def handle_decl(self,s):self.out.append('<!'+s+'>')
 def handle_comment(self,s):self.out.append('<!--'+s+'-->')
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=='html':a['lang']='nl-NL'
  for k in ['alt','title','placeholder','aria-label']:
   if a.get(k):a[k]=self.translate(a[k])
  if t=='meta' and (a.get('name')=='description' or a.get('property') in ['og:title','og:description']):a['content']=self.translate(a['content'])
  if a.get('property')=='og:locale':a['content']='nl_NL'
  for k in ['href','content']:
   v=a.get(k,'')
   if (t=='link' and a.get('hreflang')) or 'data-preview-language' in a or (t=='a' and a.get('lang')):continue
   for src,dst in sorted(MAP.items(),key=lambda x:-len(x[0])):
    for prefix in ['/', 'https://lakehousedalarna.com/']:
     if v==prefix+src or v.startswith(prefix+src+'#') or v.startswith(prefix+src+'?'):a[k]=v.replace(prefix+src,prefix+dst,1)
  self.out.append('<'+t+''.join(' '+k+('="'+html.escape(v,quote=True)+'"' if v is not None else '') for k,v in a.items())+'>')
  if t not in ['meta','link','img','input','br','hr','source','area','wbr']:self.stack.append(t)
 def handle_endtag(self,t):
  self.out.append('</'+t+'>')
  if t in self.stack:self.stack=self.stack[:len(self.stack)-1-self.stack[::-1].index(t)]
 def handle_data(self,s):
  if any(t in self.stack for t in ['script','style']):self.out.append(s)
  else:self.out.append(html.escape(self.translate(s),quote=False))
def build():
 from seo_markup import add_markup
 d=json.loads((ROOT/'content/nl.json').read_text(encoding='utf-8'))
 sources=[('scripts/explore/en.html','scripts/explore/nl.html'),('privacy/en.html','privacy/nl.html'),('sweden-lake-house.html','nl/vakantiehuis-zweden/index.html'),('ski-holiday-sweden.html','nl/skivakantie-zweden/index.html')]
 for src,dst in sources:
  p=Dutch(d);p.feed((ROOT/src).read_text(encoding='utf-8'));result=''.join(p.out)
  if dst=='scripts/explore/nl.html':
   result=result.replace('Photo credits for this preview','Fotobronnen')
  if dst=='privacy/nl.html':
   result=result.replace('href="/privacy/nl.html">English','href="/privacy/en.html">English')
  if dst.startswith('nl/'):
   result=re.sub(r'<script type="application/ld\+json">.*?</script>','',result,flags=re.S)
   result=add_markup(result,'nl','https://lakehousedalarna.com/'+dst.removesuffix('index.html'),html.unescape(re.search('<title>(.*?)</title>',result)[1]),html.unescape(re.search('name="description" content="([^"]+)"',result)[1]))
   result=result.replace('</head>',f'<link rel="alternate" hreflang="nl-NL" href="https://lakehousedalarna.com/{dst.removesuffix("index.html")}"></head>')
  target=ROOT/dst;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(result,encoding='utf-8')
if __name__=='__main__':build()
