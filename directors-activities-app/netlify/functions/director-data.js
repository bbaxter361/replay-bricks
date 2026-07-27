import {
  loadDirectorStateFromSupabase,
  saveDirectorStateToSupabase,
} from './_shared/director-data-store.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

async function proxyToDirectorData(req) {
  const fallbackBase = 'https://baxter-directors-activities.netlify.app';
  const headers = {
    Accept: 'application/json',
  };
  let body;

  if (req.method === 'POST') {
    headers['Content-Type'] = 'application/json';
    body = await req.text();
  }

  const response = await fetch(`${fallbackBase}/api/director-data`, {
    method: req.method,
    headers,
    body,
  });
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export default async (req) => {
  try {
    if (req.method === 'GET') {
      const loaded = await loadDirectorStateFromSupabase();
      if (!loaded.ok && loaded.status === 503) return proxyToDirectorData(req);
      return json(loaded, loaded.ok ? 200 : loaded.status || 503);
    }

    if (req.method === 'POST') {
      const payload = await req.json();
      const saved = await saveDirectorStateToSupabase(payload?.data || {});
      if (!saved.ok && saved.status === 503) {
        return proxyToDirectorData(new Request(req.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }));
      }
      return json(saved, saved.ok ? 200 : saved.status || 503);
    }

    return json({ ok: false, detail: 'Method not allowed.' }, 405);
  } catch (error) {
    return json({ ok: false, detail: error.message || 'Director data request failed.' }, 500);
  }
};

export const config = {
  path: '/api/director-data',
};
