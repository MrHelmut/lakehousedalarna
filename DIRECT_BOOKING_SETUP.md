# Direct booking setup

## Current version

The site still uses a safe manual flow:

1. Guest sends a direct booking request from `booking.html`.
2. Alexander reviews the guest, dates, price and availability.
3. Alexander opens `admin.html`.
4. The helper calculates rent, cleaning fee and total amount.
5. The helper creates copy-ready text for Stripe Payment Links and a guest reply.
6. Alexander creates the payment link manually in Stripe.
7. Booking is confirmed only after payment and a written confirmation.

No Stripe secret key is stored in the website.

## Important security note

GitHub Pages is static and public. It must not contain:

- Stripe secret keys
- passwords
- private guest data
- automatic payment creation code

The current `admin.html` page is only a public, unlinked helper. It does not create payments or store data.

## Later version

For automatic Stripe payment links, add a small backend/serverless function with:

- `STRIPE_SECRET_KEY` stored as a secret in the hosting provider
- a protected owner/admin page
- a `create-checkout-session` or `create-payment-link` endpoint
- Stripe webhook handling for successful payment
- booking status storage
- calendar blocking after payment or manual approval

Recommended path:

1. Keep manual Stripe Payment Links first.
2. Add a protected backend when the manual process works.
3. Add automatic calendar blocking last.
