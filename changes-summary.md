# Change Summary — Shop layer: products, basket, accounts, discounts, search, recipes, business bundles · 2026-08-21

## Files Created
- js/catalog.js — generated product catalog: 54 products (6 per counter, 18 discounted), 3 recipes, 4 business bundles, EN/EL names, keyword photos, search keywords
- js/shop.js — basket drawer + checkout, sign-in/register (private or business, 5% trade discount), order history, product grid rendering, discounts grouping, live search + results page, recipes and bundles rendering, toasts; localStorage-backed demo
- offers.html — all discounts grouped by counter with sticky sub-nav and live count
- recipes.html — three recipes with ingredient lists, method, basket total and "add all to basket"
- business.html — photo hero, three trade features, four delivery bundles with bundle pricing and one-tap add
- search.html — search results page (noindex)
- account.html — sign in / create account tabs, account panel, orders list, order-placed confirmation (noindex)

## Files Modified
- index.html — hero stickers now carry photos (bakery, cellar, living, Bonus Card); all nine department cards have photos; offers section is a live 8-product discount grid from the catalog; teaser banners for recipes and business bundles
- shops/*.html (all 9) — each counter page now lists its own discounts and its full product range with add-to-basket
- departments.html, contact.html, app.html, faq.html, blog.html, blog/*.html, 404.html — new header (search box, account link, basket button with badge), basket drawer, updated nav (Offers, Recipes, Business) and footer links
- css/styles.css — product cards, basket drawer, quantity steppers, toast, header tools/search dropdown, account tabs/forms, recipe and bundle layouts, sticker photo overlays; nav density fix; sticker dot fix
- js/main.js — 82 new i18n keys (EN+EL) for shop, cart, search, account, offers, recipes, business; exposes window.ATH (t, lang, onLang) so shop.js re-renders on language change
- sitemap.xml — adds offers, recipes, business
- README.md — documents the shop layer, new pages and how to replace the demo storage

## Notes
- Accounts, basket and orders live in localStorage (per browser) — the checkout takes no payment. Swap STORE/Account/Cart in js/shop.js for real API calls for production.
- Product photos are keyword placeholders from loremflickr.com; replace with real product photography.
- Business accounts automatically receive 5% off in the basket; registering with "Business / restaurant" demonstrates this.
