// PushEngine — writes changes BACK to BrickLink and BrickOwl.
// This is what makes Hold a true Bricqer replacement: when an order lands on
// one marketplace, the matching lot on the other marketplace is decremented
// so we never oversell.
//
// SAFETY MODEL:
//   - push_mode setting: 'dry_run' (default) or 'live'
//   - In dry_run, every write is computed and logged to push_log with
//     status='simulated' but NO API call is made. This lets us run alongside
//     Bricqer and verify the writes match what Bricqer does before cutover.
//   - In live mode the API call is made and the response logged.
//   - We NEVER delete lots. Quantity floor is 0.

import { getDb, getSetting } from './db.js';

// BrickOwl order status ids (for status push)
const BO_STATUS_IDS = {
  paid: 2,        // Payment Received
  picked: 3,      // Processing
  packed: 4,      // Processed
  shipped: 5,     // Shipped
  delivered: 6,   // Received
  cancelled: 8,   // Cancelled
};

// BrickLink order status values (for status push)
const BL_STATUS_VALUES = {
  paid: 'PAID',
  picked: 'PROCESSING',
  packed: 'PACKED',
  shipped: 'SHIPPED',
  delivered: 'COMPLETED',
  cancelled: 'CANCELLED',
};

export class PushEngine {
  constructor(syncEngine) {
    this.sync = syncEngine;
    this.db = getDb();
  }

  get mode() {
    return getSetting(this.db, 'push_mode', 'dry_run');
  }

  _log({ marketplace, action, lotId = null, inventoryId = null, orderRef = null, payload, status, result }) {
    this.db.prepare(`
      INSERT INTO push_log (marketplace, action, lot_id, inventory_id, order_ref, payload, mode, status, result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      marketplace, action, lotId, inventoryId, orderRef,
      JSON.stringify(payload), this.mode, status,
      typeof result === 'string' ? result.slice(0, 1000) : JSON.stringify(result || null).slice(0, 1000)
    );
  }

  /**
   * Set a marketplace lot to an absolute quantity (and optionally price).
   * BrickLink expects quantity as a SIGNED DELTA string ("+3"/"-2");
   * BrickOwl accepts absolute_quantity.
   */
  async pushLotQuantity({ marketplace, lotId, currentQty, newQty, priceCents = null, inventoryId = null, orderRef = null, action = 'update_qty' }) {
    newQty = Math.max(0, newQty);
    const delta = newQty - currentQty;
    if (delta === 0 && priceCents === null) {
      return { skipped: true, reason: 'no change' };
    }

    let payload;
    if (marketplace === 'bricklink') {
      payload = {};
      if (delta !== 0) payload.quantity = (delta > 0 ? '+' : '') + String(delta);
      if (priceCents !== null) payload.unit_price = (priceCents / 100).toFixed(3);
    } else if (marketplace === 'brickowl') {
      payload = { absolute_quantity: newQty };
      if (priceCents !== null) payload.price = (priceCents / 100).toFixed(3);
    } else {
      throw new Error(`Unknown marketplace: ${marketplace}`);
    }

    if (this.mode !== 'live') {
      this._log({ marketplace, action, lotId, inventoryId, orderRef, payload, status: 'simulated', result: `DRY RUN: would set lot ${lotId} from ${currentQty} to ${newQty}` });
      return { simulated: true, marketplace, lotId, from: currentQty, to: newQty };
    }

    try {
      let result;
      if (marketplace === 'bricklink') {
        result = await this.sync.blClient.updateInventoryItem(lotId, payload);
      } else {
        result = await this.sync.boClient.updateInventoryItem(lotId, payload);
      }
      this._log({ marketplace, action, lotId, inventoryId, orderRef, payload, status: 'success', result });

      // Mirror the change locally so we don't wait for next sync
      this.db.prepare(`
        UPDATE marketplace_lots SET quantity = ?, last_synced_at = datetime('now')
        WHERE marketplace = ? AND lot_id = ?
      `).run(newQty, marketplace, String(lotId));

      return { pushed: true, marketplace, lotId, from: currentQty, to: newQty };
    } catch (err) {
      this._log({ marketplace, action, lotId, inventoryId, orderRef, payload, status: 'failed', result: err.message });
      throw err;
    }
  }

  /**
   * Push an inventory edit (qty/price changed in Hold UI) to ALL marketplace
   * lots linked to that inventory row.
   */
  async pushInventoryChange(inventoryId, { quantity = null, unitPriceCents = null } = {}) {
    const lots = this.db.prepare(
      'SELECT * FROM marketplace_lots WHERE inventory_id = ?'
    ).all(inventoryId);

    const results = [];
    for (const lot of lots) {
      try {
        const r = await this.pushLotQuantity({
          marketplace: lot.marketplace,
          lotId: lot.lot_id,
          currentQty: lot.quantity,
          newQty: quantity !== null ? quantity : lot.quantity,
          priceCents: unitPriceCents,
          inventoryId,
          action: 'update_inventory',
        });
        results.push({ lot: lot.lot_id, marketplace: lot.marketplace, ...r });
      } catch (err) {
        results.push({ lot: lot.lot_id, marketplace: lot.marketplace, error: err.message });
      }
    }
    return results;
  }

  /**
   * Reconcile one order: decrement matching lots on the OTHER marketplace.
   * E.g. order came in on BrickLink → push decrements to BrickOwl lots.
   * Idempotent: skips orders already stamped reconciled_at.
   */
  async reconcileOrder(orderDbId) {
    const order = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderDbId);
    if (!order) throw new Error(`Order ${orderDbId} not found`);
    if (order.reconciled_at) return { skipped: true, reason: 'already reconciled' };
    if (order.status === 'cancelled') {
      this.db.prepare("UPDATE orders SET reconciled_at = datetime('now') WHERE id = ?").run(orderDbId);
      return { skipped: true, reason: 'cancelled order' };
    }

    const items = this.db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderDbId);
    if (items.length === 0) {
      return { skipped: true, reason: 'no line items synced yet' };
    }

    const otherMarketplace = order.marketplace === 'bricklink' ? 'brickowl' : 'bricklink';
    const actions = [];

    for (const item of items) {
      // Find the inventory row for this order item.
      // Match priority:
      //   1. The order item's own lot_id → marketplace_lots (same marketplace) → inventory_id
      //   2. remote_lot_id (BO sometimes carries the BL lot id directly)
      //   3. part_no + color + condition
      let inv = null;

      if (item.lot_id) {
        const ownLot = this.db.prepare(
          'SELECT * FROM marketplace_lots WHERE marketplace = ? AND lot_id = ?'
        ).get(order.marketplace, String(item.lot_id));
        if (ownLot && ownLot.inventory_id) inv = { id: ownLot.inventory_id };
      }
      if (!inv && item.remote_lot_id) {
        const lot = this.db.prepare(
          'SELECT * FROM marketplace_lots WHERE marketplace = ? AND lot_id = ?'
        ).get(otherMarketplace, String(item.remote_lot_id));
        if (lot) inv = { id: lot.inventory_id, directLot: lot };
      }
      if (!inv) {
        const cond = (item.condition || 'USED').toUpperCase().startsWith('N') ? 'NEW' : 'USED';
        inv = this.db.prepare(
          item.color_id !== null
            ? 'SELECT id FROM inventory WHERE part_no = ? AND color_id = ? AND condition = ?'
            : 'SELECT id FROM inventory WHERE part_no = ? AND color_id IS NULL AND condition = ?'
        ).get(item.part_no, ...(item.color_id !== null ? [item.color_id, cond] : [cond]));
      }

      if (!inv) {
        actions.push({ part: item.part_no, status: 'unmatched', note: 'no inventory row found' });
        continue;
      }

      const lot = inv.directLot || this.db.prepare(
        'SELECT * FROM marketplace_lots WHERE inventory_id = ? AND marketplace = ?'
      ).get(inv.id, otherMarketplace);

      if (!lot) {
        actions.push({ part: item.part_no, status: 'no_cross_lot', note: `not listed on ${otherMarketplace}` });
        continue;
      }

      try {
        const r = await this.pushLotQuantity({
          marketplace: otherMarketplace,
          lotId: lot.lot_id,
          currentQty: lot.quantity,
          newQty: lot.quantity - item.quantity,
          inventoryId: lot.inventory_id,
          orderRef: `${order.marketplace}:${order.order_id}`,
          action: 'reconcile_decrement',
        });
        actions.push({ part: item.part_no, qty: item.quantity, ...r });
      } catch (err) {
        actions.push({ part: item.part_no, status: 'failed', error: err.message });
      }
    }

    // Stamp reconciled (in dry-run too — the simulation is the record;
    // re-running before cutover is done via the re-reconcile endpoint)
    this.db.prepare("UPDATE orders SET reconciled_at = datetime('now') WHERE id = ?").run(orderDbId);

    return { order: `${order.marketplace}:${order.order_id}`, mode: this.mode, actions };
  }

  /** Reconcile all unreconciled OPEN orders (pending/paid/picked/packed).
   *  Historical shipped/delivered orders are stamped as skipped — their
   *  cross-marketplace adjustments were handled back when they shipped. */
  async reconcileAll() {
    // Stamp historical orders so they never get touched
    this.db.prepare(`
      UPDATE orders SET reconciled_at = datetime('now')
      WHERE reconciled_at IS NULL AND status IN ('shipped', 'delivered', 'cancelled')
    `).run();

    const pending = this.db.prepare(`
      SELECT id FROM orders
      WHERE reconciled_at IS NULL AND status IN ('pending', 'paid', 'picked', 'packed')
      ORDER BY order_date ASC
    `).all();

    const results = [];
    for (const row of pending) {
      try {
        results.push(await this.reconcileOrder(row.id));
      } catch (err) {
        results.push({ orderDbId: row.id, error: err.message });
      }
    }
    return { count: results.length, results };
  }

  /** Push an order status change back to its marketplace. */
  async pushOrderStatus(orderDbId, newStatus) {
    const order = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderDbId);
    if (!order) throw new Error(`Order ${orderDbId} not found`);

    let payload;
    if (order.marketplace === 'bricklink') {
      const v = BL_STATUS_VALUES[newStatus];
      if (!v) return { skipped: true, reason: `no BL mapping for status '${newStatus}'` };
      payload = { status: v };
    } else {
      const id = BO_STATUS_IDS[newStatus];
      if (id === undefined) return { skipped: true, reason: `no BO mapping for status '${newStatus}'` };
      payload = { status_id: id };
    }

    if (this.mode !== 'live') {
      this._log({ marketplace: order.marketplace, action: 'order_status', orderRef: order.order_id, payload, status: 'simulated', result: `DRY RUN: would set order ${order.order_id} to ${newStatus}` });
      return { simulated: true, order: order.order_id, status: newStatus };
    }

    try {
      let result;
      if (order.marketplace === 'bricklink') {
        result = await this.sync.blClient.updateOrderStatus(order.order_id, payload.status);
      } else {
        result = await this.sync.boClient.request('POST', '/order/update', { order_id: order.order_id, status_id: payload.status_id });
      }
      this._log({ marketplace: order.marketplace, action: 'order_status', orderRef: order.order_id, payload, status: 'success', result });
      return { pushed: true, order: order.order_id, status: newStatus };
    } catch (err) {
      this._log({ marketplace: order.marketplace, action: 'order_status', orderRef: order.order_id, payload, status: 'failed', result: err.message });
      throw err;
    }
  }
}
