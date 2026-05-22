#!/usr/bin/env bash
# Rebuild and deploy Compass frontend to Netlify
# Usage: bash deploy-compass.sh <API_URL>
# Example: bash deploy-compass.sh https://abc-123.trycloudflare.com

set -e
API_URL="${1}"
COMPASS_DIR="/home/bbaxter/workspace/replay-bricks/compass"

if [ -z "$API_URL" ]; then
  echo "Usage: $0 <API_URL>"
  echo "Example: $0 https://abc-123.trycloudflare.com"
  echo ""
  echo "Current tunnel URL (if running):"
  grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cloudflared.log 2>/dev/null | tail -1
  exit 1
fi

echo "🚀 Building Compass with API URL: $API_URL"
cd "$COMPASS_DIR"
VITE_API_URL="$API_URL" npm run build

echo "📦 Deploying to Netlify..."
NETLIFY_AUTH_TOKEN="nfc_qau3Rq6nLo4QvJrk2c3ub9Z5gVAAcw7W8579" /home/bbaxter/.hermes/node/bin/netlify deploy --dir dist --prod --site b07a2d62-7f71-4ba6-b647-3d4400b56996

echo ""
echo "✅ Done! Compass is live at https://compass-replaybricks.netlify.app"
