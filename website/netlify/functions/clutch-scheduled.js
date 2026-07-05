// Hold Scheduled Sync — Netlify Scheduled Function
// Runs every 15 minutes, triggers all syncs, sends Discord notification for new orders
// Completely independent — no laptop/Hermes dependency

import { getStore } from '@netlify/blobs';
import crypto from 'crypto';
import net from 'net';
import tls from 'tls';

// ── SMTP email sender ──
async function sendEmail({ to, subject, body }) {
  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
  const SMTP_USER = process.env.SMTP_USER || 'bbaxter361@gmail.com';
  const SMTP_PASS = process.env.SMTP_PASS || '';
  
  if (!SMTP_PASS) {
    console.log('[clutch-scheduled] No SMTP_PASS set, skipping email');
    return;
  }

  const from = `"Hold Orders" <${SMTP_USER}>`;
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n');

  return new Promise((resolve, reject) => {
    const socket = net.createConnection(SMTP_PORT, SMTP_HOST);
    let buffer = '';
    let step = 0;

    const send = (cmd) => {
      socket.write(cmd + '\r\n');
    };

    const onData = (data) => {
      buffer += data.toString();
      const code = parseInt(buffer.slice(0, 3));
      
      if (step === 0 && code === 220) {
        send('EHLO hold.replaybrick.com');
        step++;
      } else if (step === 1 && code === 250) {
        send('STARTTLS');
        step++;
      } else if (step === 2 && code === 220) {
        // Upgrade to TLS
        socket.removeListener('data', onData);
        const tlsSocket = tls.connect({
          socket,
          servername: SMTP_HOST,
        });
        
        buffer = '';
        tlsSocket.on('data', (tlsData) => {
          buffer += tlsData.toString();
          const code = parseInt(buffer.slice(0, 3));
          
          if (step === 2 && code === 220) {
            sendAuth(tlsSocket);
            step++;
          }
        });
        
        sendAuth(tlsSocket);
        step++;
      }
    };

    const sendAuth = (sock) => {
      let buf = '';
      let s = 0;
      
      sock.on('data', (d) => {
        buf += d.toString();
        const c = parseInt(buf.slice(0, 3));
        
        if (s === 0) {
          sendVia('EHLO hold.replaybrick.com');
          s++;
        } else if (s === 1 && c === 250) {
          sendVia('AUTH LOGIN');
          s++;
        } else if (s === 2 && c === 334) {
          sendVia(Buffer.from(SMTP_USER).toString('base64'));
          s++;
        } else if (s === 3 && c === 334) {
          sendVia(Buffer.from(SMTP_PASS).toString('base64'));
          s++;
        } else if (s === 4 && c === 235) {
          sendVia(`MAIL FROM:<${SMTP_USER}>`);
          s++;
        } else if (s === 5 && c === 250) {
          sendVia(`RCPT TO:<${to}>`);
          s++;
        } else if (s === 6 && c === 250) {
          sendVia('DATA');
          s++;
        } else if (s === 7 && c === 354) {
          sendVia(message + '\r\n.');
          s++;
        } else if (s === 8 && c === 250) {
          sendVia('QUIT');
          resolve();
        }
      });

      const sendVia = (cmd) => sock.write(cmd + '\r\n');
      sendVia('EHLO hold.replaybrick.com');
    };

    socket.on('data', onData);
    socket.on('error', (err) => {
      console.error('[clutch-scheduled] SMTP error:', err.message);
      resolve(); // Don't fail the whole sync for email issues
    });
    
    setTimeout(() => resolve(), 15000); // 15s timeout
  });
}

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
    const url = `https://replaybrick.com/api/clutch${path}${qs ? '?' + qs : ''}`;
    const token = getApiToken();
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) throw new Error(`${path}: ${resp.status}`);
    return resp.json();
  }

  async function apiPost(path, body = {}) {
    const url = `https://replaybrick.com/api/clutch${path}`;
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
      console.log('[clutch-scheduled] No DISCORD_HOLD_WEBHOOK set, skipping notification');
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

      if (newOrders.length > 0) {
        const lines = newOrders.map(o => {
          const mp = (o.marketplace || '?').charAt(0).toUpperCase() + (o.marketplace || '?').slice(1);
          const buyer = o.buyer_name || 'Unknown buyer';
          const items = o.total_items || o.items_count || 0;
          const price = (o.total_price_cents || 0) / 100;
          const date = o.order_date || '?';
          return `📦 New ${mp} Order! #${o.order_id} | ${buyer}\nDate: ${date} | ${items} item(s) | $${price.toFixed(2)}`;
        });
        
        // Discord
        if (DISCORD_WEBHOOK) {
          await sendDiscord(lines.join('\n'));
        }
        
        // Email to Brian & Amanda
        const emailBody = [
          `New orders from BrickLink & BrickOwl — ${new Date().toLocaleDateString('en-US', { timeZone: 'America/Chicago' })}`,
          '',
          ...lines.map(l => l.replace(/📦\s*\*\*/g, '').replace(/\*\*/g, '').replace(/\n/g, ' | ')),
          '',
          '— Hold Sync',
        ].join('\n');
        
        const orderTitles = newOrders.map(o => `#${o.order_id}`).join(', ');
        await sendEmail({
          to: 'amanda@replaybrick.com',
          subject: `📦 ${newOrders.length} New Order${newOrders.length > 1 ? 's' : ''}: ${orderTitles}`,
          body: emailBody,
        });
      }

      // Update state
      state.lastOrderIds = orders.map(o => o.id);
      await saveState(state);

      results.notifications = newOrders.length;
    } catch (e) {
      results.notifications_error = e.message;
    }

    console.log('[clutch-scheduled] Sync complete:', JSON.stringify(results));
    return { statusCode: 200, body: JSON.stringify(results) };
  } catch (err) {
    console.error('[clutch-scheduled] Fatal error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
