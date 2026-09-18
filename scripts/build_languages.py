"""Generate static translations from the shared root HTML and i18n.js dictionary.
Run with Python 3 from any directory. Root HTML remains the editable source.
"""
import json, subprocess, re, html
from pathlib import Path
from html.parser import HTMLParser
ROOT = Path(__file__).resolve().parents[1]
ROUTES = {'en': ['en/', 'en/house/', 'en/booking/'], 'sv': ['sv/', 'sv/huset/', 'sv/boka/'], 'de': ['de/', 'de/ferienhaus/', 'de/buchen/']}
SOURCE = ['index.html', 'house.html', 'booking.html']
BASE = 'https://lakehousedalarna.com/'
code = "const fs=require('fs'),vm=require('vm');const c={document:{addEventListener(){}},window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync(process.argv[1],'utf8')+';globalThis.data={translations:siteTranslations,meta:localizedPageMeta}',c);console.log(JSON.stringify(c.data));"
DATA = json.loads(subprocess.check_output(['node','-e',code,str(ROOT/'i18n.js')],text=True,encoding='utf-8'))

class Page(HTMLParser):
    def __init__(self, lang, page):
        super().__init__(convert_charrefs=True)
        self.lang,self.page,self.out,self.stack = lang,page,[],[]
    def text(self,s):
        key=re.sub(r'\s+',' ',html.unescape(s)).strip()
        translated=DATA['translations'].get(self.lang,{}).get(key)
        return (re.match(r'^\s*',s)[0]+translated+re.search(r'\s*$',s)[0]) if translated is not None else html.unescape(s)
    def handle_decl(self,d): self.out.append('<!'+d+'>')
    def handle_comment(self,d): self.out.append('<!--'+d+'-->')
    def handle_entityref(self,d): self.handle_data(html.unescape('&'+d+';'))
    def handle_charref(self,d): self.handle_data(html.unescape('&#'+d+';'))
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='html': a.update(lang=self.lang, **{'data-static-language':self.lang,'data-page-source':SOURCE[self.page]})
        if tag=='meta':
            meta=DATA['meta']['/'+SOURCE[self.page]][self.lang]
            if a.get('name')=='description' or a.get('property')=='og:description': a['content']=meta['description']
            if a.get('property')=='og:title': a['content']=meta['title']
            if a.get('property')=='og:url': a['content']=BASE+ROUTES[self.lang][self.page]
        if tag=='link' and a.get('rel')=='canonical': a['href']=BASE+ROUTES[self.lang][self.page]
        if tag=='link' and a.get('hreflang'):
            a['href']=BASE+ROUTES.get(a['hreflang'],ROUTES['en'])[self.page]
        for key in ['href','src','poster','data-full']:
            v=a.get(key,'')
            if v and not v.startswith(('#','/','http:','https:','mailto:','tel:','data:')):
                path=v.split('?')[0].split('#')[0]
                if path in SOURCE:
                    a[key]='/'+ROUTES[self.lang][SOURCE.index(path)]+('#'+v.split('#',1)[1] if '#' in v else '')
                else: a[key]='/'+v
        for key in ['alt','title','placeholder','aria-label']:
            if a.get(key): a[key]=self.text(a[key])
        if a.get('style'): a['style']=a['style'].replace('images/','/images/')
        self.out.append('<'+tag+''.join(' '+k+(('="'+html.escape(v,quote=True)+'"') if v is not None else '') for k,v in a.items())+'>')
        if tag not in ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']: self.stack.append(tag)
    def handle_endtag(self,tag):
        self.out.append('</'+tag+'>')
        if tag in self.stack: self.stack=self.stack[:len(self.stack)-1-self.stack[::-1].index(tag)]
    def handle_data(self,d):
        if self.stack and self.stack[-1]=='title': d=DATA['meta']['/'+SOURCE[self.page]][self.lang]['title']
        elif not any(t in self.stack for t in ['script','style']): d=self.text(d) if d.strip() else d
        self.out.append(d if any(t in self.stack for t in ['script','style']) else html.escape(d,quote=False))

for lang in ROUTES:
    for i,source in enumerate(SOURCE):
        p=Page(lang,i);p.feed((ROOT/source).read_text(encoding='utf-8'))
        result=''.join(p.out)
        locale={'en':'en_GB','sv':'sv_SE','de':'de_DE'}[lang]
        result=result.replace('</head>',f'<meta property="og:locale" content="{locale}"></head>')
        # Real crawlable language links also work without JavaScript.
        switch='<div class="language-switcher" data-language-switcher aria-label="Language">'+''.join(f'<a href="/{ROUTES[l][i]}" data-language="{l}" class="'+('active' if l==lang else '')+f'" aria-label="{label}"'+(' aria-current="true"' if l==lang else '')+f'><span class="flag flag-{l}" aria-hidden="true"></span><small>{l.upper()}</small></a>' for l,label in [('en','English'),('sv','Svenska'),('de','Deutsch')])+'</div>'
        result=result.replace('</nav>',switch+'</nav>',1)
        dest=ROOT/ROUTES[lang][i]/'index.html';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(result,encoding='utf-8')
urls=[]
for i in range(3):
    alternate=''.join(f'<xhtml:link rel="alternate" hreflang="{l}" href="{BASE+ROUTES[l][i]}"/>' for l in ROUTES)+f'<xhtml:link rel="alternate" hreflang="x-default" href="{BASE+ROUTES["en"][i]}"/>'
    urls += [f'<url><loc>{BASE+ROUTES[l][i]}</loc>{alternate}</url>' for l in ROUTES]
urls.append(f'<url><loc>{BASE}de/ferienhaus-schweden.html</loc></url>')
(ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+''.join(urls)+'</urlset>',encoding='utf-8')
print('Generated 9 static language pages and sitemap.')

