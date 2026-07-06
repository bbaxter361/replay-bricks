/* global process */

const SPRING_API_BASE = process.env.SPRING_API_BASE || 'https://replaybricksv2.netlify.app';
const SPRING_API_KEY = process.env.SPRING_API_KEY || 'spring-vicki-2026';

const allowedPaths = new Set([
  '/api/chat',
  '/api/health',
  '/api/data/contacts',
  '/api/data/events',
  '/api/data/chatHistory',
  '/api/data/conversations',
  '/api/data/books',
  '/api/read-file',
]);

export default async (req) => {
  const url = new URL(req.url);
  const targetPath = url.pathname
    .replace(/^\/api\/spring-proxy/, '/api')
    .replace(/^\/\.netlify\/functions\/spring-proxy/, '/api');

  if (!allowedPaths.has(targetPath)) {
    return Response.json({ error: 'Unsupported Spring proxy path.' }, { status: 404 });
  }

  const contentType = req.headers.get('content-type');
  const headers = {
    'x-api-key': SPRING_API_KEY,
  };
  if (contentType) headers['content-type'] = contentType;

  const response = await fetch(`${SPRING_API_BASE}${targetPath}${url.search}`, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer(),
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/json',
    },
  });
};

export const config = {
  path: [
    '/api/spring-proxy/chat',
    '/api/spring-proxy/health',
    '/api/spring-proxy/data/contacts',
    '/api/spring-proxy/data/events',
    '/api/spring-proxy/data/chatHistory',
    '/api/spring-proxy/data/conversations',
    '/api/spring-proxy/data/books',
    '/api/spring-proxy/read-file',
  ],
};
