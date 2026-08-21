# Change Summary — Initial website template · 2026-08-21

## Files Created
- index.html — home page (hero, ticker, departments, story, offers, Bonus Card, visit/hours/map, newsletter)
- departments.html — all departments with sticky sub-nav and anchor links
- contact.html — contact info, live opening status, map, order/enquiry form
- 404.html — GitHub Pages custom not-found page
- css/styles.css — full stylesheet; brand tokens from logo (orange #f26f21, leaf #73b84d, lime #c1d540), responsive, reduced-motion safe
- js/main.js — EN/EL i18n dictionary + switch, live open/closed status from hours table, header/mega-menu/drawer, scroll reveal, sub-nav tracking, form handling, footer year
- assets/logo.png — company logo copied from project files
- .nojekyll — tells GitHub Pages to serve files as-is
- README.md — structure, features, deployment steps, placeholder list

## Notes
- Push everything to the repo root and enable Pages (Settings → Pages → main / root).
- Google Fonts (Fredoka, Figtree) and the Google Maps embed load from the internet; both work on Pages.
- Opening hours, email, offers and Bonus Card terms are demo values — update `HOURS` and `I18N` in `js/main.js`.
- Forms show a local success message until `data-endpoint` (e.g. Formspree) is set on each `<form>`.
- All image areas are labelled placeholders ready for real photography.
