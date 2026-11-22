"""Build the approved Falun 2027 landing pages without altering the shared design."""
from pathlib import Path
import json,re,html
ROOT=Path(__file__).resolve().parents[1]
BASE='https://lakehousedalarna.com'
ROUTES={'en':'en/falun-2027-accommodation/','sv':'sv/boende-skid-vm-falun-2027/','de':'de/unterkunft-ski-wm-falun-2027/','nl':'nl/accommodatie-wk-ski-falun-2027/'}
BOOK={'en':'en/booking/','sv':'sv/boka/','de':'de/buchen/','nl':'nl/boeken/'}
HOUSE={'en':'en/house/','sv':'sv/huset/','de':'de/ferienhaus/','nl':'nl/het-huis/'}
def build():
 data=json.loads((ROOT/'content/vm-2027.json').read_text(encoding='utf-8'))
 for lang,d in data.items():
  e=lambda s:html.escape(s,quote=True)
  url=BASE+'/'+ROUTES[lang];booking='/'+BOOK[lang]+'?month=2027-02#availability'
  # Reuse the actual localized header, including accessible mobile navigation.
  home=(ROOT/lang/'index.html').read_text(encoding='utf-8')
  header='<header class="request-header">'+re.search(r'<nav\b.*?</nav>',home,re.S)[0]+'</header>'
  header=re.sub(r'href="/'+re.escape(BOOK[lang])+r'"','href="'+booking+'"',header)
  # Language links must lead to the corresponding VM page, not the homepage.
  def switch_links(match):
   block=match[0]
   for l,r in ROUTES.items():block=block.replace('href="/'+l+'/"','href="/'+r+'"')
   return block
  header=re.sub(r'<div[^>]*data-language-switcher[^>]*>.*?</div>',switch_links,header,flags=re.S)
  header=header.replace(' aria-current="page"','')
  image=BASE+'/images/site/winter-sunset-2026.webp'
  head=f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(d["title"])}</title><meta name="description" content="{e(d["description"])}"><link rel="canonical" href="{url}"><meta property="og:title" content="{e(d["title"])}"><meta property="og:description" content="{e(d["description"])}"><meta property="og:url" content="{url}"><meta property="og:type" content="website"><meta property="og:image" content="{image}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/style.css?v=20260924-mobile-layout"><link rel="stylesheet" href="/fonts-local.css"><link rel="stylesheet" href="/site-navigation.css?v=20261119-nl"><link rel="stylesheet" href="/consent.css?v=20260924-auto-map"><link rel="stylesheet" href="/vm-2027.css?v=20261122-travel"><script defer src="/analytics-consent.js?v=20261119-nl"></script>'
  main=f'<main><section class="seo-hero" style="background-image:url(\'/images/site/winter-sunset-2026.webp\')"><div class="seo-hero-overlay"></div><div class="seo-hero-content"><p class="welcome">{e(d["dates"])}</p><h1>{e(d["heading"])}</h1><p>{e(d["intro"])}</p><div class="hero-buttons"><a class="primary-btn vm-cta" href="{booking}">{e(d["cta"])}</a><a class="secondary-btn vm-cta" href="#house">{e(d["discover"])}</a></div></div></section>'
  main+=f'<section class="seo-section" id="house"><div class="seo-intro"><h2>{e(d["houseHeading"])}</h2><p>{e(d["houseText"])}</p><div class="vm-facts">'+''.join('<span>'+e(s)+'</span>' for s in d['facts'])+'</div></div></section>'
  main+='<section class="seo-section"><div class="seo-feature-grid">'
  for file,c in zip(['winter-window.png','relax-lake-view-2026.webp','living-dining.jpg'],d['cards']):
   main+=f'<article><img src="/images/site/{file}" alt="{e(c[0])}" loading="lazy" decoding="async"><h2>{e(c[1])}</h2><p>{e(c[2])}</p></article>'
  main+='</div></section>'
  airport='https://www.swedavia.se/arlanda/hyrbil/' if lang=='sv' else 'https://www.swedavia.com/arlanda/carrental/'
  main+=f'<section class="seo-section" id="getting-here"><div class="seo-intro"><h2>{e(d["arrivalHeading"])}</h2><p>{e(d["arrivalText"])}</p><p><a href="{airport}" target="_blank" rel="noopener noreferrer">{e(d["airportLink"])}</a></p></div></section>'
  main+='<section class="seo-section"><div class="seo-intro"><h2>'+e(d['travelHeading'])+'</h2>'+''.join('<p>'+e(p)+'</p>' for p in d['travel'])+f'<p><a href="https://falun2027.com/{"sv" if lang=="sv" else "en"}/" target="_blank" rel="noopener noreferrer">{e(d["official"])}</a></p></div></section>'
  main+='<section class="seo-section"><div class="seo-intro"><h2>'+e(d['bookingHeading'])+'</h2>'+''.join('<p>'+e(p)+'</p>' for p in d['booking'])+f'<div class="vm-booking-actions"><a class="primary-btn vm-cta" href="{booking}">{e(d["request"])}</a></div><p><a href="/{lang}/#reviews">{e(d["reviews"])}</a></p><p><a href="https://wa.me/46703021094">{e(d["whatsapp"])}</a></p><p class="vm-note"><a href="https://airbnb.com/h/solsidan-dalarna" target="_blank" rel="noopener noreferrer">{e(d["airbnb"])}</a></p></div></section>'
  quote=f'<figure class="vm-guest-quote" id="guest-review"><blockquote><p>“{e(d["reviewQuote"])}”</p></blockquote><figcaption>{e(d["reviewAttribution"])}</figcaption></figure>'
  main=main.replace('<div class="vm-booking-actions">',quote+'<div class="vm-booking-actions">')
  main+='<section class="guest-faq seo-section" id="guest-questions"><h2>'+e(d['faqHeading'])+'</h2>'+''.join('<details><summary>'+e(q)+'</summary><p>'+e(a)+'</p></details>' for q,a in d['faq'])+'</section></main>'
  graph={'@context':'https://schema.org','@graph':[{'@type':'WebPage','@id':url+'#webpage','url':url,'name':d['title'],'description':d['description'],'inLanguage':lang,'about':{'@id':BASE+'/#lodging'}},{'@type':'LodgingBusiness','@id':BASE+'/#lodging','name':'Lake House Dalarna','alternateName':'Solsidan Dalarna','url':BASE+'/','image':image,'address':{'@type':'PostalAddress','addressLocality':'Falun','addressRegion':'Dalarna','addressCountry':'SE'},'containsPlace':{'@type':'Accommodation','numberOfBedrooms':3,'occupancy':{'@type':'QuantitativeValue','value':6}}},{'@type':'FAQPage','@id':url+'#guest-questions','inLanguage':lang,'mainEntity':[{'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a}} for q,a in d['faq']]}]}
  if lang=='nl':
   head=head.replace('<html lang="nl">','<html lang="nl-NL">')
   for entity in graph['@graph']:
    if 'inLanguage' in entity:entity['inLanguage']='nl-NL'
  head+='<link rel="preload" as="image" href="/images/site/winter-sunset-2026.webp">'
  head+='<script type="application/ld+json">'+json.dumps(graph,ensure_ascii=False).replace('</','<\\/')+'</script></head>'
  footer=f'<footer><div class="footer-content"><h2>Lake House Dalarna</h2><p>Solsidan Dalarna · Rogsjön · Falun</p><div class="footer-links"><a href="/{lang}/">{e(d["home"])}</a><a href="/{HOUSE[lang]}">{e(d["discover"])}</a><a href="{booking}">{e(d["cta"])}</a><a href="/privacy/{lang}.html" data-privacy-link>{e(d["privacy"])}</a></div><p class="copyright">© 2026 Lake House Dalarna</p></div></footer><script src="/navigation.js?v=20260917-nav-spacing"></script></body></html>'
  p=ROOT/ROUTES[lang]/'index.html';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(head+'<body class="seo-page">'+header+main+footer,encoding='utf-8')
  # Only the World Championships card changes; the rest of the homepage stays intact.
  pattern=r'(<a class="button" href=")[^"]*\?month=2027-02#availability("[^>]*>)[^<]+(</a>)'
  home,n=re.subn(pattern,lambda m:m[1]+'/'+ROUTES[lang]+m[2]+e(d['cardLink'])+m[3],home)
  # Subsequent builds regenerate the original card before this step.
  assert n==1, f'Expected one VM card on {lang} homepage, got {n}'
  (ROOT/lang/'index.html').write_text(home,encoding='utf-8')
if __name__=='__main__':build()
