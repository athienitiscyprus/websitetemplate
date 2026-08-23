# Change Summary — shop round: cards, weights, unit prices, search filters, crumbs (2026-08-23)

## Files Modified
- js/shop.js — product cards: counter/category tag hidden on that counter's own shop page (`data-products="section:…"`), "Fresh daily" badge removed everywhere; unit label normalised so each/loaf/slice/cup all read "/ piece"; new €/kg–€/L reference line computed from the size in the product name (e.g. honey 450g → "€17.56 / kg"); kg products (all meat, fish, loose fruit) get a weight picker on the card (250 g – 2 kg) and the Add button adds the chosen weight; product-page stepper steps in 250 g for kg items and shows "1 kg"; basket rows show "0.75 kg", step by 250 g, badge counts a weighed item as one line; search page rebuilt — shows the full catalog when there's no query, left filter rail (sort, departments with live counts, price min–max, on-offer toggle) in the alphamega.com.cy style, live re-filter as you type, bilingual.
- js/main.js — new EN/EL strings for the filters, sorting, weight label, "All products" title and "/ piece" unit.
- search.html — new two-column layout: sticky filter rail + 3-across product grid; hero title now switches between "All products" and "Results for …".
- css/styles.css — styles for the filter rail, weight picker, €/kg reference line, search grid; counter-page breadcrumbs (`.shop-hero`, `.page-hero--photo`) now solid white + bold with a soft shadow so they read on every hero photo.
- css/mobile.css — search layout collapses to one column, filter rail becomes a tap-to-open panel, results 2-across.
- products/*.html (8 files: bk1, bk2, bt3, cn4, dl3, et1, fr1, fs1) — static "Fresh daily" badge removed from the product-page photo.
- All 90 HTML pages — cache-buster `?v=16` → `?v=17` (included in html-v17.zip; unzip over the repo root).
- styles.css, mobile.css, main.js, mobile.js, shop.js (repo root) — synced copies.

## Notes
- Butchery prices were already stored per kilo; the card now says "€7.90 / kg" explicitly and the weight picker makes the per-kilo ordering usable. The same applies to the fish counter and loose fruit, which are also sold by weight.
- Mixed weights of the same product merge into one basket line (500 g + 1 kg = 1.5 kg).
