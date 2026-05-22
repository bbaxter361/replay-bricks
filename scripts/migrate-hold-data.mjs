// Data migration script: hold.db (SQLite) → Netlify Blobs
// Reads all tables from the local SQLite database and writes them
// as JSON arrays to the Netlify Blobs 'hold-data' store.
//
// Usage: node migrate-data.js
// Requires: NETLIFY_SITE_ID, NETLIFY_BLOBS_TOKEN env vars (or running on Netlify)

import Database from 'better-sqlite3';
import { getStore } from '@netlify/blobs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'hold', 'server', 'hold.db');
const BLOB_PREFIX = 'hold_';

const TABLE_MAP = {
  inventory: true,
  orders: true,
  order_items: true,
  marketplace_lots: true,
  bl_colors: true,
  api_credentials: true,
  pricing_rules: true,
  sync_log: true,
  price_cache: true,
  pending_items: true,
  sync_state: true,
  bl_items: true,
};

async function main() {
  const store = getStore('hold-data');
  const db = new Database(DB_PATH, { readonly: true });

  console.log(`📦 Migrating data from ${DB_PATH} → Netlify Blobs (hold-data)`);

  let totalRows = 0;

  for (const table of Object.keys(TABLE_MAP)) {
    try {
      const rows = db.prepare(`SELECT * FROM ${table}`).all();
      const blobKey = `${BLOB_PREFIX}${table}`;

      // Verify this is a real table
      if (rows.length === 0) {
        console.log(`  ${table}: empty (skipping)`);
        continue;
      }

      await store.setJSON(blobKey, rows);
      console.log(`  ✅ ${table}: ${rows.length} rows → ${blobKey}`);
      totalRows += rows.length;
    } catch (err) {
      console.error(`  ❌ ${table}: ${err.message}`);
    }
  }

  // Special: copy the sync_log table but truncate to last 500 entries to keep blob size reasonable
  try {
    const syncLogs = db.prepare('SELECT * FROM sync_log ORDER BY id DESC LIMIT 500').all();
    if (syncLogs.length > 0) {
      await store.setJSON('hold_sync_log', syncLogs.reverse());
      const total = db.prepare('SELECT COUNT(*) as c FROM sync_log').get();
      console.log(`  ✅ sync_log: ${syncLogs.length}/${total.c} rows (truncated to 500)`);
    }
  } catch (err) {
    console.error(`  ❌ sync_log trim: ${err.message}`);
  }

  db.close();
  console.log(`\n🎉 Migration complete: ${totalRows} total rows written to blobs.`);

  // Verify
  console.log('\n🔍 Verifying...');
  for (const table of Object.keys(TABLE_MAP)) {
    try {
      const data = await store.get(`hold_${table}`, { type: 'json' });
      if (data) {
        console.log(`  ✅ hold_${table}: ${Array.isArray(data) ? data.length : '?'} entries`);
      } else {
        console.log(`  ⚠️  hold_${table}: not found`);
      }
    } catch (err) {
      console.log(`  ❌ hold_${table}: ${err.message}`);
    }
  }
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
