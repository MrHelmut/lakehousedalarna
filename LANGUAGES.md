# Static language pages

Dutch (`nl-NL`) is available at `/nl/`, `/nl/het-huis/`, `/nl/boeken/`, `/nl/ontdek-dalarna/`, `/nl/vakantiehuis-zweden/`, `/nl/skivakantie-zweden/` and `/privacy/nl.html`. Maintain Dutch copy in `content/nl.json`. The language builder embeds this dictionary into i18n.js and generates all seven pages from the shared sources. Run `python scripts/test_dutch.py` as well as the existing booking, pricing, consent and euro tests. `finalize_languages.py` owns the complete reciprocal language clusters and sitemap. English/Swedish/German routes are retained. No real booking or email is sent by these tests.

Edit the shared root index.html, house.html and booking.html plus i18n.js translations. Then run:

    python scripts/build_languages.py
    python scripts/test_languages.py
    node scripts/test_pricing.cjs

Commit the generated en/, sv/, de/index.html, de/ferienhaus/ and de/buchen/ pages and sitemap.xml together with source changes. Generated HTML has fully translated content, self canonical and reciprocal hreflang. Do not edit generated pages individually.

Root HTML pages are retained as source and legacy entry points. seo.js forwards old root URLs and ?lang=sv/de to the corresponding static route, preserving other query values and fragment. GitHub Pages does not support custom server redirects; this compatibility redirect uses JavaScript. Without JavaScript the old English source remains readable with canonical to the English static page.

Static routes always determine language, regardless of localStorage. Flags are ordinary links to the equivalent page. Calendar, pricing and images are shared root resources. Dynamic booking text uses the same i18n dictionary. Rebuilding does not fetch availability or change prices.

The existing German editorial landing page de/ferienhaus-schweden.html stays at its original URL and is not an alternate translation of the homepage.
