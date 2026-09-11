# Availability

Both booked and blocked dates are unavailable. The UI uses one disabled, striped state for both. Guests cannot select these dates, select a range across them, or include them as a checkout date. Manual date input is also validated, and the email request cannot open for an invalid selection.

The updater imports every iCal event regardless of its summary. It then adds availability-overrides.json. The additional blocked dates 15 and 24 September 2026 were verified in the Airbnb host calendar on 11 September but omitted from its export. If reopened, remove their overrides. Do not automatically extend all reservations by one night: Airbnb can allow same-day arrivals for other dates.

The export window is limited to 365 days. Outside this coverage, during loading, on failure, or if the last update is over 48 hours old, selection is disabled. This prevents unknown availability being presented as free.

GitHub Actions is scheduled every six hours and requires the private AIRBNB_ICAL_URL repository secret. Never commit the private URL or guest names. Public data contains only unavailable dates and generic ranges.

Validation: node scripts/test_pricing.cjs
