#!/usr/bin/env bash
set -e
[ -d src/seed ] || { echo "❌ Run from server/"; exit 1; }

echo "🔍 Looking for Munch's API endpoints…"
echo ""

# Try common API paths
for path in \
  "https://order.munch.co.ke/api/categories" \
  "https://order.munch.co.ke/api/menu" \
  "https://order.munch.co.ke/api/products" \
  "https://order.munch.co.ke/api/category/13-combos"
do
  status=$(curl -s -o /dev/null -w "%{http_code}" -H "Accept: application/json" "$path" || echo "000")
  echo "  [$status] $path"
done

echo ""
echo "👉 Open DevTools on Munch's site → Network tab → filter XHR → reload a category page."
echo "   Copy the request URL that returns JSON (look for 'api' in the name)."
echo "   Paste it below when prompted."
echo ""
read -p "API URL to fetch: " API_URL
[ -z "$API_URL" ] && { echo "No URL provided. Exiting."; exit 0; }

echo ""
echo "📥 Fetching $API_URL"
curl -s "$API_URL" -H "Accept: application/json" > /tmp/munch-menu.json

echo "📄 First 500 chars:"
head -c 500 /tmp/munch-menu.json
echo ""
echo ""
echo "Saved to /tmp/munch-menu.json ($(wc -c < /tmp/munch-menu.json) bytes)"
echo "Inspect it, then tell me the shape and I'll write the seed transformer."
