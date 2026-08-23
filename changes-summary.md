# Change Summary — mobile card layout, country of origin, Fresh daily removal (2026-08-23)

## Files Created
- `finish-update.sh` — run from the repo root **after** copying the seven files below into place. Bumps the cache-buster on the remaining 90 pages, deletes the spent `organise-repo.sh`, and checks for broken links.

## Files Modified
- `js/shop.js` — rebuilt the bottom of the product card as a `.product__foot` block (weight picker on its own line, add button beneath it, both pinned to the card bottom). Add button now carries a plus icon before the label. Added an origin line to the card and an origin block on the product page, built in JS so no product page needed editing. Also re-applied the shop-page category-chip rule from the earlier task — it never got copied in, so `js/shop.js` was still hiding the chip on product-page "similar" strips too.
- `js/catalog.js` — added an `origin: {en, el}` field to 24 products across butchery, fish, fruit and deli. Purely additive; the replaced photo paths under `assets/img/` are untouched.
- `js/main.js` — added the `product.origin` label ("Origin" / "Προέλευση") to both dictionaries.
- `css/styles.css` — added `.product__origin`, `.product__foot` and `.pdp__origin`; the add button moved its `margin-top: auto` to the new footer wrapper and gained icon spacing.
- `css/mobile.css` — see below.
- `admin/admin.js` — added Country of origin (EN) and (EL) inputs to the product editor, saved to `p.origin`.
- `index.html` — removed the two `dept__tag` / `dept.tag.fresh` spans (bakery and fish cards).

## Files Deleted
- `organise-repo.sh` — the one-off tidy-up from the previous task, now spent. Removed by `finish-update.sh`.

## What was actually wrong on mobile

The add button was `position: absolute; right: 10px; bottom: 10px` — a 38px round "+" floating over the bottom-right corner of the card body. The weight picker sat in the normal flow underneath it, which is why it was invisible.

Fixing the position meant three related rules could also go:
- `.product h3 { padding-right: 44px }` and `.product__price { padding-right: 44px }` — gutters that existed only to keep text clear of the floating button.
- `.product__price small { display: none }` — the `/kg` suffix was being hidden on mobile for the same space reason. **I brought it back**, because a weight stepper sitting next to a bare "€7.90" reads as a total rather than a per-kilo price.

The mobile weight row stacks its label above a full-width stepper, so it fits the ~146px of content width on a two-up card at 375px without the label and the − 1 kg + control competing for the same line.

## Verification
- Rendered every real grid through the actual `js/shop.js` with a stubbed DOM:

| Grid | Cards | Category chips | Origin lines | Weight rows | Plus icons | Fresh badges |
|---|---|---|---|---|---|---|
| `shops/butchery.html` section | 6 | 0 | 6 | 6 | 6 | 0 |
| `shops/fruit.html` section | 6 | 0 | 6 | 4 | 6 | 0 |
| `index.html` discounts | 21 | 21 | 8 | 5 | 21 | 0 |
| `products/bt1.html` similar | 4 | 4 | 4 | 4 | 4 | 0 |
| `offers.html` discounts | 21 | 21 | 8 | 5 | 21 | 0 |
| `search.html` results | 2 | 2 | 1 | 0 | 2 | 0 |

- Origin renders in Greek under `lang=el` (Κύπρος).
- `node --check` passes on all four changed scripts; both stylesheets are brace-balanced.
- Dry-ran the whole delivery on a clean clone: `finish-update.sh` exits 0, 92 pages checked, 0 broken links, and the result is byte-identical to the copy everything above was verified in.

## Notes

**1. The mobile layout has not been measured in a real browser.** I tried to install headless Chrome to check for overlaps at 375px; the download host is not on this container's network allowlist, so it failed. The structural argument is solid — nothing inside the card is absolutely positioned any more, so the class of bug that hid the weight picker cannot recur — but that is reasoning, not measurement. Worth a look on the iPhone, especially a counter page where the two-up cards are tightest.

**2. The origin values are plausible defaults, not verified facts.** Cyprus for the local meat, produce and halloumi; Ireland for the beef mince; Greece for the sea bass and Kalamata olives; Spain for the Manchego; Ecuador for the prawns; Norway for the salt cod. For a real shop these are a labelling matter and someone should confirm each one. They are all editable in the staff panel now (Products → open a product → Country of origin).

**3. Scope of "non packaged".** I applied origin to the four fresh counters — butchery, fish, fruit, deli. Left out: bakery and eatery (made in store, so a country is the wrong answer), and cellar, cleaning, living, gifts (packaged). Cellar is the arguable one — wine is packaged but origin is genuinely expected on it. Adding those six bottles is a small change if you want it.

**4. `tag: "fresh"` stays in the catalog data.** The badge no longer renders anywhere, but the "featured" product filter (`spec === "featured"`) selects on `p.tag`, so removing the field would quietly change which products are featured. The staff panel still offers "fresh daily" in its Tag dropdown — that control now has no visible effect on the storefront, so it may be worth removing on a later pass.
