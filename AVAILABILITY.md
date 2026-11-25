# Availability

## Owner self-service (25 November 2026)

The owner view at `/stad/` can create a reservation, confirmed direct booking, or calendar-only block. New records use stable `owner-<uuid>` IDs and `source: direct-portal`. Reservations and blocks never create cleaning jobs or cleaner notices. Confirming a reservation preserves its ID and creates the departure cleaning through the existing confirmed-booking flow. Cancelling only changes status; notes, responses and cleaning history remain stored. Existing legacy records and overrides are not migrated or removed by this feature.

Every owner save atomically writes the private booking and a public `ownerAvailability/{id}` mirror containing only `start`, `end` (exclusive), and `active`. Firestore rules restrict all writes to the existing verified active owner, enforce the mirror, and prohibit exposing guest details. A shared transaction lock serializes owner saves; overlap checks include active bookings, reservations and blocks. New dates also require a successful calendar check. Confirmation keeps already-held dates and checks private bookings again, without treating the owner's subsequent Airbnb block as a new conflict.

All public booking languages read the date-only mirror together with `availability.json`, including immediately before a request or fallback email. A failed mirror read disables requests. An inactive owner mirror cannot reopen dates blocked by the base calendar or another active mirror. Cloud iCal refreshes do not overwrite owner records. This is not two-way Airbnb synchronization: the owner must block or reopen Airbnb separately, and manually confirm direct guest requests. Existing notification schedules and daily limits apply to confirmed bookings and cancellations.

Tests: `node scripts/test_owner_bookings.mjs`, `node scripts/test_booking_request.cjs`, and `node scripts/test_pricing.cjs`. Browser checks use isolated synthetic records, never real guest bookings.

Both booked and blocked dates are unavailable. The UI uses one disabled, striped state for both. Guests cannot select these dates, select a range across them, or include them as a checkout date. Manual date input is also validated, and the email request cannot open for an invalid selection.

The updater imports every iCal event regardless of its summary. It then adds availability-overrides.json. The additional blocked dates 15 and 24 September 2026 were verified in the Airbnb host calendar on 11 September but omitted from its export. If reopened, remove their overrides. Do not automatically extend all reservations by one night: Airbnb can allow same-day arrivals for other dates.

The export window is limited to 365 days. Outside this coverage, during loading, on failure, or if the last update is over 48 hours old, selection is disabled. This prevents unknown availability being presented as free.

GitHub Actions is scheduled every six hours and requires the private AIRBNB_ICAL_URL repository secret. Never commit the private URL or guest names. Public data contains only unavailable dates and generic ranges.

On 16 November 2026 the owner explicitly authorized storing AIRBNB_ICAL_URL as a GitHub Actions repository secret. The cloud job tests calendar rules, imports the feed, commits only availability.json, explicitly requests a Pages build, and verifies the live JSON. Missing, malformed, incomplete or empty feeds fail without refreshing old data. Error output must never contain the private URL. Overlapping runs are serialized; failed runs remain visible in GitHub Actions. Existing owner overrides are read unchanged. This replaces the local nightly update only after a successful end-to-end cloud run. Airbnb host-only blocks omitted from iCal still require manual review; cloud import cannot inspect a logged-in host calendar.

Validation: node scripts/test_pricing.cjs

Owner authorized website-only availability for 22â€“27 December 2026 on 18 September. direct_only_open_ranges only excludes explicit Airbnb (Not available) events; reservations and unknown event types always stay blocked. Airbnb itself remains unchanged.

On 28 September 2026 the owner closed remaining free 2026 nights on Airbnb only. direct_only_open_ranges preserves only dates that were free on the website before that change; existing unavailable periods remain blocked. New direct reservations must be added to blocked_ranges because Airbnb owner-block events are ignored only within these explicit ranges. Reservations and unknown event types always override direct-only availability. No 2027 channel availability was changed.

Owner updates on 28 September: website-only opening of 19 October 2026, November except 13-15, 31 May-13 June 2027, and 5-11 July 2027 (inclusive nights). October-November 2027 was explicitly opened and checked in Airbnb. manual_request_ranges permits requests outside the 365-day sync window, while unknown gaps remain blocked. New reservations in these manual ranges must be checked and added locally until dates enter normal sync coverage. Imported reservations/unknown events and local blocks always take precedence.

2026-10-04 owner decision: age alone must never disable requests. Keep known blocked dates and coverage limits; display last update and require personal availability confirmation. Reopened December 11-13 after cancellation of owner use.
