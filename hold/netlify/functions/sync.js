import { schedule } from '@netlify/functions';

async function runSync() {
  const sourceUrl = process.env.SYNC_URL;
  if (!sourceUrl) {
    return { statusCode: 500, body: JSON.stringify({ error: 'SYNC_URL not configured' }) };
  }

  const targetUrl = process.env.SYNC_TARGET_URL
    || `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/api/api/sync`;

  const sourceRes = await fetch(sourceUrl);
  if (!sourceRes.ok) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: `Source fetch failed: ${sourceRes.status}` }),
    };
  }
  const payload = await sourceRes.json();
  const items = Array.isArray(payload) ? payload : payload.items;
  if (!Array.isArray(items)) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Source returned no items array' }) };
  }

  const syncRes = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  const result = await syncRes.json();
  return {
    statusCode: syncRes.ok ? 200 : 502,
    body: JSON.stringify({ source: sourceUrl, target: targetUrl, result }),
  };
}

export const handler = schedule('@hourly', runSync);
