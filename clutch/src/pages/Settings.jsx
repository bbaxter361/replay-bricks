import { useState, useEffect } from 'react'
import { api } from '../api'
import toast from 'react-hot-toast'

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [pushStatus, setPushStatus] = useState(null)
  const [schedStatus, setSchedStatus] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState({ bricklink: false, brickowl: false })

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

  if (!settings) return <div className="win95-loading" style={{ padding: '32px', color: '#808080' }}>⏳ Loading…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div className="win95-section-title">⚙️ Settings</div>
        <div className="win95-section-desc">Configure marketplace connections, sync behaviour, push mode, and backup preferences for Clutch.</div>
      </div>

      <hr className="win95-divider" />

      {/* ── Push Mode ── */}
      <div className="win95-groupbox">
        <legend>🚦 Push Mode</legend>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>{pushStatus?.push_mode === 'live' ? '🔴' : '🟢'}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#000' }}>
                {pushStatus?.push_mode === 'live' ? 'LIVE' : 'Dry-Run'}
              </div>
              <div style={{ fontSize: '11px', color: '#404040' }}>
                {pushStatus?.push_mode === 'live'
                  ? 'Changes push to BrickLink & BrickOwl in real-time'
                  : 'Writes are simulated & logged, no API calls made'}
              </div>
            </div>
          </div>
          <button onClick={togglePushMode} className="win95-button">
            {pushStatus?.push_mode === 'live' ? '🔇 Switch to Dry-Run' : '🔴 Switch to Live'}
          </button>
        </div>
        {pushStatus?.counts && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {pushStatus.counts.map((c, i) => (
              <div key={i} className="win95-stat-card" style={{ padding: '6px 12px', minWidth: '80px' }}>
                <div className="stat-value" style={{ fontSize: '16px' }}>{c.cnt}</div>
                <div className="stat-label">{c.mode} / {c.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Marketplace API Keys ── */}
      <div className="win95-groupbox">
        <legend>🔑 Marketplace API Keys</legend>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['bricklink', 'brickowl'].map(mp => {
            const shown = showApiKeys[mp]
            const keyName = mp === 'bricklink' ? 'BrickLink' : 'BrickOwl'
            const apiKey = settings[`${mp}_api_key`]
            const apiSecret = settings[`${mp}_api_secret`]
            return (
              <div key={mp} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
                <span style={{ fontSize: '18px' }}>{mp === 'bricklink' ? '🔵' : '🟠'}</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#000', minWidth: '80px' }}>{keyName}</span>
                <span style={{ fontSize: '12px', color: apiKey ? '#006000' : '#CC0000' }}>
                  {apiKey ? '● Configured' : '○ Not configured'}
                </span>
                <button
                  onClick={() => setShowApiKeys(prev => ({ ...prev, [mp]: !prev[mp] }))}
                  className="win95-button"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                >
                  {shown ? '🙈 Hide' : '👁️ Show'}
                </button>
                {shown && (
                  <div style={{ fontSize: '11px', color: '#404040' }}>
                    Key: {apiKey || '—'} | Secret: {apiSecret ? '****' : '—'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Background Sync ── */}
      <div className="win95-groupbox">
        <legend>⏰ Background Sync</legend>
        <div style={{ fontSize: '12px', color: '#404040', marginBottom: '8px' }}>
          {schedStatus?.enabled ? `🔄 Runs every ${schedStatus.interval_min}min` : '⏹️ Disabled'}
          {schedStatus?.last_run ? ` · Last run: ${new Date(schedStatus.last_run).toLocaleTimeString()}` : ''}
        </div>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: '#000', minWidth: '100px' }}>Sync Interval (min):</label>
              <input name="sync_interval" type="number" min="2" defaultValue={settings.sync_interval_min || 10} className="win95-input" style={{ width: '80px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: '#000', minWidth: '100px' }}>Backup Retention (days):</label>
              <input name="backup_days" type="number" min="1" defaultValue={settings.backup_keep_days || 14} className="win95-input" style={{ width: '80px' }} />
            </div>
          </div>
          <label className="win95-checkbox" style={{ fontSize: '12px' }}>
            <input name="auto_sync" type="checkbox" defaultChecked={settings.auto_sync_enabled !== 'false'} />
            Enable automatic background sync
          </label>
          <div>
            <button type="submit" disabled={saving} className="win95-button">
              {saving ? '⏳ Saving…' : '💾 Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Database Backups ── */}
      <div className="win95-groupbox">
        <legend>💾 Database Backups</legend>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000' }}>Nightly Backups</div>
            <div style={{ fontSize: '11px', color: '#404040' }}>
              Stored locally · Retention: {settings.backup_keep_days || 14} days
            </div>
          </div>
          <button
            onClick={() => api.triggerBackup().then(() => toast.success('✅ Backup created')).catch(e => toast.error(e.message))}
            className="win95-button"
          >
            📦 Backup Now
          </button>
        </div>
      </div>
    </div>
  )
}
