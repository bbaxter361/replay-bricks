import { useState, useEffect } from 'react'
import { api } from '../api'
import { Settings as SettingsIcon, Shield, Clock, Database } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [pushStatus, setPushStatus] = useState(null)
  const [schedStatus, setSchedStatus] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    Promise.all([
      api.getSettings().catch(() => ({})),
      api.getPushStatus().catch(() => ({ push_mode: 'unknown' })),
      api.getSchedulerStatus().catch(() => ({ enabled: false })),
    ]).then(([s, p, sc]) => {
      setSettings(s)
      setPushStatus(p)
      setSchedStatus(sc)
    })
  }

  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const form = new FormData(e.target)
      const updates = {
        sync_interval_min: form.get('sync_interval'),
        auto_sync_enabled: form.get('auto_sync') === 'on' ? 'true' : 'false',
        backup_keep_days: form.get('backup_days'),
      }
      await api.updateSettings(updates)
      toast.success('Settings saved')
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const togglePushMode = async () => {
    const newMode = pushStatus.push_mode === 'live' ? 'dry_run' : 'live'
    try {
      await api.setPushMode(newMode)
      toast.success(newMode === 'live' ? '⚠️ Push mode: LIVE — changes will write to BrickLink & BrickOwl' : 'Push mode: dry_run — safe testing mode')
      load()
    } catch (err) { toast.error(err.message) }
  }

  if (!settings) return <div className="text-gray-400 p-8">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configure sync, push mode, and backups</p>
      </div>

      {/* Push Mode */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Shield className={`w-5 h-5 ${pushStatus?.push_mode === 'live' ? 'text-red-400' : 'text-green-400'}`} />
            <div>
              <h3 className="text-white font-medium">Push Mode</h3>
              <p className="text-xs text-gray-500">
                {pushStatus?.push_mode === 'live'
                  ? 'LIVE — changes push to BrickLink & BrickOwl in real-time'
                  : 'Dry-run — writes are simulated & logged, no API calls made'}
              </p>
            </div>
          </div>
          <button
            onClick={togglePushMode}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              pushStatus?.push_mode === 'live'
                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
            }`}
          >
            {pushStatus?.push_mode === 'live' ? 'Switch to Dry-Run' : 'Switch to Live'}
          </button>
        </div>
        {pushStatus?.counts && (
          <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
            {pushStatus.counts.map((c, i) => (
              <div key={i} className="bg-dark-bg rounded-lg p-2 text-center">
                <div className="text-white font-mono">{c.cnt}</div>
                <div className="text-gray-500">{c.mode} / {c.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduler */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <Clock className="w-5 h-5 text-lego-blue" />
          <div>
            <h3 className="text-white font-medium">Background Sync</h3>
            <p className="text-xs text-gray-500">
              {schedStatus?.enabled ? `Runs every ${schedStatus.interval_min}min` : 'Disabled'}
              {schedStatus?.last_run ? ` · Last: ${new Date(schedStatus.last_run).toLocaleTimeString()}` : ''}
            </p>
          </div>
        </div>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sync Interval (minutes)</label>
              <input name="sync_interval" type="number" min="2" defaultValue={settings.sync_interval_min || 10} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Backup Retention (days)</label>
              <input name="backup_days" type="number" min="1" defaultValue={settings.backup_keep_days || 14} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input name="auto_sync" type="checkbox" defaultChecked={settings.auto_sync_enabled !== 'false'} className="rounded bg-dark-bg border-dark-border" />
            Enable automatic background sync
          </label>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-lego-red hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      </div>

      {/* Database */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-gray-400" />
          <div>
            <h3 className="text-white font-medium">Database Backups</h3>
            <p className="text-xs text-gray-500">
              Nightly backups stored locally · Retention: {settings.backup_keep_days || 14} days
            </p>
          </div>
        </div>
        <button
          onClick={() => api.triggerBackup().then(() => toast.success('Backup created')).catch(e => toast.error(e.message))}
          className="mt-3 px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-gray-300 hover:text-white text-sm"
        >
          Backup Now
        </button>
      </div>
    </div>
  )
}
