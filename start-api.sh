#!/usr/bin/env bash
# Start Replay Bricks Compass API server and Cloudflare tunnel
# Run this after WSL starts up: bash ~/workspace/replay-bricks/start-api.sh

set -e

API_DIR="/home/bbaxter/workspace/replay-bricks/compass-api"
COMPASS_DIR="/home/bbaxter/workspace/replay-bricks/compass"
TUNNEL_LOG="/tmp/cloudflared.log"

echo "🚀 Starting Compass API server..."

# Kill any existing processes
pkill -f "node server.js" 2>/dev/null || true
pkill -f cloudflared 2>/dev/null || true
sleep 1

# Load API key
DEEPSEEK_API_KEY="sk-927c40f732ae4322ac74d5950459bc43"

# Start API server
cd "$API_DIR"
DEEPSEEK_API_KEY="$DEEPSEEK_API_KEY" PORT=3001 node server.js &
API_PID=$!
echo "   API server started (PID: $API_PID)"

# Wait for server to be ready
sleep 2

# Start Cloudflare tunnel (log to file)
rm -f "$TUNNEL_LOG"
nohup cloudflared tunnel --url http://localhost:3001 >> "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!
echo "   Cloudflare tunnel started (PID: $TUNNEL_PID)"

# Wait for tunnel URL
echo "   Waiting for tunnel URL..."
for i in $(seq 1 15); do
  TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | tail -1)
  if [ -n "$TUNNEL_URL" ]; then
    echo "✅ Tunnel URL: $TUNNEL_URL"
    break
  fi
  sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
  echo "❌ Failed to get tunnel URL"
  exit 1
fi

# Test the tunnel
echo "   Testing tunnel..."
sleep 3
HEALTH=$(curl -s "${TUNNEL_URL}/api/health" 2>/dev/null || echo "fail")
if echo "$HEALTH" | grep -q '"ok"'; then
  echo "✅ API is reachable at $TUNNEL_URL"
else
  echo "⚠️  API health check returned: $HEALTH"
fi

echo ""
echo "📋 Summary:"
echo "   API Server:    http://localhost:3001"
echo "   Public URL:    $TUNNEL_URL"
echo "   Health check:  ${TUNNEL_URL}/api/health"
echo ""
echo "⚠️  If the tunnel URL changed from the previous one,"
echo "   rebuild Compass frontend with:"
echo "   cd $COMPASS_DIR && VITE_API_URL=$TUNNEL_URL npm run build"
echo "   Then deploy to Netlify from the Desktop/compass-deploy folder"
