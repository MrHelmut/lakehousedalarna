# Direct-booking prices

Reviewed in the Airbnb host calendar on 11 September 2026 for September 2026 through August 2028 (all 24 months shown). Calendar prices are guide prices, not guest checkout totals or host payouts.

- Ordinary nightly prices: 2,984 SEK; Friday/Saturday: 3,223 SEK.
- Date overrides include autumn 2026, 20 February–9 March 2027 (9,000 / 12,900 / 14,500 SEK) and 2 January 2028 (3,581 SEK).
- First guest included; 239 SEK per additional guest per night before discounts.
- Apply 10% weekly discount from 7 nights, or 30% monthly discount from 28 nights, then 10% returning-guest direct discount to accommodation including extra guests.
- Cleaning: 850 SEK per stay. Bed linen: 150 SEK per guest per stay. No direct discount on these fees.
- Calendar figures are rounded to whole SEK for readability; estimated totals and breakdowns retain ore precision. Checkout is excluded from charged nights.

## Updating

Edit pricing-data.js. Monthly arrays contain Airbnb nightly SEK values in date order; index 0 is the first day. A null price was hidden by an existing booking. Unknown or out-of-range dates must show price on request, never an invented rate. Review the host calendar and advance reviewedAt and the supported date range when updating.

Prices are a manual snapshot. The availability workflow only updates availability.json and does not synchronize prices. Airbnb guest-specific promotions and service fees are not included in the comparison. Confirm the final quote before accepting a booking.

Run: node scripts/test_pricing.cjs

## Owner update 18 September 2026
December 2026 base nightly price: 3000 SEK, or 3200 SEK for nights 22–27 inclusive. The 10% direct discount is excluded on 22–27 December (including extra guests); other nights retain it. Existing extra-guest, weekly/monthly, cleaning and linen rules remain unchanged. These are owner-set website prices, not a new Airbnb price snapshot.

## Christmas peak update (2026-09-18)
Owner-approved nightly base prices: 24, 25 and 26 December 2026: SEK 4,000; 22, 23 and 27 December: SEK 3,200. The direct-booking 10% discount remains excluded for 22–27 December inclusive. Guest surcharges, cleaning, linen and length-of-stay rules are unchanged.

Owner correction: 23 December 2026 also has a SEK 4,000 nightly base price. Peak dates are now 23–26 December inclusive; 22 and 27 December remain SEK 3,200.
