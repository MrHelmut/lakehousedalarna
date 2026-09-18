import json,re,html
from pathlib import Path
root=Path(__file__).resolve().parents[1]
pages=[*root.glob('sv/**/index.html'),*root.glob('en/**/index.html'),root/'de/index.html',root/'de/ferienhaus/index.html',root/'de/buchen/index.html']
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
            assert len(node['mainEntity'])==6
            for qa in node['mainEntity']:
                assert html.escape(qa['name'],quote=False) in text
                assert html.escape(qa['acceptedAnswer']['text'],quote=False) in text
assert 'User-agent: OAI-SearchBot\nAllow: /' in (root/'robots.txt').read_text()
print('PASS: structured JSON, canonical consistency, six visible matching FAQ answers per language, search crawler access.')
