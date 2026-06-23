// Hold Scheduled Sync — Netlify Scheduled Function
// Runs every 15 minutes, triggers all syncs, sends Discord notification for new orders
// Completely independent — no laptop/Hermes dependency

import { getStore } from '@netlify/blobs';
import crypto from 'crypto';

// Wrap in async IIFE for top-level await in scheduled functions
export const handler = async (event) => {
  // Only run on scheduled events
  if (event.headers['x-netlify-event'] !== 'schedule') {
    return { statusCode: 200, body: 'ok' };
  }

  const results = {};
  const DISCORD_WEBHOOK = process.env.DISCORD_HOLD_WEBHOOK || '';

  // ── Helpers ──
  async function apiGet(path, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = `https://replaybrick.com/api/hold${path}${qs ? '?' + qs : ''}`;
    const token = getApiToken();
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) throw new Error(`${path}: ${resp.status}`);
    return resp.json();
  }

  async function apiPost(path, body = {}) {
    const url = `https://replaybrick.com/api/hold${path}`;
    const token = getApiToken();
    const resp = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`${path}: ${resp.status}`);
    return resp.json();
  }

  // ── Auth token ──
  function getApiToken() {
    if (process.env.HOLD_API_TOKEN) return process.env.HOLD_API_TOKEN;
    return crypto.createHash('sha256')
      .update('hold-replay-bricks-' + (process.env.NETLIFY_SITE_ID || 'local'))
      .digest('hex').slice(0, 48);
  }

  // ── Blob store for tracking last-seen orders ──
  async function getState() {
    try {
      const store = getStore('hold-data');
      const data = await store.get('__scheduled_sync_state__', { type: 'json' });
      return data || { lastOrderIds: [] };
    } catch { return { lastOrderIds: [] }; }
  }

  async function saveState(state) {
    try {
      const store = getStore('hold-data');
      await store.set('__scheduled_sync_state__', JSON.stringify(state));
    } catch (e) { console.error('Failed to save sync state:', e.message); }
  }

  // ── Discord notification ──
  async function sendDiscord(message) {
    if (!DISCORD_WEBHOOK) {
      console.log('[hold-scheduled] No DISCORD_HOLD_WEBHOOK set, skipping notification');
      return;
    }
    try {
      await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });
    } catch (e) { console.error('Discord notification failed:', e.message); }
  }

  // ── Main sync logic ──
  try {
    const state = await getState();
    
    // Trigger all syncs
    for (const mp of ['bricklink', 'brickowl']) {
      for (const kind of ['orders', 'inventory']) {
        try {
          const r = await apiPost(`/sync/${mp}/${kind}`);
          results[`${mp}_${kind}`] = r;
        } catch (e) {
          results[`${mp}_${kind}`] = { error: e.message };
        }
      }
    }

    // Check for new orders
    try {
      const orderResp = await apiGet('/orders', { limit: 50 });
      const orders = orderResp.orders || [];
      const knownIds = new Set(state.lastOrderIds);
      const newOrders = orders.filter(o => !knownIds.has(o.id));

      if (newOrders.length > 0 && DISCORD_WEBHOOK) {
        const lines = newOrders.map(o => {
          const mp = (o.marketplace || '?').charAt(0).toUpperCase() + (o.marketplace || '?').slice(1);
          const buyer = o.buyer_name || 'Unknown buyer';
          const items = o.total_items || o.items_count || 0;
          const price = (o.total_price_cents || 0) / 100;
          const date = o.order_date || '?';
          return `📦 **New ${mp} Order!** #${o.order_id} | ${buyer}\nDate: ${date} | ${items} item(s) | $${price.toFixed(2)}`;
        });
        await sendDiscord(lines.join('\n'));
      }

      // Update state
      state.lastOrderIds = orders.map(o => o.id);
      await saveState(state);

      results.notifications = newOrders.length;
    } catch (e) {
      results.notifications_error = e.message;
    }

    console.log('[hold-scheduled] Sync complete:', JSON.stringify(results));
    return { statusCode: 200, body: JSON.stringify(results) };
  } catch (err) {
    console.error('[hold-scheduled] Fatal error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
