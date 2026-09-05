import json
import os
import re
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
OUTFILE = ROOT / "availability.json"


def unfold_ics(text):
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    unfolded = []
    for line in lines:
        if line.startswith((" ", "\t")) and unfolded:
            unfolded[-1] += line[1:]
        else:
            unfolded.append(line)
    return unfolded


def parse_ics_date(value):
    value = value.strip()
    if re.fullmatch(r"\d{8}", value):
        return datetime.strptime(value, "%Y%m%d").date()
    if re.fullmatch(r"\d{8}T\d{6}Z", value):
        return datetime.strptime(value, "%Y%m%dT%H%M%SZ").date()
    if re.fullmatch(r"\d{8}T\d{6}", value):
        return datetime.strptime(value, "%Y%m%dT%H%M%S").date()
    raise ValueError(f"Unsupported iCal date format: {value}")


def property_value(line):
    return line.split(":", 1)[1].strip()


def fetch_ics(url):
    req = Request(url, headers={"User-Agent": "LakeHouseDalarnaCalendar/1.0"})
    with urlopen(req, timeout=30) as response:
        return response.read().decode("utf-8", errors="replace")


def event_ranges(lines):
    in_event = False
    current = {}

    for line in lines:
        if line == "BEGIN:VEVENT":
            in_event = True
            current = {}
            continue
        if line == "END:VEVENT":
            if current.get("start") and current.get("end"):
                yield current
            in_event = False
            current = {}
            continue
        if not in_event:
            continue
        if line.startswith("DTSTART"):
            current["start"] = parse_ics_date(property_value(line))
        elif line.startswith("DTEND"):
            current["end"] = parse_ics_date(property_value(line))
        elif line.startswith("SUMMARY"):
            current["summary"] = property_value(line)


def daterange(start, end):
    day = start
    while day < end:
        yield day
        day += timedelta(days=1)


def main():
    ical_url = os.environ.get("AIRBNB_ICAL_URL")
    if not ical_url:
        sys.exit("AIRBNB_ICAL_URL is missing")

    ics = fetch_ics(ical_url)
    today = date.today()
    latest = today + timedelta(days=550)
    ranges = []
    booked_dates = set()

    for event in event_ranges(unfold_ics(ics)):
        start = max(event["start"], today)
        end = min(event["end"], latest)
        if start >= end:
            continue

        ranges.append({
            "start": start.isoformat(),
            "end": end.isoformat(),
            "summary": event.get("summary", "Unavailable"),
        })

        for day in daterange(start, end):
            booked_dates.add(day.isoformat())

    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "airbnb_ical",
        "booked_dates": sorted(booked_dates),
        "blocked_ranges": sorted(ranges, key=lambda item: item["start"]),
    }

    OUTFILE.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUTFILE} with {len(booked_dates)} unavailable dates")


if __name__ == "__main__":
    main()
