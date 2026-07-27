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

export default async (req) => {
  try {
    if (req.method === 'GET') {
      const loaded = await loadDirectorStateFromSupabase();
      return json(loaded, loaded.ok ? 200 : loaded.status || 503);
    }

    if (req.method === 'POST') {
      const payload = await req.json();
      const saved = await saveDirectorStateToSupabase(payload?.data || {});
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
