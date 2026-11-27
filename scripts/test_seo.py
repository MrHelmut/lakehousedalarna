import json,re,html
from pathlib import Path
root=Path(__file__).resolve().parents[1]
pages=[*root.glob('sv/**/index.html'),*root.glob('en/**/index.html'),*root.glob('de/**/index.html'),*root.glob('nl/**/index.html'),*root.glob('de/*.html'),root/'sweden-lake-house.html',root/'ski-holiday-sweden.html']
for p in pages:
    text=p.read_text(encoding='utf-8')
    scripts=re.findall(r'<script type="application/ld\+json">(.*?)</script>',text,re.S)
    assert scripts,p
    graph=json.loads(scripts[-1])['@graph']
    page=next(n for n in graph if n['@type']=='WebPage')
    assert page['url']==re.search(r'rel="canonical" href="([^"]+)"',text)[1]
    for node in graph:
        assert 'aggregateRating' not in node
        if node['@type']=='FAQPage':
            visible=re.sub(r'<script\b[^>]*>.*?</script>','',text,flags=re.S)
            faq=re.search(r'<section class="guest-faq[^\"]*"[^>]*>(.*?)</section>',visible,re.S)
            if faq:
                assert len(node['mainEntity'])==len(re.findall(r'<summary>',faq[1])),p
            else:
                faq=re.search(r'<div class="seo-faq">(.*?)</div>',visible,re.S)
                assert faq and len(node['mainEntity'])==len(re.findall(r'<h3>',faq[1])),p
            for qa in node['mainEntity']:
                assert qa['name'] in html.unescape(visible),p
                assert qa['acceptedAnswer']['text'] in html.unescape(visible),p
assert 'User-agent: OAI-SearchBot\nAllow: /' in (root/'robots.txt').read_text()
print('PASS: structured JSON, canonical consistency, visible matching FAQ answers per page and language, search crawler access.')
