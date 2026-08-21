# Athienitis Supermarket — website template

Static, dependency-free website proposal for Athienitis Supermarket (Nicosia). Built for GitHub Pages.

## Pages
| Path | Purpose |
|---|---|
| `index.html` | Home: hero, ticker, departments, story, offers, Bonus Card, latest blog posts, hours + map, newsletter |
| `departments.html` | Overview of all nine counters |
| `shops/<name>.html` | One page per counter (bakery, butchery, deli, fish, fruit, cellar, eatery, living, gifts) |
| `blog.html` · `blog/<slug>.html` · `blog/<slug>.el.html` | Blog index + each article as a separate English and Greek page (hreflang-linked) |
| `faq.html` | FAQ with `FAQPage` structured data in both languages (for search engines and LLM answer engines) |
| `app.html` | The Athienitis app — App Store / Google Play "coming soon" landing page, replaces web ordering |
| `contact.html` | Contact details, live opening status, map, enquiry form |
| `404.html`, `sitemap.xml`, `robots.txt` | GitHub Pages not-found page and crawler files |

## Features
- **EN / EL switch** with no reload; remembered across visits, Greek browsers default to EL. UI strings live in `js/main.js` (`I18N`); shop-page copy is injected per page (`window.SHOP_CONTENT`); blog articles are separate files per language and the switch navigates between them.
- **Live "Open now / Closed"** badge in Europe/Nicosia time, today highlighted in the hours table. Edit `HOURS` in `js/main.js`.
- **SEO / GEO:** canonical + Open Graph on every page, `GroceryStore` schema with departments and opening hours, `Store` schema per counter, `Article` schema per post, `FAQPage` schema (EN + EL), `MobileApplication` schema, sitemap and robots.
- **Animations:** orchestrated hero load sequence, count-up stats, pointer-follow stickers, image zoom on hover, Ken Burns shop heroes, floating phone mockup, FAQ accordion, scroll reveals — all disabled under `prefers-reduced-motion`.
- Sticky header with mega menus, mobile drawer, keyboard-visible focus, skip link.
- Forms work without a backend (local success state). Add `data-endpoint="https://formspree.io/f/XXXX"` to any `<form>` to receive submissions.

## Photos
Template photos are hot-linked from **LoremFlickr** (`https://loremflickr.com/W/H/keyword?lock=N`) — Creative Commons Flickr photos matched by keyword with a credit burned into the corner. They are placeholders: replace each `src` with the store's own photography before launch (ideally in `assets/img/`). Photo URLs are defined once in the build data and reused across cards, heroes and articles.

## Deploy on GitHub Pages
1. Push the contents of this folder to the repository root (`main` branch).
2. Repo → Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. `.nojekyll` is included. All links are relative, so the site works under `/websitetemplate/`. `sitemap.xml`, canonicals and hreflang assume `https://athienitiscyprus.github.io/websitetemplate` — search-and-replace if the domain changes.

## Editing content
Shop text, blog posts and FAQ were generated from a small data file; to add a post, duplicate one of the `blog/*.html` pairs (EN + EL), update the `hreflang` links and `data-alt-url`, and add the card to `blog.html` and `index.html`. Hours, email, offer prices and Bonus Card terms are demo values.
