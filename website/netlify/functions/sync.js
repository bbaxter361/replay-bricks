import { schedule } from '@netlify/functions';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';

function blAuth(url, method) {
  const oauth = new OAuth({
    consumer: { key: process.env.BRICKLINK_CONSUMER_KEY, secret: process.env.BRICKLINK_CONSUMER_SECRET },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto.createHmac('sha1', key).update(base_string).digest('base64');
    }
  });
  const token = { key: process.env.BRICKLINK_TOKEN_VALUE, secret: process.env.BRICKLINK_TOKEN_SECRET };
  return oauth.toHeader(oauth.authorize({ url, method }, token));
}

async function fetchBLInventory() {
  const url = 'https://api.bricklink.com/api/store/v1/inventories';
  const res = await fetch(url, { headers: { ...blAuth(url, 'GET') } });
  if (!res.ok) throw new Error(`BL ${res.status}`);
  const data = await res.json();
  return (data.data || []).map(item => ({
    part_no: item.item?.no || String(item.item?.no),
    part_name: item.item?.name || '',
    color_id: item.color_id,
    color_name: item.color_name || null,
    quantity: item.quantity || 0,
    condition: item.new_or_used || 'USED',
    location: item.remarks || null,
    unit_price_cents: item.unit_price ? Math.round(parseFloat(item.unit_price) * 100) : null,
    marketplace: 'bricklink',
    marketplace_id: String(item.inventory_id),
  }));
}

async function fetchBrickOwlInventory() {
  const key = process.env.BRICKOWL_API_KEY;
  if (!key) return [];
  const url = `https://api.brickowl.com/v1/inventory/list?key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`BO ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(item => ({
    part_no: item.boid || String(item.boid),
    part_name: item.name || '',
    color_id: item.color_id || null,
    color_name: null,
    quantity: item.qty || 0,
    condition: item.type || 'USED',
    location: null,
    unit_price_cents: item.price ? Math.round(parseFloat(item.price) * 100) : null,
    marketplace: 'brickowl',
    marketplace_id: String(item.lot_id || item.boid),
  }));
}

async function runSync() {
  const results = {};

  try {
    const items = await fetchBLInventory();
    const res = await fetch('https://replaybrick.com/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    results.bricklink = await res.json();
  } catch (err) {
    results.bricklink = { error: err.message };
  }

  try {
    const items = await fetchBrickOwlInventory();
    const res = await fetch('https://replaybrick.com/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    results.brickowl = await res.json();
  } catch (err) {
    results.brickowl = { error: err.message };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ synced_at: new Date().toISOString(), results }),
  };
}

export const handler = schedule('@hourly', runSync);
