# Change Summary — Blog, FAQ, shop pages, app landing, photos & animations · 2026-08-21

## Files Created
- app.html — "Get the app" landing page: App Store / Google Play coming-soon badges, phone mockup, features, notify-me form, MobileApplication schema
- blog.html — blog index, EN and EL card sets switched by the language toggle
- blog/sunday-souvla-guide.html, blog/sunday-souvla-guide.el.html — article pair (EN/EL) with Article schema + hreflang
- blog/halloumi-buying-guide.html, blog/halloumi-buying-guide.el.html — article pair
- blog/flaounes-easter-bakery.html, blog/flaounes-easter-bakery.el.html — article pair
- faq.html — 11 Q&As in EN and EL, FAQPage JSON-LD for both languages (GEO/LLM-friendly), accordion UI
- shops/bakery.html, shops/butchery.html, shops/deli.html, shops/fish.html, shops/fruit.html, shops/cellar.html, shops/eatery.html, shops/living.html, shops/gifts.html — one page per counter: photo hero (Ken Burns), bilingual long-form copy, product chips, tip, hours, order-ahead panel, Store schema
- sitemap.xml — all 22 URLs
- robots.txt — allow all + sitemap reference

## Files Modified
- index.html — hosted photos on department/offer/story cards, stickers now link to shops, count-up stats, "Order via the app" CTA, latest-articles section, timeline updated
- departments.html — now an overview grid of photo cards linking to the shop pages (replaces the long single-page list)
- contact.html — ordering moved to the app (banner), form reduced to general enquiries
- 404.html — header/nav updated for new pages
- css/styles.css — styles for app, blog, FAQ, shop pages; hero load sequence, parallax stickers, photo zooms, floating phone, accordion; `[hidden]` override fix; responsive rules
- js/main.js — 45 new i18n keys (EN+EL), fixed-language pages with EN↔EL redirect, per-language content blocks, shop copy swap, count-up counters, pointer parallax, FAQ accordion, `nav.home`
- README.md — documents new pages, SEO/GEO schema, photo source, editing workflow

## Notes
- Photos are hot-linked from loremflickr.com (CC-licensed, keyword-matched, credit watermark). Replace with real photography before going live.
- Canonical/hreflang/sitemap URLs assume `https://athienitiscyprus.github.io/websitetemplate`; update if the repo or domain changes.
- Store badges on app.html point to the notify form; swap `href` for the real App Store / Play listings at launch.
- Forms still show a local success message until `data-endpoint` is set.
