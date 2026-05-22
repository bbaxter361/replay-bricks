#!/bin/bash
# Refresh BrickLink prices for all inventory items
# Called by Hermes cron job every hour

API_URL="${HOLD_API_URL:-http://localhost:3002}"
MAX_ITEMS="${PRICE_REFRESH_BATCH:-25}"

response=$(curl -s -X POST "${API_URL}/api/inventory/refresh-prices?limit=${MAX_ITEMS}&condition=USED" 2>&1)

if echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK')" 2>/dev/null; then
  success=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success',0))")
  errors=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('errors',0))")
  echo "[REFRESH] $success refreshed, $errors errors"
else
  echo "[ERROR] Price refresh failed: $response"
fi
