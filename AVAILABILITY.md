# Availability

Both booked and blocked dates are unavailable. The UI uses one disabled, striped state for both. Guests cannot select these dates, select a range across them, or include them as a checkout date. Manual date input is also validated, and the email request cannot open for an invalid selection.

The updater imports every iCal event regardless of its summary. It then adds availability-overrides.json. The additional blocked dates 15 and 24 September 2026 were verified in the Airbnb host calendar on 11 September but omitted from its export. If reopened, remove their overrides. Do not automatically extend all reservations by one night: Airbnb can allow same-day arrivals for other dates.

The export window is limited to 365 days. Outside this coverage, during loading, on failure, or if the last update is over 48 hours old, selection is disabled. This prevents unknown availability being presented as free.

GitHub Actions is scheduled every six hours and requires the private AIRBNB_ICAL_URL repository secret. Never commit the private URL or guest names. Public data contains only unavailable dates and generic ranges.

Validation: node scripts/test_pricing.cjs

Owner authorized website-only availability for 22â€“27 December 2026 on 18 September. direct_only_open_ranges only excludes explicit Airbnb (Not available) events; reservations and unknown event types always stay blocked. Airbnb itself remains unchanged.

On 28 September 2026 the owner closed remaining free 2026 nights on Airbnb only. direct_only_open_ranges preserves only dates that were free on the website before that change; existing unavailable periods remain blocked. New direct reservations must be added to blocked_ranges because Airbnb owner-block events are ignored only within these explicit ranges. Reservations and unknown event types always override direct-only availability. No 2027 channel availability was changed.

Owner updates on 28 September: website-only opening of 19 October 2026, November except 13-15, 31 May-13 June 2027, and 5-11 July 2027 (inclusive nights). October-November 2027 was explicitly opened and checked in Airbnb. manual_request_ranges permits requests outside the 365-day sync window, while unknown gaps remain blocked. New reservations in these manual ranges must be checked and added locally until dates enter normal sync coverage. Imported reservations/unknown events and local blocks always take precedence.
