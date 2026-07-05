// BrickLink API v3 client using OAuth 1.0
// API docs: https://www.bricklink.com/v3/api/help/landing.page
// Base URL: https://api.bricklink.com/api/store/v1/

import OAuth from 'oauth-1.0a';
import CryptoJS from 'crypto-js';
import fetch from 'node-fetch';

const BASE_URL = 'https://api.bricklink.com/api/store/v1';

export class BrickLinkClient {
  constructor(consumerKey, consumerSecret, tokenValue, tokenSecret) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.tokenValue = tokenValue;
    this.tokenSecret = tokenSecret;

    this.oauth = new OAuth({
      consumer: { key: consumerKey, secret: consumerSecret },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64);
      }
    });

    this.token = {
      key: tokenValue,
      secret: tokenSecret
    };
  }

  async request(method, path, params = null) {
    const url = params
      ? `${BASE_URL}${path}?${new URLSearchParams(params)}`
      : `${BASE_URL}${path}`;

    const requestData = { url, method };

    const headers = this.oauth.toHeader(this.oauth.authorize(requestData, this.token));
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';

    const options = { method, headers };

    // BL API puts body as JSON for POST/PUT
    if (method === 'POST' || method === 'PUT') {
      options.body = params ? JSON.stringify(params) : '{}';
    }

    const response = await fetch(url, options);
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`BrickLink API: Non-JSON response (${response.status}): ${text.slice(0, 200)}`);
    }

    if (data.meta?.code && data.meta.code >= 400) {
      throw new Error(`BrickLink API Error ${data.meta.code}: ${data.meta.message || JSON.stringify(data.meta)}`);
    }

    return data.data || data;
  }

  // --- Inventory ---

  async getInventory(params = {}) {
    return this.request('GET', '/inventories', params);
  }

  async getInventoryItem(inventoryId) {
    return this.request('GET', `/inventories/${inventoryId}`);
  }

  async updateInventoryItem(inventoryId, data) {
    return this.request('PUT', `/inventories/${inventoryId}`, data);
  }

  async createInventoryItem(data) {
    return this.request('POST', '/inventories', data);
  }

  // --- Orders ---

  async getOrders(params = {}) {
    return this.request('GET', '/orders', params);
  }

  async getOrder(orderId) {
    return this.request('GET', `/orders/${orderId}`);
  }

  async getOrderItems(orderId) {
    return this.request('GET', `/orders/${orderId}/items`);
  }

  async updateOrderStatus(orderId, status, adminNotes = '') {
    return this.request('PUT', `/orders/${orderId}/status`, { field: 'status', value: status, admin_notes: adminNotes });
  }

  // --- Catalog ---

  async getItem(itemType, itemNo) {
    return this.request('GET', `/items/${itemType}/${itemNo}`);
  }

  async getItemPriceGuide(itemType, itemNo, colorId = null, params = {}) {
    let path = `/items/${itemType}/${itemNo}/price`;
    if (colorId) path += `/${colorId}`;
    return this.request('GET', path, params);
  }

  async getItemSubsets(itemType, itemNo, colorId = null, params = {}) {
    let path = `/items/${itemType}/${itemNo}/subsets`;
    if (colorId) path += `/${colorId}`;
    return this.request('GET', path, params);
  }

  // --- Colors ---

  async getColors() {
    return this.request('GET', '/colors');
  }

  // --- Categories ---

  async getCategories() {
    return this.request('GET', '/categories');
  }

  // --- Orders with pagination support ---

  async *iterateOrders(status = null) {
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const params = { page: page + 1, page_size: 50 };
      if (status) params.status = status;

      const result = await this.getOrders(params);
      const orders = Array.isArray(result) ? result : (result.data || result.list || []);

      for (const order of orders) {
        yield order;
      }

      hasMore = orders.length >= 50;
      page++;
    }
  }

  async *iterateInventory() {
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      page++;
      const params = { page, page_size: 500 };
      const result = await this.getInventory(params);
      const items = Array.isArray(result) ? result : (result.data || result.list || []);

      for (const item of items) {
        yield item;
      }

      hasMore = items.length >= 500;
    }
  }
}
