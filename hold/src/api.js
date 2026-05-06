// API service layer for Hold backend
const API_BASE = 'http://localhost:3002/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };

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
  updateInventoryItem: (id, data) =>
    request(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

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
};
