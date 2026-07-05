#!/usr/bin/env bash
# Start Compass API Server + Cloudflare Tunnel
# This script keeps the terminal window open to show status

set -e

API_DIR="$HOME/workspace/replay-bricks/compass-api"
TUNNEL_LOG="/tmp/cloudflared.log"
START_LOG="/tmp/compass-start.log"

echo "╔══════════════════════════════════════════════════╗"
echo "║     Compass API Server - Replay Bricks          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Cleanup old processes
echo "🔄 Cleaning up old processes..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f cloudflared 2>/dev/null || true
sleep 1

# API key must come from the local environment.
OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-}"
if [ -z "$OPENROUTER_API_KEY" ]; then
  echo "❌ OPENROUTER_API_KEY is not set. Export it before running this script."
  echo "   (Set the same key used by Hermes for OpenRouter)"
  exit 1
fi

echo "🚀 Starting API server..."
cd "$API_DIR"
OPENROUTER_API_KEY="$OPENROUTER_API_KEY" PORT=3001 node server.js &
API_PID=$!
echo "   PID: $API_PID"

# Wait for server
sleep 2

# Start tunnel
echo "🌐 Starting Cloudflare tunnel..."
rm -f "$TUNNEL_LOG"
cloudflared tunnel --url http://localhost:3001 >> "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!
echo "   PID: $TUNNEL_PID"

# Wait for tunnel URL
echo ""
echo "⏳ Waiting for tunnel URL..."
for i in $(seq 1 20); do
  TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | tail -1)
  if [ -n "$TUNNEL_URL" ]; then
    echo ""
    echo "✅ TUNNEL URL: $TUNNEL_URL"
    echo "   ⚠️  If this URL changed, rebuild Compass:"
    echo "   bash ~/workspace/replay-bricks/deploy-compass.sh $TUNNEL_URL"
    echo ""
    break
  fi
  sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
  echo "❌ Failed to get tunnel URL - check /tmp/cloudflared.log"
  echo "\$ cat $TUNNEL_LOG"
  exit 1
fi

# Test the API
sleep 2
HEALTH=$(curl -s "${TUNNEL_URL}/api/health" 2>/dev/null || echo "")
if echo "$HEALTH" | grep -q '"ok"'; then
  echo "✅ API health check: OK"
else
  echo "⚠️  Health check: $HEALTH"
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ SERVER IS RUNNING                           ║"
echo "║                                                ║"
echo "║  🖥️  Local:  http://localhost:3001              ║"
echo "║  🌐  Public: $TUNNEL_URL"
echo "║                                                ║"
echo "║  The Compass app is at:                         ║"
echo "║  https://compass-replaybricks.netlify.app       ║"
echo "║                                                ║"
echo "║  Close this window to stop the server.          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Keep running - show tunnel logs
echo "📡 Tunnel active. Ctrl+C to stop."
while true; do
  sleep 60
  # Check if processes are still running
  if ! kill -0 $API_PID 2>/dev/null; then
    echo "⚠️  API server died! Restarting..."
    OPENROUTER_API_KEY="$OPENROUTER_API_KEY" PORT=3001 node server.js &
    API_PID=$!
  fi
  if ! kill -0 $TUNNEL_PID 2>/dev/null; then
    echo "⚠️  Tunnel died! Restarting..."
    cloudflared tunnel --url http://localhost:3001 >> "$TUNNEL_LOG" 2>&1 &
    TUNNEL_PID=$!
  fi
done
