# Athienitis Supermarket — website template

Static, dependency-free website proposal for Athienitis Supermarket (Nicosia). Built for GitHub Pages.

## Pages
- `index.html` — home: hero, announcements ticker, departments grid, story, weekly offers, Bonus Card, hours + map, newsletter
- `departments.html` — all nine departments with sticky sub-navigation and anchors (`#bakery`, `#cellar` …)
- `contact.html` — contact details, live opening status, map, order / enquiry form
- `404.html` — served automatically by GitHub Pages for unknown URLs

## Features
- **EN / EL language switch** with no reload; choice is remembered, Greek browsers default to EL. All copy lives in `js/main.js` (`I18N`).
- **"Open now / Closed" badge** computed live from the store's hours in Europe/Nicosia time, plus today highlighted in the hours table. Edit `HOURS` in `js/main.js`.
- Sticky header with mega menus, mobile drawer, scroll reveal (disabled for `prefers-reduced-motion`), keyboard-visible focus, skip link.
- Forms work without a backend (local success state). To receive submissions, add `data-endpoint="https://formspree.io/f/XXXX"` to the `<form>`.

## Deploy on GitHub Pages
1. Push the contents of this folder to the repository root (`main` branch).
2. Repo → Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. `.nojekyll` is included so nothing is processed. All paths are relative, so the site works under `/websitetemplate/`.

## Replace placeholders
- Photos: every `.photo__placeholder` / `.offer__img` block is a stand-in for a real image.
- Opening hours, email address, offer prices, Bonus Card terms: demo content — see `js/main.js` and the HTML.
- `assets/logo.png` is the supplied logo; an SVG version would be sharper.
