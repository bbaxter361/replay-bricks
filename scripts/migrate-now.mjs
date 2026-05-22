// Run migration: reads hold.db and POSTs to deployed API
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(
  path.join(import.meta.dirname || '.', 'hold/server/hold.db'),
  { readonly: true }
);

const tables = ['inventory','orders','order_items','marketplace_lots','bl_colors',
  'api_credentials','pricing_rules','sync_log','price_cache','pending_items','sync_state','bl_items'];
const API = 'https://replaybrick.com/api/hold/seed';

for (const table of tables) {
  try {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    if (rows.length === 0) { console.log(`${table}: empty, skipped`); continue; }
    
    process.stdout.write(`${table}: ${rows.length} rows... `);
    const r = await fetch(API, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ table, rows })
    });
    const data = await r.json();
    console.log(data.ok ? `OK (${data.total} total)` : `FAIL: ${JSON.stringify(data)}`);
  } catch(e) {
    console.log(`ERROR: ${e.message}`);
  }
}
db.close();
console.log('\nDone!');
