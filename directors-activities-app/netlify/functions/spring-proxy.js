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
]);

export default async (req) => {
  const url = new URL(req.url);
  const targetPath = url.pathname.replace(/^\/api\/spring-proxy/, '/api');

  if (!allowedPaths.has(targetPath)) {
    return Response.json({ error: 'Unsupported Spring proxy path.' }, { status: 404 });
  }

  const response = await fetch(`${SPRING_API_BASE}${targetPath}${url.search}`, {
    method: req.method,
    headers: {
      'Content-Type': req.headers.get('Content-Type') || 'application/json',
      'x-api-key': SPRING_API_KEY,
    },
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text(),
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
  path: '/api/spring-proxy/*',
};
