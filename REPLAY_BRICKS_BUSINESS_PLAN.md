# Replay Bricks — Comprehensive Business Plan

**Owners:** Brian & Amanda Baxter
**Website:** replaybrick.com (Netlify, linked to replaybricksv2.netlify.app)
**Existing Stores:** BrickLink (replay1138), BrickOwl (replaybricks), eBay
**Current Tooling:** Hold app (React/Vite + Express/SQLite), website (React/Vite), Compass app

---

## Executive Summary

Replay Bricks is an established LEGO resale business with existing marketplace presence (BrickLink, BrickOwl, eBay) and a solid-but-unfinished in-house inventory app (Hold). The business has good bones — real stores, real inventory, real customers — but lacks centralized inventory management, a cohesive multi-channel strategy, and a systematic approach to sourcing/diversification.

This plan is a 6-month actionable roadmap. **No fluff. Every section has concrete next steps.**

---

## 1. INVENTORY APP — Hold Assessment & Phased Plan

### Current State of Hold (Audit Results)

**What exists and works:**
- ✅ React 19 + Vite 8 frontend with Tailwind CSS v4, dark theme
- ✅ Express + SQLite backend (better-sqlite3) on port 3002
- ✅ Authentication (localStorage-based, Brian/Amanda accounts)
- ✅ Full schema: `inventory`, `orders`, `order_items`, `marketplace_lots`, `pricing_rules`, `api_credentials`, `sync_log`, `sync_state`, `bl_items`, `bl_colors`
- ✅ BrickLink OAuth 1.0 client + BrickOwl API client
- ✅ BrickStore (.bsx) file parser & sync bridge
- ✅ Sync engine with pagination support for BL/BO inventory + orders
- ✅ Dashboard with stats (total items, unique parts, total value, orders)
- ✅ Inventory view (table + grid), search, pagination
- ✅ Order management with status workflow
- ✅ Pricing rules engine (markup %, min/max prices)
- ✅ Part-out tool (hardcoded set catalog, needs BrickLink API integration)
- ✅ Marketplace management + CSV export
- ✅ Fully built `dist/` directory — app builds successfully
- ✅ Travel Portal page (Amanda's side feature)

**What's missing or broken:**
- ❌ **No barcode scanning** — no barcode library, no UI for it
- ❌ **No photo upload** — no file upload, no photo management per inventory item
- ❌ **No condition grading UI** — DB has `condition` field (NEW/USED) but no grading UI (e.g., CIB, sealed, box damage)
- ❌ **No add-item form** — Inventory page reads/search only, no way to add items manually
- ❌ **Part-out tool has hardcoded data** — uses hardcoded sample sets, not the BrickLink API for real set inventories
- ❌ **BrickLink OAuth may be unconfigured** — credentials table is empty or needs setup
- ❌ **No CSV import** — can export, can't import (BrickStore sync exists but is file-path based)
- ❌ **No photo attachments** — DB has no image storage column for user photos
- ❌ **Reports page exists but minimal**
- ❌ **Mobile responsive but not mobile-optimized** for field use at LEGO stand
- ❌ **No barcode/QR code assignment** for inventory items

### Phased Approach

#### PHASE 1: MVP Stabilization (Right Now — 2 weeks) — Effort: ~20-30 hours

**Goal:** Get the app actually usable for daily inventory management.

**Tasks:**

1. **Start the server and verify BrickLink connection**
   - `node server/src/index.js` (runs on :3002)
   - Configure BrickLink API credentials (consumer key, secret, token, token secret)
   - Test sync: `POST /api/sync/bricklink/inventory`
   - Verify orders sync: `POST /api/sync/bricklink/orders`
   - If OAuth setup is daunting, skip BL sync for now and use BrickStore .bsx import as fallback

2. **Add manual inventory item creation**
   - Build a simple "Add Item" modal/form in `Inventory.jsx`
   - Fields: Part #, Color (dropdown from `bl_colors`), Quantity, Condition (NEW/USED), Location, Price
   - Calls `api.createInventoryItem()` — need to add `POST /api/inventory` endpoint

3. **CSV Import**
   - Accept BrickLink `.bsx` files OR standard CSV with columns: `part_no, color_name, quantity, condition, unit_price`
   - Frontend file picker → `POST /api/inventory/import` → parse → upsert
   - This is critical because your existing inventory is likely in BrickStore or spreadsheets

4. **Part-out tool — real BrickLink API integration**
   - Remove hardcoded data in `PartOut.jsx`
   - Use BrickLink catalog API to fetch set inventory by set number
   - Display parts list with checkboxes → "Add to Inventory" with one click
   - This is the highest-leverage feature for selling

5. **Fix Reports page**
   - Total inventory value, category breakdown, low-stock alerts
   - Add a "by location" report (useful for multi-bin storage)

**Deliverable:** Hold is usable day-to-day. Brian and Amanda can add items, search inventory, track orders.

#### PHASE 2: Core Workflow (Weeks 3-4) — Effort: ~20 hours

**Goal:** Make the app useful for stand selling and in-person transactions.

1. **Barcode Scanning**
   - Add `zbar-wasm` or `html5-qrcode` npm package for camera-based scanning
   - Simple overlay: scan a LEGO part barcode → auto-search inventory → show item
   - For sets: scan UPC/EAN barcode → look up set number → auto-populate
   - This is essential for the LEGO stand (see Section 4)
   - **Estimate:** 8-10 hours for working scan → search → display flow

2. **Photo Upload**
   - Add photo attachment per inventory item
   - Store photos as files in `server/uploads/` with DB reference
   - Or use base64 in SQLite blob column (simpler, no file management)
   - Photo upload button in item detail modal
   - **Estimate:** 4-6 hours

3. **Condition Grading UI**
   - Expand condition field beyond NEW/USED
   - For sets: Sealed (10/10), Opened/Complete (9/10), Complete with Box Damage, Missing Pieces
   - For parts: New, Used-Like New, Used-Good, Used-Poor
   - Color-coded badges in inventory view
   - **Estimate:** 3-4 hours

4. **Location Management**
   - Storage location tracking (bin/shelf/box)
   - Locations view: see what's in each bin
   - Useful for pulling orders at the stand
   - **Estimate:** 3-4 hours

#### PHASE 3: Sales Integration (Weeks 5-6) — Effort: ~15 hours

1. **BrickLink Lot Management**
   - View/edit BrickLink lots from Hold
   - Quick price updates that sync back to BrickLink
   - Bulk price adjustment from Pricing Rules

2. **Offline Mode**
   - Service Worker + IndexedDB cache for field use
   - Critical: at a flea market/Lego stand, you might not have internet
   - Local-first: all reads from cache, writes queue to sync when online

3. **Simple Point-of-Sale Mode**
   - "Sell" button on inventory items
   - Creates an order, marks items as sold, decrements quantity
   - Generates a simple receipt

#### PHASE 4: Polish & Scale (Weeks 7-10) — Effort: ~20 hours

1. **Mobile app wrapper**
   - Wrap the web app as a PWA (Progressive Web App)
   - Add manifest.json, service worker, install prompt
   - Or use Capacitor/Cordova for native camera access
   - Install icon on phone/tablet for stand use

2. **Multi-user sync**
   - Brian adds inventory on desktop, Amanda sells on tablet at stand
   - Real-time or near-real-time sync via the server
   - WebSocket or Server-Sent Events for live updates

3. **Sales analytics**
   - What sells fastest? Average days on shelf?
   - Profit margin tracking (if purchase price is recorded)
   - Best-selling parts vs. slow movers

### Tech Stack Recommendations

| Component | Current | Recommendation | Why |
|-----------|---------|---------------|-----|
| Database | SQLite (better-sqlite3) | **Keep SQLite** | It works, data is a single file, portable. Upgrade to PostgreSQL only if multi-user sync is needed at scale |
| Barcode | None | `html5-qrcode` | Works in browser, no build step, camera-based |
| Photo Storage | None | File system (`server/uploads/`) + DB path | Simple, cheap, works locally |
| Mobile | Responsive web | PWA (workbox) | No app store needed, installs on home screen |
| State Sync | localStorage | Keep + add server sync | Hybrid: local-first, server as source of truth |
| Auth | localStorage mock | **Keep for now** | Production auth needed only if you expose Hold publicly |

### Estimated Total Cost

- **Time investment:** ~75-80 hours total across all phases
- **Cash cost:** $0 (all open source, no new services)
- **Ongoing:** ~$5-10/mo if you host the server (Railway/Render/Hetzner VPS)

---

## 2. SELLING CHANNELS — Detailed Comparison

### Channel-by-Channel Analysis

#### BRICKLINK
- **Your store:** replay1138
- **Fees:** ~3% store fee + PayPal fees (~3%) = ~6% total
- **Audience:** Hardcore AFOLs (Adult Fans of Lego), part buyers, set completists
- **Listing complexity:** HIGH — parts need correct BL part # + color ID, condition, location
- **Shipping:** Buyer pays; you need to weigh parts and use BL's shipping calculator
- **Pros:**
  - Largest LEGO-only marketplace (1M+ items, 10k+ stores)
  - Parts sell here better than anywhere else
  - Buyers are knowledgeable, low return rate
  - Automatic order management if Hold sync works
- **Cons:**
  - Steep listing curve — parts must match BL's catalog exactly
  - High competition on popular parts (race to bottom on common bricks)
  - API is painful (OAuth 1.0, rate limits)
  - Store must be maintained with store terms, splash page
- **Verdict:** KEEP as primary channel for parts and minifigs. It's your anchor store.

#### BRICKOWL
- **Your store:** replaybricks
- **Fees:** 3% + PayPal (3%) = ~6%
- **Audience:** AFOLs, EU buyers (stronger in Europe than US)
- **Listing complexity:** MEDIUM — simpler than BL, less strict catalog matching
- **Shipping:** Buyer pays
- **Pros:**
  - Smaller but growing, less competition
  - Lower barrier to listing
  - EU buyer base (good for sets with international appeal)
  - Bulk listing upload via CSV
- **Cons:**
  - Smaller audience = fewer sales
  - Less API support than BL
  - May not be worth the overhead if you're small
- **Verdict:** KEEP as secondary channel, but only list items that are already in Hold. Use CSV export from Hold → upload to BO. Auto-sync if/when you get the Hold sync working.

#### EBAY
- **Fees:** 13.25% (final value fee for most categories) + payment processing (~3%) = ~16% total
- **Audience:** General public, impulse buyers, set collectors
- **Listing complexity:** LOW for sets, HIGH for parts (parts don't sell well here)
- **Shipping:** You pay or buyer pays — promoted listings cost extra
- **Pros:**
  - Massive reach — best for **retired sets** that collectors search for
  - Auction format can drive prices above market on rare items
  - Best platform for "bulk lots" (unsorted LEGO by the pound)
  - Best platform for "used set, no box" listings
- **Cons:**
  - Highest fees of any channel
  - Buyer protection favors buyers — more scams, returns, "item not as described"
  - Parts selling is terrible — don't bother listing individual parts here
  - eBay managed payments can hold funds
- **Verdict:** USE for retired sets ($200+), bulk lots, and unique items only. Skip for parts. 16% fee means you need higher margin.

#### AMAZON
- **Fees:** 15% referral fee + fulfillment fees if FBA
- **Audience:** Everyone, but primarily new-set buyers
- **Listing complexity:** HIGH — gated categories, UPC requirements, restricted by brand
- **Shipping:** You can FBM (Fulfilled by Merchant) or FBA
- **Pros:**
  - Biggest platform in the world
  - Best for NEW, SEALED sets in active production
  - Amazon customers trust the platform
- **Cons:**
  - LEGO is a gated brand — you need approval and invoices from LEGO or authorized distributors
  - You CAN'T sell used LEGO on Amazon (unless you're an approved used-goods seller)
  - High fees, high competition from Amazon itself
  - Inventory management is a nightmare
  - Returns are frequent and Amazon always sides with buyer
- **Verdict:** SKIP for now unless you have wholesale invoices for new-in-box current sets. Not worth the gatekeeping hassle.

#### FACEBOOK MARKETPLACE
- **Fees:** FREE
- **Audience:** Local buyers, casual shoppers
- **Listing complexity:** VERY LOW — take a photo, write a description, post
- **Shipping:** Local pickup only (or you can offer to ship via FB's system)
- **Pros:**
  - Zero fees
  - Best for local pickup — no shipping cost
  - Good for bulky items (large sets, tables, bulk bins)
  - Fast cash — list today, sell today
  - Good for "AS-IS" lots where you don't want returns
- **Cons:**
  - Scammers are everywhere — "Is this available?" spam
  - No-show buyers are common
  - Local market may not have LEGO collectors
  - FB can randomly remove listings
  - No integrated payment processing (cash/Zelle only)
- **Verdict:** BEST for local pickup of large sets, bulk lots, and the LEGO stand (promote your stand location here). Also good for sourcing — people underprice sets frequently.

#### MERCARI
- **Fees:** 10% + payment processing (~3%) = ~13%
- **Audience:** Bargain shoppers, younger buyers, casual collectors
- **Listing complexity:** LOW — take photos, describe, set price
- **Shipping:** Mercari provides prepaid labels (buyer pays or you can offer free shipping)
- **Pros:**
  - Easy to list — phone app is excellent
  - Prepaid shipping labels
  - Good for selling individual sets and minifigures
  - Social features (followers, likes) help visibility
- **Cons:**
  - Low average selling price — buyers want deals
  - Not good for parts (no catalog system)
  - Returns are easy for buyers
  - 10% + 3% = 13% is still significant
- **Verdict:** USEFUL for sets under $100, minifigures, and impulse purchases. Skip for parts.

#### POSHMARK
- **Fees:** 20% (for sales over $15)
- **Audience:** Fashion/apparel buyers
- **Listing complexity:** LOW
- **Pros:** N/A for LEGO
- **Cons:** 20% fee, wrong audience, no LEGO ecosystem
- **Verdict:** SKIP entirely. Wrong platform for brick reselling.

### Recommended Channel Strategy

| Channel | Priority | What to List | Fee Impact |
|---------|----------|-------------|------------|
| **BrickLink** | 🥇 PRIMARY | Parts, minifigs, sets (parted-out) | ~6% |
| **eBay** | 🥈 SECONDARY | Retired sets ($200+), bulk lots, rare items | ~16% |
| **Facebook MP** | 🥉 FREE | Local pickup sets, bulk lots, stand promotion | 0% |
| **BrickOwl** | 4th | Cross-post same as BL (minimal extra effort) | ~6% |
| **Mercari** | 5th | Minifigures, small sets, impulse items | ~13% |
| **Amazon** | ❌ SKIP | Unless you have LEGO wholesale invoices | 15%+ |

**Action Items:**
1. Focus 80% of listing effort on **BrickLink** — it's where LEGO buyers are
2. Cross-post retired/high-value sets to **eBay**
3. Post bulk lots and large sets on **Facebook Marketplace** for local pickup
4. Set up **BrickOwl** as a passive second channel — sync from Hold
5. Spend 30 min/week on **Mercari** for minifigures and small sets

---

## 3. MONEY-MAKING IDEAS — Ranked by Ease vs. Profit

### The Matrix

```
                          HIGH PROFIT
                              │
                    ┌─────────┼─────────┐
                    │  ★ 10  │  ★ 8   │
                    │  MOC   │ Minifig │
                    │  Comm  │  Resale │
                    │        │         │
                    ├─────────┼─────────┤
       HARD ────────┤         │         ├─────── EASY
                    │         │         │
                    ├─────────┼─────────┤
                    │  ★ 7   │  ★ 9   │
                    │ Part-  │  Stand  │
                    │  Out   │  Sales  │
                    │  Sets  │ (in-pr) │
                    └─────────┼─────────┘
                              │
                          LOW PROFIT
```

### Ranked List (1 = Easiest, 10 = Highest Profit)

| # | Idea | Ease (1-10) | Profit (1-10) | Time Invest | Best Channel | Details |
|---|------|-------------|---------------|-------------|-------------|---------|
| **1** | **LEGO Stand / Flea Market** | 9 | 7 | Weekends | In-person | Already doing this! Sell mixed inventory. Low barrier, cash-only, zero fees |
| **2** | **Bulk Lot Flipping** | 8 | 5 | 2-4 hrs/lot | FB MP, eBay | Buy bulk lots cheap, sort into "good" and "bulk" bins, resell. Low margin per piece but high volume |
| **3** | **Facebook Marketplace Singles** | 8 | 4 | 30 min/item | FB MP | Take photo of set, list for local pickup. Fast sale, low price, but zero fees |
| **4** | **eBay Retired Set Sales** | 6 | 9 | 1 hr/set | eBay | Identify recently-retired sets, buy low/source from thrift, sell on eBay. Best profit margin |
| **5** | **BrickLink Parts Selling** | 4 | 6 | Ongoing | BrickLink | The core business. High effort to list, steady profit. Best once Hold automates listing |
| **6** | **Minifigure Reselling** | 7 | 8 | 30 min/fig | BL, Mercari | Identify rare minifigs, buy in lots, sell individually. Good margin, easy to ship |
| **7** | **Parting Out Sets** | 3 | 8 | 2-4 hrs/set | BrickLink | Buy a set, break it into parts, sell parts individually. High effort, very high total return (3-5x set price) |
| **8** | **Bulk Unsorted LEGO by Weight** | 9 | 3 | 1 hr | FB MP, eBay | Buy unsorted, sell unsorted by pound. Easiest possible, but low margin/lb |
| **9** | **Subscription Box / Monthly Brick** | 2 | 6 | High setup | Website | Monthly LEGO part pack. High logistics, niche audience. Not recommended early on |
| **10** | **MOC Building Commissions** | 2 | 10 | Very high | Fiverr, Etsy, Local | Build custom models for clients. Highest profit but requires design skill and time |
| **11** | **Consignment Selling** | 5 | 7 | Variable | BrickLink | Sell other people's LEGO for a cut (20-30%). Use your existing storefront. Requires trust/contracts |
| **12** | **Pick-a-Brick Arbitrage** | 6 | 3 | 2 hrs | BrickLink | Buy from LEGO Pick-a-Brick wall, resell on BrickLink. Low margin, high competition |
| **13** | **LEGO-Based Crafts/Art** | 5 | 5 | Variable | Etsy, Fairs | Mosaic portraits, keychains, ornaments. Niche but has fans |
| **14** | **LEGO Party / Events** | 4 | 7 | Weekends | Local | Host building events for kids' birthdays. Requires insurance, liability, setup |
| **15** | **Instruction Writing** | 7 | 3 | 5-10 hrs | Rebrickable | Write building instructions for MOCs. Passive income, very small market |

### Recommended Focus (First 6 Months)

1. **Stand sales** (already doing this) — keep as cash-flow engine
2. **eBay retired sets** — highest margin per hour for sets
3. **Minifigure reselling** — good margin, easy to ship, fast turnaround
4. **Bulk lot flipping** — volume, keeps inventory fresh, feeds the stand
5. **Part-out high-value sets** — one set can return 3-5x its purchase price when parted out on BrickLink
6. **Consignment** — once you have the infrastructure, selling other people's LEGO is pure % profit

---

## 4. LEGO STAND — In-Person Selling Plan

### What to Stock

| Category | % of Table | Best Items | Price Range |
|----------|-----------|------------|-------------|
| **Minifigures** | 25% | Star Wars, HP, Marvel, CMF series | $3-50 each |
| **Polybags / Small Sets** | 15% | GWP polybags, $10-20 sets | $5-30 |
| **Bulk Bricks by Cup** | 20% | Sorted by color, fill a Solo cup | $5-10/cup |
| **Retired Sets** | 15% | Recently retired, partial or complete | $30-200 |
| **Hard-to-Find Parts** | 15% | Rare colors, specialty pieces | $1-20 each |
| **Oddities / Custom** | 10% | Keychains, brick separators, etc. | $1-5 |

### Pricing Strategy

| Item Type | Pricing Rule |
|-----------|-------------|
| Common bricks (2x4, 1x2, 1x1) | $0.05-0.10 each or $5/cup |
| Medium parts (tiles, plates, slopes) | $0.10-0.25 each |
| Rare parts / unusual colors | BrickLink average × 1.2 (premium for instant gratification) |
| Minifigures (common) | BrickLink average price (buyers compare on phone) |
| Minifigures (rare) | BrickLink + 10-20% (they see it in person, it's here now) |
| Polybags | $5-15 depending on rarity |
| Retired sets | eBay sold price minus 20% (no shipping, no fees) |
| Bulk cups | $5 small, $10 large (don't sort, just fill a cup) |

**Key insight:** At a stand, you're selling convenience and impulse. People pay a premium to have it NOW instead of waiting for shipping. Rare minifigs can be priced 10-20% above BrickLink average. Common parts should be BELOW BrickLink (competitive). Bulk cups are pure profit from what didn't sell online.

### Payment Processing — Square

**Why Square?**
- Lowest rates for in-person: 2.6% + $0.10 per swipe/tap/dip
- Free card reader (or $10 for chip+tap)
- Works offline (store transactions, process when back online)
- Integrated inventory (Square Items) if you want
- Instant transfers to bank (1.5% fee) or free next-day
- Can also do invoices for custom orders

**Setup:**
1. Order a Square Reader (contactless + chip) — free with promo
2. Download Square POS app on phone/tablet
3. Create items in Square OR just use "Custom Amount" at the stand
4. Offer cash discount (optional) — "Cash price $10, card $10.30"

**Alternative:** Zelle/Venmo/Cash App for cash-avoiders (0% fees but no buyer protection). Many buyers at LEGO shows will Zelle you.

### Display Setup

**Recommended layout for a 6ft table:**

```
┌─────────────────────────────────────────────────────┐
│  MINIFIGURE DISPLAY (standing on plates in rows)    │ MINIFIGURE
│  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐   │ ZONE
│  │S │H │M │B │L │F │  │  │  │  │  │  │  │  │  │   │ (left)
│  │W │P │V │M │O │W │  │  │  │  │  │  │  │  │  │   │
│  │  │  │  │C │T │W │  │  │  │  │  │  │  │  │  │   │
│  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘   │
│                                                       │
│  POLYBAGS ← → BULK CUPS                              │ MIDDLE
│  (standing in rows)   (fill-your-own cups)            │ (impulse)
│                                                       │
│  ┌──────────────────┐  ┌──────────────────┐          │
│  │ RETIRED SET      │  │ SPECIAL PARTS    │          │
│  │ (#10295 Porsche) │  │ (rare colors,    │          │
│  │ $130             │  │  specialty tiles)│          │
│  └──────────────────┘  └──────────────────┘          │ RIGHT
│                                                       │
│  CASH BOX ← PHONE (Square) → BAGS FOR PURCHASES      │ FRONT
└─────────────────────────────────────────────────────┘
```

**Tip:** Bring a small tabletop LEGO build (like a mosaic or mini model) to attract attention. People stop to look at the build, then buy.

### Stand Operations Checklist

- [ ] Square reader charged
- [ ] Phone/tablet charged + portable battery
- [ ] Small bills for cash change ($50 in 1s, 5s, 10s)
- [ ] Plastic bags for purchases
- [ ] Price tags / labels for everything
- [ ] Business cards with QR code to BrickLink store
- [ ] Notepad to track what sold (feed back to Hold)
- [ ] Foldable table + display bins
- [ ] LED battery light for dark venues (e.g., indoor swap meets)

---

## 5. PHASED TIMELINE — 6 Month Roadmap

```
MONTH 1: FOUNDATIONS  MONTH 2: SYSTEM    MONTH 3: SALES     MONTH 4-6: SCALE
───────────────      ───────────────     ───────────────     ─────────────────
Wk1-2: Hold MVP     Wk5-6: Barcode     Wk9-10: Pricing    Month 4:
  - Start server      + Photo upload      - Auto-pricing     - Consignment launch
  - Add inventory      - Condition UI       rules driven      - Source 3 bulk lots
    create/import      - Part-out tool      by BL averages     - Part out 5 sets
  - Fix Part-out       using real API                         - PWA mobile wrapper
  - Test BL/BO sync  Wk7-8: eBay Push    Wk11-12: Stand     Month 5-6:
                         - List 5 retired   - First big show   - Re-evaluate Hold hosting
Wk3-4: Core Workflow    sets on eBay      - Test Square       - 2 more shows/stands
  - Orders workflow   - Source 2 bulk       + barcode scan    - Reach 500 unique BL parts
  - Reports fix         lots              - Track everything  - Newsletter subscriber growth
  - CSV import        - Sort + list on      in Hold
                         Facebook MP
```

### Detailed Weekly Plan

#### WEEK 1-2: Hold MVP
- **Day 1-2:** Start the Hold server. Configure BrickLink API credentials. Run a test sync.
- **Day 3-4:** Build the "Add Item" form — part #, color dropdown, quantity, condition, price, location.
- **Day 5-6:** Add `POST /api/inventory` and `PUT /api/inventory` endpoints to the server.
- **Day 7-10:** Build CSV/BSX import — file picker, parse, upsert to DB.
- **Day 11-14:** Connect Part-out tool to real BrickLink API. Test with 3 real set numbers.

#### WEEK 3-4: Core Workflow
- **Add orders workflow:** mark as picked, packed, shipped from Hold
- **Fix Reports:** total value, category breakdown, low stock, by-location report
- **Location management UI:** assign bins, view by location
- **Manual item editing:** update quantities, prices, locations directly in Inventory view

#### WEEK 5-6: Barcode & Photos
- **Integrate `html5-qrcode`** — scan LEGO part barcode → search inventory
- **For sets:** scan UPC → BrickLink catalog lookup → auto-populate
- **Photo upload** per inventory item
- **Condition grading UI** — expand from NEW/USED to detailed grades
- **Test at stand:** use the app during a real sales day to find bugs

#### WEEK 7-8: Sales Channels
- **eBay:** List 5 retired sets. Use Hold to track which sets went to eBay.
- **Facebook Marketplace:** Post 3-4 items locally. See what moves.
- **Bulk lot sourcing:** Hit 2 garage sales / FB finds. Buy 2 bulk lots ($20-50 each).
- **Sort bulk lots:** Pull out valuable minifigs and rare parts for individual sale. Bag the rest as bulk cups.

#### WEEK 9-10: Pricing & Part-out
- **Auto-pricing:** Pull BrickLink 6-month average prices, apply markup rule
- **Part-out 3 sets:** Buy current sets on sale, part out for BrickLink parts
- **Compare:** Profit from selling as complete set vs. parted-out

#### WEEK 11-12: Stand Preparation
- **Book 2 stand dates** (flea market, LEGO show, comic convention)
- **Order Square Reader** if not already done
- **Prepare display** as described in Section 4
- **Print business cards** with BrickLink QR code
- **First stand day:** Use Hold + Square + barcode scanner. Track everything.
- **Post-stand debrief:** What sold best? Where to stock differently?

#### MONTH 4: Consignment & Sourcing
- **Launch consignment:** Offer to sell other people's LEGO for 20-30%. Use your established BrickLink store.
- **Source 3 bulk lots** minimum
- **Part out 5 sets** — aim for sets 30%+ off retail
- **PWA wrapper:** Make Hold installable on phone/tablet

#### MONTH 5-6: Evaluation & Scale
- **Re-evaluate Hold hosting:** Is the local server stable? Need cloud hosting? (~$10/mo on Railway)
- **Run 2 more stand events**
- **Target: 500 unique parts on BrickLink**
- **Grow newsletter** (the website has signup) — send monthly LEGO investment tips
- **Review profitability** of each channel. Double down on what works.

### Key Metrics to Track

| Metric | Current | 3-Month Goal | 6-Month Goal |
|--------|---------|-------------|-------------|
| Hold inventory items | Unknown | 500 | 2,000 |
| BrickLink store items | Unknown | 300 unique parts | 500 unique parts |
| eBay monthly sales | Unknown | $200/mo | $500/mo |
| Stand monthly revenue | Unknown | $200/mo | $400/mo |
| Time invested/week | Unknown | 10 hrs | 10-15 hrs |
| Monthly profit | Unknown | $300 | $800-1,200 |

---

## APPENDIX: Quick-Start Actions for RIGHT NOW

1. **Open terminal, start Hold server:**
   ```bash
   cd /home/bbaxter/workspace/replay-bricks/hold
   node server/src/index.js
   ```
   (Opens on http://localhost:3002)

2. **Start Hold frontend:**
   ```bash
   cd /home/bbaxter/workspace/replay-bricks/hold
   npm run dev -- --port 5175
   ```
   (Opens on http://localhost:5175)

3. **Log in:**
   - Brian: `brian@replaybrick.com` / `Brian!1138`
   - Amanda: `amanda@replaybrick.com` / `Brian!1138`

4. **Configure BrickLink credentials** in Settings → API Keys
5. **Test sync** from Marketplaces page
6. **Import your existing BrickStore file** via the BrickStore sync endpoint or CSV

---

*Business Plan v1.0 — Prepared for Replay Bricks (Brian & Amanda Baxter)*
