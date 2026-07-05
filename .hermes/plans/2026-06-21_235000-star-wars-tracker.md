# Star Wars Tracker — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task. Design agent → Coding agent → Review → Integration.

**Goal:** Add a Star Wars Vintage Kenner Figure Tracker to the replaybrick.com portal — a complete catalog of all 96 vintage Kenner figures with their accessories, live eBay/DVT pricing, deal detection, and Kenner-style package design.

**Architecture:** New child app `starwars-tracker/` in the replay-bricks monorepo (React + Vite + Tailwind v4), embedded via iframe in the portal. Express API (`starwars-api/`) with Scrapling-based eBay/DVT price fetching, SQLite database for figure catalog and price history. Cron job keeps prices fresh.

**Tech Stack:** React 19, Vite 8, Tailwind CSS v4, React Router v7, Express 5, SQLite (better-sqlite3), Scrapling (StealthyFetcher), Framer Motion

---

## Task 0: Project Scaffold

**Objective:** Create the starwars-tracker app and starwars-api directories with working dev servers.

**Files:**
- Create: `starwars-tracker/package.json`
- Create: `starwars-tracker/vite.config.js`
- Create: `starwars-tracker/index.html`
- Create: `starwars-tracker/src/main.jsx`
- Create: `starwars-tracker/src/App.jsx`
- Create: `starwars-tracker/src/index.css`
- Create: `starwars-api/package.json`
- Create: `starwars-api/src/index.js`
- Create: `starwars-api/src/db.js`

**Step 1: Scaffold tracker frontend**

```bash
cd /home/bbaxter/workspace/replay-bricks
mkdir -p starwars-tracker/src starwars-tracker/public starwars-api/src
```

**Step 2: Create starwars-tracker/package.json**
```json
{
  "name": "starwars-tracker",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 5176 --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.2.4",
    "framer-motion": "^12.38.0",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-router-dom": "^7.14.2",
    "tailwindcss": "^4.2.4"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^6.0.1",
    "vite": "^8.0.10"
  }
}
```

**Step 3: Create vite.config.js**
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5176,
    proxy: {
      '/api': { target: 'http://localhost:3003', changeOrigin: true }
    }
  },
  build: { outDir: 'dist' }
});
```

**Step 4: Create index.html** — standard Vite HTML entry with `<div id="root">`

**Step 5: Create src/main.jsx** — imports App, renders to root

**Step 6: Create src/App.jsx** — bare BrowserRouter with a placeholder "Star Wars Tracker" heading

**Step 7: Create src/index.css** — Tailwind imports + Kenner font imports (use Google Fonts: Bebas Neue for headers, Inter for body)

**Step 8: Create starwars-api/package.json**
```json
{
  "name": "starwars-api",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node src/index.js",
    "seed": "node src/seed.js"
  },
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "cors": "^2.8.5",
    "express": "^5.2.1"
  }
}
```

**Step 9: Create starwars-api/src/index.js** — minimal Express server on port 3003 with CORS, health endpoint, figure list endpoint (stub)

**Step 10: Create starwars-api/src/db.js** — SQLite database setup with tables for figures, accessories, prices

**Verification:**
```bash
cd starwars-tracker && npm install && npm run dev &
cd starwars-api && npm install && npm run dev &
curl http://localhost:5176  # should return HTML
curl http://localhost:3003/api/health  # should return {"status":"ok"}
```

---

## Task 1: Figure Catalog — Database + Seed Data

**Objective:** Create the complete SQLite database of all 96 vintage Kenner Star Wars figures with their accessories, and expose via API endpoint.

**Files:**
- Create: `starwars-api/src/seed.js`
- Modify: `starwars-api/src/db.js`
- Modify: `starwars-api/src/index.js`

**Step 1: Define schema in db.js**

```javascript
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '..', 'starwars.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS figures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      year INTEGER NOT NULL,
      film TEXT NOT NULL,       -- 'ANH','ESB','ROTJ','POTF'
      card_back TEXT,           -- '12 Back-A','20 Back-G', etc.
      variant TEXT,             -- 'Small Head','Vinyl Cape', etc.
      coo TEXT,                 -- Country of origin
      image_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accessories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      figure_id INTEGER NOT NULL REFERENCES figures(id),
      name TEXT NOT NULL,
      color TEXT,
      quantity INTEGER DEFAULT 1,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      figure_id INTEGER NOT NULL REFERENCES figures(id),
      source TEXT NOT NULL,       -- 'ebay','dvt','hakes'
      price REAL NOT NULL,
      condition TEXT,             -- 'loose_complete','moc','loose_incomplete'
      url TEXT,
      title TEXT,
      recorded_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_prices_figure ON prices(figure_id);
    CREATE INDEX IF NOT EXISTS idx_prices_source ON prices(source);
    CREATE INDEX IF NOT EXISTS idx_prices_recorded ON prices(recorded_at);
  `);
}
```

**Step 2: Create seed.js with ALL 96 figures**

Include every figure from the ANH (first 12 + wave 2), ESB, ROTJ, and POTF lines with their correct accessories. Use the data we researched:

```javascript
const figures = [
  // ANH — First 12 (1978)
  { name: 'Luke Skywalker', film: 'ANH', card_back: '12 Back', variant: 'Farmboy', accessories: [
    { name: 'Lightsaber', color: 'Yellow', notes: 'Double-telescoping or single' },
  ]},
  { name: 'Ben (Obi-Wan) Kenobi', film: 'ANH', card_back: '12 Back', variant: 'Gray Hair', accessories: [
    { name: 'Lightsaber', color: 'Blue' },
    { name: 'Cape', color: 'Brown', notes: 'Vinyl' },
  ]},
  // ... all 96 figures with accessories
];
```

**Step 3: Add API endpoints to index.js**

```
GET /api/figures          — list all figures with accessories
GET /api/figures/:id      — single figure with price history
GET /api/prices/:figureId — price history for a figure
```

**Verification:**
```bash
cd starwars-api && npm run seed
sqlite3 starwars.db "SELECT COUNT(*) FROM figures;"  # → 96
sqlite3 starwars.db "SELECT COUNT(*) FROM accessories;"  # → ~120+
curl http://localhost:3003/api/figures | python3 -c "import json,sys; print(len(json.load(sys.stdin)))"  # → 96
```

---

## Task 2: eBay + DVT Price Scraper

**Objective:** Build the Scrapling-based scraper that fetches current prices from eBay and DVT for each figure. Expose via API endpoint and store in price history.

**Files:**
- Create: `starwars-api/src/scraper.js`
- Create: `starwars-api/src/scrape-ebay.js`
- Create: `starwars-api/src/scrape-dvt.js`
- Modify: `starwars-api/src/index.js`

**Step 1: Create eBay scraper (scrape-ebay.js)**

Uses `/tmp/scrapling-env/bin/python3` via child_process. Single figure search:

```javascript
import { spawn } from 'child_process';

export function scrapeEbay(figureName, variant = '') {
  return new Promise((resolve, reject) => {
    const query = `vintage kenner star wars ${figureName} ${variant} complete -potf2 -modern -retro -custom -repro`;
    const pythonCode = `
from scrapling.fetchers import StealthyFetcher
import re
page = StealthyFetcher.fetch('https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_BIN=1&_sop=15')
body = page.body.decode('utf-8','replace')
text = re.sub(r'<[^>]+>',' ',body)
text = re.sub(r'\\s+',' ',text)
matches = re.findall(r'(Star\\s+Wars[^$]{20,150}?\\$[\\d,]+\\.\\d{2})', text, re.IGNORECASE)
results = []
for m in matches[:10]:
    pm = re.search(r'\\$([\\d,]+\\.\\d{2})', m)
    if pm:
        results.append({'title': m.strip()[:150], 'price': float(pm.group(1).replace(',',''))})
import json
print(json.dumps(results))
`;
    const proc = spawn('/tmp/scrapling-env/bin/python3', ['-c', pythonCode]);
    let stdout = '';
    proc.stdout.on('data', d => stdout += d);
    proc.on('close', code => {
      try { resolve(JSON.parse(stdout)); }
      catch(e) { reject(e); }
    });
  });
}
```

**Step 2: Create DVT scraper (scrape-dvt.js)**

Scrapes the DVT complete figures and AFA pages, matches against known figure names:

```javascript
export async function scrapeDVT() {
  // Fetch vintagestarwarscompletefigures.aspx and starwarsafaloose.aspx
  // Parse product names + prices
  // Match against our figure database
  // Return array of {figure_id, name, price, url}
}
```

**Step 3: Create orchestrator (scraper.js)**

```javascript
import { getDb } from './db.js';
import { scrapeEbay } from './scrape-ebay.js';
import { scrapeDVT } from './scrape-dvt.js';

export async function refreshPrices(figureIds = null) {
  const db = getDb();
  const figures = figureIds
    ? db.prepare('SELECT * FROM figures WHERE id IN (?)').all(figureIds)
    : db.prepare('SELECT * FROM figures').all();
  
  const insert = db.prepare(
    'INSERT INTO prices (figure_id, source, price, condition, url, title) VALUES (?,?,?,?,?,?)'
  );
  
  for (const fig of figures) {
    // eBay
    const ebayResults = await scrapeEbay(fig.name, fig.variant);
    for (const r of ebayResults.slice(0, 5)) {
      insert.run(fig.id, 'ebay', r.price, 'loose_complete', r.url, r.title);
    }
    
    // DVT (only refresh every 6h to be polite)
    // ...match against DVT catalog
  }
}
```

**Step 4: Add API endpoints**

```
POST /api/refresh          — trigger price refresh for all figures
POST /api/refresh/:id      — refresh single figure
GET  /api/prices/summary   — latest price per figure per source
```

**Verification:**
```bash
curl -X POST http://localhost:3003/api/refresh/1  # refresh Luke Farmboy
curl http://localhost:3003/api/prices/1 | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d))"  # should have results
```

---

## Task 3: Frontend — Figure Catalog Page (Kenner Design)

**Objective:** Build the main figure catalog page with Kenner-style package design — black starfield background, yellow/white cardback aesthetic, figure grid with prices from the API.

**Files:**
- Modify: `starwars-tracker/src/App.jsx`
- Create: `starwars-tracker/src/pages/CatalogPage.jsx`
- Create: `starwars-tracker/src/components/FigureCard.jsx`
- Create: `starwars-tracker/src/components/PriceBadge.jsx`
- Create: `starwars-tracker/src/components/KennerHeader.jsx`

**Design spec (Kenner package aesthetic):**
- Background: Deep black with subtle starfield (#0a0a14)
- Card borders: Kenner yellow (#FFD700) and silver (#C0C0C0)
- Typography: Bebas Neue for headers (matches Kenner cardback font), Inter for body
- Card back pattern: Use diagonal stripe accent (kenner cardback homage)
- Price badges: Red/yellow Kenner price sticker style
- Logo area: Black bar with yellow text, like the vintage "STAR WARS" logo treatment

**Step 1: KennerHeader component** — black bar with "STAR WARS" in yellow Impact/Bebas Neue, subtitle "VINTAGE KENNER FIGURE TRACKER"

**Step 2: FigureCard component** — displays:
- Figure name (big, bold)
- Film badge (ANH/ESB/ROTJ/POTF color-coded)
- Card back info
- Accessories list (small text)
- Latest eBay price (from API)
- DVT price if available (from API)
- Deal indicator (green if below average)

**Step 3: PriceBadge component** — Kenner price sticker style: colored circle with price inside, source label

**Step 4: CatalogPage** — fetches `/api/figures` and `/api/prices/summary`, renders grid of FigureCards. Filter bar at top: by film, by card back, sort by price/name.

**Step 5: Wire up App.jsx** with BrowserRouter routes:
- `/` → CatalogPage
- `/figure/:id` → FigureDetailPage (Task 5)

**Verification:**
```bash
cd starwars-tracker && npm run dev
# Open http://localhost:5176 — should see figure grid with Kenner styling
# Verify API data loads from localhost:3003
```

---

## Task 4: Frontend — Deal Dashboard & Price History

**Objective:** Build the deal dashboard that shows underpriced figures and price trend charts.

**Files:**
- Create: `starwars-tracker/src/pages/DealsPage.jsx`
- Create: `starwars-tracker/src/components/DealCard.jsx`
- Create: `starwars-tracker/src/components/MiniPriceChart.jsx`

**Step 1: DealsPage** — highlights figures where:
- Current eBay low price is below 30-day average
- DVT has it in stock cheaper than eBay
- No DVT stock — buy from eBay flag
- Big price drops in last 7 days

**Step 2: DealCard** — shows figure, current price, avg price, price delta, source links

**Step 3: MiniPriceChart** — simple SVG sparkline of last 10 prices for a figure. Inline, small, no axis labels needed.

**Step 4: Add route** — `/deals` → DealsPage

**Verification:**
```bash
# After at least 2 price refresh cycles:
curl http://localhost:3003/api/prices/summary | python3 -c "import json,sys; print(len(json.load(sys.stdin)))"
# Should show deals on /deals page
```

---

## Task 5: Frontend — Figure Detail Page

**Objective:** Individual figure detail page with full price history, all accessories, recent eBay listings, and buy links.

**Files:**
- Create: `starwars-tracker/src/pages/FigureDetailPage.jsx`
- Create: `starwars-tracker/src/components/PriceHistoryChart.jsx`
- Create: `starwars-tracker/src/components/EbayListings.jsx`

**Step 1: FigureDetailPage** — shows:
- Large figure name + variant
- Film badge + card back info
- Complete accessories list with colors
- Price history chart (interactive-ish)
- Recent eBay listings with prices and links
- DVT listing if available
- Avg price over time

**Step 2: PriceHistoryChart** — using a simple canvas/SVG line chart. X-axis = date, Y-axis = price. Color-coded by source (green = eBay, blue = DVT).

**Step 3: EbayListings** — scrollable list of recent eBay finds with prices, condition notes, and "View on eBay" links.

**Verification:**
```bash
curl http://localhost:5176/figure/1  # Luke Farmboy detail page
```

---

## Task 6: Netlify API Endpoint for Price Refresh

**Objective:** Create a Netlify serverless function that triggers price refresh so the cron job can hit it.

**Files:**
- Create: `website/netlify/functions/starwars-refresh.js`
- Modify: `starwars-api/src/index.js` (add authentication middleware)

**Step 1: Create the Netlify function**

```javascript
const { schedule } = require('@netlify/functions');

exports.handler = schedule('0 */6 * * *', async () => {
  // Call the local API (or if deployed, the Railway/Render instance)
  const response = await fetch('http://localhost:3003/api/refresh', {
    method: 'POST',
    headers: { 'x-api-key': process.env.STARWARS_API_KEY }
  });
  return { statusCode: response.status };
});
```

**Step 2: Add API key auth to scraper endpoint** in starwars-api

**Verification:**
```bash
curl -X POST http://localhost:3003/api/refresh -H 'x-api-key: test'  # should 401
curl -X POST http://localhost:3003/api/ref... -H 'x-api-key: <correct>'  # should 200
```

---

## Task 7: Portal Integration — Add to replaybrick.com

**Objective:** Add the Star Wars Tracker to the portal hub and wire up iframe embedding.

**Files:**
- Modify: `website/src/pages/PortalPage.jsx`
- Create: `website/src/pages/StarWarsPage.jsx`
- Modify: `website/src/App.jsx`

**Step 1: Add StarWarsPage** — simple iframe wrapper like CompassPage:

```jsx
export default function StarWarsPage({ user, onLogout }) {
  return (
    <div className="h-screen flex flex-col bg-[#0f0f1a]">
      <div className="flex items-center gap-4 px-6 py-3 border-b border-white/10">
        <button onClick={() => navigate('/portal')} className="text-gray-400 hover:text-white">
          ← Portal
        </button>
        <h1 className="text-yellow-400 font-bold text-lg">STAR WARS TRACKER</h1>
        <span className="ml-auto text-gray-500 text-sm">{user.name}</span>
      </div>
      <iframe src="http://localhost:5176?auto=true" className="flex-1 w-full border-0" title="Star Wars Tracker" />
    </div>
  );
}
```

**Step 2: Add portal card** in PortalPage.jsx:

```jsx
{
  id: 'starwars',
  title: 'Star Wars Tracker',
  subtitle: 'Vintage Kenner Figure Database',
  description: 'Track eBay and DVT prices for all 96 vintage Kenner Star Wars action figures. Find deals, build your collection.',
  route: '/starwars',
  color: '#FFD700',
  icon: <StarWarsIcon />,
}
```

**Step 3: Add route in App.jsx:**
```jsx
<Route path="/starwars" element={
  user ? <StarWarsPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
} />
```

**Step 4: Add auto-login support in starwars-tracker** — read `?auto=true` param to skip auth (internal tool)

**Step 5: Rebuild parent website to copy tracker dist**
Add to website/package.json postbuild:
```json
"postbuild": "cp -rv ../hold/dist dist/hold 2>/dev/null || true && cp -rv ../starwars-tracker/dist dist/starwars 2>/dev/null || true"
```

**Verification:**
```bash
cd starwars-tracker && npm run build
cd website && npm run build
# Open http://localhost:5173/portal — should see Star Wars card
# Click → should load tracker in iframe
```

---

## Task 8: Cron Job — Automated Price Refresh

**Objective:** Set up a Hermes cron job that periodically refreshes prices.

**Files:**
- Create: `~/.hermes/scripts/starwars-refresh.py`

**Step 1: Create refresh script**

Python script that:
1. Pings the starwars-api `/api/refresh` endpoint
2. Only refreshes 5-10 figures per run (to be polite to eBay/DVT)
3. Tracks which figures were refreshed last
4. Rotates through all 96 figures over ~24 hours

**Step 2: Schedule with cronjob**

```
cronjob create:
  name: 'Star Wars Tracker - Price Refresh'
  schedule: '0 */4 * * *'  (every 4 hours)
  script: ~/.hermes/scripts/starwars-refresh.py
  no_agent: true
  deliver: local
```

**Verification:**
```bash
python3 ~/.hermes/scripts/starwars-refresh.py  # run once manually
sqlite3 starwars-api/starwars.db "SELECT COUNT(*) FROM prices WHERE recorded_at > datetime('now','-1 hour')"
```

---

## Task 9: Design Polish — Kenner Package Aesthetic

**Objective:** Polish the visual design to nail the Kenner vintage package look.

**Files:**
- Modify: `starwars-tracker/src/index.css`
- Modify: `starwars-tracker/src/components/FigureCard.jsx`
- Modify: `starwars-tracker/src/pages/CatalogPage.jsx`

**Design checklist:**
- [ ] Starfield background (animated subtle twinkle?)
- [ ] Kenner-style black/silver/yellow card borders on FigureCards
- [ ] "STAR WARS" logo treatment in header
- [ ] Kenner price sticker style on PriceBadge
- [ ] Film-specific color accents (ANH=blue, ESB=red, ROTJ=green, POTF=purple)
- [ ] Vintage "Ages 4 and up" style footer element
- [ ] Cardback-inspired diagonal stripe pattern on detail page

**Verification:**
```bash
cd starwars-tracker && npm run dev
# Visual review — does it feel like a Kenner cardback?
```

---

## Task 10: Build & Deploy

**Objective:** Build everything for production and deploy to Netlify.

**Files:**
- Modify: `website/package.json` (postbuild script)

**Step 1: Build tracker**
```bash
cd starwars-tracker && npm run build
```

**Step 2: Build website (which copies tracker dist)**
```bash
cd website && npm run build
```

**Step 3: Deploy to Netlify**
```bash
cd website
NETLIFY_AUTH_TOKEN="nfp_xxx" npx netlify deploy --dir dist --prod --site replaybricksv2
```

**Verification:**
```bash
# Check that starwars/ directory exists in website/dist
ls website/dist/starwars/index.html
# Visit https://replaybrick.com/starwars
```

---

## Open Questions for Review

1. **Cron job frequency:** Every 4 hours means ~24 refreshes/day (~240 eBay searches/day). Is this too aggressive for eBay's anti-bot measures? Should we reduce to every 8 hours?

2. **DVT scraping frequency:** DVT is a local small business. Should we scrape them at all, or just check DVT once per day? They might not appreciate aggressive scraping.

3. **Figure images:** Should we include images? If so, source from where? (eBay listing images? Rebelscum archive? Manual upload?)

4. **Want list / collection tracking:** Should users be able to mark figures as "have" / "want" and track their collection progress? This would need localStorage state in the tracker app.

5. **Deal notifications:** Should we add email/Discord alerts when a figure drops below a target price? Or keep it passive — you check when you want?

6. **API hosting:** The starwars-api runs locally on port 3003. In production, this only works when your machine is on. Options: (a) keep it local-only, (b) deploy to Railway/Render free tier, (c) use Cloudflare tunnel. Which do you prefer?
