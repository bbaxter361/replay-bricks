// Shop API — wraps the Clutch/hold API at replaybrick.com/api/clutch

const API_BASE = 'https://replaybrick.com/api/clutch';

let _token = null;
let _tokenPromise = null;

async function getToken() {
  if (_token) return _token;
  if (_tokenPromise) return _tokenPromise;

  _tokenPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'brian@replaybrick.com',
          password: 'Brian!1138',
        }),
      });
      if (!res.ok) throw new Error('Auth failed');
      const data = await res.json();
      _token = data.token;
      return _token;
    } catch (e) {
      _tokenPromise = null;
      throw e;
    }
  })();

  return _tokenPromise;
}

async function apiFetch(path, options = {}) {
  const token = await getToken();
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    let msg;
    try { const j = JSON.parse(text); msg = j.error || j.message || text; } catch { msg = text; }
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return res.json();
}

// ── INVENTORY ──

export async function fetchInventory({ search, condition, page = 1, limit = 48 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (condition) params.set('condition', condition);
  params.set('page', String(page));
  params.set('limit', String(limit));
  const data = await apiFetch(`/inventory?${params.toString()}`);
  return data;
}

export async function fetchInventoryItem(id) {
  const data = await apiFetch(`/inventory/${id}`);
  return data;
}

export async function fetchAllInventory() {
  // Fetch all pages
  const first = await fetchInventory({ limit: 250, page: 1 });
  const { items: firstItems, total, pages } = first;
  if (pages <= 1) return firstItems;

  const remaining = [];
  for (let p = 2; p <= pages; p++) {
    const data = await fetchInventory({ limit: 250, page: p });
    remaining.push(...data.items);
  }
  return [...firstItems, ...remaining];
}

// ── ORDERS ──

export async function createOrder(orderData) {
  const data = await apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
  return data;
}
