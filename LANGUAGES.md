# Static language pages

Edit the shared root index.html, house.html and booking.html plus i18n.js translations. Then run:

    python scripts/build_languages.py
    python scripts/test_languages.py
    node scripts/test_pricing.cjs

Commit the generated en/, sv/, de/index.html, de/ferienhaus/ and de/buchen/ pages and sitemap.xml together with source changes. Generated HTML has fully translated content, self canonical and reciprocal hreflang. Do not edit generated pages individually.

Root HTML pages are retained as source and legacy entry points. seo.js forwards old root URLs and ?lang=sv/de to the corresponding static route, preserving other query values and fragment. GitHub Pages does not support custom server redirects; this compatibility redirect uses JavaScript. Without JavaScript the old English source remains readable with canonical to the English static page.

Static routes always determine language, regardless of localStorage. Flags are ordinary links to the equivalent page. Calendar, pricing and images are shared root resources. Dynamic booking text uses the same i18n dictionary. Rebuilding does not fetch availability or change prices.

The existing German editorial landing page de/ferienhaus-schweden.html stays at its original URL and is not an alternate translation of the homepage.
