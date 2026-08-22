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
| `offers.html` | Every discounted product, grouped by counter, with a sticky counter sub-nav |
| `recipes.html` | Recipes built from catalog products, "add all ingredients" to basket |
| `business.html` | Trade delivery bundles for restaurants, cafés, bars, hotels; business accounts get 5% off |
| `search.html` | Product search results (the header search box also shows live suggestions) |
| `login.html` · `register.html` | Split-layout sign-in and registration (private or business, with delivery address); one-click demo accounts |
| `account.html` | Customer dashboard: Bonus points, order history with "order again", personal details, delivery address |
| `contact.html` | Contact details, live opening status, map, enquiry form |
| `404.html`, `sitemap.xml`, `robots.txt` | GitHub Pages not-found page and crawler files |

## Shop layer (demo)
`js/catalog.js` holds 54 template products (6 per counter, 18 on offer), 3 recipes and 4 business bundles, with EN/EL names and keyword-matched photos. `js/shop.js` renders product grids wherever a `data-products="section:bakery"`, `data-products="discounts"` or `data-products="discounts:fish"` container appears, and runs the basket drawer, checkout, accounts and search.

Accounts, basket and orders are stored in the browser's `localStorage` so the demo works on GitHub Pages without a server. For production, replace the `STORE`/`Account`/`Cart` functions in `shop.js` with API calls and move the catalog to a CMS or the app backend.

## Configuration — `js/config.js`
- `theme`: `"auto"` (picks Easter / summer / Christmas by date using the Orthodox Easter calendar), or force `"default"`, `"easter"`, `"summer"`, `"christmas"`. A theme changes the accent colours, adds a campaign card under the hero (EN/EL copy, photo, link) and swaps the announcement ticker. Edit the copy and photos in the same file.
- `aiEndpoint`: URL of a hosted model for the assistant (optional).
- Dark mode: follows the visitor's system preference; the moon/sun button in the top bar overrides it and remembers the choice.

## Demo accounts
Four template customers are seeded into the browser on first visit (password `demo`): Maria Georgiou and Andreas Christou (private), Taverna Elia and Café Kipos (business, with delivery addresses, VAT numbers and order history). The login page has one-click buttons for each. Edit `SEED_USERS` in `js/catalog.js`.

## AI customer service
`js/assistant.js` adds the chat bubble on every page. It answers from the site's own data — opening hours and live open/closed status, location, offers, product search, the signed-in customer's orders and points, Bonus Card terms, business delivery, the app — in English or Greek, entirely client-side. To plug in a real model, set `window.AI_ENDPOINT` to a backend URL that accepts `POST {messages, lang, context}` and returns `{reply}`; the local engine stays as the fallback.

## Features
- **EN / EL switch** with no reload; remembered across visits, Greek browsers default to EL. UI strings live in `js/main.js` (`I18N`); shop-page copy is injected per page (`window.SHOP_CONTENT`); blog articles are separate files per language and the switch navigates between them.
- **Live "Open now / Closed"** badge in Europe/Nicosia time, today highlighted in the hours table. Edit `HOURS` in `js/main.js`.
- **SEO / GEO:** canonical + Open Graph on every page, `GroceryStore` schema with departments and opening hours, `Store` schema per counter, `Article` schema per post, `FAQPage` schema (EN + EL), `MobileApplication` schema, sitemap and robots.
- **Motion (Grabbit-inspired):** hero headline splits into words that rise in, with a rotating last phrase; a large manifesto line whose words light up as you scroll, with inline photo chips that pop in; a sticky "How it works" panel whose photo swaps as each step scrolls into view; a product photo marquee; magnetic primary buttons; 3D tilt on cards; add-to-basket fly animation; header that hides on scroll down and returns on scroll up.
- **Page transitions:** fade-out on internal links and fade-in on load, a scroll progress bar under the header, and staggered scroll-reveal for every grid (products, posts, tiles, gallery, features).
- **Animations:** orchestrated hero load sequence, count-up stats, pointer-follow stickers, image zoom on hover, Ken Burns shop heroes, floating phone mockup, FAQ accordion, scroll reveals — all disabled under `prefers-reduced-motion`.
- Sticky header with mega menus, mobile drawer, keyboard-visible focus, skip link.
- Forms work without a backend (local success state). Add `data-endpoint="https://formspree.io/f/XXXX"` to any `<form>` to receive submissions.

## Photos
Every image is a named *slot* listed in `images.json` (slot, description, size, hosted URL, files that use it). Photos are hand-picked Unsplash images (free to use, no attribution required) chosen to match each product and counter — e.g. `product_dl1` is a plate of halloumi, `shop_fish` is fish on ice.

### Replacing a photo — `tools/replace_image.py`
The script finds the site folder automatically (it can live in `tools/`, in the repo root, or be run from anywhere inside the repo).
```
python tools/replace_image.py list                  # every slot, grouped, with the files it appears in
python tools/replace_image.py list butchery         # filter
python tools/replace_image.py preview               # contact sheet of all current images (opens in browser)
python tools/replace_image.py show shop_bakery      # details + preview of one slot
python tools/replace_image.py set shop_bakery https://…/photo.jpg     # use a hosted image
python tools/replace_image.py set shop_bakery ~/Desktop/bakery.jpg    # local file → resized to slot size, saved in assets/img/, all pages updated
python tools/replace_image.py undo shop_bakery      # back to the original
```
Local files are resized with Pillow (`pip install pillow`); relative paths are computed per page so `shops/` and `blog/` keep working. Commit the changed files and `assets/img/` afterwards.

## Deploy on GitHub Pages
1. Push the contents of this folder to the repository root (`main` branch).
2. Repo → Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. `.nojekyll` is included. All links are relative, so the site works under `/websitetemplate/`. `sitemap.xml`, canonicals and hreflang assume `https://athienitiscyprus.github.io/websitetemplate` — search-and-replace if the domain changes.

## Editing content
Shop text, blog posts and FAQ were generated from a small data file; to add a post, duplicate one of the `blog/*.html` pairs (EN + EL), update the `hreflang` links and `data-alt-url`, and add the card to `blog.html` and `index.html`. Hours, email, offer prices and Bonus Card terms are demo values.
