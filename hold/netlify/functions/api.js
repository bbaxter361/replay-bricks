import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'inventory.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

function loadInventory() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function saveInventory(items) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
}

function loadOrders() {
  try {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function saveOrders(orders) {
  fs.mkdirSync(path.dirname(ORDERS_FILE), { recursive: true });
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function nextId(items) {
  return items.reduce((m, i) => Math.max(m, Number(i.id) || 0), 0) + 1;
}

const ORDER_STATUSES = ['NEW', 'PICKED', 'SHIPPED'];

class Router {
  constructor() {
    this.routes = [];
  }

  add(method, pattern, handler) {
    const keys = [];
    const regex = new RegExp(
      '^' +
        pattern.replace(/:([A-Za-z_]+)/g, (_, k) => {
          keys.push(k);
          return '([^/]+)';
        }) +
        '/?$'
    );
    this.routes.push({ method, regex, keys, handler });
  }

  get(p, h) { this.add('GET', p, h); }
  post(p, h) { this.add('POST', p, h); }
  put(p, h) { this.add('PUT', p, h); }
  delete(p, h) { this.add('DELETE', p, h); }

  async handle(req) {
    for (const r of this.routes) {
      if (r.method !== req.method) continue;
      const m = req.path.match(r.regex);
      if (!m) continue;
      req.params = {};
      r.keys.forEach((k, i) => { req.params[k] = decodeURIComponent(m[i + 1]); });
      return await r.handler(req);
    }
    return { status: 404, body: { error: 'Not found' } };
  }
}

const router = new Router();

router.get('/api/inventory', () => {
  const items = loadInventory();
  return { status: 200, body: { items, total: items.length } };
});

router.get('/api/inventory/:id', (req) => {
  const items = loadInventory();
  const item = items.find((i) => String(i.id) === String(req.params.id));
  if (!item) return { status: 404, body: { error: 'Not found' } };
  return { status: 200, body: item };
});

router.post('/api/inventory', (req) => {
  const body = req.body || {};
  if (!body.part_no) return { status: 400, body: { error: 'part_no required' } };
  const items = loadInventory();
  const now = new Date().toISOString();
  const item = {
    id: nextId(items),
    part_no: body.part_no,
    part_name: body.part_name || '',
    color_id: body.color_id ?? null,
    color_name: body.color_name || null,
    quantity: body.quantity ?? 1,
    condition: body.condition || 'USED',
    location: body.location || null,
    unit_price_cents: body.unit_price_cents ?? null,
    notes: body.notes || null,
    created_at: now,
    updated_at: now,
  };
  items.push(item);
  saveInventory(items);
  return { status: 201, body: item };
});

router.put('/api/inventory/:id', (req) => {
  const items = loadInventory();
  const idx = items.findIndex((i) => String(i.id) === String(req.params.id));
  if (idx === -1) return { status: 404, body: { error: 'Not found' } };
  const body = req.body || {};
  const editable = [
    'part_no', 'part_name', 'color_id', 'color_name',
    'quantity', 'condition', 'location', 'unit_price_cents', 'notes',
  ];
  for (const k of editable) {
    if (body[k] !== undefined) items[idx][k] = body[k];
  }
  items[idx].updated_at = new Date().toISOString();
  saveInventory(items);
  return { status: 200, body: items[idx] };
});

router.delete('/api/inventory/:id', (req) => {
  const items = loadInventory();
  const idx = items.findIndex((i) => String(i.id) === String(req.params.id));
  if (idx === -1) return { status: 404, body: { error: 'Not found' } };
  const [removed] = items.splice(idx, 1);
  saveInventory(items);
  return { status: 200, body: { ok: true, removed } };
});

router.get('/api/orders', () => {
  const orders = loadOrders();
  return { status: 200, body: { orders, total: orders.length } };
});

router.get('/api/orders/:id', (req) => {
  const orders = loadOrders();
  const order = orders.find((o) => String(o.id) === String(req.params.id));
  if (!order) return { status: 404, body: { error: 'Not found' } };
  return { status: 200, body: order };
});

router.post('/api/orders', (req) => {
  const body = req.body || {};
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { status: 400, body: { error: 'items required' } };
  }
  for (const it of body.items) {
    if (it == null || it.inventory_id == null || !Number.isFinite(Number(it.qty)) || Number(it.qty) <= 0) {
      return { status: 400, body: { error: 'each item requires inventory_id and positive qty' } };
    }
  }
  if (!body.customer_name) return { status: 400, body: { error: 'customer_name required' } };
  const status = body.status || 'NEW';
  if (!ORDER_STATUSES.includes(status)) {
    return { status: 400, body: { error: `status must be one of ${ORDER_STATUSES.join(', ')}` } };
  }
  const orders = loadOrders();
  const now = new Date().toISOString();
  const order = {
    id: nextId(orders),
    items: body.items.map((it) => ({
      inventory_id: it.inventory_id,
      qty: Number(it.qty),
    })),
    customer_name: body.customer_name,
    customer_email: body.customer_email || null,
    status,
    total_cents: body.total_cents ?? 0,
    created_at: now,
    updated_at: now,
  };
  orders.push(order);
  saveOrders(orders);
  return { status: 201, body: order };
});

router.put('/api/orders/:id', (req) => {
  const orders = loadOrders();
  const idx = orders.findIndex((o) => String(o.id) === String(req.params.id));
  if (idx === -1) return { status: 404, body: { error: 'Not found' } };
  const body = req.body || {};
  if (body.status !== undefined && !ORDER_STATUSES.includes(body.status)) {
    return { status: 400, body: { error: `status must be one of ${ORDER_STATUSES.join(', ')}` } };
  }
  const editable = ['items', 'customer_name', 'customer_email', 'status', 'total_cents'];
  for (const k of editable) {
    if (body[k] !== undefined) orders[idx][k] = body[k];
  }
  orders[idx].updated_at = new Date().toISOString();
  saveOrders(orders);
  return { status: 200, body: orders[idx] };
});

router.delete('/api/orders/:id', (req) => {
  const orders = loadOrders();
  const idx = orders.findIndex((o) => String(o.id) === String(req.params.id));
  if (idx === -1) return { status: 404, body: { error: 'Not found' } };
  const [removed] = orders.splice(idx, 1);
  saveOrders(orders);
  return { status: 200, body: { ok: true, removed } };
});

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const rawPath = event.path || '';
  const reqPath = rawPath.replace(/^\/\.netlify\/functions\/api/, '') || '/';

  let body = null;
  if (event.body) {
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch {
      return {
        statusCode: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON body' }),
      };
    }
  }

  const req = {
    method: event.httpMethod,
    path: reqPath,
    query: event.queryStringParameters || {},
    headers: event.headers || {},
    body,
  };

  try {
    const result = await router.handle(req);
    return {
      statusCode: result.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify(result.body),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
}
