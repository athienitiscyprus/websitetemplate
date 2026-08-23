#!/usr/bin/env bash
#
# apply-update.sh — search filters, mobile search-overlay fixes, brand data.
#
# Files handed back from a session arrive without their folder, so js/shop.js
# becomes a bare shop.js in your downloads. Copy all eight files anywhere into
# the repo root and run this: it puts each one where the site actually loads it
# from, merges with whatever is already committed, verifies, commits and pushes.
#
#   bash apply-update.sh          # organise, verify, commit, push
#   bash apply-update.sh --no-push # stop after the commit
#
set -euo pipefail

PUSH=1
[ "${1:-}" = "--no-push" ] && PUSH=0

[ -f index.html ] && [ -d js ] && [ -d css ] || {
  echo "Run this from the repo root (the folder with index.html and js/)." >&2; exit 1; }
git rev-parse --git-dir >/dev/null 2>&1 || { echo "Not a git repository." >&2; exit 1; }

# ---------------------------------------------------------------------------
echo "==> 1/6  Merging with what is already on the remote"
git fetch --quiet origin || echo "    (could not reach origin — carrying on with the local copy)"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if git rev-parse --verify --quiet "origin/$BRANCH" >/dev/null; then
  BEHIND=$(git rev-list --count "HEAD..origin/$BRANCH" 2>/dev/null || echo 0)
  if [ "$BEHIND" -gt 0 ]; then
    echo "    $BEHIND new commit(s) on origin/$BRANCH — rebasing your work on top"
    git stash push --quiet --include-untracked -m "apply-update: incoming files" || true
    git pull --rebase --quiet origin "$BRANCH"
    git stash pop --quiet 2>/dev/null || true
  else
    echo "    already up to date with origin/$BRANCH"
  fi
fi

# ---------------------------------------------------------------------------
echo "==> 2/6  Putting each file in the folder the site loads it from"
move() {
  if [ -f "$1" ]; then mkdir -p "$(dirname "$2")"; mv -f "$1" "$2"; echo "    $1  ->  $2"
  else echo "    $1  (not at top level, skipped)"; fi
}
move shop.js    js/shop.js
move catalog.js js/catalog.js
move main.js    js/main.js
move mobile.js  js/mobile.js
move styles.css css/styles.css
move mobile.css css/mobile.css
move admin.js   admin/admin.js
# search.html belongs at the top level, so it needs no move.

# ---------------------------------------------------------------------------
echo "==> 3/6  Clearing out the previous update's helper files"
git rm -q --ignore-unmatch \
  fix-file-locations.sh organise-repo.sh finish-update.sh changes-summary.md
# any stray copies that were never committed
rm -f fix-file-locations.sh organise-repo.sh finish-update.sh changes-summary.md

# ---------------------------------------------------------------------------
echo "==> 4/6  Bumping the cache-buster to v=22"
if grep -rlq '?v=2[01]' --include='*.html' .; then
  grep -rl '?v=2[01]' --include='*.html' . | xargs sed -i.bak -E 's/\?v=2[01]/?v=22/g'
  find . -name '*.html.bak' -delete
fi
echo "    versions in use: $(grep -rho '?v=[0-9]*' --include='*.html' . | sort -u | tr '\n' ' ')"

# ---------------------------------------------------------------------------
echo "==> 5/6  Verifying"
python3 - <<'PY'
import os, re, glob, sys

problems = []

# a) the live files must be the new ones
markers = {
    "js/shop.js":     ["data-search-toolbar", "facetGroup", "data-f-brand", "data-f-origin", "product__foot"],
    "js/catalog.js":  ['"brand"', '"origin"'],
    "js/main.js":     ["filter.brand", "filter.origin", "product.brand"],
    "js/mobile.js":   ["msearch-open", "popstate"],
    "css/styles.css": [".search-toolbar", ".fchip", ".fgroup__more"],
    "css/mobile.css": [".filters__scrim", "msearch-open", "filters__foot"],
    "admin/admin.js": ['name="brand"', "originEn"],
    "search.html":    ["data-search-toolbar", "filters__scrim"],
}
for path, keys in markers.items():
    if not os.path.exists(path):
        problems.append(f"{path} is missing"); continue
    s = open(path, encoding="utf-8").read()
    absent = [k for k in keys if k not in s]
    if absent:
        problems.append(f"{path} is missing: {', '.join(absent)}")

# b) no loose assets left at the top level
loose = [f for f in os.listdir(".") if f.endswith((".js", ".css")) and os.path.isfile(f)]
if loose:
    problems.append(f"assets still loose at the top level: {', '.join(loose)}")

# c) the old floating "+" rule must be gone
mob = open("css/mobile.css", encoding="utf-8").read()
if "right: 10px; bottom: 10px" in mob:
    problems.append("css/mobile.css still has the old floating + button rule")

# d) brace balance in the stylesheets
for f in ("css/styles.css", "css/mobile.css"):
    s = open(f, encoding="utf-8").read()
    if s.count("{") != s.count("}"):
        problems.append(f"{f} braces unbalanced ({s.count('{')}/{s.count('}')})")

# e) every product carries a brand
cat = open("js/catalog.js", encoding="utf-8").read()
import json
obj = json.loads(cat[cat.index("{"):cat.rindex("}") + 1])
nobrand = [p["id"] for p in obj["products"] if not p.get("brand")]
if nobrand:
    problems.append(f"products with no brand: {', '.join(nobrand)}")

# f) nothing points at a file that no longer exists
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
print(f"    {len(obj['products'])} products, "
      f"{len({p['brand'] for p in obj['products']})} brands, "
      f"{len({p['origin']['en'] for p in obj['products'] if p.get('origin')})} countries")
for f, u in missing[:20]:
    print("      BROKEN:", f, "->", u)
for p in problems:
    print("      PROBLEM:", p)
sys.exit(1 if (problems or missing) else 0)
PY

for f in js/shop.js js/catalog.js js/main.js js/mobile.js admin/admin.js; do
  if command -v node >/dev/null 2>&1; then node --check "$f" >/dev/null || { echo "    SYNTAX ERROR in $f" >&2; exit 1; }; fi
done
command -v node >/dev/null 2>&1 && echo "    all scripts parse" || echo "    (node not installed — skipped the syntax check)"

# ---------------------------------------------------------------------------
echo "==> 6/6  Committing"
git add -A
if git diff --cached --quiet; then
  echo "    nothing to commit — the repo already matches this update"
else
  git commit -q -m "search: brand and country-of-origin filters; fix mobile search overlay"
  echo "    committed"
fi

if [ "$PUSH" = "1" ]; then
  echo "==> Pushing to origin/$BRANCH"
  git push origin "$BRANCH" && echo "    pushed" || {
    echo "    push failed — commit is saved locally, run 'git push' once that is sorted" >&2; exit 1; }
else
  echo "==> Skipping push (--no-push). Run 'git push' when ready."
fi

cat <<'MSG'

Done. On the phone, hard-refresh or use a private tab so you get v=22.
This script can be deleted now; the next update will bring its own.
MSG
