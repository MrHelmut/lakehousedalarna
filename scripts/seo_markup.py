"""Shared structured data drawn from the rendered page; no prices or ratings."""
import json,re,html
def add_markup(result,lang,url,title,description):
    site='https://lakehousedalarna.com/'
    graph=[{'@type':'WebSite','@id':site+'#website','url':site,'name':'Lake House Dalarna','alternateName':'Solsidan Dalarna','inLanguage':['sv','en','de']},
           {'@type':'LodgingBusiness','@id':site+'#lodging','name':'Lake House Dalarna','alternateName':'Solsidan Dalarna','url':site,'image':site+'images/hero.png','address':{'@type':'PostalAddress','addressLocality':'Falun','addressRegion':'Dalarna','addressCountry':'SE'},'petsAllowed':False,'sameAs':['https://airbnb.com/h/solsidan-dalarna','https://www.instagram.com/solsidan_dalarna/']},
           {'@type':'WebPage','@id':url+'#webpage','url':url,'name':title,'description':description,'inLanguage':lang,'isPartOf':{'@id':site+'#website'},'about':{'@id':site+'#lodging'}}]
    lodging=graph[1]
    lodging['containsPlace']={'@type':'Accommodation','numberOfBedrooms':3,'occupancy':{'@type':'QuantitativeValue','value':6},'floorSize':{'@type':'QuantitativeValue','value':200,'unitCode':'MTK'}}
    lodging['amenityFeature']=[{'@type':'LocationFeatureSpecification','name':name,'value':True} for name in ['Private sandy beach','Private sauna','Boat','SUP']]
    faq=re.search(r'<section class="guest-faq"[^>]*>(.*?)</section>',result,re.S)
    if faq:
        clean=lambda v: html.unescape(re.sub('<[^>]+>','',v)).strip()
        pairs=re.findall(r'<summary>(.*?)</summary><p>(.*?)</p>',faq[1],re.S)
        graph.append({'@type':'FAQPage','@id':url+'#guest-questions','inLanguage':lang,'mainEntity':[{'@type':'Question','name':clean(q),'acceptedAnswer':{'@type':'Answer','text':clean(a)}} for q,a in pairs]})
    elif 'class="seo-faq"' in result:
        clean=lambda v: html.unescape(re.sub('<[^>]+>','',v)).strip()
        block=re.search(r'<div class="seo-faq">(.*?)</div>',result,re.S)
        pairs=re.findall(r'<h3>(.*?)</h3>\s*<p>(.*?)</p>',block[1],re.S)
        graph.append({'@type':'FAQPage','@id':url+'#guest-questions','inLanguage':lang,'mainEntity':[{'@type':'Question','name':clean(q),'acceptedAnswer':{'@type':'Answer','text':clean(a)}} for q,a in pairs]})
    return result.replace('</head>','<script type="application/ld+json">'+json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False).replace('</','<\\/')+'</script></head>')
