// Brick Owl API v1 client
// API docs: https://www.brickowl.com/api
// Base URL: https://api.brickowl.com/v1/

import fetch from 'node-fetch';

const BASE_URL = 'https://api.brickowl.com/v1';

export class BrickOwlClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async request(method, endpoint, params = {}) {
    params.key = this.apiKey;

    let url;
    let options = { method, headers: {} };

    if (method === 'GET') {
      url = `${BASE_URL}${endpoint}?${new URLSearchParams(params)}`;
    } else {
      url = `${BASE_URL}${endpoint}`;
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      options.body = new URLSearchParams(params).toString();
    }

    const response = await fetch(url, options);
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`BrickOwl API: Non-JSON response (${response.status}): ${text.slice(0, 200)}`);
    }

    // BrickOwl returns { status: 'success', data: ... } or { status: 'error', message: ... }
    if (data.status === 'error') {
      throw new Error(`BrickOwl API Error: ${data.message || JSON.stringify(data)}`);
    }

    return data.data || data;
  }

  // --- Store Inventory ---

  async getInventory(params = {}) {
    return this.request('GET', '/inventory/list', params);
  }

  async getInventoryItem(lotId) {
    return this.request('GET', '/inventory/view', { lot_id: lotId });
  }

  async updateInventoryItem(lotId, data) {
    return this.request('POST', '/inventory/update', { lot_id: lotId, ...data });
  }

  async createInventoryItem(data) {
    return this.request('POST', '/inventory/add', data);
  }

  // --- Orders ---

  async getOrders(params = {}) {
    return this.request('GET', '/order/list', params);
  }

  async getOrder(orderId) {
    return this.request('GET', '/order/view', { order_id: orderId });
  }

  async updateOrderStatus(orderId, status) {
    return this.request('POST', '/order/update', { order_id: orderId, status });
  }

  // --- Bulk operations ---

  async bulkGetInventory(lotIds) {
    return this.request('POST', '/inventory/list', { lot_ids: lotIds.join(',') });
  }

  async bulkUpdateInventory(items) {
    // items: array of { lot_id, qty, price, ... }
    return this.request('POST', '/inventory/bulkupdate', { lots: JSON.stringify(items) });
  }

  // --- Catalog ---

  async searchCatalog(query, params = {}) {
    return this.request('GET', '/catalog/search', { query, ...params });
  }

  async getCatalogItem(boid) {
    return this.request('GET', '/catalog/view', { boid });
  }

  async getCatalogItemByElementId(elementId) {
    return this.request('GET', '/catalog/view', { element_id: elementId });
  }

  // --- Colors ---

  async getColors() {
    return this.request('GET', '/catalog/colors');
  }

  // --- Collection / Wanted List ---

  async getCollection(params = {}) {
    return this.request('GET', '/collection/list', params);
  }

  async addToCollection(data) {
    return this.request('POST', '/collection/add', data);
  }

  // --- User ---

  async getUserInfo() {
    return this.request('GET', '/user/info');
  }

  async getFeedback() {
    return this.request('GET', '/user/feedback');
  }
}
