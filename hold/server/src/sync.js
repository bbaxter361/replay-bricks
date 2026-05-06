import { getDb } from './db.js';
import { BrickLinkClient } from './bricklink.js';
import { BrickOwlClient } from './brickowl.js';

export class SyncEngine {
  constructor() {
    this.blClient = null;
    this.boClient = null;
    this.db = getDb();
    this._lock = false;  // prevent concurrent syncs
  }

  loadCredentials() {
    const credentials = this.db.prepare('SELECT marketplace, credentials FROM api_credentials').all();
    for (const cred of credentials) {
      const data = JSON.parse(cred.credentials);
      if (cred.marketplace === 'bricklink') {
        this.blClient = new BrickLinkClient(
          data.consumerKey,
          data.consumerSecret,
          data.tokenValue,
          data.tokenSecret
        );
      } else if (cred.marketplace === 'brickowl') {
        this.boClient = new BrickOwlClient(data.apiKey);
      }
    }
  }

  isConfigured(marketplace) {
    if (marketplace === 'bricklink') return !!this.blClient;
    if (marketplace === 'brickowl') return !!this.boClient;
    return false;
  }

  // ========== Sync BrickLink Inventory ==========

  async syncBLInventory() {
    if (!this.blClient) throw new Error('BrickLink not configured');
    
    const logId = this._startLog('bricklink', 'inventory');
    let count = 0;
    const errors = [];

    try {
      for await (const item of this.blClient.iterateInventory()) {
        try {
          this._upsertBLInventoryItem(item);
          count++;
        } catch (err) {
          errors.push(`Item ${item.inventory_id}: ${err.message}`);
        }
      }
      this._completeLog(logId, 'success', count, errors);
    } catch (err) {
      this._completeLog(logId, 'failed', count, [err.message]);
      throw err;
    }

    return { synced: count, errors };
  }

  _upsertBLInventoryItem(item) {
    const partNo = item.item?.no || item.part_no;
    const colorId = item.color_id || item.color?.color_id || null;
    const partName = item.item?.name || item.part_name || '';
    const condition = item.condition || 'USED';

    // Upsert into main inventory — handle NULL color_id correctly
    const existing = this.db.prepare(
      colorId !== null
        ? 'SELECT id FROM inventory WHERE part_no = ? AND color_id = ? AND condition = ?'
        : 'SELECT id FROM inventory WHERE part_no = ? AND color_id IS NULL AND condition = ?'
    ).get(partNo, ...(colorId !== null ? [colorId, condition] : [condition]));

    let invId;
    if (existing) {
      this.db.prepare(`
        UPDATE inventory SET 
          quantity = ?,
          unit_price_cents = ?,
          location = COALESCE(?, location),
          part_name = COALESCE(?, part_name),
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        item.quantity || 0,
        item.unit_price ? Math.round(parseFloat(item.unit_price) * 100) : 0,
        item.location || null,
        partName,
        existing.id
      );
      invId = existing.id;
    } else {
      const result = this.db.prepare(`
        INSERT INTO inventory (part_no, color_id, part_name, quantity, location, condition, unit_price_cents)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        partNo, colorId, partName,
        item.quantity || 0,
        item.location || null,
        condition,
        item.unit_price ? Math.round(parseFloat(item.unit_price) * 100) : 0
      );
      invId = result.lastInsertRowid;
    }

    // Upsert marketplace lot
    this.db.prepare(`
      INSERT INTO marketplace_lots (inventory_id, marketplace, lot_id, quantity, unit_price_cents, condition, description, remarks, last_synced_at)
      VALUES (?, 'bricklink', ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(marketplace, lot_id) DO UPDATE SET
        inventory_id = excluded.inventory_id,
        quantity = excluded.quantity,
        unit_price_cents = excluded.unit_price_cents,
        condition = excluded.condition,
        description = excluded.description,
        remarks = excluded.remarks,
        last_synced_at = datetime('now')
    `).run(
      invId,
      String(item.inventory_id),
      item.quantity || 0,
      item.unit_price ? Math.round(parseFloat(item.unit_price) * 100) : 0,
      condition,
      item.description || null,
      item.remarks || null
    );
  }

  // ========== Sync BrickLink Orders ==========

  async syncBLOrders(status = null) {
    if (!this.blClient) throw new Error('BrickLink not configured');

    const logId = this._startLog('bricklink', 'orders');
    let count = 0;
    const errors = [];

    try {
      for await (const order of this.blClient.iterateOrders(status)) {
        try {
          await this._upsertBLOrder(order);
          count++;
        } catch (err) {
          errors.push(`Order ${order.order_id}: ${err.message}`);
        }
      }
      this._completeLog(logId, 'success', count, errors);
    } catch (err) {
      this._completeLog(logId, 'failed', count, [err.message]);
      throw err;
    }

    return { synced: count, errors };
  }

  async _upsertBLOrder(order) {
    const orderDate = order.date_ordered ? order.date_ordered.split('T')[0] : null;
    const paidDate = order.date_paid ? order.date_paid.split('T')[0] : null;

    const totalPriceCents = order.grand_total
      ? Math.round(parseFloat(order.grand_total) * 100)
      : null;
    const shippingCents = order.shipping_cost
      ? Math.round(parseFloat(order.shipping_cost) * 100)
      : 0;

    // Map BL statuses
    const statusMap = {
      'pending': 'pending',
      'updated': 'pending',
      'processing': 'pending',
      'ready': 'pending',
      'paid': 'paid',
      'packed': 'packed',
      'shipped': 'shipped',
      'received': 'delivered',
      'completed': 'delivered',
      'cancelled': 'cancelled',
    };
    const localStatus = statusMap[order.status] || 'pending';

    // Upsert order
    this.db.prepare(`
      INSERT INTO orders (marketplace, order_id, buyer_name, status, total_items, total_price_cents, shipping_cents, currency, shipping_address, order_date, paid_date, tracking_number, shipping_carrier, notes, last_synced_at)
      VALUES ('bricklink', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(marketplace, order_id) DO UPDATE SET
        buyer_name = excluded.buyer_name,
        status = excluded.status,
        total_items = excluded.total_items,
        total_price_cents = excluded.total_price_cents,
        shipping_cents = excluded.shipping_cents,
        currency = excluded.currency,
        shipping_address = excluded.shipping_address,
        paid_date = excluded.paid_date,
        tracking_number = excluded.tracking_number,
        shipping_carrier = excluded.shipping_carrier,
        notes = excluded.notes,
        last_synced_at = datetime('now')
    `).run(
      String(order.order_id),
      order.buyer?.buyer_name || order.buyer_name || '',
      localStatus,
      order.total_count || 0,
      totalPriceCents,
      shippingCents,
      order.currency_code || 'USD',
      this._formatAddress(order),
      orderDate,
      paidDate,
      order.tracking_no || null,
      order.shipping_method?.name || null,
      order.admin_notes || null
    );

    // Get items
    try {
      const items = await this.blClient.getOrderItems(order.order_id);
      if (Array.isArray(items)) {
        const orderRow = this.db.prepare(
          'SELECT id FROM orders WHERE marketplace = ? AND order_id = ?'
        ).get('bricklink', String(order.order_id));

        if (orderRow) {
          // Delete existing items and re-insert
          this.db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderRow.id);

          const insertItem = this.db.prepare(`
            INSERT INTO order_items (order_id, part_no, color_id, part_name, quantity, unit_price_cents, condition, marketplace)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'bricklink')
          `);

          for (const item of items) {
            insertItem.run(
              orderRow.id,
              item.item?.no || item.part_no || '',
              item.color_id || item.color?.color_id || null,
              item.item?.name || item.part_name || '',
              item.quantity || 0,
              item.unit_price ? Math.round(parseFloat(item.unit_price) * 100) : 0,
              item.new_or_used || 'U'
            );
          }
        }
      }
    } catch (err) {
      // Non-fatal — order items are nice to have
      console.warn(`Could not fetch items for order ${order.order_id}: ${err.message}`);
    }
  }

  _formatAddress(order) {
    try {
      const addr = order.shipping_address || order.address || {};
      const parts = [addr.name, addr.address1, addr.address2, `${addr.city}, ${addr.state} ${addr.zip}`, addr.country];
      return parts.filter(Boolean).join('\n');
    } catch {
      return '';
    }
  }

  // ========== Sync BrickOwl Inventory ==========

  async syncBOInventory() {
    if (!this.boClient) throw new Error('BrickOwl not configured');

    const logId = this._startLog('brickowl', 'inventory');
    let count = 0;
    const errors = [];

    try {
      const items = await this.boClient.getInventory({ limit: 1000 });
      const list = Array.isArray(items) ? items : (items.lots || items.list || []);

      for (const item of list) {
        try {
          this._upsertBOInventoryItem(item);
          count++;
        } catch (err) {
          errors.push(`Lot ${item.lot_id}: ${err.message}`);
        }
      }
      this._completeLog(logId, 'success', count, errors);
    } catch (err) {
      this._completeLog(logId, 'failed', count, [err.message]);
      throw err;
    }

    return { synced: count, errors };
  }

  _upsertBOInventoryItem(item) {
    // BO uses BOID format like "44980-38" (element_id-color_id)
    const boid = item.boid || '';
    const [elementId, boColorId] = boid.split('-');
    const partNo = elementId || item.element_id || item.part_no || boid;
    const colorId = boColorId ? parseInt(boColorId) : null;
    const partName = item.name || item.part_name || '';
    const condition = item.condition === 'N' ? 'NEW' : 'USED';

    const existing = this.db.prepare(
      colorId !== null
        ? 'SELECT id FROM inventory WHERE part_no = ? AND color_id = ? AND condition = ?'
        : 'SELECT id FROM inventory WHERE part_no = ? AND color_id IS NULL AND condition = ?'
    ).get(partNo, ...(colorId !== null ? [colorId, condition] : [condition]));

    let invId;
    if (existing) {
      this.db.prepare(`
        UPDATE inventory SET 
          quantity = ?,
          unit_price_cents = ?,
          part_name = COALESCE(?, part_name),
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        parseInt(item.qty || item.quantity || 0),
        item.price ? Math.round(parseFloat(item.price) * 100) : 0,
        partName,
        existing.id
      );
      invId = existing.id;
    } else {
      const result = this.db.prepare(`
        INSERT INTO inventory (part_no, color_id, part_name, quantity, condition, unit_price_cents)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        partNo, colorId, partName,
        parseInt(item.qty || item.quantity || 0),
        condition,
        item.price ? Math.round(parseFloat(item.price) * 100) : 0
      );
      invId = result.lastInsertRowid;
    }

    // Upsert marketplace lot
    this.db.prepare(`
      INSERT INTO marketplace_lots (inventory_id, marketplace, lot_id, quantity, unit_price_cents, condition, description, remarks, last_synced_at)
      VALUES (?, 'brickowl', ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(marketplace, lot_id) DO UPDATE SET
        inventory_id = excluded.inventory_id,
        quantity = excluded.quantity,
        unit_price_cents = excluded.unit_price_cents,
        condition = excluded.condition,
        description = excluded.description,
        remarks = excluded.remarks,
        last_synced_at = datetime('now')
    `).run(
      invId,
      String(item.lot_id || boid),
      parseInt(item.qty || item.quantity || 0),
      item.price ? Math.round(parseFloat(item.price) * 100) : 0,
      condition,
      item.description || null,
      item.remarks || null
    );
  }

  // ========== Sync BrickOwl Orders ==========

  async syncBOOrders(params = {}) {
    if (!this.boClient) throw new Error('BrickOwl not configured');

    const logId = this._startLog('brickowl', 'orders');
    let count = 0;
    const errors = [];

    try {
      const orders = await this.boClient.getOrders({ limit: 100, ...params });
      const list = Array.isArray(orders) ? orders : (orders.list || []);

      for (const order of list) {
        try {
          await this._upsertBOOrder(order);
          count++;
        } catch (err) {
          errors.push(`Order ${order.order_id}: ${err.message}`);
        }
      }
      this._completeLog(logId, 'success', count, errors);
    } catch (err) {
      this._completeLog(logId, 'failed', count, [err.message]);
      throw err;
    }

    return { synced: count, errors };
  }

  async _upsertBOOrder(order) {
    const orderId = String(order.order_id);
    const totalPriceCents = order.total
      ? Math.round(parseFloat(order.total) * 100)
      : null;
    const shippingCents = order.shipping
      ? Math.round(parseFloat(order.shipping) * 100)
      : 0;

    const statusMap = {
      'unpaid': 'pending',
      'paid': 'paid',
      'picking': 'picked',
      'picked': 'picked',
      'packing': 'packed',
      'packed': 'packed',
      'shipped': 'shipped',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
      'refunded': 'cancelled',
    };
    const localStatus = statusMap[order.status] || 'pending';

    this.db.prepare(`
      INSERT INTO orders (marketplace, order_id, buyer_name, status, total_items, total_price_cents, shipping_cents, currency, shipping_address, order_date, tracking_number, notes, last_synced_at)
      VALUES ('brickowl', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(marketplace, order_id) DO UPDATE SET
        buyer_name = excluded.buyer_name,
        status = excluded.status,
        total_items = excluded.total_items,
        total_price_cents = excluded.total_price_cents,
        shipping_cents = excluded.shipping_cents,
        currency = excluded.currency,
        shipping_address = excluded.shipping_address,
        tracking_number = excluded.tracking_number,
        notes = excluded.notes,
        last_synced_at = datetime('now')
    `).run(
      orderId,
      order.buyer_name || '',
      localStatus,
      parseInt(order.item_count || order.total_items || 0),
      totalPriceCents,
      shippingCents,
      order.currency || 'USD',
      order.shipping_address || '',
      order.date_created ? order.date_created.split(' ')[0] : null,
      order.tracking || null,
      order.notes || null
    );
  }

  // ========== Sync Logging ==========

  _startLog(marketplace, syncType) {
    const result = this.db.prepare(`
      INSERT INTO sync_log (marketplace, sync_type, status, started_at)
      VALUES (?, ?, 'running', datetime('now'))
    `).run(marketplace, syncType);
    return result.lastInsertRowid;
  }

  _completeLog(logId, status, count, errors) {
    this.db.prepare(`
      UPDATE sync_log SET
        status = ?,
        completed_at = datetime('now'),
        items_processed = ?,
        errors = ?
      WHERE id = ?
    `).run(status, count, errors.length ? errors.join('; ') : null, logId);
  }

  // ========== Full Sync ==========

  async syncAll() {
    if (this._lock) {
      console.log('Sync skipped — already in progress');
      return { skipped: true };
    }
    this._lock = true;
    try {
      const results = {};

      if (this.isConfigured('bricklink')) {
        console.log('Syncing BrickLink inventory...');
        results.bricklink_inventory = await this.syncBLInventory();
        
        console.log('Syncing BrickLink orders...');
        results.bricklink_orders = await this.syncBLOrders();
      }

      if (this.isConfigured('brickowl')) {
        console.log('Syncing BrickOwl inventory...');
        results.brickowl_inventory = await this.syncBOInventory();
        
        console.log('Syncing BrickOwl orders...');
        results.brickowl_orders = await this.syncBOOrders();
      }

      return results;
    } finally {
      this._lock = false;
    }
  }
}
