# Spring Fortress — Data Protection & Reliability Plan

**Written:** 2026-05-22 13:00 CDT
**Goal:** Make Amanda's Compass data (Spring) bullet-proof — nightly backups, state audit ready, hardened against data loss and intrusion. Covers entire replaybrick.com ecosystem.

---

## Current State Assessment

### Data Stores
| Store | Location | Size/Status | Backup? |
|-------|----------|-------------|---------|
| Compass data | Browser localStorage (`compass-app-data`) | Active | ❌ None |
| Compass blobs | Netlify Blobs (`/api/data/*`) | **EMPTY** — sync code exists but never populated | ❌ None |
| Inventory DB | `/home/bbaxter/workspace/replay-bricks/hold/server/hold.db` | 360KB SQLite | ❌ None |
| Netlify config | Netlify dashboard (DNS, env vars, functions) | Live | ❌ None |
| GitHub repo | `bbaxter361/replay-bricks` | Primary source | ✅ Git (but no off-platform backup) |

### Security Vulnerabilities Found
1. **`spring-vicki-2026`** — Spring API key hardcoded in frontend JS (`compass/src/api.js` line 22)
2. **`nfc_qau3Rq6nLo4QvJrk2c3ub9Z5gVAAcw7W8579`** — Netlify personal access token in deploy scripts
3. **`AIzaSyDeyyhCPDHEmCLcROHVph2sh7x3gFs6KWo`** — Google API key in Hermes config and deploy scripts
4. **No rate limiting** on Spring API endpoints — open to abuse
5. **No CORS restrictions** — API accepts requests from any origin
6. **No authentication on data endpoints** (`/api/data/*`) — anyone with the key can read/write

### Data Flow (Current)
```
Amanda's Browser
    │
    ├── localStorage (compass-app-data) ← live state
    │       └── Zustand persist middleware
    │
    └── Netlify Blobs ← syncToBlobs() fires on state changes
            └── Currently EMPTY — sync appears to fail silently
```

---

## Phase 1: Nightly Automated Backups

### Task 1.1 — Cron: Nightly Compass Data Export
Create a cron job that runs at 2 AM CDT daily:
- Calls `GET /api/data/<key>` for each blob key (contacts, events, chatHistory, conversations, books)
- Saves timestamped JSON exports to `~/.hermes/backups/compass/YYYY-MM-DD/`
- Verifies each export is valid JSON with expected schema
- Alerts Brian on Discord if any export is empty or fails

### Task 1.2 — Cron: Nightly Inventory DB Backup
Create a cron job that runs at 2:30 AM CDT daily:
- Copies `hold/server/hold.db` to `~/.hermes/backups/inventory/YYYY-MM-DD/`
- Runs `sqlite3 hold.db ".backup backup.db"` for safe copy
- Verifies backup file size matches original ±10%
- Alerts on failure

### Task 1.3 — Cron: GitHub Repo Mirror
Create a job that runs at 3 AM CDT daily:
- Clones/pulls replay-bricks repo to `~/.hermes/backups/repo/`
- Creates a tarball snapshot: `replay-bricks-YYYY-MM-DD.tar.gz`
- This protects against GitHub outage or accidental force-push

### Task 1.4 — Backup Retention
- Keep daily backups for 30 days
- Keep weekly backups (Sunday) for 3 months
- Auto-prune older backups

---

## Phase 2: Fix Blob Sync (Critical)

### Task 2.1 — Debug Why Blobs Are Empty
- The `syncToBlobs()` function exists and fires on state changes
- But `/api/data` returns `{"keys":[]}` — meaning saves are failing silently
- Investigate: network errors, CORS, API key issues, backend blob storage
- Fix whatever is preventing blob writes

### Task 2.2 — Add Blob Sync Verification
- After every blob save, read back and verify data matches
- Add a `/api/data/stats` endpoint that returns blob sizes and last-sync times
- Expose blob health on the Compass dashboard

### Task 2.3 — Blob Sync on App Exit
- Add `beforeunload` handler to force blob sync when Amanda closes the app
- This ensures the last session's data is captured

---

## Phase 3: Data Accessibility for Amanda

### Task 3.1 — Spring Memory API
Create a new endpoint `/api/spring/memories` that allows Amanda (via chat) to:
- "Spring, what activities did I plan last week?"
- "Spring, show me John Smith's contact info"
- The endpoint queries blobs and returns structured data

### Task 3.2 — Data Export Dashboard
Add a "Data Export" section to the Compass app:
- Download all contacts as CSV
- Download all calendar events as ICS or CSV
- Download full activity log as PDF (state audit ready)
- One-click "Export Everything" ZIP download

### Task 3.3 — Historical Snapshots
- Add `/api/data/snapshots` — creates a timestamped point-in-time snapshot
- Amanda or Brian can trigger: "Spring, save a snapshot called 'May Audit'"
- Snapshots are immutable (can't be modified after creation)

---

## Phase 4: Security Hardening

### Task 4.1 — Move API Keys Out of Code
- Move `spring-vicki-2026` to Netlify environment variable
- Move Netlify token out of deploy scripts (use `netlify login` or env vars)
- Rotate all keys that have been exposed in commits
- Add `.env.example` files, ensure `.env` is in `.gitignore`

### Task 4.2 — Add Rate Limiting to Spring API
- Implement rate limiting on `/api/chat`: max 30 requests/minute per IP
- On `/api/data/*`: max 60 requests/minute
- Return 429 with Retry-After header
- Log rate limit hits for monitoring

### Task 4.3 — CORS Hardening
- Restrict CORS to only `https://replaybrick.com` and `https://compass-replaybricks-v2-550.netlify.app`
- Block all other origins
- Add Content Security Policy headers

### Task 4.4 — Data Endpoint Authentication
- Require API key on all `/api/data/*` endpoints (already done via `apiFetch`)
- Add request signing or HMAC for write operations
- Audit log: who accessed what data and when

### Task 4.5 — HTTPS Everywhere
- Verify all endpoints enforce HTTPS (Netlify does this by default)
- Add HSTS header: `max-age=31536000; includeSubDomains`
- Redirect all HTTP to HTTPS

---

## Phase 5: Reliability & Monitoring

### Task 5.1 — Health Check Monitoring
- Cron: Check Spring health endpoint every 15 minutes
- Alert on Discord if Spring is down for >5 minutes
- Track uptime percentage

### Task 5.2 — Backup Verification
- Weekly: Restore a random backup to a test environment
- Verify data integrity: count contacts, events, books
- Alert if backup is corrupt or incomplete

### Task 5.3 — Error Tracking
- Add structured error logging to Spring backend
- Track error frequency by type
- Alert if error rate spikes above threshold

### Task 5.4 — Compass Data Integrity Check
- Weekly: Verify localStorage data is synced to blobs
- Compare counts: localStorage.contacts.length vs blob contacts.length
- Alert on mismatch

---

## Phase 6: State Audit Readiness

### Task 6.1 — Activity Log
- Add an append-only audit log to Spring
- Records: timestamp, user (Amanda), action (created event, added contact, etc.)
- Immutable — can't be edited or deleted
- Exportable as PDF or CSV with date range filter

### Task 6.2 — Resident Data Export
- Generate state-ready reports:
  - "Monthly Activities Report" — all events, attendance, types
  - "Resident Contact List" — active contacts with last interaction date
  - "Activity Compliance Report" — shows required activity types vs delivered
- Professional formatting with Spring Creek branding

### Task 6.3 — Chain of Custody
- Every data export includes:
  - Export timestamp
  - Exported by (user)
  - Data range
  - SHA-256 hash of data (tamper verification)
  - "Generated by Spring Compass v2.0" footer

---

## Implementation Order

**Immediate (today):**
1. Phase 2: Fix blob sync (data is currently NOT backed up anywhere)
2. Phase 1.1-1.3: Set up nightly backup cron jobs

**This week:**
3. Phase 4: Security hardening (keys, CORS, rate limiting)
4. Phase 5: Monitoring and health checks

**Next week:**
5. Phase 3: Data accessibility (export dashboard, memory API)
6. Phase 6: Audit readiness

---

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `~/.hermes/crons/compass-backup.js` | Nightly Compass data export script |
| `~/.hermes/crons/inventory-backup.sh` | Nightly inventory DB backup |
| `~/.hermes/crons/health-check.sh` | 15-min health monitor |
| `hold/index.js` | Rate limiting, CORS, audit log, new endpoints |
| `compass/src/stores/useStore.js` | Fix blob sync, add exit handler |
| `compass/src/pages/ExportPage.jsx` | New data export UI |
| `netlify.toml` | CSP headers, HSTS |
| `deploy-compass.sh` | Remove hardcoded token |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Browser cache clear wipes data | Medium | **CRITICAL** | Blob sync + nightly backups |
| API key leaked via frontend | High | High | Move to env vars, rotate keys |
| Netlify outage | Low | Medium | Local backup cache, GitHub mirror |
| State audit finds gaps | Medium | **CRITICAL** | Activity log + export reports |
| Blob storage quota exceeded | Low | High | Monitor sizes, alert at 80% |
