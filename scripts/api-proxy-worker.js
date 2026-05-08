// Cloudflare Worker: API Proxy for Replay Bricks
// Routes /api/* requests to the Fly.io backend
// Deploy: npm install -g wrangler && wrangler deploy

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Only proxy /api/* paths
    if (!path.startsWith('/api/')) {
      return new Response('Not found', { status: 404 });
    }
    
    // Build backend URL
    const backendUrl = `https://replaybricks-api.fly.dev${path}${url.search}`;
    
    // Forward the request
    try {
      const response = await fetch(backendUrl, {
        method: request.method,
        headers: {
          'Content-Type': request.headers.get('Content-Type') || 'application/json',
        },
        body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : null,
      });
      
      const body = await response.text();
      
      return new Response(body, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Bad Gateway',
        message: '⚠️ Spring is offline — please start up Brian\'s computer! Once it\'s back on, everything works again. 🌸',
      }), {
        status: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }
  }
};
