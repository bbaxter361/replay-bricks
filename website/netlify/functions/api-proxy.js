// Netlify Function: API Proxy for Compass
// Forwards /api/* requests to the Fly.io backend
// This ensures Amanda can always reach Spring from any network

const API_BACKEND = 'https://replaybricks-api.fly.dev';

exports.handler = async (event) => {
  // Only handle /api/* paths
  const path = event.path.replace('/.netlify/functions/api-proxy', '/api');
  
  // Build the backend URL
  const backendUrl = `${API_BACKEND}${path}${event.queryStringParameters ? '?' + new URLSearchParams(event.queryStringParameters).toString() : ''}`;
  
  // Build request headers (forward only what we need)
  const headers = {
    'Content-Type': event.headers['content-type'] || 'application/json',
  };

  try {
    const response = await fetch(backendUrl, {
      method: event.httpMethod,
      headers,
      body: event.body || null,
    });

    const responseBody = await response.text();
    let parsedBody;
    try {
      parsedBody = JSON.parse(responseBody);
    } catch {
      parsedBody = responseBody;
    }

    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parsedBody),
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Bad Gateway',
        message: 'Spring is offline — Brian\'s computer is turned off. Please start it up! Once his machine is back on, I\'ll be here to help you plan activities, manage your calendar, and everything else. 🌸',
      }),
    };
  }
};
