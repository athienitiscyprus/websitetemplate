#!/usr/bin/env bash
#
# apply-update.sh — keyword links, product labels, mobile sign-out, cart FAB.
#
# Files handed back from a session arrive without their folder, so js/shop.js
# becomes a bare shop.js in your downloads. Copy all six files into the repo
# root and run this: it puts each one where the site loads it from, merges with
# what is already committed, verifies, commits and pushes.
#
#   bash apply-update.sh            # organise, verify, commit, push
#   bash apply-update.sh --no-push  # stop after the commit
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
move styles.css css/styles.css
move mobile.css css/mobile.css
# account.html belongs at the top level, so it needs no move.

# ---------------------------------------------------------------------------
echo "==> 3/6  Clearing out previous helper files"
git rm -q --ignore-unmatch \
  fix-file-locations.sh organise-repo.sh finish-update.sh changes-summary.md
rm -f fix-file-locations.sh organise-repo.sh finish-update.sh changes-summary.md

# ---------------------------------------------------------------------------
echo "==> 4/6  Bumping the cache-buster to v=23"
if grep -rlq '?v=2[12]' --include='*.html' .; then
  grep -rl '?v=2[12]' --include='*.html' . | xargs sed -i.bak -E 's/\?v=2[12]/?v=23/g'
  find . -name '*.html.bak' -delete
fi
echo "    versions in use: $(grep -rho '?v=[0-9]*' --include='*.html' . | sort -u | tr '\n' ' ')"

# ---------------------------------------------------------------------------
echo "==> 5/6  Verifying"
python3 - <<'PY'
import os, re, glob, json, sys

problems = []

markers = {
    "js/shop.js":     ["labelsHTML", "LABEL_ORDER", 'classList.toggle("cart-open"', "SP.ids"],
    "js/catalog.js":  ['"shopItems"', '"labels"', '"oos"'],
    "js/main.js":     ["shopItemHref", "label.frozen", "filter.selection"],
    "css/styles.css": [".plabel", ".shop-item__link", "body.cart-open .cart-fab", ".dash__signout { display: none"],
    "css/mobile.css": [".dash__nav .btn { display: none", ".dash__signout { display: inline-flex", "body.cart-open .ai"],
    "account.html":   ["dash__signout"],
}
for path, keys in markers.items():
    if not os.path.exists(path):
        problems.append(f"{path} is missing"); continue
    s = open(path, encoding="utf-8").read()
    absent = [k for k in keys if k not in s]
    if absent:
        problems.append(f"{path} is missing: {', '.join(absent)}")

loose = [f for f in os.listdir(".") if f.endswith((".js", ".css")) and os.path.isfile(f)]
if loose:
    problems.append(f"assets still loose at the top level: {', '.join(loose)}")

for f in ("css/styles.css", "css/mobile.css"):
    s = open(f, encoding="utf-8").read()
    if s.count("{") != s.count("}"):
        problems.append(f"{f} braces unbalanced ({s.count('{')}/{s.count('}')})")
    bad = [c for c in re.findall(r"#[0-9a-zA-Z]+", s)
           if not re.fullmatch(r"#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})", c)]
    if bad:
        problems.append(f"{f} has malformed colour values: {', '.join(sorted(set(bad)))}")

acct = open("account.html", encoding="utf-8").read()
if acct.count("data-logout") != 2:
    problems.append(f"account.html has {acct.count('data-logout')} sign-out buttons, expected 2")

cat = open("js/catalog.js", encoding="utf-8").read()
C = json.loads(cat[cat.index("{"):cat.rindex("}") + 1])
by_id = {p["id"]: p for p in C["products"]}
linked = 0
for shop, m in C.get("shopItems", {}).items():
    for idx, ids in m.items():
        linked += 1
        for pid in ids:
            if pid not in by_id:
                problems.append(f"keyword {shop}[{idx}] points at unknown product {pid}")
            elif by_id[pid]["section"] != shop:
                problems.append(f"keyword {shop}[{idx}] -> {pid}, which sits in {by_id[pid]['section']}")
            elif len(ids) == 1 and not os.path.exists(f"products/{pid}.html"):
                problems.append(f"keyword {shop}[{idx}] -> products/{pid}.html does not exist")

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

labelled = len([p for p in C["products"] if p.get("labels") or p.get("was") or p.get("oos")])
print(f"    {len(pages)} pages checked, {len(missing)} broken links")
print(f"    {linked} keywords linked, {labelled} of {len(C['products'])} products carry a label")
for f, u in missing[:20]:
    print("      BROKEN:", f, "->", u)
for p in problems:
    print("      PROBLEM:", p)
sys.exit(1 if (problems or missing) else 0)
PY

if command -v node >/dev/null 2>&1; then
  for f in js/shop.js js/catalog.js js/main.js js/mobile.js admin/admin.js; do
    node --check "$f" >/dev/null || { echo "    SYNTAX ERROR in $f" >&2; exit 1; }
  done
  echo "    all scripts parse"
else
  echo "    (node not installed — skipped the syntax check)"
fi

# ---------------------------------------------------------------------------
echo "==> 6/6  Committing"
git add -A
if git diff --cached --quiet; then
  echo "    nothing to commit — the repo already matches this update"
else
  git commit -q -m "shop keyword links, product labels, mobile sign-out, hide cart FAB behind drawer"
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

Done. On the phone, hard-refresh or use a private tab so you get v=23.
This script can be deleted now; the next update will bring its own.
MSG
