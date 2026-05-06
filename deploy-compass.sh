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
NETLIFY_AUTH_TOKEN="nfp_NB2XEGLpijeXEpDGJDWwGysukttiPGJqb14b" npx netlify deploy --dir dist --prod --site 98ca3a41-6cda-413a-81a0-e2f3a7b03bb6

echo ""
echo "✅ Done! Compass is live at https://compass-replaybricks.netlify.app"
