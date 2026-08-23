#!/usr/bin/env bash
#
# finish-update.sh — the two repo-wide chores for this change.
#
# Copy the seven files from this task into place FIRST, then run this from the
# repo root:  bash finish-update.sh
#
set -euo pipefail

[ -f index.html ] && [ -d js ] && [ -d css ] || {
  echo "Run this from the repo root (the folder with index.html and js/)." >&2; exit 1; }

echo "==> Bumping the cache-buster to v=20 on the remaining pages"
# index.html already arrives at v=20; this catches the other 90.
if grep -rlq '?v=19' --include='*.html' .; then
  grep -rl '?v=19' --include='*.html' . | xargs sed -i.bak -E 's/\?v=19/?v=20/g'
  find . -name '*.html.bak' -delete
fi
echo "    versions now in use: $(grep -rho '?v=[0-9]*' --include='*.html' . | sort -u | tr '\n' ' ')"

echo "==> Removing organise-repo.sh (spent — it was the one-off tidy-up)"
git rm -q --ignore-unmatch organise-repo.sh

echo "==> Checking nothing points at a file that no longer exists"
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

Done. Review and commit:
  git status
  git add -A
  git commit -m "mobile card layout, origin on fresh counters, drop Fresh daily badge"
  git push
MSG
