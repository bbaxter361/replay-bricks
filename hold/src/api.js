// API service layer for Hold backend
// In production: uses Netlify Function at replaybrick.com/api/hold
// In development: uses local Express server
const API_BASE = import.meta.env.DEV
  ? 'http://localhost:3002/api'
  : 'https://replaybrick.com/api';

const TOKEN_KEY = 'hold_api_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setApiToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { headers, ...options };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API Error: ${response.status}`);
  }

  return data;
}

export const api = {
  // Status
  status: () => request('/status'),

  // Credentials
  getCredentials: () => request('/credentials'),
  setCredentials: (marketplace, credentials) =>
    request('/credentials', {
      method: 'POST',
      body: JSON.stringify({ marketplace, credentials }),
    }),
  deleteCredentials: (marketplace) =>
    request(`/credentials/${marketplace}`, { method: 'DELETE' }),

  // Sync
  sync: (marketplace, type) =>
    request(`/sync/${marketplace}/${type}`, { method: 'POST' }),
  syncAll: () => request('/sync/all/all', { method: 'POST' }),
  syncBeacon: () => {
    // Fire-and-forget — uses sendBeacon, doesn't block page close
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${API_BASE}/sync/beacon`, '{}');
    }
  },
  getSyncLogs: (limit = 20) => request(`/sync/logs?limit=${limit}`),

  // Inventory
  getInventory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/inventory${qs ? '?' + qs : ''}`);
  },
  getInventoryItem: (id) => request(`/inventory/${id}`),
  createInventoryItem: (data) =>
    request('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateInventoryItem: (id, data) =>
    request(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteInventoryItem: (id) =>
    request(`/inventory/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/orders${qs ? '?' + qs : ''}`);
  },
  getOrder: (id) => request(`/orders/${id}`),
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Colors
  getColors: () => request('/colors'),

  // Pricing Rules
  getPricingRules: () => request('/pricing-rules'),
  createPricingRule: (rule) =>
    request('/pricing-rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    }),
  deletePricingRule: (id) =>
    request(`/pricing-rules/${id}`, { method: 'DELETE' }),

  // Marketplace Lots
  getMarketplaceLots: (marketplace) =>
    request(`/marketplace-lots/${marketplace}`),

  // Price Guide
  getItemPrices: (id) => request(`/inventory/${id}/prices`),
  refreshAllPrices: () =>
    request('/inventory/refresh-prices', { method: 'POST' }),
  refreshPrices: (condition) =>
    request(`/inventory/refresh-prices?condition=${condition}`, { method: 'POST' }),

  // Price Dashboard
  getPriceSummary: () => request('/prices/summary'),
  getPriceFreshness: () => request('/prices/freshness'),

  // Pending Items (Voice Import)
  getPendingItems: () => request('/pending'),
  addPendingItem: (item) =>
    request('/pending', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  addPendingBatch: (items, session_id) =>
    request('/pending/batch', {
      method: 'POST',
      body: JSON.stringify({ items, session_id }),
    }),
  updatePendingItem: (id, data) =>
    request(`/pending/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePendingItem: (id) =>
    request(`/pending/${id}`, { method: 'DELETE' }),
  confirmPendingItems: (ids) =>
    request('/pending/confirm', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  // Push / Reconcile (two-way sync)
  getPushStatus: () => request('/push/status'),
  setPushMode: (mode) =>
    request('/push/mode', { method: 'POST', body: JSON.stringify({ mode }) }),
  reconcileAll: () => request('/reconcile', { method: 'POST' }),
  reconcileOrder: (orderId) =>
    request(`/reconcile/${orderId}`, { method: 'POST' }),

  // Scheduler
  getSchedulerStatus: () => request('/scheduler/status'),
  triggerTick: () => request('/scheduler/tick', { method: 'POST' }),
  triggerBackup: () => request('/scheduler/backup', { method: 'POST' }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (updates) =>
    request('/settings', { method: 'PUT', body: JSON.stringify(updates) }),

  // Reports
  getReports: () => request('/reports'),

  // Picking
  getPicking: (orderId) =>
    request(`/picking${orderId ? '?order_id=' + orderId : ''}`),

  // Part-out
  partOut: (setNo, options) =>
    request(`/partout/${setNo}`, { method: 'POST', body: JSON.stringify(options || {}) }),
  confirmPartOut: (setNo, data) =>
    request(`/partout/${setNo}/confirm`, { method: 'POST', body: JSON.stringify(data) }),

  // Pricing engine
  getPricingPreview: (ruleId) =>
    request(`/pricing/preview${ruleId ? '?rule_id=' + ruleId : ''}`),
  applyPricing: (changes) =>
    request('/pricing/apply', { method: 'POST', body: JSON.stringify({ changes }) }),
};
