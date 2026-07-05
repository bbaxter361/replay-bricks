const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function createLabel({ order_id, weight_oz, package_type, carrier }) {
  const apiKey = process.env.SHIPPING_API_KEY;
  const endpoint = process.env.SHIPPING_API_URL;

  if (!apiKey || !endpoint) {
    return {
      label_url: `https://placeholder.local/labels/${order_id}-${Date.now()}.pdf`,
      tracking_number: null,
      carrier: carrier || 'PLACEHOLDER',
      provider: 'placeholder',
    };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ order_id, weight_oz, package_type, carrier }),
  });
  if (!res.ok) throw new Error(`Carrier API ${res.status}`);
  const data = await res.json();
  return {
    label_url: data.label_url,
    tracking_number: data.tracking_number ?? null,
    carrier: data.carrier ?? carrier ?? null,
    provider: 'live',
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return {
      statusCode: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  if (body.order_id == null || !body.weight_oz || !body.package_type) {
    return {
      statusCode: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'order_id, weight_oz, package_type required' }),
    };
  }

  try {
    const label = await createLabel(body);
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify(label),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
}
