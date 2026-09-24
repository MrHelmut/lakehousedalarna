# Direct booking requests

All guests can enquire directly. Host approval and personal confirmation are required. No checkout/payment has been added. Existing owner-approved prices are unchanged.

## Activate Web3Forms
Verify the recipient email with Web3Forms, create a free form, then put its PUBLIC access key in booking-config.js. Empty key = existing email-app handoff, explicitly explained to guests. The key is designed for public browser use; never add account tokens or private credentials. Deploy and test delivery to the verified inbox before calling email delivery verified. Configure the provider retention and spam controls for the account.

Direct mode POSTs over HTTPS, checks the success response, preserves values on error, allows retry or email fallback, and prevents duplicate clicks while pending or after success. There is no automatic retry after a timeout. All adults and children count towards the six-person limit. At least one adult is required.

## Measurement
Existing GA4 ID, configuration, consent and legacy booking_click / airbnb_click / contact_click events remain.
- click_check_availability: click to the booking page.
- start_booking_request: first date selection or form interaction per page view.
- submit_booking_request: Web3Forms accepted the request. This is an enquiry receipt, NOT a booking or proof of inbox delivery.
- click_airbnb: outbound Airbnb link, including reviews.
- booking_request_email_handoff: valid request handed to email app; NOT proof of sending. Never count it as received.
No names, email, phone, country, dates or messages go into custom events. Events require analytics consent. Provider delivery does not require analytics consent.

In GA4, mark submit_booking_request as a key event after direct delivery is activated. Existing events are retained; do not combine old and new click names into one conversion count. Verify in DebugView/Realtime with analytics consent. No GA4 property settings were changed.

## Organic discovery update — 24 September 2026
Seasonal landing pages link directly to the existing booking routes. WhatsApp now emits click_whatsapp instead of whatsapp_click, exactly once per click. Historical whatsapp_click data remains in GA4; compare the two names across this change date rather than counting a duplicate alias. GA4 property settings, measurement ID and consent are unchanged.

## Activation 2026-09-24
Owner-supplied public access key configured. Direct submission enabled. Actual inbox delivery still requires a real test and recipient confirmation.
