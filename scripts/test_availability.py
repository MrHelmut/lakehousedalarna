import json
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch
import update_availability as app


def feed(summary='Reserved'):
    return ('BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART;VALUE=DATE:20261222\n'
            'DTEND;VALUE=DATE:20261228\nSUMMARY:' + summary + '\nEND:VEVENT\nEND:VCALENDAR\n')


class FixedDate(date):
    @classmethod
    def today(cls):
        return cls(2026, 11, 16)


class CalendarTest(unittest.TestCase):
    def run_feed(self, calendar, overrides):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / 'availability.json'
            output.write_text('old data')
            (root / 'availability-overrides.json').write_text(json.dumps(overrides))
            with patch.object(app, 'ROOT', root), patch.object(app, 'OUTFILE', output), \
                    patch.object(app, 'fetch_ics', return_value=calendar), \
                    patch.object(app, 'date', FixedDate), \
                    patch.dict(app.os.environ, AIRBNB_ICAL_URL='https://example.invalid/private'):
                try:
                    app.main()
                except Exception:
                    self.assertEqual(output.read_text(), 'old data')
                    raise
            return json.loads(output.read_text())

    def test_invalid_feeds_preserve_old_data(self):
        for value in ['<html>Error</html>', 'BEGIN:VCALENDAR\nEND:VCALENDAR',
                      feed().replace('DTEND;VALUE=DATE:20261228\n', ''),
                      feed().replace('END:VEVENT\n', '')]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                self.run_feed(value, {})

    def test_reservations_and_unknown_events_override_christmas_opening(self):
        overrides = {'direct_only_open_ranges': [{'start': '2026-12-22', 'end': '2026-12-28'}]}
        for summary in ['Reserved', 'Unknown', '']:
            result = self.run_feed(feed(summary), overrides)
            self.assertIn('2026-12-24', result['booked_dates'])

    def test_only_owner_blocks_can_open_and_local_blocks_always_win(self):
        overrides = {
            'direct_only_open_ranges': [{'start': '2026-12-22', 'end': '2026-12-28'}],
            'blocked_ranges': [{'start': '2026-12-24', 'end': '2026-12-26'},
                               {'start': '2027-05-17', 'end': '2027-05-31'}]}
        result = self.run_feed(feed('Airbnb (Not available)'), overrides)
        self.assertNotIn('2026-12-22', result['booked_dates'])
        self.assertIn('2026-12-24', result['booked_dates'])
        self.assertIn('2027-05-30', result['booked_dates'])
        self.assertNotIn('2027-05-31', result['booked_dates'])


if __name__ == '__main__':
    unittest.main()
