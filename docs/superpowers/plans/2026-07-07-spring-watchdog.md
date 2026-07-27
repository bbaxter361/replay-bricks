# Spring Watchdog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a no-extra-server Spring watchdog that checks Spring during Dallas business hours, journals incidents, and sends Brian email/text alerts when mail configuration is present.

**Architecture:** A Netlify scheduled function runs every 5 minutes and skips outside 6 AM-6 PM America/Chicago. Shared watchdog utilities run health/chat/file/proxy checks, classify failures, store state, journal to Supabase-compatible REST when configured, and prepare Obsidian-readable journal records for local sync. Alert delivery uses SMTP-style environment configuration so no paid server is introduced.

**Tech Stack:** Netlify Functions, JavaScript ESM, Node test runner, Supabase REST API when environment variables are configured.

---

### Task 1: Watchdog Utilities

**Files:**
- Create: `directors-activities-app/netlify/functions/_shared/watchdog-core.js`
- Test: `directors-activities-app/tests/watchdogCore.test.mjs`

- [x] Add tests for Central Time business-hours gating, failure threshold, recovery detection, and journal entry shape.
- [x] Implement pure utility functions for check windows, incident state, and journal formatting.

### Task 2: Scheduled Function

**Files:**
- Create: `directors-activities-app/netlify/functions/spring-watchdog.js`
- Modify: `directors-activities-app/netlify.toml`
- Test: `directors-activities-app/tests/watchdogFunction.test.mjs`

- [x] Add tests that verify the scheduled function uses a 5-minute cron and exposes a manual API path.
- [x] Implement the Netlify function with a schedule, manual endpoint, and safe JSON response.

### Task 3: Journaling And Alerts

**Files:**
- Create: `directors-activities-app/netlify/functions/_shared/watchdog-journal.js`
- Create: `directors-activities-app/scripts/sync-watchdog-obsidian.mjs`
- Test: `directors-activities-app/tests/watchdogJournal.test.mjs`

- [x] Add tests for Supabase payloads, Obsidian markdown formatting, and missing alert configuration.
- [x] Implement Supabase insert/select adapters and an Obsidian sync helper that writes readable markdown when run locally.

### Task 4: Verify And Deploy

**Files:**
- Existing app and Netlify files.

- [x] Run full tests.
- [x] Run targeted lint.
- [x] Build.
- [x] Deploy to Netlify production.
