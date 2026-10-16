#!/usr/bin/env bash
set -e
[ -d src/pages ] || { echo "❌ Run from client/"; exit 1; }

# Replace the message in Profile.jsx
python3 <<'PY'
import re, pathlib

p = pathlib.Path('src/pages/Profile.jsx')
src = p.read_text()

old = 'message="This will remove your account information. Full deletion must use the same backend contract as Flutter."'
new = 'message="This will permanently delete your account, including your order history, saved addresses, and favourites. This action cannot be undone."'

if old in src:
    src = src.replace(old, new)
    p.write_text(src)
    print("✅ Updated Profile.jsx message")
else:
    print("⚠️  Old message not found — checking for variants…")
    # Fallback: replace any message containing "Flutter"
    new_src, count = re.subn(
        r'message="[^"]*Flutter[^"]*"',
        'message="This will permanently delete your account, including your order history, saved addresses, and favourites. This action cannot be undone."',
        src,
    )
    if count:
        p.write_text(new_src)
        print(f"✅ Replaced {count} match(es)")
    else:
        print("❌ Could not find the message. Open src/pages/Profile.jsx and edit manually.")
PY

echo ""
echo "Now edit any other pages that mention 'Flutter' or 'backend contract':"
grep -rn "Flutter\|backend contract" src/ || echo "  (none found — clean!)"
