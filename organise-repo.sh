#!/usr/bin/env bash
#
# organise-repo.sh — one-off tidy-up of the Athienitis website repo.
#
# The repo picked up a second, flat copy of the site at the top level: assets that
# belong in js/ and css/, plus old copies of the shop, product and blog pages.
# Nothing loads those top-level copies — every page asks for js/… and css/… — but
# some of them are NEWER than the files the site actually serves, so recent work
# was sitting in files the browser never fetched.
#
# This script moves the newer copies into the folders the site really reads, deletes
# the stale ones, and bumps the cache-buster so browsers pick the new files up.
#
# Run it from the top of the repo:   bash organise-repo.sh
#
set -euo pipefail

[ -f index.html ] && [ -d js ] && [ -d css ] || {
  echo "Run this from the repo root (the folder with index.html and js/)." >&2; exit 1; }

echo "==> 1/4  Deleting stale top-level copies"
# Old shop pages (superseded by shops/*.html — these still had loremflickr images,
# no dark-mode toggle and no account bar).
git rm -q --ignore-unmatch \
  bakery.html butchery.html cellar.html cleaning.html deli.html \
  eatery.html fish.html fruit.html gifts.html living.html
# Old product and blog pages.
git rm -q --ignore-unmatch \
  dl1.html \
  flaounes-easter-bakery.html flaounes-easter-bakery.el.html \
  halloumi-buying-guide.html halloumi-buying-guide.el.html \
  sunday-souvla-guide.html sunday-souvla-guide.el.html
# Assets where the copy already in place is the same or better:
#   admin.css, config.js  — byte-identical to admin/admin.css and js/config.js
#   assistant.js          — js/assistant.js is newer (adds the ATH_CONFIG fallback)
#   catalog.js            — js/catalog.js is newer; the root copy would undo the
#                           replaced photo for product_cl4
git rm -q --ignore-unmatch admin.css config.js assistant.js catalog.js
# Duplicate image tools. tools/ has the same scripts, and the root copy of
# reapply_images.py computes the site root one level too high, so it cannot work here.
git rm -q --ignore-unmatch replace_image.py reapply_images.py

echo "==> 2/4  Promoting the newer top-level assets into place"
# These five are genuinely ahead of the copies the site serves — they carry the
# weight-stepper, the €/kg reference price, the search filters and the admin
# per-weight controls, and they already include the earlier flickering fixes.
git mv -f main.js    js/main.js
git mv -f shop.js    js/shop.js
git mv -f styles.css css/styles.css
git mv -f mobile.css css/mobile.css
git mv -f admin.js   admin/admin.js

echo "==> 3/4  Bumping the cache-buster to v=19"
grep -rl '?v=1[58]' --include='*.html' . | xargs sed -i.bak -E 's/\?v=1[58]/?v=19/g'
find . -name '*.html.bak' -delete

echo "==> 4/4  Checking nothing points at a file that no longer exists"
python3 - <<'PY'
import os, re, glob
missing = []
for f in glob.glob('**/*.html', recursive=True):
    d = os.path.dirname(f)
    for m in re.finditer(r'(?:src|href)="([^"#?]+)(?:\?[^"]*)?"', open(f, encoding='utf-8').read()):
        u = m.group(1)
        if u.startswith(('http', 'mailto:', 'tel:', 'data:', '//')) or not u:
            continue
        p = os.path.normpath(os.path.join(d, u))
        if not os.path.exists(p):
            missing.append((f, u))
print(f"    {len(glob.glob('**/*.html', recursive=True))} pages checked, {len(missing)} broken links")
for f, u in missing[:20]:
    print("      BROKEN:", f, "->", u)
raise SystemExit(1 if missing else 0)
PY

cat <<'MSG'

Done. Top level should now hold only real pages plus README.md, robots.txt,
sitemap.xml and images.json.

Two things left, in this order:
  1. Copy the js/shop.js from this task over the one the script just moved
     (it is the same file plus the shop-page category-chip change).
  2. Review and commit:
       git status
       git add -A
       git commit -m "tidy repo: one copy of every asset, promote unshipped work"
       git push
MSG
