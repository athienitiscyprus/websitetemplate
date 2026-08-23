#!/usr/bin/env bash
#
# fix-file-locations.sh
#
# Six asset files landed at the top of the repo instead of inside js/, css/ and
# admin/. Nothing loads them there, so the site kept serving the old versions.
# This moves each one to the folder the pages actually request, removes the
# leftover helper files, and bumps the cache-buster.
#
# Run from the repo root:  bash fix-file-locations.sh
#
# Safe to re-run: if a file is not at the top level, that move is skipped.
#
set -euo pipefail

[ -f index.html ] && [ -d js ] && [ -d css ] || {
  echo "Run this from the repo root (the folder with index.html and js/)." >&2; exit 1; }

move() {   # move $1 -> $2 only if $1 is sitting at the top level
  if [ -f "$1" ]; then
    git mv -f "$1" "$2"
    echo "    $1  ->  $2"
  else
    echo "    $1  (already in place, skipped)"
  fi
}

echo "==> 1/4  Moving assets into the folders the pages load"
move shop.js    js/shop.js
move catalog.js js/catalog.js
move main.js    js/main.js
move styles.css css/styles.css
move mobile.css css/mobile.css
move admin.js   admin/admin.js

echo "==> 2/4  Removing helper files that are not part of the site"
git rm -q --ignore-unmatch changes-summary.md finish-update.sh organise-repo.sh

echo "==> 3/4  Bumping the cache-buster to v=21"
# v=20 was already published against the OLD files, so browsers have those cached
# under that version. A fresh number is needed for the corrected files.
if grep -rlq '?v=20' --include='*.html' .; then
  grep -rl '?v=20' --include='*.html' . | xargs sed -i.bak -E 's/\?v=20/?v=21/g'
  find . -name '*.html.bak' -delete
fi
echo "    versions now in use: $(grep -rho '?v=[0-9]*' --include='*.html' . | sort -u | tr '\n' ' ')"

echo "==> 4/4  Verifying the live files really are the new ones"
python3 - <<'PY'
import os, re, glob, sys

checks = [
    ("js/shop.js",      ["product__origin", "product__foot", "onShopPage"]),
    ("js/catalog.js",   ['"origin"']),
    ("js/main.js",      ["product.origin"]),
    ("css/styles.css",  [".product__origin", ".product__foot", ".pdp__origin"]),
    ("css/mobile.css",  [".product__origin", ".product__foot"]),
    ("admin/admin.js",  ["originEn", "originEl"]),
]
bad = []
for path, markers in checks:
    if not os.path.exists(path):
        bad.append(f"{path} is missing"); continue
    s = open(path, encoding="utf-8").read()
    absent = [m for m in markers if m not in s]
    if absent:
        bad.append(f"{path} has none of: {', '.join(absent)}")

# the old floating add button must be gone from the live stylesheet
mob = open("css/mobile.css", encoding="utf-8").read() if os.path.exists("css/mobile.css") else ""
if "right: 10px; bottom: 10px" in mob:
    bad.append("css/mobile.css still contains the old floating + button rule")

# nothing may point at a file that no longer exists
missing = []
pages = glob.glob("**/*.html", recursive=True)
for f in pages:
    d = os.path.dirname(f)
    for m in re.finditer(r'(?:src|href)="([^"#?]+)(?:\?[^"]*)?"', open(f, encoding="utf-8").read()):
        u = m.group(1)
        if u.startswith(("http", "mailto:", "tel:", "data:", "//")) or not u:
            continue
        if not os.path.exists(os.path.normpath(os.path.join(d, u))):
            missing.append((f, u))

print(f"    {len(pages)} pages checked, {len(missing)} broken links")
for f, u in missing[:20]:
    print("      BROKEN:", f, "->", u)
for b in bad:
    print("      PROBLEM:", b)
sys.exit(1 if (bad or missing) else 0)
PY

cat <<'MSG'

All six files are now in the folders the site loads. Commit:
  git status
  git add -A
  git commit -m "move assets into js/ and css/ so the changes actually ship"
  git push

Then hard-refresh on the phone (or open in a private tab) to get v=21.
MSG
