# Change Summary — Accounts, AI assistant, home UI polish, transitions · 2026-08-21

## Files Created
- login.html — split-layout sign-in page with photo, demo-account one-click buttons (noindex)
- register.html — registration with account type, phone and delivery address; `?type=business` preselects business (noindex)
- js/assistant.js — AI customer-service widget: bilingual intent engine over site data (hours/live status, location, offers, product search, customer's orders & points, Bonus Card, business delivery, app), quick-reply chips, typing indicator, optional `window.AI_ENDPOINT` hook for a real LLM

## Files Modified
- account.html — rebuilt as a dashboard: sidebar tabs (Overview, Orders, Personal details, Delivery address), stats (points, orders, total spent), recent orders with "Order again", editable details/address form, quick tiles; redirects to login when signed out
- index.html — "three dinners / run a kitchen" banners replaced by three equal photo tiles (Recipes, Business, App); new "Inside the market" photo gallery; story section rhythm fixed; hero stat numbers gradient
- js/catalog.js — adds `seedUsers`: 4 template customers/restaurants with phone, address, VAT, bonus points and order history
- js/shop.js — richer account model (phone, company, VAT, address, bonus points), first-visit seeding, details form save, reorder from history, order statuses, separate login/register flow, checkout redirect to login, staggered re-observe after rendering
- js/main.js — 44 new i18n keys (account, orders, assistant); page-transition fade in/out; scroll progress bar; auto-staggered reveal for grids; `ATH.observe` hook
- css/styles.css — mega menus show titles only (no descriptions); top bar kept single-line; password/search inputs styled consistently with other fields; tiles, gallery, auth split layout, dashboard, stats, assistant panel, photo feature cards, transition/progress styles
- app.html, business.html — feature cards now carry photos
- contact.html — photo hero
- All other pages — assistant script and transition layer via shared chrome

## Notes
- Demo accounts: maria@example.com, andreas@example.com, orders@tavernaelia.cy, hello@cafekipos.cy — password `demo`. Stored in localStorage; seeded once per browser.
- The assistant is fully client-side; set `window.AI_ENDPOINT` (e.g. in a small script tag before assistant.js) to route questions to a hosted model.
- Photos remain keyword placeholders from loremflickr.com.
