# Part-Out Tool — Implementation Plan

> Port BrickStore's part-out flow into Hold as a native React page. User enters a set number, system fetches BrickLink subset inventory, applies Hold's pricing rules, and queues lots into the existing Pending Review pipeline.

**Plan built by:** Claude Opus 4 reading the actual Hold codebase
**Date:** June 12, 2026

---

## 1. Architecture

### What we are building
A native page inside Hold (`/hold/partout`) that mirrors BrickStore's "Part-Out Items" dialog:

1. Set number → BrickLink Catalog API → list of `consistsOf` entries (part, color, qty, flags)
2. Each entry priced through Hold's existing pricing rules engine
3. User reviews, edits qty/price/condition per row, then confirms
4. Confirmed rows land in the existing `pending_items` table with `source='partout'`, available for final acceptance into `inventory` via Pending Review

### How it fits into Hold
- **Frontend:** extend `hold/src/pages/PartOut.jsx` (already mounted in App.jsx, already has working search form + results table). No new page file needed.
- **Backend:** extend the two existing endpoints in `hold/server/src/index.js` (lines 1021 and 1071). No new modules.
- **Database:** reuse existing `settings` key-value and `pending_items` tables. No new tables.
- **Pricing:** extract the pricing rules loop from `/api/pricing/preview` into a helper, then call it from part-out.
- **Confirm flow:** route through `pending_items` (matches Hold's voice-import flow).

### Out of scope
- Offline catalog DB (BrickStore's `brickstore-database`) — we hit BrickLink API on every part-out
- Auto-pricing minifig sub-inventories (`break_minifigs: false`)
- Printing
- Amanda access — admin-only

---

## 2. Current State (Baseline)

What already works (do not re-implement):

| Component | File | Status |
|---|---|---|
| `PartOut.jsx` page | `hold/src/pages/PartOut.jsx` | Search form, condition selector, results table (first 50 rows), confirm → pending_items |
| `POST /api/partout/:setNo` | `hold/server/src/index.js:1021` | Calls `blClient.getItemSubsets`, returns `{set_no, total_lots, total_pieces, parts[]}` with cached avg prices |
| `POST /api/partout/:setNo/confirm` | `hold/server/src/index.js:1071` | Batch inserts into `pending_items` with `source='partout'` |
| `api.partOut` / `api.confirmPartOut` | `hold/src/api.js:169` | Wired |
| BrickLink subset client | `hold/server/src/bricklink.js:115` | `getItemSubsets(itemType, itemNo, colorId, params)` |
| `pending_items` table | `hold/server/src/db.js:174` | All needed columns |
| `settings` key-value table | `hold/server/src/db.js:202` | Reuse for part-out defaults |
| Pricing rules engine | `hold/server/src/index.js:1102` | Logic inlined — must be extracted |

**11 specific gaps this plan fills:**

1. Pricing rules not applied to part-out — raw `price_cache.avg_price_cents` only
2. No completeness option (sealed / complete / incomplete)
3. No per-row editing (qty, unit price, condition override)
4. No running totals (lot count, piece count, total value)
5. No image preview (server builds `image_url` but UI ignores it)
6. `extra` flag captured but not displayed; `is_alternate` not captured
7. No color name resolution — UI shows raw `color_id`
8. No set-name lookup / display
9. No defaults panel — every search re-enters the condition
10. No set-number validation
11. Settings allow-list doesn't include part-out keys

---

## 3. Step-by-Step Tasks

### Phase A — Backend: Pricing & Data Quality

**A1. Extract pricing-rule evaluation to a helper** (`hold/server/src/index.js`)
- Pull the rule loop from `/api/pricing/preview` into `applyPricingRules(basePriceCents, condition, rules)`
- Verify `/api/pricing/preview` returns identical JSON before/after

**A2. Apply pricing rules in `/api/partout/:setNo`**
- Load enabled rules, compute `suggested_price_cents` per part
- Keep `cached_avg_price_cents` intact so UI shows both

**A3. Join color names server-side**
- Build `Map<color_id, color_name>` from `bl_colors` table
- Set `color_name` per part during build loop

**A4. Capture `is_alternate` flag**
- Add `alternate: !!entry.is_alternate` in entry loop

**A5. Look up set name once**
- Call `blClient.getItem('SET', setNo)` before returning
- Include `set_name` + `set_image_url` in response
- Cache in 24h in-memory Map

**A6. Accept `completeness` in request body**
- Values: `'C'` (complete), `'B'` (incomplete), `'S'` (sealed)
- Pass through to response

**A7. Extend confirm endpoint with completeness**
- Accept `completeness` in body
- Append completeness label to notes: `Part-out: ${setNo} (Complete)`

### Phase B — Backend: Settings & Validation

**B1. Add part-out defaults to settings allow-list** (`index.js:956`)
- Keys: `partout_default_condition`, `partout_default_completeness`, `partout_default_markup_percent`, `partout_auto_apply_pricing`

**B2. Seed default values** (`hold/server/src/db.js:235`)
- `['partout_default_condition', 'USED']`
- `['partout_default_completeness', 'C']`
- `['partout_default_markup_percent', '0']`
- `['partout_auto_apply_pricing', 'true']`

**B3. Honor `partout_auto_apply_pricing`** in partout endpoint
- If `'false'`, skip rule application; `suggested = cached`

**B4. Validate set number shape**
- Reject non-matching `/^[A-Z0-9]+-\d+$/` with 400 before hitting BrickLink

### Phase C — Frontend: Display new data

**C1. Read settings on mount** — seed `condition`, `completeness`, `markup` from defaults

**C2. Add completeness selector** — dropdown: Complete / Incomplete / Sealed

**C3. Render set header** — `set_name`, `set_no`, set image at top of results

**C4. Color names + thumbnails** — 32×32 `<img>` column, render `color_name`

**C5. Flag chips** — `EXTRA` badge (yellow), `ALT` badge (gray)

**C6. Show base + suggested price** — two columns, color when they differ

**C7. Running totals bar** — `${lots} lots · ${pieces} pieces · $${value}`

**C8. Row selection + per-row editing** — checkbox, editable qty/price inputs, alternates default unchecked

**C9. Remove 50-row cap** — render all rows, virtualize only if needed

### Phase D — Frontend: Defaults panel

**D1. Collapsible "Defaults" section** — condition/completeness/markup/auto-pricing, save via `api.updateSettings()`

### Phase E — Verification

**E1. Smoke test** — `6034-1` (small) and `21318-1` (large modular)

**E2. Pricing round-trip** — create 20% USED rule, verify suggested = cached × 1.20

**E3. Error paths** — unknown set, BrickLink unconfigured, network failure

**E4. Pending Review integration** — confirm, then verify rows appear with `source='partout'`

---

## 4. API Contracts

### `POST /api/partout/:setNo`

**Request:**
```json
{
  "condition": "USED",
  "completeness": "C",
  "include_prices": true
}
```

**Response 200:**
```json
{
  "set_no": "21318-1",
  "set_name": "Tree House",
  "set_image_url": "https://img.bricklink.com/ItemImage/SN/0/21318-1.png",
  "condition": "USED",
  "completeness": "C",
  "total_lots": 423,
  "total_pieces": 3036,
  "rules_applied": 2,
  "parts": [
    {
      "part_no": "3001",
      "part_name": "Brick 2 x 4",
      "item_type": "PART",
      "color_id": 11,
      "color_name": "Black",
      "quantity": 4,
      "extra": false,
      "alternate": false,
      "image_url": "https://img.bricklink.com/ItemImage/PN/11/3001.png",
      "cached_avg_price_cents": 12,
      "suggested_price_cents": 15
    }
  ]
}
```

Errors: `400` (invalid set, BL unconfigured), `404` (subset empty), `500` (BL failure)

### `POST /api/partout/:setNo/confirm`

**Request:**
```json
{
  "condition": "USED",
  "completeness": "C",
  "location": "Bin A3",
  "parts": [
    {
      "part_no": "3001",
      "color_id": 11,
      "color_name": "Black",
      "part_name": "Brick 2 x 4",
      "quantity": 4,
      "unit_price_cents": 15,
      "condition": "USED"
    }
  ]
}
```

**Response 200:** `{ "ok": true, "added": 1 }`
**Response 400:** `parts` missing or empty

### Settings (existing endpoints, new keys)

`GET /api/settings` adds:
```json
{
  "partout_default_condition": "USED",
  "partout_default_completeness": "C",
  "partout_default_markup_percent": "0",
  "partout_auto_apply_pricing": "true"
}
```

---

## 5. Database Changes

**No new tables. No new columns.**

Reuse: `settings` table for 4 new keys, `pending_items` for confirmed lots. Completeness stored in `pending_items.notes` field.

---

## 6. Files Touched

| File | Change |
|---|---|
| `hold/server/src/index.js` | A1 extract helper · A2–A7 extend partout endpoints · B1 settings allow-list · B4 validate set number |
| `hold/server/src/db.js` | B2 seed default settings |
| `hold/src/pages/PartOut.jsx` | C1–C9 + D1 — bulk of UI work |
| `hold/src/api.js` | No change needed |
| `hold/server/src/bricklink.js` | No change needed |

**No new files. No new dependencies.**

---

## 7. Risk Areas

- **BrickLink rate limit:** 5000 reqs/day. A set = 1 subset + 1 set-info call. Add daily counter if usage spikes.
- **Large set latency:** UCS Falcon-class (7000+ lots) takes 5–10s. Server-side 30s timeout.
- **`break_minifigs` quirk:** stays `false`; flipping it changes response shape.
- **Duplicate confirms:** nothing prevents confirming same set twice. Acceptable — Pending Review can dedupe.
- **Null cached prices:** parts never priced → skip on confirm with row warning.

---

## 8. Verification

### Golden path
1. `cd hold/server && pnpm dev` (backend) + `cd hold && pnpm dev` (frontend)
2. `/hold/partout` → enter `6034-1`, USED, Complete
3. Search → set name + image render, lots load with prices
4. Uncheck an alternate, edit one qty and one price
5. "Send to Pending Review" → toast confirms count
6. `/hold/pending` → rows present with `source='partout'`

### Regression
- Voice-import → pending → accept flow unaffected
- `/api/pricing/preview` returns same proposals after A1 refactor
