#!/usr/bin/env python3
"""
reapply_images.py — re-apply every photo replacement recorded in tools/replacements.json.

Use this after pulling a new version of the site (or on a fresh clone): it re-runs
`replace_image.py set <slot> assets/img/<slot>.<ext>` for each slot, using the files
already in assets/img, so all pages and js/catalog.js point at your photos again.

  python tools/reapply_images.py            # re-apply everything in replacements.json
  python tools/reapply_images.py --resize   # also re-crop the files to the slot sizes (needs Pillow)
"""
import json, os, sys, subprocess, glob

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
STATE = os.path.join(HERE, "replacements.json")
TOOL = os.path.join(HERE, "replace_image.py")

if not os.path.exists(STATE):
    sys.exit("No tools/replacements.json found — nothing to re-apply.")
state = json.load(open(STATE, encoding="utf-8"))
resize = "--resize" in sys.argv
ok = missing = 0
for slot, info in state.items():
    cur = info.get("current", "")
    if cur.startswith("http"):
        args = [sys.executable, TOOL, "set", slot, cur]
    else:
        files = glob.glob(os.path.join(ROOT, "assets", "img", slot + ".*"))
        if not files:
            print(f"  ! {slot}: file missing in assets/img — skipped"); missing += 1; continue
        args = [sys.executable, TOOL, "set", slot, os.path.relpath(files[0], ROOT)] + ([] if resize else ["--no-resize"])
    r = subprocess.run(args, cwd=ROOT, capture_output=True, text=True)
    if r.returncode == 0: ok += 1; print(f"  ✓ {slot}")
    else: print(f"  ! {slot}: {r.stderr.strip().splitlines()[-1] if r.stderr else r.stdout.strip()}")
print(f"\nRe-applied {ok} slot(s){', ' + str(missing) + ' missing' if missing else ''}. Commit the changed files.")
