# Price Pipeline Integration Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task with Codex agents.

**Goal:** Wire live BrickLink pricing, BrickEconomy market data, and eBay sold prices into the existing Replay Bricks inventory system.

**Architecture:** The `hold` server already has a BrickLink OAuth client (`bricklink.js`), a `price_cache` table, and a partial batch refresh endpoint. We extend `index.js` with completed price refresh endpoints, add a Python bridge for the BrickEconomy scraper, build a price dashboard in the frontend, and set up cron-driven automated refreshes.

**Tech Stack:** Node.js (Express), SQLite (better-sqlite3), Python (for BrickEconomy scraping), React (hold frontend)

---

### Task 1: Complete the batch price refresh endpoint

**Objective:** Finish the `/api/inventory/refresh-prices` route that iterates all inventory items and fetches BrickLink price guides.

**Files:**
- Modify: `hold/server/src/index.js:292-299`

**Step 1: Read the current state of the endpoint**

The route starts at line 292 but is incomplete. Read lines 292-330 to see where it cut off.

Run:
```bash
cat -n /home/bbaxter/workspace/replay-bricks/hold/server/src/index.js | sed -n '292,330p'
```

**Step 2: Write the complete implementation**

Replace lines 292-299 and any partial code up to the next route/comment with:

```javascript
app.post('/api/inventory/refresh-prices', async (req, res) => {
  if (!sync.isConfigured('bricklink')) {
    return res.status(400).json({ error: 'BrickLink not configured' });
  }

  const { condition, limit } = req.query;
  let query = 'SELECT DISTINCT part_no, color_id, condition FROM inventory WHERE 1=1';
  const params = [];

  if (condition) {
    query += ' AND condition = ?';
    params.push(condition);
  }
  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit));
  }

  const items = db.prepare(query).all(...params);
  const results = { total: items.length, success: 0, skipped: 0, errors: 0, details: [] };
  const BATCH_DELAY = 1000; // 1s between API calls (BrickLink rate limit: ~5/sec)

  for (const item of items) {
    try {
      // Skip if cached within last hour
      const cached = db.prepare(`
        SELECT cached_at FROM price_cache
        WHERE part_no = ? AND source = 'bricklink' AND condition = ?
        ORDER BY cached_at DESC LIMIT 1
      `).get(item.part_no, item.condition || 'USED');

      if (cached) {
        const age = (Date.now() - new Date(cached.cached_at + 'Z').getTime()) / 1000 / 60;
        if (age < 60) {
          results.skipped++;
          continue;
        }
      }

      const partType = /-\d+$/.test(item.part_no) ? 'SET' : 'PART';
      const barePart = item.part_no.replace(/-\d+$/, '');
      const priceData = await sync.blClient.getItemPriceGuide(
        partType, barePart, item.color_id || null,
        item.condition ? { guide_type: item.condition.toLowerCase() === 'new' ? 'sold' : 'sold' } : {}
      );

      if (priceData) {
        db.prepare(`
          INSERT INTO price_cache (part_no, color_id, source, avg_price_cents, min_price_cents, max_price_cents, qty_available, currency, condition, raw_data, cached_at)
          VALUES (?, ?, 'bricklink', ?, ?, ?, ?, 'USD', ?, ?, datetime('now'))
          ON CONFLICT(part_no, color_id, source, condition) DO UPDATE SET
            avg_price_cents = excluded.avg_price_cents,
            min_price_cents = excluded.min_price_cents,
            max_price_cents = excluded.max_price_cents,
            qty_available = excluded.qty_available,
            raw_data = excluded.raw_data,
            cached_at = datetime('now')
        `).run(
          item.part_no, item.color_id,
          priceData.avg_price ? Math.round(parseFloat(priceData.avg_price) * 100) : null,
          priceData.min_price ? Math.round(parseFloat(priceData.min_price) * 100) : null,
          priceData.max_price ? Math.round(parseFloat(priceData.max_price) * 100) : null,
          priceData.quantity_available || null,
          item.condition || 'USED',
          JSON.stringify(priceData)
        );

        results.details.push({
          part_no: item.part_no,
          avg: priceData.avg_price,
          min: priceData.min_price,
          max: priceData.max_price,
          qty: priceData.quantity_available,
        });
        results.success++;
      }

      // Rate limit
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    } catch (err) {
      results.errors++;
      results.details.push({ part_no: item.part_no, error: err.message });
    }
  }

  res.json(results);
});
```

**Step 3: Restart server and test with a single item**

```bash
# Restart
cd /home/bbaxter/workspace/replay-bricks/hold/server && node src/index.js &
sleep 2

# Test with limit=1
curl -s -X POST 'http://localhost:3002/api/inventory/refresh-prices?limit=1&condition=USED' | python3 -m json.tool
```

Expected: JSON response with `total: 1, success: 1` and a `details` array containing the fetched price.

**Step 4: Verify the price_cache table was populated**

```bash
curl -s 'http://localhost:3002/api/inventory/1/prices' | python3 -m json.tool
```

Expected: Returns the cached price from the DB.

**Step 5: Commit**

```bash
cd /home/bbaxter/workspace/replay-bricks
git add hold/server/src/index.js
git commit -m "feat: complete batch price refresh endpoint for BrickLink"
```

---

### Task 2: Add `GET /api/prices/summary` endpoint

**Objective:** Build a summary endpoint that returns price data for the frontend dashboard.

**Files:**
- Modify: `hold/server/src/index.js` (add after price routes)

**Step 1: Write the endpoint**

Add this route after the `/api/inventory/refresh-prices` handler:

```javascript
// ========== PRICE DASHBOARD ==========

app.get('/api/prices/summary', (req, res) => {
  // Get latest price for each inventory item from cache
  const prices = db.prepare(`
    SELECT i.id, i.part_no, i.part_name, i.color_id, i.condition, i.quantity, i.unit_price_cents,
           c.color_name,
           pc.source, pc.avg_price_cents, pc.min_price_cents, pc.max_price_cents,
           pc.qty_available, pc.cached_at
    FROM inventory i
    LEFT JOIN bl_colors c ON i.color_id = c.color_id
    LEFT JOIN price_cache pc ON pc.part_no = i.part_no
      AND (pc.color_id = i.color_id OR (pc.color_id IS NULL AND i.color_id IS NULL))
      AND pc.condition = i.condition
    WHERE pc.id IN (
      SELECT MAX(id) FROM price_cache
      WHERE part_no = i.part_no AND condition = i.condition
      GROUP BY part_no, condition
    )
    ORDER BY i.updated_at DESC
  `).all();

  // Compute price deltas (current price vs our listed price)
  const withDeltas = prices.map(p => {
    const ourPrice = p.unit_price_cents || 0;
    const marketAvg = p.avg_price_cents || 0;
    const delta = ourPrice && marketAvg ? ((ourPrice - marketAvg) / marketAvg * 100) : null;

    return {
      ...p,
      our_price_dollars: ourPrice ? (ourPrice / 100).toFixed(2) : null,
      market_avg_dollars: marketAvg ? (marketAvg / 100).toFixed(2) : null,
      market_min_dollars: p.min_price_cents ? (p.min_price_cents / 100).toFixed(2) : null,
      market_max_dollars: p.max_price_cents ? (p.max_price_cents / 100).toFixed(2) : null,
      delta_percent: delta ? delta.toFixed(1) : null,
      alert: delta && delta > 20 ? 'overpriced' : (delta && delta < -20 ? 'underpriced' : 'ok'),
    };
  });

  res.json(withDeltas);
});
```

**Step 2: Test**

```bash
curl -s 'http://localhost:3002/api/prices/summary' | python3 -m json.tool | head -40
```

**Step 3: Commit**

```bash
cd /home/bbaxter/workspace/replay-bricks
git add hold/server/src/index.js
git commit -m "feat: add GET /api/prices/summary with market price deltas"
```

---

### Task 3: Price cache staleness endpoint

**Objective:** Add an endpoint that reports cache freshness so the UI can show when prices are stale.

**Files:**
- Modify: `hold/server/src/index.js`

**Step 1: Add the freshness endpoint**

```javascript
app.get('/api/prices/freshness', (req, res) => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_cached,
      COUNT(CASE WHEN (julianday('now') - julianday(cached_at)) * 24 < 1 THEN 1 END) as fresh_1h,
      COUNT(CASE WHEN (julianday('now') - julianday(cached_at)) * 24 < 24 THEN 1 END) as fresh_24h,
      COUNT(CASE WHEN (julianday('now') - julianday(cached_at)) * 24 >= 24 THEN 1 END) as stale,
      MAX(cached_at) as newest_cache,
      MIN(cached_at) as oldest_cache
    FROM price_cache
  `).get();

  res.json(stats);
});
```

**Step 2: Commit**

```bash
cd /home/bbaxter/workspace/replay-bricks
git add hold/server/src/index.js
git commit -m "feat: add price cache freshness endpoint"
```

---

### Task 4: Frontend price dashboard component

**Objective:** Build a React component in the `hold` frontend that displays the price summary.

**Files:**
- Create: `hold/src/components/PriceDashboard.jsx`
- Create: `hold/src/components/PriceDashboard.css`

**Step 1: Create the component**

Write `hold/src/components/PriceDashboard.jsx`:

```jsx
import { useState, useEffect } from 'react';
import './PriceDashboard.css';

const API = 'http://localhost:3002';

export default function PriceDashboard() {
  const [prices, setPrices] = useState([]);
  const [freshness, setFreshness] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPrices();
    fetchFreshness();
  }, []);

  async function fetchPrices() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/prices/summary`);
      const data = await res.json();
      setPrices(data);
    } catch (err) {
      console.error('Failed to fetch prices:', err);
    }
    setLoading(false);
  }

  async function fetchFreshness() {
    try {
      const res = await fetch(`${API}/api/prices/freshness`);
      const data = await res.json();
      setFreshness(data);
    } catch (err) {
      console.error('Failed to fetch freshness:', err);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch(`${API}/api/inventory/refresh-prices?condition=USED`, { method: 'POST' });
      const data = await res.json();
      alert(`Refreshed ${data.success} items (${data.errors} errors, ${data.skipped} skipped)`);
      fetchPrices();
      fetchFreshness();
    } catch (err) {
      alert('Refresh failed: ' + err.message);
    }
    setRefreshing(false);
  }

  return (
    <div className="price-dashboard">
      <div className="price-header">
        <h2>Market Prices</h2>
        <div className="price-actions">
          {freshness && (
            <span className="freshness-badge">
              {freshness.fresh_1h} fresh / {freshness.total_cached} cached
            </span>
          )}
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh All Prices'}
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading prices...</p>
      ) : (
        <table className="price-table">
          <thead>
            <tr>
              <th>Part</th>
              <th>Name</th>
              <th>Condition</th>
              <th>Our Price</th>
              <th>Market Avg</th>
              <th>Min</th>
              <th>Max</th>
              <th>Delta</th>
              <th>Qty Avail</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((p, i) => (
              <tr key={i} className={`alert-${p.alert || 'ok'}`}>
                <td>{p.part_no}</td>
                <td>{p.part_name}</td>
                <td>{p.condition}</td>
                <td>${p.our_price_dollars || '-'}</td>
                <td>${p.market_avg_dollars || '-'}</td>
                <td>${p.market_min_dollars || '-'}</td>
                <td>${p.market_max_dollars || '-'}</td>
                <td className={`delta ${p.delta_percent > 0 ? 'above' : 'below'}`}>
                  {p.delta_percent ? `${p.delta_percent}%` : '-'}
                </td>
                <td>{p.qty_available || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

**Step 2: Create styles**

Write `hold/src/components/PriceDashboard.css`:

```css
.price-dashboard { padding: 20px; }
.price-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.price-header h2 { margin: 0; }
.price-actions { display: flex; align-items: center; gap: 12px; }
.freshness-badge { font-size: 0.8rem; color: #666; background: #f0f0f0; padding: 3px 10px; border-radius: 10px; }
.refresh-btn { padding: 8px 16px; background: #0055BF; color: white; border: none; border-radius: 4px; cursor: pointer; }
.refresh-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.price-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.price-table th, .price-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; }
.price-table th { background: #f5f5f5; font-weight: 600; }
.alert-overpriced { background: #fff3f3; }
.alert-underpriced { background: #f3fff3; }
.delta.above { color: #c91a09; font-weight: 600; }
.delta.below { color: #00852b; font-weight: 600; }
```

**Step 3: Wire into the app**

Add an import and route in `hold/src/App.jsx` (or wherever the main app routes are defined):

```jsx
import PriceDashboard from './components/PriceDashboard';
```

And add a link/nav item for it.

**Step 4: Commit**

```bash
cd /home/bbaxter/workspace/replay-bricks
git add hold/src/components/PriceDashboard.jsx hold/src/components/PriceDashboard.css
git commit -m "feat: add price dashboard component"
```

---

### Task 5: Automated hourly price refresh cron

**Objective:** Set up a Hermes cron job that calls the refresh-prices endpoint hourly to keep the cache fresh.

**Files:**
- Create: `scripts/refresh-prices.sh`
- Create: Hermes cron job

**Step 1: Create the refresh script**

Write `scripts/refresh-prices.sh`:

```bash
#!/bin/bash
# Refresh BrickLink prices for all inventory items
# Called by Hermes cron job every hour

API_URL="${HOLD_API_URL:-http://localhost:3002}"
MAX_ITEMS="${PRICE_REFRESH_BATCH:-25}"

response=$(curl -s -X POST "${API_URL}/api/inventory/refresh-prices?limit=${MAX_ITEMS}" 2>&1)

if echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK')" 2>/dev/null; then
  success=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success',0))")
  errors=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('errors',0))")
  echo "[REFRESH] $success refreshed, $errors errors"
else
  echo "[ERROR] Price refresh failed: $response"
fi
```

Make executable:
```bash
chmod +x /home/bbaxter/workspace/replay-bricks/scripts/refresh-prices.sh
```

**Step 2: Create the cron job**

Use Hermes cron to schedule hourly price refreshes:

```bash
hermes cron create \
  --name "Replay Bricks Price Refresh" \
  --schedule "0 */1 * * *" \
  --script "scripts/refresh-prices.sh" \
  --no-agent \
  --deliver local
```

**Step 3: Test manually**

```bash
cd /home/bbaxter/workspace/replay-bricks
bash scripts/refresh-prices.sh
```

Expected: Output showing number of items refreshed.

**Step 4: Commit**

```bash
cd /home/bbaxter/workspace/replay-bricks
git add scripts/refresh-prices.sh
git commit -m "feat: add automated hourly price refresh script"
```

---

### Task 6: Python bridge for BrickEconomy scraper

**Objective:** Wire the existing `brickeconomy_scraper.py` into the hold server so BrickEconomy price data flows into price_cache.

**Files:**
- Modify: `hold/server/src/brickeconomy_scraper.py` (add CLI mode)
- Create: `hold/server/src/brickeconomy_bridge.js`

**Step 1: Update the scraper to accept CLI args**

Add a `__main__` block to `brickeconomy_scraper.py`:

```python
if __name__ == '__main__':
    import sys, json

    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python brickeconomy_scraper.py <set_number>"}))
        sys.exit(1)

    set_number = sys.argv[1]
    result = scrape_set_pricing(set_number)  # assumes this function exists
    print(json.dumps(result))
```

**Step 2: Create the Node.js bridge**

Write `hold/server/src/brickeconomy_bridge.js`:

```javascript
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRAPER_PATH = path.join(__dirname, 'brickeconomy_scraper.py');

export async function fetchBrickEconomyPrice(setNumber) {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [SCRAPER_PATH, setNumber], { timeout: 30000 });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Scraper exited ${code}: ${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (err) {
        reject(new Error(`Invalid JSON: ${stdout.slice(0, 200)}`));
      }
    });
  });
}
```

**Step 3: Wire into index.js**

Add to `index.js` imports:
```javascript
import { fetchBrickEconomyPrice } from './brickeconomy_bridge.js';
```

Add a BrickEconomy-specific price route:
```javascript
app.get('/api/inventory/:id/brickeconomy', async (req, res) => {
  const item = db.prepare('SELECT part_no FROM inventory WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  try {
    const data = await fetchBrickEconomyPrice(item.part_no);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Step 4: Commit**

```bash
cd /home/bbaxter/workspace/replay-bricks
git add hold/server/src/brickeconomy_bridge.js hold/server/src/index.js
git commit -m "feat: wire BrickEconomy scraper into price pipeline"
```

---

### Task 7: BrickStore file upload endpoint

**Objective:** Add a file upload route so .bsx files can be uploaded directly via HTTP instead of needing a local file path.

**Files:**
- Modify: `hold/server/src/index.js`

**Step 1: Add multer dependency and upload route**

Install multer:
```bash
cd /home/bbaxter/workspace/replay-bricks/hold/server && npm install multer
```

Add to index.js:
```javascript
import multer from 'multer';
const upload = multer({ dest: '/tmp/bsx-uploads/' });

app.post('/api/brickstore/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const result = bsSync.syncFromBSX(req.file.path, { marketplace: req.body.marketplace || null });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Step 2: Commit:**
```bash
cd /home/bbaxter/workspace/replay-bricks
git add hold/server/src/index.js hold/server/package.json
git commit -m "feat: add BrickStore .bsx file upload endpoint"
```

---

### Task 8: CSV export endpoint

**Objective:** Add `GET /api/inventory/export/csv` so Brian can download his inventory as a CSV file.

**Files:**
- Modify: `hold/server/src/index.js`

**Step 1: Add CSV export route**

```javascript
// ========== CSV EXPORT ==========

app.get('/api/inventory/export/csv', (req, res) => {
  const items = db.prepare(`
    SELECT i.part_no, i.part_name, c.color_name, c.color_id,
           i.condition, i.quantity, i.unit_price_cents, i.location,
           i.purchase_price_cents, i.notes,
           pc.avg_price_cents as market_avg_cents,
           pc.min_price_cents as market_min_cents,
           pc.max_price_cents as market_max_cents
    FROM inventory i
    LEFT JOIN bl_colors c ON i.color_id = c.color_id
    LEFT JOIN price_cache pc ON pc.part_no = i.part_no
      AND (pc.color_id = i.color_id OR (pc.color_id IS NULL AND i.color_id IS NULL))
      AND pc.condition = i.condition
      AND pc.id IN (SELECT MAX(id) FROM price_cache WHERE part_no = i.part_no GROUP BY part_no, condition)
    ORDER BY i.part_no
  `).all();

  // Build CSV
  const headers = ['part_no', 'part_name', 'color_name', 'color_id', 'condition',
                   'quantity', 'our_price', 'purchase_price', 'market_avg',
                   'market_min', 'market_max', 'location', 'notes'];
  const rows = items.map(i => [
    i.part_no, `"${(i.part_name || '').replace(/"/g, '""')}"`,
    i.color_name || '', i.color_id || '', i.condition,
    i.quantity,
    i.unit_price_cents ? (i.unit_price_cents / 100).toFixed(2) : '',
    i.purchase_price_cents ? (i.purchase_price_cents / 100).toFixed(2) : '',
    i.market_avg_cents ? (i.market_avg_cents / 100).toFixed(2) : '',
    i.market_min_cents ? (i.market_min_cents / 100).toFixed(2) : '',
    i.market_max_cents ? (i.market_max_cents / 100).toFixed(2) : '',
    `"${(i.location || '').replace(/"/g, '""')}"`,
    `"${(i.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="replaybricks-inventory.csv"');
  res.send(csv);
});
```

**Step 2: Test**

```bash
curl -s 'http://localhost:3002/api/inventory/export/csv' | head -10
```

**Step 3: Commit:**
```bash
cd /home/bbaxter/workspace/replay-bricks
git add hold/server/src/index.js
git commit -m "feat: add CSV export endpoint for inventory"
```

---

## BrickStore Upload (Already Done ✓)

The existing `POST /api/brickstore/sync` (takes filePath) and `POST /api/brickstore/preview` (parse-only) routes are already built. Task 7 adds a direct file upload variant for convenience. The `brickstore.js` parser handles all .bsx XML formats (BrickStoreXML and BrickStockXML).

---

## Execution Order

1. Task 1 → Complete batch refresh (core foundation)
2. Task 2 → Price summary endpoint (API for dashboard)
3. Task 3 → Freshness endpoint (UI health indicator)
4. Task 4 → Frontend dashboard (user-facing)
5. Task 5 → Cron automation (keeps cache fresh)
6. Task 6 → BrickEconomy bridge (secondary data source)
7. Task 7 → BrickStore file upload endpoint
8. Task 8 → CSV export endpoint

---

## Verification Checklist

- [ ] `POST /api/inventory/refresh-prices` works with `?limit=1` and `?condition=USED`
- [ ] `GET /api/prices/summary` returns price deltas
- [ ] `GET /api/prices/freshness` shows cache age stats
- [ ] Price dashboard renders in hold frontend with refresh button
- [ ] Cron job fires hourly and produces logs
- [ ] BrickEconomy scraper returns data for known set numbers
