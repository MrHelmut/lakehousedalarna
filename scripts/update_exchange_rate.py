"""Store only ECB's SEK/EUR reference. A failed refresh preserves the last valid file."""
import json
from pathlib import Path
from datetime import date
from urllib.request import urlopen, Request
from xml.etree import ElementTree as ET

URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml'
def parse_reference(xml):
    root = ET.fromstring(xml)
    for node in root.iter():
        if 'time' not in node.attrib:
            continue
        day = date.fromisoformat(node.attrib['time'])
        for currency in node:
            if currency.attrib.get('currency') == 'SEK':
                rate = float(currency.attrib['rate'])
                if not 5 < rate < 20:
                    raise ValueError('Invalid SEK reference rate')
                return {'date': day.isoformat(), 'sekPerEur': rate, 'source': URL}
    raise ValueError('ECB response has no SEK reference')

if __name__ == '__main__':
    with urlopen(Request(URL, headers={'User-Agent':'LakeHouseDalarna/reference-rate'}), timeout=30) as response:
        rate = parse_reference(response.read())
    age = (date.today() - date.fromisoformat(rate['date'])).days
    if not 0 <= age <= 14:
        raise ValueError('ECB reference is not current')
    target = Path(__file__).resolve().parents[1] / 'exchange-rate.json'
    target.write_text(json.dumps(rate, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(rate))
