/**
 * BrickStore .BSX file parser and sync bridge
 * 
 * BrickStore saves inventory as XML files with .bsx extension.
 * This module:
 * 1. Parses .bsx XML files into inventory items
 * 2. Maps BrickStore fields to Hold database columns
 * 3. Syncs item-by-item (upsert by part_no + color_id + condition)
 */

import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { getDb } from './db.js';

// BrickStore → Hold field mapping
const ITEM_TYPE_MAP = { 'P': 'PART', 'S': 'SET', 'M': 'MINIFIG', 'B': 'BOOK', 'G': 'GEAR', 'C': 'CATALOG', 'I': 'INSTRUCTION', 'O': 'ORIGINAL_BOX', 'U': 'UNSORTED_LOT' };
const STATUS_MAP = { 'I': 'include', 'X': 'exclude', 'E': 'extra' };
const CONDITION_MAP = { 'N': 'NEW', 'U': 'USED' };

export class BrickStoreSync {
  constructor() {
    this.db = getDb();
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      textNodeName: '#text',
      isArray: (name) => ['Item'].includes(name),
    });
  }

  /**
   * Parse a BrickStore .bsx file and return normalized items
   */
  parseBSXFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const xml = fs.readFileSync(filePath, 'utf-8');
    const doc = this.parser.parse(xml);
    
    // Handle root element naming (BrickStoreXML or BrickStockXML)
    const root = doc.BrickStoreXML || doc.BrickStockXML;
    if (!root) {
      throw new Error('Invalid BrickStore file: missing BrickStoreXML/BrickStockXML root');
    }

    const inventory = root.Inventory;
    if (!inventory) {
      throw new Error('Invalid BrickStore file: missing Inventory element');
    }

    const currency = inventory['@Currency'] || 'USD';
    const items = inventory.Item || [];

    return {
      currency,
      items: items.map(item => this._normalizeItem(item)),
      itemCount: items.length,
    };
  }

  /**
   * Normalize a BrickStore Item XML node to Hold-format object
   */
  _normalizeItem(item) {
    const itemTypeId = item.ItemTypeID || 'P';
    
    return {
      // Core identifiers — force to string (XML parser may convert "3701" → 3701.0)
      part_no: String(item.ItemID || ''),
      item_type: ITEM_TYPE_MAP[String(item.ItemTypeID)] || 'PART',
      color_id: item.ColorID ? parseInt(item.ColorID) : null,
      
      // Names
      part_name: item.ItemName || '',
      color_name: item.ColorName || '',
      category_id: item.CategoryID ? parseInt(item.CategoryID) : null,
      category_name: item.CategoryName || '',
      
      // Quantities & pricing
      quantity: item.Qty ? parseInt(item.Qty) : 0,
      unit_price_cents: item.Price ? Math.round(parseFloat(item.Price) * 100) : 0,
      cost_cents: item.Cost ? Math.round(parseFloat(item.Cost) * 100) : 0,
      bulk: item.Bulk ? parseInt(item.Bulk) : 1,
      sale_qty: item.Sale ? parseInt(item.Sale) : 0,
      
      // Tier pricing
      tier_qty_1: item.TQ1 ? parseInt(item.TQ1) : 0,
      tier_price_1_cents: item.TP1 ? Math.round(parseFloat(item.TP1) * 100) : 0,
      tier_qty_2: item.TQ2 ? parseInt(item.TQ2) : 0,
      tier_price_2_cents: item.TP2 ? Math.round(parseFloat(item.TP2) * 100) : 0,
      tier_qty_3: item.TQ3 ? parseInt(item.TQ3) : 0,
      tier_price_3_cents: item.TP3 ? Math.round(parseFloat(item.TP3) * 100) : 0,
      
      // Status & condition
      status: item.Status || 'I',
      status_label: STATUS_MAP[item.Status] || 'include',
      condition: CONDITION_MAP[item.Condition] || 'USED',
      condition_raw: item.Condition || 'U',
      sub_condition: item.SubCondition || null,
      
      // BrickLink integration
      lot_id: item.LotID ? parseInt(item.LotID) : null,
      retain: !!item.Retain,
      stockroom: item.Stockroom || null,
      reserved: item.Reserved || null,
      
      // Metadata
      comments: item.Comments || '',
      remarks: item.Remarks || '',
      total_weight: item.TotalWeight ? parseFloat(item.TotalWeight) : 0,
      marker_text: item.MarkerText || '',
      marker_color: item.MarkerColor || '',
      
      // Original values (for difference tracking)
      orig_qty: item.OrigQty ? parseInt(item.OrigQty) : 0,
      orig_price_cents: item.OrigPrice ? Math.round(parseFloat(item.OrigPrice) * 100) : 0,
    };
  }

  /**
   * Sync a BSX file's items into the Hold database.
   * Only items with Status 'I' (include) are synced.
   * Matched by (part_no, color_id, condition).
   */
  syncFromBSX(filePath, options = {}) {
    const { syncOnlyIncluded = true, marketplace = null } = options;
    const data = this.parseBSXFile(filePath);
    
    let synced = 0;
    let skipped = 0;
    let errors = [];

    const upsertItem = this.db.prepare(`
      INSERT INTO inventory (part_no, color_id, part_name, part_category, quantity, location, condition, unit_price_cents, purchase_price_cents, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(part_no, color_id, condition) DO UPDATE SET
        part_name = COALESCE(excluded.part_name, part_name),
        part_category = COALESCE(excluded.part_category, part_category),
        quantity = excluded.quantity,
        unit_price_cents = excluded.unit_price_cents,
        purchase_price_cents = COALESCE(excluded.purchase_price_cents, purchase_price_cents),
        notes = CASE WHEN excluded.notes IS NOT NULL AND excluded.notes != '' THEN excluded.notes ELSE notes END,
        updated_at = datetime('now')
      WHERE excluded.quantity > 0
    `);

    const upsertLot = this.db.prepare(`
      INSERT INTO marketplace_lots (inventory_id, marketplace, lot_id, quantity, unit_price_cents, condition, description, remarks, last_synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(marketplace, lot_id) DO UPDATE SET
        inventory_id = excluded.inventory_id,
        quantity = excluded.quantity,
        unit_price_cents = excluded.unit_price_cents,
        condition = excluded.condition,
        description = excluded.description,
        remarks = excluded.remarks,
        last_synced_at = datetime('now')
    `);

    const transaction = this.db.transaction(() => {
      for (const item of data.items) {
        try {
          // Skip excluded/extra items if syncOnlyIncluded
          if (syncOnlyIncluded && item.status !== 'I') {
            skipped++;
            continue;
          }

          // Build notes from comments + remarks + BrickStore status info
          const notesParts = [];
          if (item.comments) notesParts.push(item.comments);
          if (item.remarks) notesParts.push(`[${item.remarks}]`);
          const notes = notesParts.join(' ') || null;

          // Upsert inventory item
          upsertItem.run(
            item.part_no,
            item.color_id,
            item.part_name || null,
            item.category_name || null,
            item.quantity,
            item.stockroom || null,
            item.condition,
            item.unit_price_cents,
            item.cost_cents || null,
            notes
          );

          // If the item has a BL lot_id and marketplace is set, also upsert the lot
          if (item.lot_id && marketplace === 'bricklink') {
            // Get the inventory_id we just upserted
            const invRow = this.db.prepare(
              'SELECT id FROM inventory WHERE part_no = ? AND color_id = ? AND condition = ?'
            ).get(item.part_no, item.color_id, item.condition);
            
            if (invRow) {
              upsertLot.run(
                invRow.id,
                marketplace,
                String(item.lot_id),
                item.quantity,
                item.unit_price_cents,
                item.condition_raw === 'N' ? 'NEW' : 'USED',
                item.remarks || null,
                item.comments || null
              );
            }
          }

          synced++;
        } catch (err) {
          errors.push(`${item.part_no}: ${err.message}`);
        }
      }
    });

    transaction();

    return {
      file: path.basename(filePath),
      currency: data.currency,
      totalItems: data.itemCount,
      synced,
      skipped,
      errors,
    };
  }

  /**
   * Generate a sample .bsx file for testing
   */
  generateSampleBSX(outputPath) {
    const sample = `<?xml version="1.0" encoding="UTF-8"?>
<BrickStoreXML>
  <Inventory Currency="USD">
    <Item>
      <ItemID>3701</ItemID>
      <ItemTypeID>P</ItemTypeID>
      <ColorID>7</ColorID>
      <Qty>10</Qty>
      <Price>0.25</Price>
      <Condition>N</Condition>
      <Bulk>1</Bulk>
      <Comments>Test Technic brick</Comments>
      <Remarks>Synced from BrickStore</Remarks>
      <ItemName>Technic Brick 1x4</ItemName>
      <ColorName>Black</ColorName>
      <CategoryID>5</CategoryID>
      <CategoryName>Technic</CategoryName>
      <Cost>0.15</Cost>
      <TQ1>5</TQ1>
      <TP1>0.22</TP1>
      <TQ2>20</TQ2>
      <TP2>0.20</TP2>
    </Item>
    <Item>
      <ItemID>3001</ItemID>
      <ItemTypeID>P</ItemTypeID>
      <ColorID>1</ColorID>
      <Qty>50</Qty>
      <Price>0.12</Price>
      <Condition>N</Condition>
      <Bulk>10</Bulk>
      <Comments>Sample brick for testing</Comments>
      <ItemName>Brick 2x4</ItemName>
      <ColorName>White</ColorName>
      <CategoryID>1</CategoryID>
      <CategoryName>Brick</CategoryName>
    </Item>
  </Inventory>
</BrickStoreXML>`;

    fs.writeFileSync(outputPath, sample, 'utf-8');
    return outputPath;
  }
}
