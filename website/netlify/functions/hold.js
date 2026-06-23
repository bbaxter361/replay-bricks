// Hold — Netlify Function
// Brick inventory management backend
// Wraps the Express-based hold server using serverless-http
// Uses Netlify Blobs instead of SQLite (Netlify Functions can't use native modules)

import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { getStore } from '@netlify/blobs';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors({
  origin: ['https://replaybrick.com', 'https://compass-replaybricks-v2-550.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: false,
  optionsSuccessStatus: 204
}));
app.use(express.json({ limit: '50mb' }));

// Strip /hold prefix when behind Netlify redirect (/api/hold/* → function)
// Express routes are mounted at /api/* so we need to rewrite the URL
// MUST run BEFORE auth middleware so req.path is clean
app.use((req, res, next) => {
  if (req.url.startsWith('/api/hold/')) {
    req.url = req.url.replace('/api/hold/', '/api/');
  } else if (req.url.startsWith('/api/hold')) {
    req.url = req.url.replace('/api/hold', '/api');
  }
  next();
});

// ========== AUTH ==========
// Generate a stable API token from deployment context (same token across invocations)
const API_TOKEN = (() => {
  if (process.env.HOLD_API_TOKEN) return process.env.HOLD_API_TOKEN;
  return crypto.createHash('sha256').update('hold-replay-bricks-' + (process.env.NETLIFY_SITE_ID || 'local')).digest('hex').slice(0, 48);
})();

app.use('/api', (req, res, next) => {
  if (req.path === '/status' || req.path === '/auth/login') return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token;
  if (token === API_TOKEN) return next();
  return res.status(401).json({ error: 'Unauthorized' });
});

// Login: exchanges portal credentials for API token
const USERS = {
  'brian@replaybrick.com': 'Brian!1138',
  'amanda@replaybrick.com': 'Brian!1138',
};
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (USERS[String(email || '').toLowerCase()] === password) {
    return res.json({ ok: true, token: API_TOKEN, name: email.split('@')[0] });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// ============================================================
// BLOB STORE SETUP (follows same pattern as spring.js)
// ============================================================

let blobStoreMode = 'unknown'; // 'netlify-blobs' | 'memory' | 'unknown'
let blobStoreError = null;

async function getBlobStore() {
  if (_cachedBlobStore && (blobStoreMode === 'netlify-blobs' || blobStoreMode === 'memory')) {
    return _cachedBlobStore;
  }

  // Approach 1: Automatic environment context (NETLIFY_BLOBS_CONTEXT)
  try {
    const store = getStore('hold-data');
    await store.list({ prefix: '__health_check__' });
    _cachedBlobStore = store;
    blobStoreMode = 'netlify-blobs';
    blobStoreError = null;
    console.log('✅ Hold Blobs connected (automatic context) — data WILL persist');
    return store;
  } catch (e) {
    console.warn('⚠️  Hold Blobs auto-context failed:', e.message);
    blobStoreError = `auto-context: ${e.message}`;
  }

  // Approach 2: Explicit config
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_ACCESS_TOKEN;
  if (siteID && token) {
    try {
      const store = getStore({
        name: 'hold-data',
        siteID,
        token,
        apiURL: process.env.NETLIFY_BLOBS_API_URL,
      });
      await store.list({ prefix: '__health_check__' });
      _cachedBlobStore = store;
      blobStoreMode = 'netlify-blobs';
      blobStoreError = null;
      console.log('✅ Hold Blobs connected (explicit config) — data WILL persist');
      return store;
    } catch (e) {
      console.warn('⚠️  Hold Blobs explicit config failed:', e.message);
      blobStoreError = `explicit-config: ${e.message}`;
    }
  } else {
    if (!blobStoreError) blobStoreError = 'missing NETLIFY_SITE_ID and NETLIFY_BLOBS_TOKEN env vars';
  }

  // FALLBACK: In-memory Map
  const map = new Map();
  _cachedBlobStore = map;
  blobStoreMode = 'memory';
  console.error('❌ CRITICAL: Hold Blobs unavailable! Using in-memory Map.');
  return map;
}

let _cachedBlobStore = null;

// ============================================================
// BLOB HELPER FUNCTIONS
// Each "table" is a JSON array stored at a blob key
// ============================================================

async function blobRawGet(key) {
  const store = await getBlobStore();
  if (store instanceof Map) {
    const raw = store.get(key);
    return raw ? JSON.parse(raw) : [];
  }
  const data = await store.get(key, { type: 'json' });
  return Array.isArray(data) ? data : [];
}

async function blobRawSet(key, data) {
  const store = await getBlobStore();
  if (store instanceof Map) {
    store.set(key, JSON.stringify(data));
  } else {
    await store.setJSON(key, data);
  }
}

async function blobGet(key) {
  return blobRawGet(key);
}

async function blobSet(key, data) {
  return blobRawSet(key, data);
}

async function blobFind(key, predicateFn) {
  const data = await blobRawGet(key);
  return data.find(predicateFn) || null;
}

async function blobFilter(key, filterFn, sortFn, limit, offset) {
  let data = await blobRawGet(key);
  if (filterFn) {
    data = data.filter(filterFn);
  }
  if (sortFn) {
    data.sort(sortFn);
  }
  const total = data.length;
  if (offset !== undefined) {
    data = data.slice(offset);
  }
  if (limit !== undefined) {
    data = data.slice(0, limit);
  }
  return { items: data, total };
}

async function blobCount(key, filterFn) {
  const data = await blobRawGet(key);
  if (!filterFn) return data.length;
  return data.filter(filterFn).length;
}

async function blobNextId(key) {
  const data = await blobRawGet(key);
  if (data.length === 0) return 1;
  const maxId = Math.max(...data.map(item => item.id || 0));
  return maxId + 1;
}

async function blobInsert(key, item) {
  const data = await blobRawGet(key);
  const id = await blobNextId(key);
  const newItem = { id, ...item };
  data.push(newItem);
  await blobRawSet(key, data);
  return newItem;
}

async function blobUpdate(key, id, updates) {
  const data = await blobRawGet(key);
  const idx = data.findIndex(item => item.id === id);
  if (idx === -1) return false;
  data[idx] = { ...data[idx], ...updates };
  await blobRawSet(key, data);
  return true;
}

async function blobDelete(key, id) {
  const data = await blobRawGet(key);
  const idx = data.findIndex(item => item.id === id);
  if (idx === -1) return false;
  data.splice(idx, 1);
  await blobRawSet(key, data);
  return true;
}

// ============================================================
// UTILITY: Compute BrickLink image and catalog URLs
// ============================================================

function computeImageUrls(partNo, colorId) {
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

  const catalogPart = isSet ? barePartNo : partNo;
  const catalog_url = colorId && !isSet
    ? `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${catalogPart}&C=${colorId}`
    : `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${catalogPart}`;

  return { image_url, catalog_url };
}

// ============================================================
// HELPERS: seed default BrickLink colors if empty
// ============================================================

const DEFAULT_COLORS = [
  [0, 'Not Applicable', '000000', 'UNKNOWN'],
  [1, 'White', 'FFFFFF', 'SOLID'],
  [2, 'Tan', 'E4CD9E', 'SOLID'],
  [3, 'Light Bluish Gray', 'A0A5A9', 'SOLID'],
  [4, 'Light Gray', 'C9C9C9', 'SOLID'],
  [5, 'Dark Gray', '6D6D6D', 'SOLID'],
  [6, 'Dark Bluish Gray', '6C6E6B', 'SOLID'],
  [7, 'Black', '1B2A34', 'SOLID'],
  [8, 'Dark Green', '00852B', 'SOLID'],
  [9, 'Green', '40A82D', 'SOLID'],
  [10, 'Dark Tan', '958A73', 'SOLID'],
  [11, 'Reddish Brown', '582A12', 'SOLID'],
  [12, 'Red', 'C91A09', 'SOLID'],
  [13, 'Dark Red', 'A2333B', 'SOLID'],
  [14, 'Dark Pink', 'E06D94', 'SOLID'],
  [15, 'Light Pink', 'FCBCCD', 'SOLID'],
  [23, 'Bright Light Blue', '81D4F1', 'SOLID'],
  [24, 'Blue', '0055BF', 'SOLID'],
  [25, 'Dark Blue', '0B3463', 'SOLID'],
  [26, 'Light Blue', 'ABCAE9', 'SOLID'],
  [27, 'Light Yellow', 'FFF89B', 'SOLID'],
  [28, 'Yellow', 'FFD800', 'SOLID'],
  [29, 'Dark Yellow', 'DAB078', 'SOLID'],
  [36, 'Light Purple', 'CF98CF', 'SOLID'],
  [37, 'Purple', '7A3B78', 'SOLID'],
  [38, 'Dark Purple', '4E2561', 'SOLID'],
  [39, 'Orange', 'F1682D', 'SOLID'],
  [40, 'Dark Orange', 'A86738', 'SOLID'],
  [41, 'Magenta', 'BD6CAD', 'SOLID'],
  [42, 'Lime', 'AADD4A', 'SOLID'],
  [43, 'Dark Pink', 'C8707A', 'SOLID'],
  [44, 'Flesh', 'FCC5A0', 'SOLID'],
  [57, 'Pearl Gold', 'DCAA5C', 'SOLID'],
  [68, 'Dark Brown', '352100', 'SOLID'],
  [69, 'Metallic Silver', 'A5A9B4', 'SOLID'],
  [70, 'Metallic Gold', 'DDB078', 'SOLID'],
  [71, 'Glitter Trans-Clear', 'D2D9C1', 'TRNSL'],
  [73, 'Trans-Clear', 'F5F3D7', 'TRNSL'],
  [74, 'Trans-Red', 'C91A09', 'TRNSL'],
  [75, 'Trans-Light Blue', 'AADBF5', 'TRNSL'],
  [76, 'Trans-Neon Green', 'C0E6A7', 'TRNSL'],
  [77, 'Trans-Green', '57AB27', 'TRNSL'],
  [78, 'Trans-Yellow', 'F5E99B', 'TRNSL'],
  [79, 'Trans-Orange', 'F08F1C', 'TRNSL'],
  [80, 'Trans-Pink', 'E6A7D6', 'TRNSL'],
  [82, 'Trans-Purple', '9678B6', 'TRNSL'],
  [84, 'Trans-Neon Yellow', 'E5F67F', 'TRNSL'],
  [85, 'Trans-Neon Orange', 'FF9300', 'TRNSL'],
  [86, 'Trans-Black', '1B2A34', 'TRNSL'],
  [89, 'Trans-Dark Blue', '0B3463', 'TRNSL'],
  [92, 'Chrome Gold', 'C0A679', 'CHROME'],
  [93, 'Chrome Silver', 'CDCDCD', 'CHROME'],
  [99, 'Pearl White', 'F5F5F5', 'PEARL'],
  [101, 'Flat Silver', '898788', 'METAL'],
  [103, 'Metal Blue', '49678C', 'METAL'],
  [104, 'Copper', 'AE7A59', 'METAL'],
  [105, 'Glow In Dark Opaque', 'D4D4C0', 'SOLID'],
  [110, 'Glow In Dark Trans', 'BCD9CD', 'TRNSL'],
];

async function seedColorsIfNeeded() {
  const colors = await blobRawGet('hold_bl_colors');
  if (colors.length === 0) {
    const seeded = DEFAULT_COLORS.map(([color_id, color_name, color_code, color_type]) => ({
      color_id, color_name, color_code, color_type
    }));
    await blobRawSet('hold_bl_colors', seeded);
  }
}

// ============================================================
// ============================================================
// OAUTH 1.0a SIGNER (BrickLink API)
// Uses only built-in crypto module — no external packages needed
// ============================================================

function oauthPercentEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

function oauthNonce() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function oauthTimestamp() {
  return Math.floor(Date.now() / 1000).toString();
}

function oauthSign(method, url, params, consumerSecret, tokenSecret) {
  // Sort params alphabetically
  const sortedKeys = Object.keys(params).sort();
  const paramStr = sortedKeys.map(k => `${oauthPercentEncode(k)}=${oauthPercentEncode(String(params[k]))}`).join('&');
  
  // Build signature base string
  const baseStr = [
    method.toUpperCase(),
    oauthPercentEncode(url),
    oauthPercentEncode(paramStr)
  ].join('&');
  
  // Signing key: consumerSecret + "&" + tokenSecret (empty string if no token)
  const signingKey = oauthPercentEncode(consumerSecret) + '&' + oauthPercentEncode(tokenSecret || '');
  
  return crypto.createHmac('sha1', signingKey).update(baseStr).digest('base64');
}

function oauthHeader(method, url, params, consumerKey, consumerSecret, tokenValue, tokenSecret) {
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: oauthNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: oauthTimestamp(),
    oauth_version: '1.0',
  };
  if (tokenValue) {
    oauthParams.oauth_token = tokenValue;
  }
  
  // Merge oauth params with request params
  const allParams = { ...params, ...oauthParams };
  const signature = oauthSign(method, url, allParams, consumerSecret, tokenSecret);
  oauthParams.oauth_signature = signature;
  
  // Build header
  const headerParts = Object.entries(oauthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${oauthPercentEncode(k)}="${oauthPercentEncode(String(v))}"`);
  
  return 'OAuth ' + headerParts.join(', ');
}

async function blApiGet(path, queryParams = {}) {
  const creds = await loadBLCredentials();
  if (!creds) throw new Error('BrickLink not configured');
  
  const url = 'https://api.bricklink.com/api/store/v1' + path;
  const fullUrl = Object.keys(queryParams).length
    ? url + '?' + new URLSearchParams(queryParams)
    : url;
  
  const authHeader = oauthHeader('GET', url, queryParams,
    creds.consumerKey, creds.consumerSecret, creds.tokenValue, creds.tokenSecret);
  
  const res = await fetch(fullUrl, {
    headers: {
      Authorization: authHeader,
      Accept: 'application/json',
    },
  });
  
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch {
    throw new Error(`BL API: Non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (data.meta?.code && data.meta.code >= 400) {
    throw new Error(`BL API ${data.meta.code}: ${data.meta.message || JSON.stringify(data.meta)}`);
  }
  return data.data || data;
}

async function blApiPost(path, body = {}) {
  const creds = await loadBLCredentials();
  if (!creds) throw new Error('BrickLink not configured');
  
  const url = 'https://api.bricklink.com/api/store/v1' + path;
  const authHeader = oauthHeader('POST', url, {},
    creds.consumerKey, creds.consumerSecret, creds.tokenValue, creds.tokenSecret);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch {
    throw new Error(`BL API: Non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (data.meta?.code && data.meta.code >= 400) {
    throw new Error(`BL API ${data.meta.code}: ${data.meta.message}`);
  }
  return data.data || data;
}

// BrickOwl API (simple API key auth)
async function boApiGet(path, queryParams = {}) {
  const creds = await loadBOCredentials();
  if (!creds) throw new Error('BrickOwl not configured');
  queryParams.key = creds.apiKey;
  
  const url = 'https://api.brickowl.com/v1' + path + '?' + new URLSearchParams(queryParams);
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch {
    throw new Error(`BO API: Non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (data.status === 'error') {
    throw new Error(`BO API: ${data.message || JSON.stringify(data)}`);
  }
  return data.data || data;
}

async function boApiPost(path, params = {}) {
  const creds = await loadBOCredentials();
  if (!creds) throw new Error('BrickOwl not configured');
  params.key = creds.apiKey;
  
  const url = 'https://api.brickowl.com/v1' + path;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch {
    throw new Error(`BO API: Non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (data.status === 'error') {
    throw new Error(`BO API: ${data.message}`);
  }
  return data.data || data;
}

// Lazy credential loaders (cached per container)
let _blCreds = undefined;
let _boCreds = undefined;

async function loadBLCredentials() {
  if (_blCreds !== undefined) return _blCreds;
  const creds = await blobRawGet('hold_api_credentials');
  const bl = creds.find(c => c.marketplace === 'bricklink');
  if (!bl) { _blCreds = null; return null; }
  _blCreds = JSON.parse(bl.credentials);
  return _blCreds;
}

async function loadBOCredentials() {
  if (_boCreds !== undefined) return _boCreds;
  const creds = await blobRawGet('hold_api_credentials');
  const bo = creds.find(c => c.marketplace === 'brickowl');
  if (!bo) { _boCreds = null; return null; }
  _boCreds = JSON.parse(bo.credentials);
  return _boCreds;
}

// ============================================================
// SYNC ENGINE (embedded — no SQLite, uses Blob helpers)
// ============================================================

async function syncLogStart(marketplace, syncType) {
  const entry = {
    marketplace,
    sync_type: syncType,
    started_at: new Date().toISOString(),
    status: 'running',
    items_processed: 0,
    errors: null,
    details: null,
  };
  return await blobInsert('hold_sync_log', entry);
}

async function syncLogComplete(logId, status, count, errors) {
  await blobUpdate('hold_sync_log', logId, {
    status,
    completed_at: new Date().toISOString(),
    items_processed: count,
    errors: errors?.length ? errors.join('; ') : null,
  });
}

function upsertBLInventoryItem(item) {
  // ... will be implemented inline with blob operations
}

async function syncBLInventory() {
  const logId = await syncLogStart('bricklink', 'inventory');
  let count = 0;
  const errors = [];
  
  try {
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const result = await blApiGet('/inventories', { page, page_size: 500 });
      const items = Array.isArray(result) ? result : (result.data || []);
      
      for (const item of items) {
        try {
          const partNo = item.item?.no || item.part_no;
          const colorId = item.color_id ?? item.color?.color_id ?? null;
          const partName = item.item?.name || item.part_name || '';
          const condition = item.new_or_used === 'N' ? 'NEW' : 'USED';
          const qty = parseInt(item.quantity || 0);
          const priceCents = item.unit_price ? Math.round(parseFloat(item.unit_price) * 100) : 0;
          
          // Find existing inventory item
          const inventory = await blobRawGet('hold_inventory');
          let existing;
          if (colorId !== null) {
            existing = inventory.find(i => i.part_no === partNo && i.color_id === colorId && i.condition === condition);
          } else {
            existing = inventory.find(i => i.part_no === partNo && (i.color_id === null || i.color_id === undefined) && i.condition === condition);
          }
          
          let invId;
          if (existing) {
            await blobUpdate('hold_inventory', existing.id, {
              quantity: qty,
              unit_price_cents: priceCents,
              part_name: partName || existing.part_name,
              updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
            });
            invId = existing.id;
          } else {
            const created = await blobInsert('hold_inventory', {
              part_no: partNo,
              color_id: colorId,
              part_name: partName,
              quantity: qty,
              condition,
              unit_price_cents: priceCents,
              location: item.location || null,
              created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
              updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
            });
            invId = created.id;
          }
          
          // Upsert marketplace lot
          const lots = await blobRawGet('hold_marketplace_lots');
          const lotId = String(item.inventory_id);
          const existingLot = lots.find(l => l.marketplace === 'bricklink' && l.lot_id === lotId);
          
          const lotData = {
            inventory_id: invId,
            marketplace: 'bricklink',
            lot_id: lotId,
            quantity: qty,
            unit_price_cents: priceCents,
            condition,
            description: item.description || null,
            remarks: item.remarks || null,
            last_synced_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
          };
          
          if (existingLot) {
            await blobUpdate('hold_marketplace_lots', existingLot.id, lotData);
          } else {
            await blobInsert('hold_marketplace_lots', lotData);
          }
          
          count++;
        } catch (err) {
          errors.push(`Item ${item.inventory_id}: ${err.message}`);
        }
      }
      
      hasMore = items.length >= 500;
      page++;
    }
    
    await syncLogComplete(logId, 'success', count, errors);
    return { synced: count, errors };
  } catch (err) {
    await syncLogComplete(logId, 'failed', count, [err.message]);
    throw err;
  }
}

async function syncBLOrders() {
  const logId = await syncLogStart('bricklink', 'orders');
  let count = 0;
  const errors = [];
  
  try {
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const result = await blApiGet('/orders', { page, page_size: 50 });
      const orders = Array.isArray(result) ? result : (result.data || []);
      
      for (const order of orders) {
        try {
          const orderId = String(order.order_id);
          const statusMap = { pending:'pending', updated:'pending', processing:'pending',
            ready:'pending', paid:'paid', packed:'packed', shipped:'shipped',
            received:'delivered', completed:'delivered', cancelled:'cancelled' };
          const localStatus = statusMap[order.status] || 'pending';
          
          const totalPriceCents = order.grand_total ? Math.round(parseFloat(order.grand_total) * 100) : null;
          const shippingCents = order.shipping_cost ? Math.round(parseFloat(order.shipping_cost) * 100) : 0;
          
          const orderData = {
            marketplace: 'bricklink',
            order_id: orderId,
            buyer_name: order.buyer_name || (order.buyer?.buyer_name) || '',
            buyer_email: order.buyer_email || null,
            buyer_notes: null,
            status: localStatus,
            total_items: order.total_count || 0,
            total_price_cents: totalPriceCents,
            shipping_cents: shippingCents,
            currency: order.currency_code || 'USD',
            shipping_address: order.shipping_address ? JSON.stringify(order.shipping_address) : '',
            order_date: order.date_ordered ? order.date_ordered.split('T')[0] : null,
            paid_date: order.date_paid ? order.date_paid.split('T')[0] : null,
            shipped_date: null,
            tracking_number: order.tracking_no || null,
            shipping_carrier: order.shipping_method?.name || null,
            notes: order.admin_notes || null,
            last_synced_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
          };
          
          const existingOrders = await blobRawGet('hold_orders');
          const existing = existingOrders.find(o => o.marketplace === 'bricklink' && o.order_id === orderId);
          
          if (existing) {
            await blobUpdate('hold_orders', existing.id, orderData);
          } else {
            await blobInsert('hold_orders', orderData);
          }
          
          count++;
          
          // Fetch and store order items for this BrickLink order
          const orderRow = (() => {
            // Use existing if we already read it, otherwise refetch
            if (existing) return existing;
            return null;
          })();
          const orderId_db = existing ? existing.id : null;
          if (orderId_db) {
            try {
              const itemsResult = await blApiGet(`/orders/${orderId}/items`);
              const items = Array.isArray(itemsResult) 
                ? itemsResult.flatMap(b => Array.isArray(b) ? b : [b]) 
                : [];
              for (const item of items) {
                const ie = item.item || item;
                await blobInsert('hold_order_items', {
                  order_id: orderId_db,
                  marketplace: 'bricklink',
                  inventory_id: ie.inventory_id || null,
                  item_type: ie.type || 'PART',
                  item_no: ie.no || '',
                  item_name: ie.name || '',
                  color_id: ie.color_id || null,
                  color_name: ie.color_name || '',
                  condition: (ie.new_or_used || 'U') === 'N' ? 'NEW' : 'USED',
                  quantity: parseInt(ie.quantity || item.quantity || 1),
                  unit_price_cents: ie.unit_price ? Math.round(parseFloat(ie.unit_price) * 100) : 0,
                  remarks: ie.remarks || '',
                  bl_item_id: ie.item_id || null,
                  last_synced_at: new Date().toISOString(),
                });
              }
            } catch (itemErr) {
              console.error(`Items fetch failed for BL ${orderId}:`, itemErr.message);
            }
          }
        } catch (err) {
          errors.push(`Order ${order.order_id}: ${err.message}`);
        }
      }
      
      hasMore = orders.length >= 50;
      page++;
    }
    
    await syncLogComplete(logId, 'success', count, errors);
    return { synced: count, errors };
  } catch (err) {
    await syncLogComplete(logId, 'failed', count, [err.message]);
    throw err;
  }
}

async function syncBOInventory() {
  const logId = await syncLogStart('brickowl', 'inventory');
  let count = 0;
  const errors = [];
  
  try {
    const result = await boApiGet('/inventory/list', { limit: 1000 });
    const items = Array.isArray(result) ? result : (result.lots || result.list || []);
    
    for (const item of items) {
      try {
        const boid = item.boid || '';
        const [elementId, boColorId] = boid.split('-');
        const partNo = elementId || item.element_id || item.part_no || boid;
        const colorId = boColorId ? parseInt(boColorId) : null;
        const partName = item.name || item.part_name || '';
        const condition = item.condition === 'N' ? 'NEW' : 'USED';
        const qty = parseInt(item.qty || item.quantity || 0);
        const priceCents = item.price ? Math.round(parseFloat(item.price) * 100) : 0;
        
        const inventory = await blobRawGet('hold_inventory');
        let existing;
        if (colorId !== null) {
          existing = inventory.find(i => i.part_no === partNo && i.color_id === colorId && i.condition === condition);
        } else {
          existing = inventory.find(i => i.part_no === partNo && (i.color_id === null || i.color_id === undefined) && i.condition === condition);
        }
        
        let invId;
        if (existing) {
          await blobUpdate('hold_inventory', existing.id, {
            quantity: qty,
            unit_price_cents: priceCents,
            part_name: partName || existing.part_name,
            updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
          });
          invId = existing.id;
        } else {
          const created = await blobInsert('hold_inventory', {
            part_no: partNo,
            color_id: colorId,
            part_name: partName,
            quantity: qty,
            condition,
            unit_price_cents: priceCents,
            created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
            updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
          });
          invId = created.id;
        }
        
        const lots = await blobRawGet('hold_marketplace_lots');
        const lotId = String(item.lot_id || boid);
        const existingLot = lots.find(l => l.marketplace === 'brickowl' && l.lot_id === lotId);
        
        const lotData = {
          inventory_id: invId,
          marketplace: 'brickowl',
          lot_id: lotId,
          quantity: qty,
          unit_price_cents: priceCents,
          condition,
          description: item.description || null,
          remarks: item.remarks || null,
          last_synced_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        };
        
        if (existingLot) {
          await blobUpdate('hold_marketplace_lots', existingLot.id, lotData);
        } else {
          await blobInsert('hold_marketplace_lots', lotData);
        }
        
        count++;
      } catch (err) {
        errors.push(`Lot ${item.lot_id}: ${err.message}`);
      }
    }
    
    await syncLogComplete(logId, 'success', count, errors);
    return { synced: count, errors };
  } catch (err) {
    await syncLogComplete(logId, 'failed', count, [err.message]);
    throw err;
  }
}

async function syncBOOrders() {
  const logId = await syncLogStart('brickowl', 'orders');
  let count = 0;
  const errors = [];
  
  try {
    const result = await boApiGet('/order/list', { limit: 100 });
    const orders = Array.isArray(result) ? result : (result.list || []);
    
    for (const order of orders) {
      try {
        const orderId = String(order.order_id);
        const statusMap = { unpaid:'pending', paid:'paid', picking:'picked', picked:'picked',
          packing:'packed', packed:'packed', shipped:'shipped', delivered:'delivered',
          cancelled:'cancelled', refunded:'cancelled' };
        const localStatus = statusMap[order.status] || 'pending';
        
        const totalPriceCents = order.total ? Math.round(parseFloat(order.total) * 100) : null;
        const shippingCents = order.shipping ? Math.round(parseFloat(order.shipping) * 100) : 0;
        
        const orderData = {
          marketplace: 'brickowl',
          order_id: orderId,
          buyer_name: order.buyer_name || '',
          buyer_email: order.buyer_email || null,
          buyer_notes: null,
          status: localStatus,
          total_items: parseInt(order.item_count || order.total_items || 0),
          total_price_cents: totalPriceCents,
          shipping_cents: shippingCents,
          currency: order.currency || 'USD',
          shipping_address: order.shipping_address || '',
          order_date: order.date_created ? order.date_created.split(' ')[0] : null,
          paid_date: null,
          shipped_date: null,
          tracking_number: order.tracking || null,
          shipping_carrier: null,
          notes: order.notes || null,
          last_synced_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        };
        
        const existingOrders = await blobRawGet('hold_orders');
        const existing = existingOrders.find(o => o.marketplace === 'brickowl' && o.order_id === orderId);
        
        if (existing) {
          await blobUpdate('hold_orders', existing.id, orderData);
        } else {
          await blobInsert('hold_orders', orderData);
        }
        
        count++;
      } catch (err) {
        errors.push(`Order ${order.order_id}: ${err.message}`);
      }
    }
    
    await syncLogComplete(logId, 'success', count, errors);
    return { synced: count, errors };
  } catch (err) {
    await syncLogComplete(logId, 'failed', count, [err.message]);
    throw err;
  }
}

async function syncAll() {
  const results = {};
  const blCreds = await loadBLCredentials();
  const boCreds = await loadBOCredentials();
  
  if (blCreds) {
    try {
      console.log('Syncing BrickLink inventory...');
      results.bricklink_inventory = await syncBLInventory();
    } catch (e) { results.bricklink_inventory = { error: e.message }; }
    
    try {
      console.log('Syncing BrickLink orders...');
      results.bricklink_orders = await syncBLOrders();
    } catch (e) { results.bricklink_orders = { error: e.message }; }
  }
  
  if (boCreds) {
    try {
      console.log('Syncing BrickOwl inventory...');
      results.brickowl_inventory = await syncBOInventory();
    } catch (e) { results.brickowl_inventory = { error: e.message }; }
    
    try {
      console.log('Syncing BrickOwl orders...');
      results.brickowl_orders = await syncBOOrders();
    } catch (e) { results.brickowl_orders = { error: e.message }; }
  }
  
  return results;
}
// ROUTES
// ============================================================

// ── DATA MIGRATION SEED ──
// Accepts bulk table data for initial migration from SQLite
// POST /api/seed  (body: { table: "inventory", rows: [...] })
app.post('/api/seed', async (req, res) => {
  try {
    const { table, rows } = req.body;
    if (!table || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'table (string) and rows (array) required' });
    }
    const key = `hold_${table}`;
    const existing = await blobRawGet(key);
    const merged = [...existing, ...rows];
    await blobSet(key, merged);
    res.json({ ok: true, table, existing: existing.length, added: rows.length, total: merged.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/status', async (req, res) => {
  try {
    await seedColorsIfNeeded();
    const blCreds = await loadBLCredentials();
    const boCreds = await loadBOCredentials();
    res.json({
      ok: true,
      bricklink: !!blCreds,
      brickowl: !!boCreds,
      db: true,
      blobStoreMode,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CREDENTIALS ──
app.post('/api/credentials', async (req, res) => {
  try {
    const { marketplace, credentials } = req.body;
    if (!marketplace || !credentials) {
      return res.status(400).json({ error: 'marketplace and credentials required' });
    }

    const existing = await blobFind('hold_api_credentials', c => c.marketplace === marketplace);
    if (existing) {
      await blobUpdate('hold_api_credentials', existing.id, {
        credentials: JSON.stringify(credentials),
        updated_at: new Date().toISOString()
      });
    } else {
      await blobInsert('hold_api_credentials', {
        marketplace,
        credentials: JSON.stringify(credentials),
        updated_at: new Date().toISOString()
      });
    }

    res.json({ ok: true, marketplace });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/credentials', async (req, res) => {
  try {
    const creds = await blobRawGet('hold_api_credentials');
    res.json(creds.map(c => c.marketplace));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/credentials/:marketplace', async (req, res) => {
  try {
    const cred = await blobFind('hold_api_credentials', c => c.marketplace === req.params.marketplace);
    if (cred) {
      await blobDelete('hold_api_credentials', cred.id);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SYNC ──
app.post('/api/sync/:marketplace/:type', async (req, res) => {
  const { marketplace, type } = req.params;
  try {
    let result;
    if (marketplace === 'bricklink' && type === 'inventory') {
      result = await syncBLInventory();
    } else if (marketplace === 'bricklink' && type === 'orders') {
      result = await syncBLOrders();
    } else if (marketplace === 'brickowl' && type === 'inventory') {
      result = await syncBOInventory();
    } else if (marketplace === 'brickowl' && type === 'orders') {
      result = await syncBOOrders();
    } else if (marketplace === 'all' && type === 'all') {
      result = await syncAll();
    } else {
      return res.status(400).json({ error: `Unknown sync: ${marketplace}/${type}` });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SYNC LOGS ──
app.get('/api/sync/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const logs = await blobRawGet('hold_sync_log');
    logs.sort((a, b) => new Date(b.started_at || 0) - new Date(a.started_at || 0));
    res.json(logs.slice(0, limit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── BRICKSTORE IMPORT ──
app.post('/api/import/brickstore', async (req, res) => {
  try {
    res.status(501).json({
      error: 'BrickStore sync not available in serverless mode — run locally.',
      hint: 'Install the hold server locally and run the import from there.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/import/preview', async (req, res) => {
  try {
    res.status(501).json({
      error: 'BrickStore preview not available in serverless mode — run locally.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Also handle old paths for backward compatibility
app.post('/api/brickstore/sync', async (req, res) => {
  try {
    res.status(501).json({
      error: 'BrickStore sync not available in serverless mode — run locally.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/brickstore/preview', async (req, res) => {
  try {
    res.status(501).json({
      error: 'BrickStore preview not available in serverless mode — run locally.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── INVENTORY ──
app.get('/api/inventory', async (req, res) => {
  try {
    await seedColorsIfNeeded();

    const { search, color, condition, location, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const inventory = await blobRawGet('hold_inventory');
    const colors = await blobRawGet('hold_bl_colors');

    let filtered = inventory;

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(i =>
        (i.part_no || '').toLowerCase().includes(s) ||
        (i.part_name || '').toLowerCase().includes(s)
      );
    }
    if (color) {
      filtered = filtered.filter(i => i.color_id === parseInt(color));
    }
    if (condition) {
      filtered = filtered.filter(i => i.condition === condition);
    }
    if (location) {
      const loc = location.toLowerCase();
      filtered = filtered.filter(i => (i.location || '').toLowerCase().includes(loc));
    }

    // Sort by updated_at desc
    filtered.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limitNum);

    const lots = await blobRawGet('hold_marketplace_lots');

    const result = paged.map(item => {
      const colorObj = colors.find(c => c.color_id === item.color_id);
      const { image_url, catalog_url } = computeImageUrls(item.part_no, item.color_id);
      const marketplace_count = lots.filter(ml => ml.inventory_id === item.id).length;
      return {
        ...item,
        color_name: colorObj ? colorObj.color_name : null,
        color_code: colorObj ? colorObj.color_code : null,
        marketplace_count,
        image_url,
        catalog_url,
      };
    });

    res.json({
      items: result,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory/export/csv', async (req, res) => {
  try {
    const inventory = await blobRawGet('hold_inventory');
    const colors = await blobRawGet('hold_bl_colors');

    const headers = 'part_no,part_name,color_name,color_id,quantity,condition,location,unit_price_cents,notes';
    const rows = inventory.map(item => {
      const colorObj = colors.find(c => c.color_id === item.color_id);
      const escapeCsv = (val) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      return [
        item.part_no || '',
        item.part_name || '',
        colorObj ? colorObj.color_name : '',
        item.color_id ?? '',
        item.quantity ?? 0,
        item.condition || 'USED',
        item.location || '',
        item.unit_price_cents ?? '',
        item.notes || '',
      ].map(escapeCsv).join(',');
    });

    const csv = [headers, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="hold-inventory.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const inventory = await blobRawGet('hold_inventory');
    const colors = await blobRawGet('hold_bl_colors');
    const lots = await blobRawGet('hold_marketplace_lots');

    const item = inventory.find(i => i.id === id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    const colorObj = colors.find(c => c.color_id === item.color_id);
    const itemLots = lots.filter(l => l.inventory_id === id);

    res.json({
      item: {
        ...item,
        color_name: colorObj ? colorObj.color_name : null,
        color_code: colorObj ? colorObj.color_code : null,
      },
      lots: itemLots,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { quantity, unit_price_cents, location, notes, condition } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (quantity !== undefined) updates.quantity = quantity;
    if (unit_price_cents !== undefined) updates.unit_price_cents = unit_price_cents;
    if (location !== undefined) updates.location = location;
    if (notes !== undefined) updates.notes = notes;
    if (condition !== undefined) updates.condition = condition;

    const success = await blobUpdate('hold_inventory', id, updates);
    if (!success) return res.status(404).json({ error: 'Not found' });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PRICE GUIDE ──
app.get('/api/inventory/:id/prices', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const inventory = await blobRawGet('hold_inventory');
    const item = inventory.find(i => i.id === id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    // Check cache
    const cache = await blobRawGet('hold_price_cache');
    const cached = cache.filter(c =>
      c.part_no === item.part_no &&
      (c.color_id === item.color_id || c.color_id === null) &&
      c.condition === (item.condition || 'USED')
    );
    cached.sort((a, b) => new Date(b.cached_at || 0) - new Date(a.cached_at || 0));

    // Check freshness (within 1 hour)
    const fresh = cached.filter(c => {
      const age = (Date.now() - new Date(c.cached_at).getTime()) / 1000 / 60;
      return age < 60;
    });

    if (fresh.length > 0) {
      return res.json({ source: 'cache', prices: fresh });
    }

    // Check for BrickLink credentials
    const creds = await blobRawGet('hold_api_credentials');
    const blCreds = creds.find(c => c.marketplace === 'bricklink');

    if (blCreds) {
      try {
        const credsObj = JSON.parse(typeof blCreds.credentials === 'string' ? blCreds.credentials : JSON.stringify(blCreds.credentials));
        const isSet = /-\d+$/.test(item.part_no);
        const partType = isSet ? 'SET' : 'PART';
        const barePart = item.part_no.replace(/-\d+$/, '');

        const url = `https://api.bricklink.com/api/store/v1/items/${partType}/${barePart}/price`;
        const authHeader = `Basic ${Buffer.from(`${credsObj.consumer_key}:${credsObj.consumer_secret}`).toString('base64')}`;
        const oauthHeader = `OAuth oauth_consumer_key="${credsObj.consumer_key}",oauth_token="${credsObj.token_value}",oauth_signature_method="HMAC-SHA1",oauth_timestamp="${Math.floor(Date.now() / 1000)}",oauth_nonce="${crypto.randomUUID()}",oauth_version="1.0"`;

        const response = await fetch(url, {
          headers: {
            'Authorization': authHeader,
            'X-OAuth': oauthHeader,
          },
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          const priceData = await response.json();
          const data = priceData.data;

          const entry = {
            part_no: item.part_no,
            color_id: item.color_id || null,
            source: 'bricklink',
            avg_price_cents: data.avg_price ? Math.round(parseFloat(data.avg_price) * 100) : null,
            min_price_cents: data.min_price ? Math.round(parseFloat(data.min_price) * 100) : null,
            max_price_cents: data.max_price ? Math.round(parseFloat(data.max_price) * 100) : null,
            qty_available: data.quantity_available || null,
            currency: data.currency_code || 'USD',
            condition: item.condition || 'USED',
            raw_data: JSON.stringify(priceData),
            cached_at: new Date().toISOString(),
          };

          // Remove old matching cache entry
          const oldIdx = cache.findIndex(c =>
            c.part_no === item.part_no &&
            (c.color_id === item.color_id || c.color_id === null) &&
            c.source === 'bricklink' &&
            c.condition === (item.condition || 'USED')
          );
          if (oldIdx !== -1) {
            cache.splice(oldIdx, 1);
          }
          cache.push(entry);
          await blobRawSet('hold_price_cache', cache);

          return res.json({ source: 'bricklink', prices: [entry] });
        }
      } catch (fetchErr) {
        console.warn(`Price guide failed for ${item.part_no}:`, fetchErr.message);
        return res.json({ source: 'error', error: fetchErr.message, prices: cached });
      }
    }

    res.json({ source: 'nocache', prices: cached });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventory/refresh-prices', async (req, res) => {
  try {
    const creds = await blobRawGet('hold_api_credentials');
    const blCreds = creds.find(c => c.marketplace === 'bricklink');

    if (!blCreds) {
      return res.status(400).json({ error: 'BrickLink not configured. Add credentials first.' });
    }

    const inventory = await blobRawGet('hold_inventory');
    const cache = await blobRawGet('hold_price_cache');
    const credsObj = JSON.parse(typeof blCreds.credentials === 'string' ? blCreds.credentials : JSON.stringify(blCreds.credentials));

    // Get unique items
    const uniqueItems = [];
    const seen = new Set();
    for (const item of inventory) {
      const key = `${item.part_no}|${item.color_id}|${item.condition}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueItems.push(item);
      }
    }

    const results = { total: uniqueItems.length, success: 0, errors: 0, details: [] };

    for (const item of uniqueItems) {
      try {
        const isSet = /-\d+$/.test(item.part_no);
        const partType = isSet ? 'SET' : 'PART';
        const barePart = item.part_no.replace(/-\d+$/, '');

        const url = `https://api.bricklink.com/api/store/v1/items/${partType}/${barePart}/price`;
        const authHeader = `Basic ${Buffer.from(`${credsObj.consumer_key}:${credsObj.consumer_secret}`).toString('base64')}`;

        const response = await fetch(url, {
          headers: { 'Authorization': authHeader },
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          const priceData = await response.json();
          const data = priceData.data;

          const entry = {
            part_no: item.part_no,
            color_id: item.color_id || null,
            source: 'bricklink',
            avg_price_cents: data.avg_price ? Math.round(parseFloat(data.avg_price) * 100) : null,
            min_price_cents: data.min_price ? Math.round(parseFloat(data.min_price) * 100) : null,
            max_price_cents: data.max_price ? Math.round(parseFloat(data.max_price) * 100) : null,
            qty_available: data.quantity_available || null,
            currency: data.currency_code || 'USD',
            condition: item.condition || 'USED',
            raw_data: JSON.stringify(priceData),
            cached_at: new Date().toISOString(),
          };

          // Remove old matching entry
          const oldIdx = cache.findIndex(c =>
            c.part_no === item.part_no &&
            (c.color_id === item.color_id || c.color_id === null) &&
            c.source === 'bricklink' &&
            c.condition === (item.condition || 'USED')
          );
          if (oldIdx !== -1) {
            cache.splice(oldIdx, 1);
          }
          cache.push(entry);
          results.success++;
        }
      } catch (err) {
        results.errors++;
        results.details.push(`${item.part_no}: ${err.message.slice(0, 100)}`);
      }
    }

    await blobRawSet('hold_price_cache', cache);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PRICES SUMMARY ──
app.get('/api/prices/summary', async (req, res) => {
  try {
    const inventory = await blobRawGet('hold_inventory');
    const cache = await blobRawGet('hold_price_cache');

    const totalItems = inventory.length;
    const pricedItems = 0;
    let needsRefresh = totalItems;
    const priceDiscrepancies = [];
    let oldestItem = null;
    let newestItem = null;

    // For each inventory item, find cached prices
    for (const item of inventory) {
      const itemPrices = cache.filter(c =>
        c.part_no === item.part_no &&
        (c.color_id === item.color_id || c.color_id === null) &&
        c.condition === (item.condition || 'USED')
      );

      if (itemPrices.length > 0) {
        // Track freshness
        for (const p of itemPrices) {
          const ts = new Date(p.cached_at).getTime();
          if (!oldestItem || ts < oldestItem.ts) {
            oldestItem = { part_no: p.part_no, date: p.cached_at, ts };
          }
          if (!newestItem || ts > newestItem.ts) {
            newestItem = { part_no: p.part_no, date: p.cached_at, ts };
          }
        }

        // Check for price discrepancies (>20% difference from avg)
        if (item.unit_price_cents && item.unit_price_cents > 0) {
          const blPrices = itemPrices.filter(p => p.source === 'bricklink' && p.avg_price_cents);
          for (const p of blPrices) {
            const diffPercent = Math.abs(item.unit_price_cents - p.avg_price_cents) / Math.max(item.unit_price_cents, p.avg_price_cents);
            if (diffPercent > 0.20) {
              priceDiscrepancies.push({
                part_no: item.part_no,
                our_price_cents: item.unit_price_cents,
                market_avg_cents: p.avg_price_cents,
                difference_percent: Math.round(diffPercent * 100),
              });
            }
          }
        }
      }
    }

    const actualPricedItems = new Set();
    for (const c of cache) {
      if (c.avg_price_cents) actualPricedItems.add(`${c.part_no}|${c.color_id}|${c.condition}`);
    }
    needsRefresh = totalItems - actualPricedItems.size;

    const averageAge = oldestItem && newestItem
      ? Math.round((Date.now() - ((oldestItem.ts + newestItem.ts) / 2)) / 1000 / 60)
      : null;

    res.json({
      totalItems,
      pricedItems: actualPricedItems.size,
      needsRefresh: Math.max(0, needsRefresh),
      priceDiscrepancies: priceDiscrepancies.slice(0, 50),
      averageAge,
      oldestItem: oldestItem ? { part_no: oldestItem.part_no, date: oldestItem.date } : null,
      newestItem: newestItem ? { part_no: newestItem.part_no, date: newestItem.date } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PRICES FRESHNESS ──
app.get('/api/prices/freshness', async (req, res) => {
  try {
    const cache = await blobRawGet('hold_price_cache');
    const now = Date.now();

    let fresh = 0, stale = 0, cold = 0;

    for (const p of cache) {
      const ageMs = now - new Date(p.cached_at).getTime();
      const ageHours = ageMs / (1000 * 60 * 60);
      if (ageHours <= 1) fresh++;
      else if (ageHours <= 24) stale++;
      else cold++;
    }

    res.json({
      fresh,
      stale,
      cold,
      total: cache.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ORDERS ──
app.get('/api/orders', async (req, res) => {
  try {
    const { status, marketplace, search, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const orders = await blobRawGet('hold_orders');
    const items = await blobRawGet('hold_order_items');

    let filtered = orders;

    if (status) {
      filtered = filtered.filter(o => o.status === status);
    }
    if (marketplace) {
      filtered = filtered.filter(o => o.marketplace === marketplace);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(o =>
        (o.order_id || '').toLowerCase().includes(s) ||
        (o.buyer_name || '').toLowerCase().includes(s)
      );
    }

    // Sort by order_date desc, then id desc
    filtered.sort((a, b) => {
      const dateDiff = new Date(b.order_date || 0) - new Date(a.order_date || 0);
      if (dateDiff !== 0) return dateDiff;
      return (b.id || 0) - (a.id || 0);
    });

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limitNum);

    const result = paged.map(order => ({
      ...order,
      items_count: items.filter(oi => oi.order_id === order.id).length,
    }));

    res.json({
      orders: result,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const orders = await blobRawGet('hold_orders');
    const items = await blobRawGet('hold_order_items');
    const colors = await blobRawGet('hold_bl_colors');

    const order = orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Not found' });

    const orderItems = items
      .filter(oi => oi.order_id === id)
      .map(oi => {
        const colorObj = colors.find(c => c.color_id === oi.color_id);
        return {
          ...oi,
          color_name: colorObj ? colorObj.color_name : null,
          color_code: colorObj ? colorObj.color_code : null,
        };
      });

    res.json({ ...order, items: orderItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status required' });

    const success = await blobUpdate('hold_orders', id, {
      status,
      last_synced_at: new Date().toISOString()
    });
    if (!success) return res.status(404).json({ error: 'Not found' });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DASHBOARD ──
app.get('/api/dashboard', async (req, res) => {
  try {
    const inventory = await blobRawGet('hold_inventory');
    const orders = await blobRawGet('hold_orders');
    const syncLogs = await blobRawGet('hold_sync_log');

    const totalItems = inventory.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const uniqueParts = new Set(inventory.map(i => i.part_no)).size;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'paid').length;
    const totalValueCents = inventory.reduce((sum, i) => sum + ((i.quantity || 0) * (i.unit_price_cents || 0)), 0);

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.order_date || 0) - new Date(a.order_date || 0))
      .slice(0, 5);

    const recentSyncs = [...syncLogs]
      .sort((a, b) => new Date(b.started_at || 0) - new Date(a.started_at || 0))
      .slice(0, 5);

    res.json({
      stats: {
        totalItems,
        uniqueParts,
        totalOrders,
        pendingOrders,
        totalValueCents,
      },
      recentOrders,
      recentSyncs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PRICING RULES ──
app.get('/api/pricing-rules', async (req, res) => {
  try {
    const rules = await blobRawGet('hold_pricing_rules');
    rules.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pricing-rules', async (req, res) => {
  try {
    const { name, rule_type, marketplace, condition, min_price_cents, max_price_cents, markup_percent, markup_fixed_cents } = req.body;

    const newRule = await blobInsert('hold_pricing_rules', {
      name,
      rule_type,
      marketplace: marketplace || null,
      condition: condition || null,
      min_price_cents: min_price_cents ?? null,
      max_price_cents: max_price_cents ?? null,
      markup_percent: markup_percent ?? null,
      markup_fixed_cents: markup_fixed_cents ?? null,
      enabled: true,
      created_at: new Date().toISOString(),
    });

    res.json({ ok: true, id: newRule.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/pricing-rules/:id', async (req, res) => {
  try {
    await blobDelete('hold_pricing_rules', parseInt(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── COLORS ──
app.get('/api/colors', async (req, res) => {
  try {
    await seedColorsIfNeeded();
    const colors = await blobRawGet('hold_bl_colors');
    colors.sort((a, b) => (a.color_name || '').localeCompare(b.color_name || ''));
    res.json(colors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── MARKETPLACE LOTS ──
app.get('/api/marketplace-lots/:marketplace', async (req, res) => {
  try {
    const lots = await blobRawGet('hold_marketplace_lots');
    const inventory = await blobRawGet('hold_inventory');
    const colors = await blobRawGet('hold_bl_colors');

    const filtered = lots
      .filter(l => l.marketplace === req.params.marketplace)
      .sort((a, b) => new Date(b.last_synced_at || 0) - new Date(a.last_synced_at || 0))
      .slice(0, 100);

    const result = filtered.map(ml => {
      const invItem = inventory.find(i => i.id === ml.inventory_id);
      const colorObj = invItem ? colors.find(c => c.color_id === invItem.color_id) : null;
      return {
        ...ml,
        part_no: invItem ? invItem.part_no : null,
        part_name: invItem ? invItem.part_name : null,
        location: invItem ? invItem.location : null,
        color_name: colorObj ? colorObj.color_name : null,
        color_code: colorObj ? colorObj.color_code : null,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SYNC BEACON ──
app.post('/api/sync/beacon', async (req, res) => {
  res.json({ ok: true, queued: true });
  // Fire sync asynchronously after response
  syncAll()
    .then(r => console.log('Beacon sync completed:', Object.keys(r)))
    .catch(err => console.error('Beacon sync failed:', err.message));
});

// ── PENDING ITEMS ──
app.get('/api/pending', async (req, res) => {
  try {
    const pendingItems = await blobRawGet('hold_pending_items');
    const colors = await blobRawGet('hold_bl_colors');

    const filtered = pendingItems
      .filter(p => p.status === 'pending')
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    const result = filtered.map(item => {
      const colorObj = colors.find(c => c.color_id === item.color_id);
      const { image_url, catalog_url } = computeImageUrls(item.part_no, item.color_id);
      return {
        ...item,
        bl_color_name: colorObj ? colorObj.color_name : null,
        color_code: colorObj ? colorObj.color_code : null,
        image_url,
        catalog_url,
      };
    });

    res.json({ items: result, total: result.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pending', async (req, res) => {
  try {
    const { part_no, color_id, color_name, part_name, quantity, condition, location, unit_price_cents, notes, session_id } = req.body;

    if (!part_no) return res.status(400).json({ error: 'part_no required' });

    const newItem = await blobInsert('hold_pending_items', {
      part_no,
      color_id: color_id ?? null,
      color_name: color_name || null,
      part_name: part_name || '',
      quantity: quantity || 1,
      condition: condition || 'USED',
      location: location || null,
      unit_price_cents: unit_price_cents ?? null,
      notes: notes || null,
      source: 'voice',
      session_id: session_id || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    res.json({ ok: true, id: newItem.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pending/batch', async (req, res) => {
  try {
    const { items: pendingItems, session_id } = req.body;
    if (!Array.isArray(pendingItems) || pendingItems.length === 0) {
      return res.status(400).json({ error: 'items array required' });
    }

    const ids = [];
    const now = new Date().toISOString();

    for (const item of pendingItems) {
      const newItem = await blobInsert('hold_pending_items', {
        part_no: item.part_no,
        color_id: item.color_id ?? null,
        color_name: item.color_name || null,
        part_name: item.part_name || '',
        quantity: item.quantity || 1,
        condition: item.condition || 'USED',
        location: item.location || null,
        unit_price_cents: item.unit_price_cents ?? null,
        notes: item.notes || null,
        source: 'voice',
        session_id: session_id || null,
        status: 'pending',
        created_at: now,
        updated_at: now,
      });
      ids.push(newItem.id);
    }

    res.json({ ok: true, count: ids.length, ids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pending/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { quantity, condition, location, unit_price_cents, color_id, color_name, part_name, notes } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (quantity !== undefined) updates.quantity = quantity;
    if (condition !== undefined) updates.condition = condition;
    if (location !== undefined) updates.location = location;
    if (unit_price_cents !== undefined) updates.unit_price_cents = unit_price_cents;
    if (color_id !== undefined) updates.color_id = color_id;
    if (color_name !== undefined) updates.color_name = color_name;
    if (part_name !== undefined) updates.part_name = part_name;
    if (notes !== undefined) updates.notes = notes;

    const success = await blobUpdate('hold_pending_items', id, updates);
    if (!success) return res.status(404).json({ error: 'Not found' });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/pending/:id', async (req, res) => {
  try {
    await blobDelete('hold_pending_items', parseInt(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pending/confirm', async (req, res) => {
  try {
    const { ids } = req.body;
    const pendingItems = await blobRawGet('hold_pending_items');

    let items;
    if (ids && ids.length > 0) {
      const idSet = new Set(ids.map(i => parseInt(i)));
      items = pendingItems.filter(p => idSet.has(p.id));
    } else {
      items = pendingItems.filter(p => p.status === 'pending');
    }

    let confirmed = 0;
    let errors = [];

    const inventory = await blobRawGet('hold_inventory');
    const now = new Date().toISOString();

    for (const item of items) {
      try {
        // Check for existing inventory item with same part_no, color_id, condition
        const existingIdx = inventory.findIndex(i =>
          i.part_no === item.part_no &&
          i.color_id === item.color_id &&
          i.condition === item.condition
        );

        if (existingIdx !== -1) {
          // Merge quantities
          inventory[existingIdx].quantity += (item.quantity || 0);
          inventory[existingIdx].part_name = item.part_name || inventory[existingIdx].part_name;
          inventory[existingIdx].location = item.location || inventory[existingIdx].location;
          inventory[existingIdx].unit_price_cents = item.unit_price_cents ?? inventory[existingIdx].unit_price_cents;
          inventory[existingIdx].notes = item.notes || inventory[existingIdx].notes;
          inventory[existingIdx].updated_at = now;
        } else {
          // Insert new
          const newId = Math.max(0, ...inventory.map(i => i.id || 0)) + 1;
          inventory.push({
            id: newId,
            part_no: item.part_no,
            color_id: item.color_id,
            part_name: item.part_name || '',
            quantity: item.quantity || 1,
            location: item.location || null,
            condition: item.condition || 'USED',
            unit_price_cents: item.unit_price_cents ?? null,
            notes: item.notes || null,
            created_at: now,
            updated_at: now,
          });
        }

        // Mark pending as confirmed
        const pendingIdx = pendingItems.findIndex(p => p.id === item.id);
        if (pendingIdx !== -1) {
          pendingItems[pendingIdx] = { ...pendingItems[pendingIdx], status: 'confirmed', updated_at: now };
        }

        confirmed++;
      } catch (err) {
        errors.push({ id: item.id, error: err.message });
      }
    }

    await blobRawSet('hold_inventory', inventory);
    await blobRawSet('hold_pending_items', pendingItems);

    res.json({ ok: true, confirmed, errors, total: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// INLINE BRICKLINK / BRICKOWL API CLIENTS (using existing oauthHeader above)
// ============================================================

async function blRequest(creds, method, path, params = null) {
  const url = 'https://api.bricklink.com/api/store/v1' + path;
  const qs = params && (method === 'GET' || method === 'DELETE') ? '?' + new URLSearchParams(params) : '';
  const bodyParams = (method !== 'GET' && method !== 'DELETE') ? params : null;
  // Use existing oauthHeader(method, url, params, consumerKey, consumerSecret, tokenValue, tokenSecret)
  const extraParams = {};
  if (bodyParams) {
    // OAuth 1.0 includes POST body params in the signature
    Object.assign(extraParams, bodyParams);
  }
  const auth = oauthHeader(method, url + qs, extraParams, creds.consumerKey, creds.consumerSecret, creds.tokenValue, creds.tokenSecret);
  const opts = { method, headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json' } };
  if (bodyParams) opts.body = JSON.stringify(bodyParams);
  const res = await fetch(url + qs, opts);
  const data = await res.json();
  if (data.meta?.code >= 400) throw new Error('BL ' + data.meta.code + ': ' + (data.meta.message || ''));
  return data.data || data;
}

async function boRequest(apiKey, method, path, params = null) {
  const url = 'https://api.brickowl.com/v1' + path;
  const opts = { method, headers: { 'Content-Type': 'application/json', Accept: 'application/json' } };
  if (params) {
    params.key = apiKey;
    if (method === 'GET') opts.url_ = url + '?' + new URLSearchParams(params);
    else opts.body = JSON.stringify(params);
  } else {
    opts.url_ = url + '?key=' + apiKey;
  }
  // BrickOwl uses query param for auth; route GET/POST differently
  let finalUrl = url;
  if (params && method === 'GET') {
    finalUrl = url + '?' + new URLSearchParams({ ...params, key: apiKey });
  } else if (params) {
    finalUrl = url + '?key=' + apiKey;
    opts.body = JSON.stringify(params);
  } else {
    finalUrl = url + '?key=' + apiKey;
  }
  const res = await fetch(finalUrl, opts);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

async function getCredentials() {
  const creds = await blobRawGet('hold_api_credentials');
  const out = { bricklink: null, brickowl: null };
  for (const c of creds) {
    const data = typeof c.credentials === 'string' ? JSON.parse(c.credentials) : c.credentials;
    if (c.marketplace === 'bricklink') out.bricklink = data;
    if (c.marketplace === 'brickowl') out.brickowl = data;
  }
  return out;
}

// ============================================================
// SETTINGS
// ============================================================

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await blobRawGet('hold_settings');
    const out = {};
    for (const s of settings) { if (s.key !== 'api_token') out[s.key] = s.value; }
    if (!out.push_mode) out.push_mode = 'dry_run';
    if (!out.sync_interval_min) out.sync_interval_min = '10';
    if (!out.auto_sync_enabled) out.auto_sync_enabled = 'true';
    if (!out.backup_keep_days) out.backup_keep_days = '14';
    res.json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/settings', async (req, res) => {
  try {
    const allowed = ['push_mode', 'sync_interval_min', 'auto_sync_enabled', 'backup_keep_days'];
    const settings = await blobRawGet('hold_settings');
    const updated = {};
    for (const [k, v] of Object.entries(req.body || {})) {
      if (allowed.includes(k)) {
        const idx = settings.findIndex(s => s.key === k);
        if (idx !== -1) settings[idx].value = String(v);
        else settings.push({ key: k, value: String(v) });
        updated[k] = String(v);
      }
    }
    await blobRawSet('hold_settings', settings);
    res.json({ ok: true, updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// REPORTS
// ============================================================

app.get('/api/reports', async (req, res) => {
  try {
    const inventory = await blobRawGet('hold_inventory');
    const orders = await blobRawGet('hold_orders');
    const lots = await blobRawGet('hold_marketplace_lots');

    const byCondition = [
      { condition: 'NEW', lots: inventory.filter(i => i.condition === 'NEW').length, pieces: inventory.filter(i => i.condition === 'NEW').reduce((s, i) => s + (i.quantity || 0), 0), value_cents: inventory.filter(i => i.condition === 'NEW').reduce((s, i) => s + (i.quantity || 0) * (i.unit_price_cents || 0), 0) },
      { condition: 'USED', lots: inventory.filter(i => i.condition !== 'NEW').length, pieces: inventory.filter(i => i.condition !== 'NEW').reduce((s, i) => s + (i.quantity || 0), 0), value_cents: inventory.filter(i => i.condition !== 'NEW').reduce((s, i) => s + (i.quantity || 0) * (i.unit_price_cents || 0), 0) },
    ];

    const byMarketplace = [
      { marketplace: 'bricklink', lots: lots.filter(l => l.marketplace === 'bricklink').length, pieces: lots.filter(l => l.marketplace === 'bricklink').reduce((s, l) => s + (l.quantity || 0), 0), value_cents: lots.filter(l => l.marketplace === 'bricklink').reduce((s, l) => s + (l.quantity || 0) * (l.unit_price_cents || 0), 0) },
      { marketplace: 'brickowl', lots: lots.filter(l => l.marketplace === 'brickowl').length, pieces: lots.filter(l => l.marketplace === 'brickowl').reduce((s, l) => s + (l.quantity || 0), 0), value_cents: lots.filter(l => l.marketplace === 'brickowl').reduce((s, l) => s + (l.quantity || 0) * (l.unit_price_cents || 0), 0) },
    ];

    const topValue = inventory
      .map(i => ({ ...i, total_cents: (i.quantity || 0) * (i.unit_price_cents || 0) }))
      .sort((a, b) => b.total_cents - a.total_cents)
      .slice(0, 15);

    res.json({ byCondition, byMarketplace, topValue });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// PRICING PREVIEW & APPLY
// ============================================================

app.get('/api/pricing/preview', async (req, res) => {
  try {
    const rules = await blobRawGet('hold_pricing_rules');
    const enabled = rules.filter(r => r.enabled !== false);
    const inventory = await blobRawGet('hold_inventory');
    const priceCache = await blobRawGet('hold_price_cache');

    const proposals = [];
    for (const item of inventory) {
      if (!item.quantity || item.quantity <= 0) continue;
      const cached = priceCache.find(pc =>
        pc.part_no === item.part_no &&
        (pc.color_id === item.color_id || (pc.color_id == null && item.color_id == null)) &&
        pc.condition === item.condition && pc.source === 'bricklink'
      );
      if (!cached || !cached.avg_price_cents) continue;

      let newPrice = cached.avg_price_cents;
      for (const rule of enabled) {
        if (rule.condition && rule.condition !== item.condition) continue;
        if (rule.markup_percent) newPrice = Math.round(newPrice * (1 + rule.markup_percent / 100));
        if (rule.markup_fixed_cents) newPrice += rule.markup_fixed_cents;
        if (rule.min_price_cents && newPrice < rule.min_price_cents) newPrice = rule.min_price_cents;
        if (rule.max_price_cents && newPrice > rule.max_price_cents) newPrice = rule.max_price_cents;
      }
      if (newPrice !== item.unit_price_cents) {
        proposals.push({
          inventory_id: item.id, part_no: item.part_no, part_name: item.part_name,
          color_name: item.color_name || '', condition: item.condition, quantity: item.quantity,
          current_price_cents: item.unit_price_cents, market_avg_cents: cached.avg_price_cents,
          proposed_price_cents: newPrice, change_cents: newPrice - (item.unit_price_cents || 0),
        });
      }
    }
    res.json({ rules_applied: enabled.length, proposals, total: proposals.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/pricing/apply', async (req, res) => {
  try {
    const { changes } = req.body || {};
    if (!Array.isArray(changes) || changes.length === 0) return res.status(400).json({ error: 'changes array required' });
    const inventory = await blobRawGet('hold_inventory');
    const results = [];
    for (const ch of changes) {
      const idx = inventory.findIndex(i => i.id === ch.inventory_id);
      if (idx === -1) { results.push({ inventory_id: ch.inventory_id, error: 'Not found' }); continue; }
      inventory[idx].unit_price_cents = ch.price_cents;
      inventory[idx].updated_at = new Date().toISOString();
      results.push({ inventory_id: ch.inventory_id, ok: true });
    }
    await blobRawSet('hold_inventory', inventory);
    res.json({ ok: true, applied: results.filter(r => r.ok).length, results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// PICKING
// ============================================================

app.get('/api/picking', async (req, res) => {
  try {
    const { order_id } = req.query;
    const orderItems = await blobRawGet('hold_order_items');
    const orders = await blobRawGet('hold_orders');
    const inventory = await blobRawGet('hold_inventory');

    let rows = orderItems.map(oi => {
      const order = orders.find(o => o.id === oi.order_id) || {};
      const inv = inventory.find(i => i.part_no === oi.part_no && (i.color_id === oi.color_id || (i.color_id == null && oi.color_id == null)));
      return { ...oi, order_marketplace: order.marketplace, marketplace_order_id: order.order_id, buyer_name: order.buyer_name, order_status: order.status, location: inv?.location, stock_quantity: inv?.quantity, inventory_id: inv?.id };
    });

    if (order_id) rows = rows.filter(r => r.order_id === parseInt(order_id));
    else rows = rows.filter(r => ['paid', 'picked'].includes(r.order_status));
    rows.sort((a, b) => (a.location || '').localeCompare(b.location || ''));

    const items = rows.map(r => ({
      ...r,
      image_url: r.color_id ? `https://img.bricklink.com/ItemImage/PN/${r.color_id}/${r.part_no}.png` : `https://img.bricklink.com/ItemImage/PN/0/${r.part_no}.png`,
    }));

    res.json({ items, total: items.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// PART-OUT
// ============================================================

function isValidSetNo(s) {
  return /^\d{4,6}(-?\d+)?$/i.test(s);
}
function normalizeSetNo(setNo) {
  const cleaned = setNo.replace(/[^a-zA-Z0-9-]/g, '').trim();
  return cleaned.includes('-') ? cleaned : cleaned + '-1';
}

app.post('/api/partout/:setNo', async (req, res) => {
  try {
    const creds = await getCredentials();
    if (!creds.bricklink) return res.status(400).json({ error: 'BrickLink not configured' });

    if (!isValidSetNo(req.params.setNo)) {
      return res.status(400).json({ error: 'Invalid set number. Use format like "21318" or "10255-1".' });
    }
    const setNo = normalizeSetNo(req.params.setNo);
    const { condition = 'USED', include_prices = true, completeness = null } = req.body || {};

    if (completeness && !['sealed','complete','incomplete'].includes(completeness)) {
      return res.status(400).json({ error: 'completeness must be: sealed, complete, or incomplete' });
    }

    // Fetch set metadata (name, image)
    let setName = null, setImage = null, setYear = null;
    try {
      const setMeta = await blRequest(creds.bricklink, 'GET', '/items/SET/' + setNo);
      if (setMeta) {
        setName = setMeta.name || null;
        setImage = setMeta.image_url || null;
        setYear = setMeta.year_released || null;
      }
    } catch {}

    const subsets = await blRequest(creds.bricklink, 'GET', '/items/SET/' + setNo + '/subsets', { break_minifigs: 'true' });
    if (!Array.isArray(subsets)) return res.status(404).json({ error: 'No inventory found for set ' + setNo + '. Check the set number and try again.' });

    // Color lookup
    const colors = await blobRawGet('hold_bl_colors');
    const colorMap = new Map(colors.map(c => [c.color_id, { name: c.color_name, code: c.color_code }]));

    let parts = [], totalPieces = 0, minifigCount = 0;

    for (const subset of subsets) {
      const isMinifig = subset.match_no > 0;
      for (const entry of (subset.entries || [])) {
        const item = entry.item || {};
        const colorId = entry.color_id ?? null;
        const colorInfo = colorMap.get(colorId);

        const part = {
          part_no: item.no || entry.part_no || '',
          part_name: item.name || entry.part_name || '',
          item_type: item.type || 'PART',
          color_id: colorId,
          color_name: colorInfo?.name || entry.color_name || null,
          color_code: colorInfo?.code || null,
          quantity: entry.quantity || 0,
          extra: !!entry.is_extra,
          alternate: !!entry.is_alternate || !!entry.is_counterpart,
          minifig_set: isMinifig ? 'Minifig ' + subset.match_no : null,
          image_url: (item.no || entry.part_no)
            ? 'https://img.bricklink.com/ItemImage/PN/' + (colorId || 0) + '/' + (item.no || entry.part_no) + '.png'
            : null,
        };

        if (part.item_type === 'MINIFIG') minifigCount++;
        totalPieces += part.quantity;
        parts.push(part);
      }
    }

    const regularParts = parts.filter(p => !p.extra && !p.alternate);
    const extraParts = parts.filter(p => p.extra);
    const alternateParts = parts.filter(p => p.alternate);

    if (include_prices) {
      const priceCache = await blobRawGet('hold_price_cache');
      const priceMap = new Map();
      for (const pc of priceCache) {
        if (pc.condition === condition) {
          priceMap.set(pc.part_no + '|' + (pc.color_id || 0), pc);
        }
      }

      const attachPrice = (p) => {
        const key = p.part_no + '|' + (p.color_id || 0);
        const cached = priceMap.get(key);
        if (cached) {
          p.avg_price_cents = cached.avg_price_cents;
          p.min_price_cents = cached.min_price_cents;
          p.max_price_cents = cached.max_price_cents;
          p.qty_available = cached.qty_available;
        }
      };
      regularParts.forEach(attachPrice);
      extraParts.forEach(attachPrice);
      alternateParts.forEach(attachPrice);
    }

    res.json({
      set_no: setNo, set_name: setName, set_image: setImage, set_year: setYear,
      completeness,
      total_lots: parts.length, total_pieces: totalPieces, minifig_count: minifigCount,
      regular_parts: regularParts, extras: extraParts, alternates: alternateParts,
      parts,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/partout/:setNo/confirm', async (req, res) => {
  try {
    const { parts, condition = 'USED', location = null } = req.body || {};
    if (!Array.isArray(parts) || parts.length === 0) return res.status(400).json({ error: 'parts array required' });
    const pending = await blobRawGet('hold_pending_items');
    const nextId = Math.max(0, ...pending.map(p => p.id || 0)) + 1;
    let count = 0;
    for (const p of parts) {
      pending.push({ id: nextId + count, part_no: p.part_no, color_id: p.color_id ?? null, color_name: p.color_name || null, part_name: p.part_name || '', quantity: p.quantity || 1, condition: p.condition || condition, location: p.location || location, unit_price_cents: p.unit_price_cents ?? null, notes: 'Part-out: ' + req.params.setNo, source: 'partout', status: 'pending', created_at: new Date().toISOString() });
      count++;
    }
    await blobRawSet('hold_pending_items', pending);
    res.json({ ok: true, added: count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// PUSH / RECONCILE (two-way sync)
// ============================================================

const PUSH_LOG_KEY = 'hold_push_log';

async function logPush(mode, marketplace, action, status, detail) {
  const log = await blobRawGet(PUSH_LOG_KEY);
  log.push({ mode, marketplace, action, status, detail: detail || '', created_at: new Date().toISOString() });
  await blobRawSet(PUSH_LOG_KEY, log.slice(-500));
}

app.get('/api/push/status', async (req, res) => {
  try {
    const settings = await blobRawGet('hold_settings');
    const mode = settings.find(s => s.key === 'push_mode')?.value || 'dry_run';
    const recent = (await blobRawGet(PUSH_LOG_KEY)).slice(-50);
    const counts = [];
    res.json({ push_mode: mode, counts, recent });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/push/mode', async (req, res) => {
  try {
    const { mode } = req.body;
    if (!['dry_run', 'live'].includes(mode)) return res.status(400).json({ error: "mode must be 'dry_run' or 'live'" });
    const settings = await blobRawGet('hold_settings');
    const idx = settings.findIndex(s => s.key === 'push_mode');
    if (idx !== -1) settings[idx].value = mode;
    else settings.push({ key: 'push_mode', value: mode });
    await blobRawSet('hold_settings', settings);
    await logPush(mode, 'system', 'mode_switch', 'ok', 'Switched to ' + mode);
    res.json({ ok: true, push_mode: mode });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reconcile', async (req, res) => {
  try {
    const settings = await blobRawGet('hold_settings');
    const mode = settings.find(s => s.key === 'push_mode')?.value || 'dry_run';
    const orders = await blobRawGet('hold_orders');
    const results = [];
    for (const order of orders) {
      if (order.status === 'cancelled' || order.reconciled_at) continue;
      try {
        const r = await reconcileOrderInternal(order, mode);
        if (r) results.push(r);
      } catch (e) { await logPush(mode, order.marketplace, 'reconcile', 'error', 'Order ' + order.order_id + ': ' + e.message); }
    }
    res.json({ push_mode: mode, reconciled: results.length, results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reconcile/:orderId', async (req, res) => {
  try {
    const settings = await blobRawGet('hold_settings');
    const mode = settings.find(s => s.key === 'push_mode')?.value || 'dry_run';
    const orders = await blobRawGet('hold_orders');
    const order = orders.find(o => o.id === parseInt(req.params.orderId));
    if (!order) return res.status(404).json({ error: 'Order not found' });
    // Clear stamp for re-run
    order.reconciled_at = null;
    const result = await reconcileOrderInternal(order, mode);
    if (result) {
      result.order_id = order.order_id;
      await blobRawSet('hold_orders', orders);
    }
    res.json({ push_mode: mode, ...(result || { skipped: 'already reconciled' }) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

async function reconcileOrderInternal(order, mode) {
  // When an order lands on one marketplace, decrement matching lots on the OTHER marketplace
  const otherMp = order.marketplace === 'bricklink' ? 'brickowl' : 'bricklink';
  const creds = await getCredentials();
  if (!creds[otherMp]) { await logPush(mode, order.marketplace, 'reconcile', 'skipped', 'No ' + otherMp + ' credentials'); return null; }

  const orderItems = await blobRawGet('hold_order_items');
  const items = orderItems.filter(oi => oi.order_id === order.id);
  if (items.length === 0) { await logPush(mode, order.marketplace, 'reconcile', 'skipped', 'No line items for order ' + order.order_id); return null; }

  const lots = await blobRawGet('hold_marketplace_lots');
  const inventory = await blobRawGet('hold_inventory');
  const changes = [];

  for (const item of items) {
    const matchingLot = lots.find(l => l.marketplace === otherMp && l.inventory_id && inventory.find(i => i.id === l.inventory_id && i.part_no === item.part_no && (i.color_id === item.color_id || (i.color_id == null && item.color_id == null))));
    if (!matchingLot) continue;

    const newQty = Math.max(0, (matchingLot.quantity || 0) - (item.quantity || 0));
    changes.push({ lot_id: matchingLot.lot_id, marketplace: otherMp, old_qty: matchingLot.quantity, new_qty: newQty, part_no: item.part_no });

    if (mode === 'live') {
      try {
        if (otherMp === 'bricklink') {
          await blRequest(creds.bricklink, 'PUT', '/inventories/' + matchingLot.lot_id, { quantity: newQty });
        } else {
          await boRequest(creds.brickowl, 'POST', '/inventory/update', { lot_id: matchingLot.lot_id, qty: newQty });
        }
        matchingLot.quantity = newQty;
      } catch (e) {
        await logPush(mode, otherMp, 'reconcile', 'error', 'API write failed for lot ' + matchingLot.lot_id + ': ' + e.message);
        continue;
      }
    }
    await logPush(mode, otherMp, 'reconcile', 'ok', 'Lot ' + matchingLot.lot_id + ' qty ' + matchingLot.quantity + '→' + newQty);
    matchingLot.quantity = newQty;
  }

  if (mode === 'live' && changes.length > 0) {
    await blobRawSet('hold_marketplace_lots', lots);
  }
  order.reconciled_at = new Date().toISOString();
  await logPush(mode, order.marketplace, 'reconcile', 'ok', 'Order ' + order.order_id + ', ' + changes.length + ' lots adjusted on ' + otherMp);
  return { order_id: order.order_id, marketplace: order.marketplace, changes, count: changes.length };
}

// ============================================================
// SCHEDULER
// ============================================================

app.get('/api/scheduler/status', async (req, res) => {
  try {
    const settings = await blobRawGet('hold_settings');
    const syncInterval = settings.find(s => s.key === 'sync_interval_min')?.value || '10';
    const autoSync = settings.find(s => s.key === 'auto_sync_enabled')?.value !== 'false';
    res.json({ enabled: autoSync, interval_min: parseInt(syncInterval), last_run: null, next_run: null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/scheduler/tick', async (req, res) => {
  // Cron endpoint — triggers all syncs, checks for new orders
  // Designed to be called by external cron service (cron-job.org, GitHub Actions, etc.)
  const results = {};
  const errors = [];
  
  try {
    // Run all four syncs in parallel
    const syncs = await Promise.allSettled([
      syncBLOrders().then(r => { results.bl_orders = r; }).catch(e => { errors.push(`BL orders: ${e.message}`); }),
      syncBLInventory().then(r => { results.bl_inventory = r; }).catch(e => { errors.push(`BL inventory: ${e.message}`); }),
      syncBOOrders().then(r => { results.bo_orders = r; }).catch(e => { errors.push(`BO orders: ${e.message}`); }),
      syncBOInventory().then(r => { results.bo_inventory = r; }).catch(e => { errors.push(`BO inventory: ${e.message}`); }),
    ]);
    
    // Check for new orders vs last-seen state
    try {
      const stateBlob = await blobRawGet('hold_cron_state').catch(() => ({}));
      const lastIds = stateBlob.lastOrderIds || [];
      const orders = await blobRawGet('hold_orders');
      const knownIds = new Set(lastIds);
      const newOrders = orders.filter(o => !knownIds.has(o.id));
      
      results.new_orders = newOrders.length;
      results.order_ids = newOrders.map(o => `${o.marketplace}:${o.order_id}`);
      
      await blobSet('hold_cron_state', { lastOrderIds: orders.map(o => o.id), lastRun: new Date().toISOString() });
    } catch (e) {
      errors.push(`State tracking: ${e.message}`);
    }
    
    res.json({ ok: true, results, errors: errors.length ? errors : undefined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scheduler/backup', async (req, res) => {
  try {
    const keys = ['hold_inventory', 'hold_orders', 'hold_order_items', 'hold_marketplace_lots', 'hold_bl_colors', 'hold_api_credentials', 'hold_pricing_rules', 'hold_sync_log', 'hold_price_cache', 'hold_pending_items', 'hold_settings', 'hold_push_log'];
    for (const key of keys) {
      try {
        const data = await blobRawGet(key);
        await blobRawSet(key + '_backup_' + new Date().toISOString().replace(/[:.]/g, '-'), data);
      } catch (e) { /* skip missing blobs */ }
    }
    res.json({ ok: true, backup: 'blob snapshots created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// STARTUP LOG
// ============================================================

app.post('/api/scrape/brickeconomy', async (req, res) => {
  res.status(501).json({
    error: 'BrickEconomy scraping not available in serverless mode. Uses Python subprocess — run locally.',
    hint: 'Install the local hold server and run scraping from there.'
  });
});

// ============================================================
// TRAVEL PORTAL ENDPOINTS (not available in serverless mode)
// ============================================================

app.post('/api/travel/search', async (req, res) => {
  res.status(501).json({
    error: 'Travel portal not available in serverless mode. Uses Python subprocess — run locally.',
    hint: 'Install the local hold server and use the travel portal from there.'
  });
});

// ============================================================
// EXPORT HANDLER (serverless-http)
// ============================================================

const handler = serverless(app);
export { handler };

// ============================================================
// LOCAL DEV FALLBACK
// ============================================================

if (process.env.NETLIFY_DEV !== 'true' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔄 Hold server running on http://localhost:${PORT}`);
    console.log(`   Blob Store: ${blobStoreMode}`);
    console.log(`   API: http://localhost:${PORT}/api/status`);
  });
}
