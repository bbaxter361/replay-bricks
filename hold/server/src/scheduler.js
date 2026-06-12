// Background scheduler — keeps Hold in sync without anyone clicking a button.
// Every N minutes (settings.sync_interval_min):
//   1. Pull orders + inventory from both marketplaces
//   2. Reconcile new orders (decrement cross-marketplace lots; dry_run honors push_mode)
// Also runs a nightly DB backup at ~3am.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, getSetting } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

export class Scheduler {
  constructor(syncEngine, pushEngine) {
    this.sync = syncEngine;
    this.push = pushEngine;
    this.db = getDb();
    this.timer = null;
    this.backupTimer = null;
    this.lastRun = null;
    this.lastResult = null;
    this.running = false;
  }

  start() {
    this._scheduleNext();
    this._scheduleBackup();
    console.log(`⏱  Scheduler started (interval: ${this._intervalMin()}min, push_mode: ${getSetting(this.db, 'push_mode', 'dry_run')})`);
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    if (this.backupTimer) clearTimeout(this.backupTimer);
  }

  _intervalMin() {
    return Math.max(2, parseInt(getSetting(this.db, 'sync_interval_min', '10')) || 10);
  }

  _scheduleNext() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.tick().finally(() => this._scheduleNext()), this._intervalMin() * 60 * 1000);
  }

  async tick() {
    if (this.running) return { skipped: true, reason: 'already running' };
    if (getSetting(this.db, 'auto_sync_enabled', 'true') !== 'true') {
      return { skipped: true, reason: 'auto sync disabled' };
    }

    this.running = true;
    const started = Date.now();
    const result = { sync: null, reconcile: null, errors: [] };

    try {
      try {
        result.sync = await this.sync.syncAll();
      } catch (err) {
        result.errors.push(`sync: ${err.message}`);
      }

      try {
        result.reconcile = await this.push.reconcileAll();
      } catch (err) {
        result.errors.push(`reconcile: ${err.message}`);
      }

      result.duration_ms = Date.now() - started;
      this.lastRun = new Date().toISOString();
      this.lastResult = result;

      const recon = result.reconcile?.count || 0;
      if (recon > 0 || result.errors.length > 0) {
        console.log(`⏱  Tick: reconciled ${recon} orders${result.errors.length ? `, errors: ${result.errors.join(' | ')}` : ''}`);
      }
      return result;
    } finally {
      this.running = false;
    }
  }

  // ---- Nightly backup ----

  _scheduleBackup() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(3, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const ms = next.getTime() - now.getTime();

    this.backupTimer = setTimeout(() => {
      try { this.backup(); } catch (err) { console.error('Backup failed:', err.message); }
      this._scheduleBackup();
    }, ms);
  }

  backup() {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 10);
    const dest = path.join(BACKUP_DIR, `hold-${stamp}.db`);
    this.db.prepare('VACUUM INTO ?').run(dest);

    // Prune old backups
    const keepDays = parseInt(getSetting(this.db, 'backup_keep_days', '14')) || 14;
    const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
    for (const f of fs.readdirSync(BACKUP_DIR)) {
      const fp = path.join(BACKUP_DIR, f);
      if (fs.statSync(fp).mtimeMs < cutoff) fs.unlinkSync(fp);
    }
    console.log(`💾 Backup written: ${dest}`);
    return dest;
  }

  status() {
    return {
      enabled: getSetting(this.db, 'auto_sync_enabled', 'true') === 'true',
      interval_min: this._intervalMin(),
      push_mode: getSetting(this.db, 'push_mode', 'dry_run'),
      running: this.running,
      last_run: this.lastRun,
      last_result: this.lastResult,
    };
  }
}
