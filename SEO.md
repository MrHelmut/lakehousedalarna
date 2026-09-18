# Search and AI search

Public SV/EN/DE pages are pre-rendered. Edit root templates and i18n.js, run scripts/build_languages.py and test_languages.py. Structured data comes from scripts/seo_markup.py; FAQ answers are extracted from the visible rendered questions to prevent mismatches. Do not add unverified ratings, exact coordinates or stale price offers.

robots.txt explicitly allows OAI-SearchBot (ChatGPT Search); the existing GPTBot training policy is unchanged. No hidden AI instructions or unproven AI ranking files are used. Search inclusion is not guaranteed.

Owner follow-up: inspect sitemap/indexing and country/query performance in Google Search Console. No verified Search Console access or ranking measurement was available in this change.

Sources: https://developers.openai.com/api/docs/bots and https://developers.google.com/search/docs/appearance/ai-features
