"""Verify deployment without logging private feed data."""
import json
import time
from pathlib import Path
from urllib.request import Request, urlopen

expected = json.loads((Path(__file__).resolve().parents[1] / 'availability.json').read_text())
for attempt in range(40):
    try:
        request = Request('https://lakehousedalarna.com/availability.json?verify=' + str(time.time_ns()),
                          headers={'Cache-Control': 'no-cache'})
        with urlopen(request, timeout=20) as response:
            actual = json.load(response)
        if actual == expected:
            print('Published calendar matches generated data.')
            break
    except Exception:
        pass
    time.sleep(15)
else:
    raise SystemExit('Published calendar could not be verified. Check Pages deployment.')
