/**
 * Populates part_image_url for all inventory items using BrickLink's image CDN.
 * 
 * URL pattern: https://img.bricklink.com/{type}/{colorId}/{partNo}.jpg
 *   P = Part, S = Set, M = Minifig
 *   colorId = BrickLink color ID (0 = default/generic)
 */

import { getDb } from './src/db.js';

const db = getDb();

// Determine BL item type from part_no
function guessType(partNo) {
  if (partNo.includes('-')) return 'S';  // "75373-1" = set
  // Minifigs: 6+ digit numeric, or patterns like sw0001, min001
  if (/^[a-z]{2,4}\d{3,}$/i.test(partNo)) return 'M';
  if (/^\d{5,}$/.test(partNo)) return 'M';  // 6-digit = minifig/catalog item
  return 'P';  // default to part
}

// Map to BrickLink image prefix
const IMG_PREFIX = { P: 'P', S: 'S', M: 'M' };

const parts = db.prepare('SELECT DISTINCT part_no FROM inventory').all();
console.log(`Processing ${parts.length} unique parts...`);

let done = 0;
for (const p of parts) {
  const type = guessType(p.part_no);
  const prefix = IMG_PREFIX[type] || 'P';
  
  // Store both: generic image URL (color 0) and the prefix for color-specific
  // The generic/fallback image: https://img.bricklink.com/{prefix}/0/{partNo}.jpg
  // We also update the part_image_url to the generic one for fallback use
  const imageUrl = `//img.bricklink.com/${prefix}/0/${p.part_no}.jpg`;
  
  db.prepare(`
    UPDATE inventory SET 
      part_image_url = ?,
      updated_at = datetime('now')
    WHERE part_no = ?
  `).run(imageUrl, p.part_no);
  
  done++;
}

const withImages = db.prepare('SELECT COUNT(DISTINCT part_no) as cnt FROM inventory WHERE part_image_url IS NOT NULL').get();
console.log(`Done: ${done} parts updated, ${withImages.cnt} have images`);
