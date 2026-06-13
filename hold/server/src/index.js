import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { getDb, getSetting, setSetting } from './db.js';
import { SyncEngine } from './sync.js';
import { BrickStoreSync } from './brickstore.js';
import { BrickLinkClient } from './bricklink.js';
import { PushEngine } from './push.js';
import { Scheduler } from './scheduler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const db = getDb();
const sync = new SyncEngine();
const bsSync = new BrickStoreSync();
const push = new PushEngine(sync);
const scheduler = new Scheduler(sync, push);

// Try to load credentials on startup
sync.loadCredentials();

// ========== AUTH (simple bearer token) ==========
// Token lives in settings.api_token; generated on first boot.
let apiToken = getSetting(db, 'api_token', null);
if (!apiToken) {
  apiToken = crypto.randomBytes(24).toString('hex');
  setSetting(db, 'api_token', apiToken);
  console.log(`🔑 Generated API token (stored in settings table)`);
}

app.use('/api', (req, res, next) => {
  // Status + login stay open
  if (req.path === '/status' || req.path === '/auth/login') return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token;
  if (token === apiToken) return next();
  return res.status(401).json({ error: 'Unauthorized' });
});

// Login: exchanges the portal credentials for the API token
const USERS = {
  'brian@replaybrick.com': 'Brian!1138',
  'amanda@replaybrick.com': 'Brian!1138',
};
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (USERS[String(email || '').toLowerCase()] === password) {
    return res.json({ ok: true, token: apiToken, name: email.split('@')[0] });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// ========== STATUS ==========

app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    bricklink: sync.isConfigured('bricklink'),
    brickowl: sync.isConfigured('brickowl'),
    db: !!db,
  });
});

// ========== CREDENTIALS ==========

app.post('/api/credentials', (req, res) => {
  const { marketplace, credentials } = req.body;
  
  if (!marketplace || !credentials) {
    return res.status(400).json({ error: 'marketplace and credentials required' });
  }

  try {
    db.prepare(`
      INSERT INTO api_credentials (marketplace, credentials, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(marketplace) DO UPDATE SET
        credentials = excluded.credentials,
        updated_at = datetime('now')
    `).run(marketplace, JSON.stringify(credentials));

    // Reload sync engine
    sync.loadCredentials();

    res.json({ ok: true, marketplace });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/credentials', (req, res) => {
  const creds = db.prepare('SELECT marketplace FROM api_credentials').all();
  res.json(creds.map(c => c.marketplace));
});

app.delete('/api/credentials/:marketplace', (req, res) => {
  db.prepare('DELETE FROM api_credentials WHERE marketplace = ?').run(req.params.marketplace);
  sync.loadCredentials();
  res.json({ ok: true });
});

// ========== SYNC ==========

app.post('/api/sync/:marketplace/:type', async (req, res) => {
  const { marketplace, type } = req.params;

  try {
    let result;
    if (marketplace === 'bricklink' && type === 'inventory') {
      result = await sync.syncBLInventory();
    } else if (marketplace === 'bricklink' && type === 'orders') {
      result = await sync.syncBLOrders();
    } else if (marketplace === 'brickowl' && type === 'inventory') {
      result = await sync.syncBOInventory();
    } else if (marketplace === 'brickowl' && type === 'orders') {
      result = await sync.syncBOOrders();
    } else if (marketplace === 'all' && type === 'all') {
      result = await sync.syncAll();
    } else {
      return res.status(400).json({ error: `Unknown sync: ${marketplace}/${type}` });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sync/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const logs = db.prepare(`
    SELECT * FROM sync_log ORDER BY started_at DESC LIMIT ?
  `).all(limit);
  res.json(logs);
});

// ========== INVENTORY ==========

app.get('/api/inventory', (req, res) => {
  const { search, color, condition, location, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = ['1=1'];
  let params = [];

  if (search) {
    where.push('(i.part_no LIKE ? OR i.part_name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (color) {
    where.push('i.color_id = ?');
    params.push(parseInt(color));
  }
  if (condition) {
    where.push('i.condition = ?');
    params.push(condition);
  }
  if (location) {
    where.push('i.location LIKE ?');
    params.push(`%${location}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM inventory i WHERE ${where.join(' AND ')}`).get(...params);

  const items = db.prepare(`
    SELECT i.*, c.color_name, c.color_code,
      (SELECT COUNT(*) FROM marketplace_lots ml WHERE ml.inventory_id = i.id) as marketplace_count
    FROM inventory i
    LEFT JOIN bl_colors c ON i.color_id = c.color_id
    WHERE ${where.join(' AND ')}
    ORDER BY i.updated_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  // Compute BrickLink image + catalog URLs per item
  const result = items.map(item => {
    const partNo = item.part_no;
    const colorId = item.color_id;

    // Sets have -N suffix (e.g., 21318-1). Strip it for images.
    // BrickLink set images: /ItemImage/SN/0/{bare_number}.png
    // BrickLink part images: /ItemImage/PN/{color_id}/{part_no}.png
    const isSet = /-\d+$/.test(partNo);
    const barePartNo = isSet ? partNo.replace(/-\d+$/, '') : partNo;

    let image_url;
    if (isSet) {
      image_url = `https://img.bricklink.com/ItemImage/SN/0/${barePartNo}.png`;
    } else {
      image_url = colorId
        ? `https://img.bricklink.com/ItemImage/PN/${colorId}/${partNo}.png`
        : `https://img.bricklink.com/ItemImage/PN/0/${partNo}.png`;
    }

    // Catalog URL also works better without -1 for sets
    const catalogPart = isSet ? barePartNo : partNo;
    const catalog_url = `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${catalogPart}${colorId && !isSet ? `&C=${colorId}` : ''}`;

    return {
      ...item,
      image_url,
      catalog_url,
    };
  });

  res.json({
    items: result,
    total: total.cnt,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total.cnt / parseInt(limit)),
  });
});

app.get('/api/inventory/:id', (req, res) => {
  const item = db.prepare(`
    SELECT i.*, c.color_name, c.color_code
    FROM inventory i
    LEFT JOIN bl_colors c ON i.color_id = c.color_id
    WHERE i.id = ?
  `).get(req.params.id);

  if (!item) return res.status(404).json({ error: 'Not found' });

  const lots = db.prepare('SELECT * FROM marketplace_lots WHERE inventory_id = ?').all(item.id);

  res.json({ item, lots });
});

app.put('/api/inventory/:id', async (req, res) => {
  const { quantity, unit_price_cents, location, notes, condition, push_to_marketplaces } = req.body;

  db.prepare(`
    UPDATE inventory SET
      quantity = COALESCE(?, quantity),
      unit_price_cents = COALESCE(?, unit_price_cents),
      location = COALESCE(?, location),
      notes = COALESCE(?, notes),
      condition = COALESCE(?, condition),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(quantity ?? null, unit_price_cents ?? null, location ?? null, notes ?? null, condition ?? null, req.params.id);

  // Push qty/price changes out to linked marketplace lots (honors push_mode)
  let pushResults = null;
  if (push_to_marketplaces !== false && (quantity !== undefined || unit_price_cents !== undefined)) {
    try {
      pushResults = await push.pushInventoryChange(parseInt(req.params.id), {
        quantity: quantity ?? null,
        unitPriceCents: unit_price_cents ?? null,
      });
    } catch (err) {
      pushResults = { error: err.message };
    }
  }

  res.json({ ok: true, push: pushResults, push_mode: push.mode });
});

// ========== PRICE GUIDE ==========

app.get('/api/inventory/:id/prices', async (req, res) => {
  const item = db.prepare('SELECT part_no, color_id, condition FROM inventory WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  // Try cache first
  const cached = db.prepare(`
    SELECT * FROM price_cache
    WHERE part_no = ? AND (color_id = ? OR color_id IS NULL) AND condition = ?
    ORDER BY cached_at DESC
  `).all(item.part_no, item.color_id || null, item.condition || 'USED');

  // If cache is fresh (< 1 hour), return it
  const fresh = cached.filter(c => {
    const age = (Date.now() - new Date(c.cached_at + 'Z').getTime()) / 1000 / 60;
    return age < 60;
  });

  if (fresh.length > 0) {
    return res.json({ source: 'cache', prices: fresh });
  }

  // Try BrickLink price guide
  if (sync.isConfigured('bricklink')) {
    try {
      const partType = /-\d+$/.test(item.part_no) ? 'SET' : 'PART';
      const barePart = item.part_no.replace(/-\d+$/, '');
      const priceData = await sync.blClient.getItemPriceGuide(partType, barePart, item.color_id || null, {});

      if (priceData) {
        const entry = {
          part_no: item.part_no,
          color_id: item.color_id,
          source: 'bricklink',
          avg_price_cents: priceData.avg_price ? Math.round(parseFloat(priceData.avg_price) * 100) : null,
          min_price_cents: priceData.min_price ? Math.round(parseFloat(priceData.min_price) * 100) : null,
          max_price_cents: priceData.max_price ? Math.round(parseFloat(priceData.max_price) * 100) : null,
          qty_available: priceData.quantity_available || null,
          currency: priceData.currency_code || 'USD',
          condition: item.condition || 'USED',
          raw_data: JSON.stringify(priceData),
          cached_at: new Date().toISOString(),
        };

        db.prepare(`
          INSERT INTO price_cache (part_no, color_id, source, avg_price_cents, min_price_cents, max_price_cents, qty_available, currency, condition, raw_data, cached_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(part_no, color_id, source, condition) DO UPDATE SET
            avg_price_cents = excluded.avg_price_cents,
            min_price_cents = excluded.min_price_cents,
            max_price_cents = excluded.max_price_cents,
            qty_available = excluded.qty_available,
            currency = excluded.currency,
            raw_data = excluded.raw_data,
            cached_at = excluded.cached_at
        `).run(
          entry.part_no, entry.color_id, entry.source,
          entry.avg_price_cents, entry.min_price_cents, entry.max_price_cents,
          entry.qty_available, entry.currency, entry.condition, entry.raw_data
        );

        return res.json({ source: 'bricklink', prices: [entry] });
      }
    } catch (err) {
      console.warn(`Price guide failed for ${item.part_no}:`, err.message);
      return res.json({ source: 'error', error: err.message, prices: cached });
    }
  }

  res.json({ source: 'nocache', prices: cached });
});

app.post('/api/inventory/refresh-prices', async (req, res) => {
  if (!sync.isConfigured('bricklink')) {
    return res.status(400).json({ error: 'BrickLink not configured' });
  }

  // Get all unique inventory items
  const items = db.prepare('SELECT DISTINCT part_no, color_id, condition FROM inventory').all();
  const results = { total: items.length, success: 0, errors: 0, details: [] };

  for (const item of items) {
    try {
      const partType = /-\d+$/.test(item.part_no) ? 'SET' : 'PART';
      const barePart = item.part_no.replace(/-\d+$/, '');
      const priceData = await sync.blClient.getItemPriceGuide(partType, barePart, item.color_id || null, {});

      if (priceData) {
        db.prepare(`
          INSERT INTO price_cache (part_no, color_id, source, avg_price_cents, min_price_cents, max_price_cents, qty_available, currency, condition, raw_data, cached_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(part_no, color_id, source, condition) DO UPDATE SET
            avg_price_cents = excluded.avg_price_cents,
            min_price_cents = excluded.min_price_cents,
            max_price_cents = excluded.max_price_cents,
            qty_available = excluded.qty_available,
            currency = excluded.currency,
            raw_data = excluded.raw_data,
            cached_at = excluded.cached_at
        `).run(
          item.part_no, item.color_id, 'bricklink',
          priceData.avg_price ? Math.round(parseFloat(priceData.avg_price) * 100) : null,
          priceData.min_price ? Math.round(parseFloat(priceData.min_price) * 100) : null,
          priceData.max_price ? Math.round(parseFloat(priceData.max_price) * 100) : null,
          priceData.quantity_available || null,
          priceData.currency_code || 'USD',
          item.condition || 'USED',
          JSON.stringify(priceData)
        );
        results.success++;
      }
    } catch (err) {
      results.errors++;
      results.details.push(`${item.part_no}: ${err.message.slice(0, 100)}`);
    }
  }

  res.json(results);
});

// ========== ORDERS ==========

app.get('/api/orders', (req, res) => {
  const { status, marketplace, search, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = ['1=1'];
  let params = [];

  if (status) {
    where.push('o.status = ?');
    params.push(status);
  }
  if (marketplace) {
    where.push('o.marketplace = ?');
    params.push(marketplace);
  }
  if (search) {
    where.push('(o.order_id LIKE ? OR o.buyer_name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM orders o WHERE ${where.join(' AND ')}`).get(...params);

  const orders = db.prepare(`
    SELECT o.*,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
    FROM orders o
    WHERE ${where.join(' AND ')}
    ORDER BY o.order_date DESC, o.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({
    orders,
    total: total.cnt,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total.cnt / parseInt(limit)),
  });
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });

  const items = db.prepare(`
    SELECT oi.*, c.color_name, c.color_code
    FROM order_items oi
    LEFT JOIN bl_colors c ON oi.color_id = c.color_id
    WHERE oi.order_id = ?
  `).all(order.id);

  res.json({ ...order, items });
});

app.put('/api/orders/:id/status', async (req, res) => {
  const { status, push_to_marketplace } = req.body;
  if (!status) return res.status(400).json({ error: 'status required' });

  db.prepare(`
    UPDATE orders SET status = ?, last_synced_at = datetime('now') WHERE id = ?
  `).run(status, req.params.id);

  // Push status change back to the marketplace (honors push_mode)
  let pushResult = null;
  if (push_to_marketplace !== false) {
    try {
      pushResult = await push.pushOrderStatus(parseInt(req.params.id), status);
    } catch (err) {
      pushResult = { error: err.message };
    }
  }

  res.json({ ok: true, push: pushResult, push_mode: push.mode });
});

// ========== DASHBOARD STATS ==========

app.get('/api/dashboard', (req, res) => {
  const totalItems = db.prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM inventory').get();
  const uniqueParts = db.prepare('SELECT COUNT(DISTINCT part_no) as count FROM inventory').get();
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'paid')").get();
  const totalValue = db.prepare('SELECT COALESCE(SUM(quantity * unit_price_cents), 0) as total FROM inventory').get();

  const recentOrders = db.prepare(`
    SELECT * FROM orders ORDER BY order_date DESC LIMIT 5
  `).all();

  const recentSyncs = db.prepare(`
    SELECT * FROM sync_log ORDER BY started_at DESC LIMIT 5
  `).all();

  res.json({
    stats: {
      totalItems: totalItems.total,
      uniqueParts: uniqueParts.count,
      totalOrders: totalOrders.count,
      pendingOrders: pendingOrders.count,
      totalValueCents: totalValue.total,
    },
    recentOrders,
    recentSyncs,
  });
});

// ========== PRICING RULES ==========

app.get('/api/pricing-rules', (req, res) => {
  const rules = db.prepare('SELECT * FROM pricing_rules ORDER BY created_at DESC').all();
  res.json(rules);
});

app.post('/api/pricing-rules', (req, res) => {
  const { name, rule_type, marketplace, condition, min_price_cents, max_price_cents, markup_percent, markup_fixed_cents } = req.body;
  
  const result = db.prepare(`
    INSERT INTO pricing_rules (name, rule_type, marketplace, condition, min_price_cents, max_price_cents, markup_percent, markup_fixed_cents)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, rule_type, marketplace || null, condition || null, min_price_cents || null, max_price_cents || null, markup_percent || null, markup_fixed_cents || null);

  res.json({ ok: true, id: result.lastInsertRowid });
});

app.delete('/api/pricing-rules/:id', (req, res) => {
  db.prepare('DELETE FROM pricing_rules WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ========== CATALOG / COLORS ==========

app.get('/api/colors', (req, res) => {
  const colors = db.prepare('SELECT * FROM bl_colors ORDER BY color_name').all();
  res.json(colors);
});

// ========== MARKETPLACE LOTS ==========

app.get('/api/marketplace-lots/:marketplace', (req, res) => {
  const lots = db.prepare(`
    SELECT ml.*, i.part_no, i.part_name, i.location, c.color_name, c.color_code
    FROM marketplace_lots ml
    JOIN inventory i ON ml.inventory_id = i.id
    LEFT JOIN bl_colors c ON i.color_id = c.color_id
    WHERE ml.marketplace = ?
    ORDER BY ml.last_synced_at DESC
    LIMIT 100
  `).all(req.params.marketplace);
  res.json(lots);
});

// ========== BRICKSTORE SYNC ==========

app.post('/api/brickstore/sync', (req, res) => {
  const { filePath, marketplace } = req.body;
  
  if (!filePath) {
    return res.status(400).json({ error: 'filePath required' });
  }

  try {
    const result = bsSync.syncFromBSX(filePath, { marketplace: marketplace || null });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parse only (preview)
app.post('/api/brickstore/preview', (req, res) => {
  const { filePath } = req.body;
  
  if (!filePath) {
    return res.status(400).json({ error: 'filePath required' });
  }

  try {
    const data = bsSync.parseBSXFile(filePath);
    res.json({
      currency: data.currency,
      itemCount: data.itemCount,
      items: data.items.slice(0, 100), // limit preview
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== BEACON (fire-and-forget close sync) ==========

app.post('/api/sync/beacon', (req, res) => {
  // Return 200 immediately — sync runs in background
  res.json({ ok: true, queued: true });
  
  // Fire sync asynchronously after response is sent
  sync.syncAll()
    .then(r => console.log('Beacon sync completed:', Object.keys(r)))
    .catch(err => console.error('Beacon sync failed:', err.message));
});

// ========== PENDING ITEMS (Voice/Manual Import) ==========

app.get('/api/pending', (req, res) => {
  const items = db.prepare(`
    SELECT p.*, c.color_name as bl_color_name, c.color_code
    FROM pending_items p
    LEFT JOIN bl_colors c ON p.color_id = c.color_id
    WHERE p.status = 'pending'
    ORDER BY p.created_at DESC
  `).all();

  // Add image URLs for each item
  const result = items.map(item => ({
    ...item,
    image_url: item.color_id
      ? `https://img.bricklink.com/ItemImage/PN/${item.color_id}/${item.part_no}.png`
      : `https://img.bricklink.com/ItemImage/PN/0/${item.part_no}.png`,
    catalog_url: `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${item.part_no}${item.color_id ? `&C=${item.color_id}` : ''}`,
  }));

  res.json({ items: result, total: result.length });
});

app.post('/api/pending', (req, res) => {
  const { part_no, color_id, color_name, part_name, quantity, condition, location, unit_price_cents, notes, session_id } = req.body;

  if (!part_no) return res.status(400).json({ error: 'part_no required' });

  // Look up part info from BrickLink catalog if not provided
  const partName = part_name || '';
  const colName = color_name || null;

  const result = db.prepare(`
    INSERT INTO pending_items (part_no, color_id, color_name, part_name, quantity, condition, location, unit_price_cents, notes, source, session_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'voice', ?, 'pending')
  `).run(
    part_no,
    color_id ?? null,
    colName,
    partName,
    quantity || 1,
    condition || 'USED',
    location || null,
    unit_price_cents ?? null,
    notes || null,
    session_id || null
  );

  res.json({ ok: true, id: result.lastInsertRowid });
});

app.post('/api/pending/batch', (req, res) => {
  const { items: pendingItems, session_id } = req.body;
  if (!Array.isArray(pendingItems) || pendingItems.length === 0) {
    return res.status(400).json({ error: 'items array required' });
  }

  const insert = db.prepare(`
    INSERT INTO pending_items (part_no, color_id, color_name, part_name, quantity, condition, location, unit_price_cents, notes, source, session_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'voice', ?, 'pending')
  `);

  const ids = [];
  const txn = db.transaction(() => {
    for (const item of pendingItems) {
      const result = insert.run(
        item.part_no,
        item.color_id ?? null,
        item.color_name || null,
        item.part_name || '',
        item.quantity || 1,
        item.condition || 'USED',
        item.location || null,
        item.unit_price_cents ?? null,
        item.notes || null,
        session_id || null
      );
      ids.push(result.lastInsertRowid);
    }
  });
  txn();

  res.json({ ok: true, count: ids.length, ids });
});

app.put('/api/pending/:id', (req, res) => {
  const { quantity, condition, location, unit_price_cents, color_id, color_name, part_name, notes } = req.body;
  db.prepare(`
    UPDATE pending_items SET
      quantity = COALESCE(?, quantity),
      condition = COALESCE(?, condition),
      location = COALESCE(?, location),
      unit_price_cents = COALESCE(?, unit_price_cents),
      color_id = COALESCE(?, color_id),
      color_name = COALESCE(?, color_name),
      part_name = COALESCE(?, part_name),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    quantity ?? null, condition ?? null, location ?? null,
    unit_price_cents ?? null, color_id ?? null, color_name ?? null,
    part_name ?? null, notes ?? null, req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/pending/:id', (req, res) => {
  db.prepare('DELETE FROM pending_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Confirm pending → move to inventory
app.post('/api/pending/confirm', (req, res) => {
  const { ids } = req.body;
  const items = ids
    ? db.prepare(`SELECT * FROM pending_items WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids)
    : db.prepare("SELECT * FROM pending_items WHERE status = 'pending'").all();

  let confirmed = 0;
  let errors = [];

  const txn = db.transaction(() => {
    for (const item of items) {
      try {
        // Upsert into inventory
        db.prepare(`
          INSERT INTO inventory (part_no, color_id, part_name, quantity, location, condition, unit_price_cents, notes, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(part_no, color_id, condition) DO UPDATE SET
            quantity = excluded.quantity + inventory.quantity,
            part_name = COALESCE(excluded.part_name, part_name),
            location = COALESCE(excluded.location, location),
            unit_price_cents = excluded.unit_price_cents,
            notes = COALESCE(excluded.notes, notes),
            updated_at = datetime('now')
        `).run(
          item.part_no, item.color_id, item.part_name,
          item.quantity, item.location, item.condition,
          item.unit_price_cents, item.notes
        );

        // Mark as confirmed
        db.prepare("UPDATE pending_items SET status = 'confirmed', updated_at = datetime('now') WHERE id = ?")
          .run(item.id);
        confirmed++;
      } catch (err) {
        errors.push({ id: item.id, error: err.message });
      }
    }
  });
  txn();

  res.json({ ok: true, confirmed, errors, total: items.length });
});

// ========== BRICKECONOMY SCRAPING ==========

app.post('/api/scrape/brickeconomy', async (req, res) => {
  res.json({ ok: true, message: 'Scraper dispatched' });

  const items = db.prepare('SELECT DISTINCT part_no, color_id FROM inventory WHERE part_no IS NOT NULL').all();

  let scraped = 0;
  for (const item of items.slice(0, 10)) {  // First 10 as test
    try {
      const { execSync } = await import('child_process');
      const colorPart = item.color_id ? `&color=${item.color_id}` : '';
      const url = `https://www.brickeconomy.com/part/${item.part_no}${colorPart}`;

      const result = execSync(
        `python3 -c "
import sys
sys.path.insert(0, '/home/bbaxter/workspace/replay-bricks/hold/server/src')
from brickeconomy_scraper import scrape_price
import json
print(json.dumps(scrape_price('${item.part_no}', ${item.color_id || 'null'})))
"`,
        { timeout: 30000, shell: '/bin/bash', encoding: 'utf-8', cwd: '/home/bbaxter/workspace/replay-bricks/hold/server' }
      );
      const data = JSON.parse(result.trim());

      if (data && data.price_cents) {
        db.prepare(`
          INSERT INTO price_cache (part_no, color_id, source, avg_price_cents, min_price_cents, max_price_cents, qty_available, condition, raw_data, cached_at)
          VALUES (?, ?, 'brickeconomy', ?, ?, ?, ?, 'USED', ?, datetime('now'))
          ON CONFLICT(part_no, color_id, source, condition) DO UPDATE SET
            avg_price_cents = excluded.avg_price_cents,
            min_price_cents = excluded.min_price_cents,
            max_price_cents = excluded.max_price_cents,
            qty_available = excluded.qty_available,
            raw_data = excluded.raw_data,
            cached_at = excluded.cached_at
        `).run(
          item.part_no, item.color_id,
          data.price_cents, data.low_price_cents || data.price_cents,
          data.high_price_cents || data.price_cents,
          data.qty_available || null,
          JSON.stringify(data)
        );
        scraped++;
      }
    } catch (err) {
      console.warn(`BrickEconomy scrape failed for ${item.part_no}: ${err.message}`);
    }
  }

  console.log(`BrickEconomy: scraped ${scraped} / ${Math.min(10, items.length)} items`);
});

// ========== TRAVEL PORTAL API ==========

app.post('/api/travel/search', async (req, res) => {
  const { type, destination, month, pax, origin, depart, return_date } = req.body;
  
  try {
    // Search via the Python travel search script using browser-harness
    const { execSync } = await import('child_process');
    
    let results = [];
    
    if (type === 'cruise') {
      // Search VacationsToGo for cruises
      const destName = destination || 'caribbean';
      const destMap = {
        caribbean: 'Caribbean', alaska: 'Alaska', bahamas: 'Bahamas',
        mexico: 'Mexican+Riviera', europe: 'Europe', hawaii: 'Hawaii'
      };
      const searchDest = destMap[destName] || destName;
      
      try {
        const output = execSync(
          `cd ~/workspace/replay-bricks/hold/travel-portal && python3 search.py cruise "${destName}" "${month || '2026-07'}"`,
          { timeout: 60000, shell: '/bin/bash', encoding: 'utf-8' }
        );
        
        // For now, return the raw search output as a single result
        // Future: parse actual cruise listings from the scraped data
        results.push({
          name: `${destName.charAt(0).toUpperCase() + destName.slice(1)} Cruise - ${month || 'July 2026'}`,
          price: 'Check sites for pricing',
          details: `Searching ${destName} cruises. Multiple options available on partner sites.`,
          source: 'Expedia / VacationsToGo',
          link: `https://www.vacationstogo.com/cruise_search.cfm?month=${month || '2026-07'}&dest=${destName}`
        });
      } catch (e) {
        results.push({
          name: `${destName.charAt(0).toUpperCase() + destName.slice(1)} Cruises`,
          price: 'Check sites',
          details: `Visit VacationsToGo or Expedia for ${destName} cruise deals in ${month || 'July 2026'}.`,
          source: 'Multiple sources',
          link: `https://www.expedia.com/Cruise-Search?destination=${destName}`
        });
      }
    } else if (type === 'colorado') {
      // Search for Colorado flights
      const from = origin || 'DFW';
      const to = destination || 'DEN';
      
      try {
        const output = execSync(
          `cd ~/workspace/replay-bricks/hold/travel-portal && python3 search.py colorado "${from}" "${depart || '2026-06-10'}" "${return_date || '2026-06-15'}"`,
          { timeout: 60000, shell: '/bin/bash', encoding: 'utf-8' }
        );
        
        results.push({
          name: `Flights ${from} → ${to} (${depart || 'Jun 10'} - ${return_date || 'Jun 15'})`,
          price: 'Check sites for pricing',
          details: `Searching ${from} to ${to} flights. Compare prices across Expedia and Travelocity.`,
          source: 'Expedia / Travelocity',
          link: `https://www.expedia.com/Flights-Search?flight-type=on&d1=${from}&o1=${to}&starDate=${depart || '2026-06-10'}&endDate=${return_date || '2026-06-15'}`
        });
      } catch (e) {
        results.push({
          name: `Flights ${from} → ${to}`,
          price: 'Check sites',
          details: `Visit Expedia or Travelocity to compare ${from} to ${to} flights for your dates.`,
          source: 'Multiple sources',
          link: `https://www.travelocity.com/Flights?origin=${from}&destination=${to}`
        });
      }
    }
    
    res.json({ results });
  } catch (err) {
    console.error('Travel search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ========== PUSH / RECONCILE (two-way sync) ==========

app.get('/api/push/status', (req, res) => {
  const recent = db.prepare('SELECT * FROM push_log ORDER BY created_at DESC, id DESC LIMIT 50').all();
  const counts = db.prepare(`
    SELECT mode, status, COUNT(*) as cnt FROM push_log GROUP BY mode, status
  `).all();
  res.json({ push_mode: push.mode, counts, recent });
});

app.post('/api/push/mode', (req, res) => {
  const { mode } = req.body;
  if (!['dry_run', 'live'].includes(mode)) {
    return res.status(400).json({ error: "mode must be 'dry_run' or 'live'" });
  }
  setSetting(db, 'push_mode', mode);
  res.json({ ok: true, push_mode: mode });
});

app.post('/api/reconcile', async (req, res) => {
  try {
    const result = await push.reconcileAll();
    res.json({ push_mode: push.mode, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reconcile/:orderId', async (req, res) => {
  try {
    // Allow re-running a specific order (clears the stamp first)
    db.prepare('UPDATE orders SET reconciled_at = NULL WHERE id = ?').run(req.params.orderId);
    const result = await push.reconcileOrder(parseInt(req.params.orderId));
    res.json({ push_mode: push.mode, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== SCHEDULER ==========

app.get('/api/scheduler/status', (req, res) => {
  res.json(scheduler.status());
});

app.post('/api/scheduler/tick', async (req, res) => {
  try {
    const result = await scheduler.tick();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scheduler/backup', (req, res) => {
  try {
    const dest = scheduler.backup();
    res.json({ ok: true, backup: dest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== SETTINGS ==========

app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  for (const r of rows) {
    if (r.key === 'api_token') continue; // never expose
    out[r.key] = r.value;
  }
  res.json(out);
});

app.put('/api/settings', (req, res) => {
  const allowed = ['push_mode', 'sync_interval_min', 'auto_sync_enabled', 'backup_keep_days', 'partout_default_condition', 'partout_auto_price'];
  const updated = {};
  for (const [k, v] of Object.entries(req.body || {})) {
    if (allowed.includes(k)) {
      setSetting(db, k, v);
      updated[k] = String(v);
    }
  }
  res.json({ ok: true, updated });
});

// ========== PICKING ==========

// Pick list across all open (paid/picked) orders, sorted by location for an
// efficient walk through the storage bins. ?order_id=N narrows to one order.
app.get('/api/picking', (req, res) => {
  const { order_id } = req.query;

  let rows;
  if (order_id) {
    rows = db.prepare(`
      SELECT oi.*, o.marketplace as order_marketplace, o.order_id as marketplace_order_id,
             o.buyer_name, o.status as order_status,
             i.location, i.quantity as stock_quantity, i.id as inventory_id,
             c.color_name, c.color_code
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN inventory i ON i.part_no = oi.part_no
        AND (i.color_id = oi.color_id OR (i.color_id IS NULL AND oi.color_id IS NULL))
        AND i.condition = COALESCE(oi.condition, 'USED')
      LEFT JOIN bl_colors c ON oi.color_id = c.color_id
      WHERE o.id = ?
      ORDER BY i.location ASC, oi.part_no ASC
    `).all(order_id);
  } else {
    rows = db.prepare(`
      SELECT oi.*, o.marketplace as order_marketplace, o.order_id as marketplace_order_id,
             o.buyer_name, o.status as order_status,
             i.location, i.quantity as stock_quantity, i.id as inventory_id,
             c.color_name, c.color_code
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN inventory i ON i.part_no = oi.part_no
        AND (i.color_id = oi.color_id OR (i.color_id IS NULL AND oi.color_id IS NULL))
        AND i.condition = COALESCE(oi.condition, 'USED')
      LEFT JOIN bl_colors c ON oi.color_id = c.color_id
      WHERE o.status IN ('paid', 'picked')
      ORDER BY i.location ASC, oi.part_no ASC
    `).all();
  }

  const items = rows.map(r => ({
    ...r,
    image_url: r.color_id
      ? `https://img.bricklink.com/ItemImage/PN/${r.color_id}/${r.part_no}.png`
      : `https://img.bricklink.com/ItemImage/PN/0/${r.part_no}.png`,
  }));

  res.json({ items, total: items.length });
});

// ========== PART-OUT ==========

// Validate set number format before hitting the API
function isValidSetNo(s) {
  return /^\d{4,6}(-?\d+)?$/i.test(s);
}

// Normalize set number to BrickLink format (adds -1 suffix if missing)
function normalizeSetNo(s) {
  const cleaned = s.replace(/[^a-zA-Z0-9-]/g, '').trim();
  if (cleaned.includes('-')) return cleaned;
  return `${cleaned}-1`;
}

// Pull a set's full part inventory from BrickLink + price guide, ready to
// review and push into pending items.
app.post('/api/partout/:setNo', async (req, res) => {
  if (!sync.isConfigured('bricklink')) {
    return res.status(400).json({ error: 'BrickLink not configured' });
  }

  const setNo = normalizeSetNo(req.params.setNo);
  if (!isValidSetNo(req.params.setNo)) {
    return res.status(400).json({ error: 'Invalid set number. Use format like "21318" or "10255-1".' });
  }

  const { 
    condition = 'USED', 
    include_prices = true,
    completeness = null  // 'sealed', 'complete', 'incomplete', null = skip
  } = req.body || {};

  // Validate completeness if provided
  if (completeness && !['sealed','complete','incomplete'].includes(completeness)) {
    return res.status(400).json({ error: 'completeness must be: sealed, complete, or incomplete' });
  }

  try {
    // Fetch set metadata (name, image, year)
    let setName = null, setImage = null, setYear = null;
    try {
      const setMeta = await sync.blClient.getItem('SET', setNo);
      if (setMeta) {
        setName = setMeta.name || null;
        setImage = setMeta.image_url || null;
        setYear = setMeta.year_released || null;
      }
    } catch (metaErr) {
      // Non-critical — continue without metadata
      console.warn(`Set metadata fetch failed for ${setNo}:`, metaErr.message);
    }

    // Fetch inventory with minifigs broken out
    const subsets = await sync.blClient.getItemSubsets('SET', setNo, null, { break_minifigs: true });
    if (!Array.isArray(subsets)) {
      return res.status(404).json({ error: `No inventory found for set ${setNo}. Check the set number and try again.` });
    }

    // Build color name lookup
    const colors = db.prepare('SELECT color_id, color_name, color_code FROM bl_colors').all();
    const colorMap = new Map(colors.map(c => [c.color_id, { name: c.color_name, code: c.color_code }]));

    let parts = [];
    let totalPieces = 0;
    let minifigCount = 0;

    for (const subset of subsets) {
      const isMinifig = (subset.match_no > 0);
      
      for (const entry of subset.entries || []) {
        const item = entry.item || {};
        const colorId = entry.color_id ?? null;
        const colorInfo = colorMap.get(colorId);
        
        const part = {
          part_no: item.no,
          part_name: item.name,
          item_type: item.type,
          color_id: colorId,
          color_name: colorInfo?.name || null,
          color_code: colorInfo?.code || null,
          quantity: entry.quantity || 0,
          extra: !!entry.is_extra,
          alternate: !!entry.is_alternate || !!entry.is_counterpart,
          minifig_set: isMinifig ? `Minifig ${subset.match_no}` : null,
          image_url: item.no
            ? `https://img.bricklink.com/ItemImage/PN/${colorId || 0}/${item.no}.png`
            : null,
        };
        
        if (part.item_type === 'MINIFIG') minifigCount++;
        totalPieces += part.quantity;
        parts.push(part);
      }
    }

    // Separate regular parts, extras, alternates
    const regularParts = parts.filter(p => !p.extra && !p.alternate);
    const extraParts = parts.filter(p => p.extra);
    const alternateParts = parts.filter(p => p.alternate);

    // Optionally price parts from price guide
    if (include_prices && regularParts.length > 0) {
      // Price up to 200 parts to avoid rate limits
      const partsToPrice = regularParts.slice(0, 200);
      const priceMap = new Map();

      // Use cached prices first
      const cachedPrices = db.prepare(`
        SELECT part_no, color_id, avg_price_cents, min_price_cents, max_price_cents, qty_available
        FROM price_cache WHERE condition = ?
      `).all(condition);
      for (const p of cachedPrices) {
        priceMap.set(`${p.part_no}|${p.color_id}`, {
          avg: p.avg_price_cents,
          min: p.min_price_cents,
          max: p.max_price_cents,
          qty_avail: p.qty_available,
        });
      }

      // For unpriced parts, fetch from BrickLink price guide in batches
      const unpriced = partsToPrice.filter(p => !priceMap.has(`${p.part_no}|${p.color_id}`));
      if (unpriced.length > 0) {
        for (const p of unpriced) {
          try {
            const guide = await sync.blClient.getItemPriceGuide(
              p.item_type === 'MINIFIG' ? 'MINIFIG' : 'PART',
              p.part_no,
              p.color_id,
              { guide_type: 'sold', condition }
            );
            if (guide) {
              priceMap.set(`${p.part_no}|${p.color_id}`, {
                avg: guide.avg_price ? Math.round(parseFloat(guide.avg_price) * 100) : null,
                min: guide.min_price ? Math.round(parseFloat(guide.min_price) * 100) : null,
                max: guide.max_price ? Math.round(parseFloat(guide.max_price) * 100) : null,
                qty_avail: guide.qty_avg_price || guide.total_quantity || null,
              });
              // Cache it for future lookups
              if (guide.avg_price) {
                db.prepare(`
                  INSERT INTO price_cache (part_no, color_id, source, avg_price_cents, min_price_cents, max_price_cents, qty_available, condition)
                  VALUES (?, ?, 'bricklink', ?, ?, ?, ?, ?)
                  ON CONFLICT(part_no, color_id, source, condition) DO UPDATE SET
                    avg_price_cents = excluded.avg_price_cents,
                    min_price_cents = excluded.min_price_cents,
                    max_price_cents = excluded.max_price_cents,
                    qty_available = excluded.qty_available,
                    cached_at = datetime('now')
                `).run(
                  p.part_no, p.color_id,
                  Math.round(parseFloat(guide.avg_price) * 100),
                  guide.min_price ? Math.round(parseFloat(guide.min_price) * 100) : null,
                  guide.max_price ? Math.round(parseFloat(guide.max_price) * 100) : null,
                  guide.qty_avg_price || guide.total_quantity || null,
                  condition
                );
              }
            }
          } catch (priceErr) {
            // Skip individual pricing failures
          }
        }
      }

      // Attach prices to parts
      const attachPrice = (p) => {
        const priceInfo = priceMap.get(`${p.part_no}|${p.color_id}`);
        if (priceInfo) {
          p.avg_price_cents = priceInfo.avg;
          p.min_price_cents = priceInfo.min;
          p.max_price_cents = priceInfo.max;
          p.qty_available = priceInfo.qty_avail;
        }
      };
      regularParts.forEach(attachPrice);
      extraParts.forEach(attachPrice);
      alternateParts.forEach(attachPrice);
    }

    res.json({
      set_no: setNo,
      set_name: setName,
      set_image: setImage,
      set_year: setYear,
      completeness,
      total_lots: parts.length,
      total_pieces: totalPieces,
      minifig_count: minifigCount,
      regular_parts: regularParts,
      extras: extraParts,
      alternates: alternateParts,
      parts, // Flat list for backward compat
    });
  } catch (err) {
    console.error(`Part-out error for ${setNo}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Send part-out results into pending review
app.post('/api/partout/:setNo/confirm', async (req, res) => {
  const { parts, condition = 'USED', location = null } = req.body || {};
  if (!Array.isArray(parts) || parts.length === 0) {
    return res.status(400).json({ error: 'parts array required' });
  }

  const insert = db.prepare(`
    INSERT INTO pending_items (part_no, color_id, color_name, part_name, quantity, condition, location, unit_price_cents, notes, source, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'partout', 'pending')
  `);

  let count = 0;
  const txn = db.transaction(() => {
    for (const p of parts) {
      insert.run(
        p.part_no, p.color_id ?? null, p.color_name || null, p.part_name || '',
        p.quantity || 1, p.condition || condition, p.location || location,
        p.unit_price_cents ?? null, `Part-out: ${req.params.setNo}`
      );
      count++;
    }
  });
  txn();

  res.json({ ok: true, added: count });
});

// ========== PRICING ENGINE ==========

// Preview repricing: apply BrickLink avg prices + rules to inventory.
// Does NOT change anything — returns proposed changes.
app.get('/api/pricing/preview', (req, res) => {
  const { rule_id } = req.query;
  const rules = rule_id
    ? db.prepare('SELECT * FROM pricing_rules WHERE id = ? AND enabled = 1').all(rule_id)
    : db.prepare('SELECT * FROM pricing_rules WHERE enabled = 1').all();

  const items = db.prepare(`
    SELECT i.*, c.color_name,
      pc.avg_price_cents as market_avg_cents
    FROM inventory i
    LEFT JOIN bl_colors c ON i.color_id = c.color_id
    LEFT JOIN price_cache pc ON pc.part_no = i.part_no
      AND (pc.color_id = i.color_id OR (pc.color_id IS NULL AND i.color_id IS NULL))
      AND pc.condition = i.condition AND pc.source = 'bricklink'
    WHERE i.quantity > 0
  `).all();

  const proposals = [];
  for (const item of items) {
    if (!item.market_avg_cents) continue;

    let newPrice = item.market_avg_cents;
    for (const rule of rules) {
      if (rule.condition && rule.condition !== item.condition) continue;
      if (rule.markup_percent) newPrice = Math.round(newPrice * (1 + rule.markup_percent / 100));
      if (rule.markup_fixed_cents) newPrice += rule.markup_fixed_cents;
      if (rule.min_price_cents && newPrice < rule.min_price_cents) newPrice = rule.min_price_cents;
      if (rule.max_price_cents && newPrice > rule.max_price_cents) newPrice = rule.max_price_cents;
    }

    if (newPrice !== item.unit_price_cents) {
      proposals.push({
        inventory_id: item.id,
        part_no: item.part_no,
        part_name: item.part_name,
        color_name: item.color_name,
        condition: item.condition,
        quantity: item.quantity,
        current_price_cents: item.unit_price_cents,
        market_avg_cents: item.market_avg_cents,
        proposed_price_cents: newPrice,
        change_cents: newPrice - (item.unit_price_cents || 0),
      });
    }
  }

  res.json({ rules_applied: rules.length, proposals, total: proposals.length });
});

// Apply repricing for selected inventory ids (or all proposals)
app.post('/api/pricing/apply', async (req, res) => {
  const { changes } = req.body || {};
  if (!Array.isArray(changes) || changes.length === 0) {
    return res.status(400).json({ error: 'changes array required: [{inventory_id, price_cents}]' });
  }

  const results = [];
  for (const ch of changes) {
    try {
      db.prepare(`
        UPDATE inventory SET unit_price_cents = ?, updated_at = datetime('now') WHERE id = ?
      `).run(ch.price_cents, ch.inventory_id);

      const pushed = await push.pushInventoryChange(ch.inventory_id, { unitPriceCents: ch.price_cents });
      results.push({ inventory_id: ch.inventory_id, ok: true, push: pushed });
    } catch (err) {
      results.push({ inventory_id: ch.inventory_id, error: err.message });
    }
  }

  res.json({ ok: true, push_mode: push.mode, applied: results.length, results });
});

// ========== REPORTS ==========

app.get('/api/reports', (req, res) => {
  const byCondition = db.prepare(`
    SELECT condition, COUNT(*) as lots, SUM(quantity) as pieces, SUM(quantity * COALESCE(unit_price_cents,0)) as value_cents
    FROM inventory GROUP BY condition
  `).all();

  const byColor = db.prepare(`
    SELECT c.color_name, COUNT(*) as lots, SUM(i.quantity) as pieces
    FROM inventory i LEFT JOIN bl_colors c ON i.color_id = c.color_id
    GROUP BY i.color_id ORDER BY pieces DESC LIMIT 15
  `).all();

  const byMarketplace = db.prepare(`
    SELECT marketplace, COUNT(*) as lots, SUM(quantity) as pieces, SUM(quantity * COALESCE(unit_price_cents,0)) as value_cents
    FROM marketplace_lots GROUP BY marketplace
  `).all();

  const salesByMonth = db.prepare(`
    SELECT substr(order_date, 1, 7) as month, marketplace, COUNT(*) as orders, SUM(COALESCE(total_price_cents,0)) as revenue_cents
    FROM orders WHERE status != 'cancelled' AND order_date IS NOT NULL
    GROUP BY month, marketplace ORDER BY month DESC LIMIT 24
  `).all();

  const topValue = db.prepare(`
    SELECT i.part_no, i.part_name, c.color_name, i.quantity, i.unit_price_cents,
           (i.quantity * COALESCE(i.unit_price_cents,0)) as total_cents
    FROM inventory i LEFT JOIN bl_colors c ON i.color_id = c.color_id
    ORDER BY total_cents DESC LIMIT 15
  `).all();

  res.json({ byCondition, byColor, byMarketplace, salesByMonth, topValue });
});

// CSV export
app.get('/api/inventory/export/csv', (req, res) => {
  const items = db.prepare(`
    SELECT i.part_no, i.part_name, c.color_name, i.color_id, i.quantity, i.condition,
           i.location, i.unit_price_cents, i.notes
    FROM inventory i LEFT JOIN bl_colors c ON i.color_id = c.color_id
    ORDER BY i.part_no
  `).all();

  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = 'part_no,part_name,color_name,color_id,quantity,condition,location,unit_price,notes';
  const lines = items.map(i => [
    i.part_no, i.part_name, i.color_name, i.color_id, i.quantity, i.condition,
    i.location, i.unit_price_cents != null ? (i.unit_price_cents / 100).toFixed(2) : '', i.notes
  ].map(esc).join(','));

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="hold-inventory.csv"');
  res.send([header, ...lines].join('\n'));
});

// ========== STARTUP ==========

app.listen(PORT, () => {
  console.log(`🔄 Hold server running on http://localhost:${PORT}`);
  console.log(`   BrickLink: ${sync.isConfigured('bricklink') ? '✅' : '❌'}`);
  console.log(`   BrickOwl:  ${sync.isConfigured('brickowl') ? '✅' : '❌'}`);
  scheduler.start();
});
