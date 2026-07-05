import { useState, useEffect } from 'react'
import { api } from '../api'

export default function Marketplaces() {
  const [status, setStatus] = useState(null)
  const [lots, setLots] = useState({ bricklink: [], brickowl: [] })
  const [syncing, setSyncing] = useState(null)
  const [syncTimes, setSyncTimes] = useState({})

  useEffect(() => {
    api.status().then(s => {
      setStatus(s)
      if (s.bricklink) api.getMarketplaceLots('bricklink').then(l => setLots(prev => ({ ...prev, bricklink: l }))).catch(() => {})
      if (s.brickowl) api.getMarketplaceLots('brickowl').then(l => setLots(prev => ({ ...prev, brickowl: l }))).catch(() => {})
    }).catch(() => {})
  }, [])

  const sync = async (marketplace) => {
    setSyncing(marketplace)
    try {
      await api.sync(marketplace, 'all')
      setSyncTimes(prev => ({ ...prev, [marketplace]: new Date().toLocaleTimeString() }))
      const fresh = await api.getMarketplaceLots(marketplace)
      setLots(prev => ({ ...prev, [marketplace]: fresh }))
    } catch (e) {
      // error handled silently
    } finally {
      setSyncing(null)
    }
  }

  const mpConfig = {
    bricklink: { name: 'BrickLink', color: '#1E90FF', icon: '🔵' },
    brickowl: { name: 'Brick Owl', color: '#FF8C00', icon: '🟠' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div className="win95-section-title">🏪 Marketplaces</div>
        <div className="win95-section-desc">Connected stores and their live listing counts — sync to pull the latest inventory and orders from BrickLink and BrickOwl.</div>
      </div>

      <hr className="win95-divider" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {['bricklink', 'brickowl'].map(mp => {
          const connected = status ? status[mp] : false
          const cfg = mpConfig[mp]
          const mpLots = lots[mp] || []
          const totalQty = mpLots.reduce((s, l) => s + (l.quantity || 0), 0)
          const totalValue = mpLots.reduce((s, l) => s + (l.quantity || 0) * (l.unit_price_cents || 0), 0)
          const lastSync = syncTimes[mp]

          return (
            <div key={mp} className="win95-window" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>{cfg.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000' }}>{cfg.name}</h3>
                    <p style={{ fontSize: '12px', color: connected ? '#006000' : '#CC0000' }}>
                      {connected ? '● Connected' : '○ Not connected — configure in Settings'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {connected && lastSync && (
                    <span style={{ fontSize: '11px', color: '#808080' }}>Last sync: {lastSync}</span>
                  )}
                  <button 
                    onClick={() => sync(mp)} 
                    disabled={!connected || syncing === mp}
                    className="win95-button"
                  >
                    {syncing === mp ? '⏳ Syncing...' : '🔄 Sync'}
                  </button>
                </div>
              </div>

              {connected && mpLots.length > 0 && (
                <>
                  <hr className="win95-divider" />
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#000080' }}>{mpLots.length}</span>
                      <span style={{ fontSize: '12px', color: '#404040', marginLeft: '6px' }}>listings</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#000080' }}>{totalQty}</span>
                      <span style={{ fontSize: '12px', color: '#404040', marginLeft: '6px' }}>total items</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#000080' }}>${(totalValue / 100).toFixed(0)}</span>
                      <span style={{ fontSize: '12px', color: '#404040', marginLeft: '6px' }}>total value</span>
                    </div>
                  </div>
                </>
              )}

              {connected && mpLots.length === 0 && (
                <div style={{ padding: '12px', textAlign: 'center', color: '#808080' }}>
                  <p>No listings synced yet. Click Sync to pull your {cfg.name} inventory.</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {status && !status.bricklink && !status.brickowl && (
        <div className="win95-window" style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>🔌</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>No Marketplaces Connected</p>
          <p style={{ fontSize: '12px', color: '#404040', maxWidth: '400px', margin: '0 auto 16px' }}>
            Add your BrickLink and BrickOwl API keys in Settings to sync your inventory and orders automatically.
          </p>
          <button onClick={() => window.location.href = '/settings'} className="win95-button">
            ⚙️ Go to Settings
          </button>
        </div>
      )}
    </div>
  )
}
