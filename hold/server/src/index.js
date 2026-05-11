import express from 'express';
import cors from 'cors';
import { getDb } from './db.js';
import { SyncEngine } from './sync.js';
import { BrickStoreSync } from './brickstore.js';
import { BrickLinkClient } from './bricklink.js';
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

// Try to load credentials on startup
sync.loadCredentials();

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

app.put('/api/inventory/:id', (req, res) => {
  const { quantity, unit_price_cents, location, notes, condition } = req.body;
  
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

  res.json({ ok: true });
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

app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status required' });

  db.prepare(`
    UPDATE orders SET status = ?, last_synced_at = datetime('now') WHERE id = ?
  `).run(status, req.params.id);

  res.json({ ok: true });
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

// ========== STARTUP ==========

app.listen(PORT, () => {
  console.log(`🔄 Hold server running on http://localhost:${PORT}`);
  console.log(`   BrickLink: ${sync.isConfigured('bricklink') ? '✅' : '❌'}`);
  console.log(`   BrickOwl:  ${sync.isConfigured('brickowl') ? '✅' : '❌'}`);
});
