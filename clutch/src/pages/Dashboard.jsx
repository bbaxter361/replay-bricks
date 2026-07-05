import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const STATUS_STYLE = {
  'pending': { color: '#000' },
  'paid': { color: '#000080', fontWeight: 'bold' },
  'picked': { color: '#000080' },
  'packed': { color: '#000080' },
  'shipped': { color: '#006000', fontWeight: 'bold' },
  'delivered': { color: '#006000' },
  'cancelled': { color: '#CC0000' },
}

export default function Dashboard() {
  const [stats, setStats] = useState({ totalItems: 0, uniqueParts: 0, totalOrders: 0, pendingOrders: 0, totalValueCents: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [recentSyncs, setRecentSyncs] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadDashboard = async () => {
    try {
      const data = await api.getDashboard()
      setStats(data.stats)
      setRecentOrders(data.recentOrders || [])
      setRecentSyncs(data.recentSyncs || [])
    } catch (err) { console.error('Failed to load dashboard:', err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadDashboard() }, [])

  const handleSync = async () => {
    setSyncing(true)
    try { await api.syncAll(); await loadDashboard() }
    catch (err) { console.error('Sync failed:', err) }
    finally { setSyncing(false) }
  }

  const timeAgo = (ts) => {
    if (!ts) return ''
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
    if (diff < 1) return 'just now'
    if (diff < 60) return `${diff}m ago`
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`
  }

  // Order pipeline stats
  const pipelineStages = ['pending', 'paid', 'picked', 'packed', 'shipped', 'delivered']
  const pipelineCounts = {}
  const totalPipeline = recentOrders.length
  if (recentOrders.length > 0) {
    for (const o of recentOrders) {
      pipelineCounts[o.status] = (pipelineCounts[o.status] || 0) + 1
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <span className="win95-loading" style={{ fontSize: '32px' }}>⏳</span>
        <p style={{ marginTop: '12px' }}>Loading dashboard data...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* ── SECTION: Overview ── */}
      <div>
        <div className="win95-section-title">📊 Dashboard</div>
        <div className="win95-section-desc">Your daily action items — inventory stats, pending orders, and quick links to keep your LEGO business moving.</div>
      </div>

      <hr className="win95-divider" />

      {/* ── Stat Cards Row ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link to="/inventory" style={{ textDecoration: 'none' }} className="win95-stat-card" title="View Inventory">
          <div className="stat-value">{stats.totalItems.toLocaleString()}</div>
          <div className="stat-label">{stats.uniqueParts} unique parts in stock</div>
        </Link>
        <div className="win95-stat-card">
          <div className="stat-value">${(stats.totalValueCents / 100).toFixed(0)}</div>
          <div className="stat-label">Total inventory value</div>
        </div>
        <Link to="/orders" style={{ textDecoration: 'none' }} className="win95-stat-card" title="View Orders">
          <div className="stat-value" style={stats.pendingOrders > 0 ? { color: '#CC0000', animation: 'none' } : {}}>
            {stats.pendingOrders > 0 && '⚠ '}{stats.pendingOrders}
          </div>
          <div className="stat-label" style={stats.pendingOrders > 0 ? { fontWeight: 'bold', color: '#CC0000' } : {}}>
            {stats.pendingOrders > 0 ? '⚠ Orders need your attention' : 'No pending orders'}
          </div>
        </Link>
        <div className="win95-stat-card">
          <div className="stat-value">{stats.totalOrders}</div>
          <div className="stat-label">Total orders all time</div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <div className="win95-section-title">⚡ Quick Actions</div>
        <div className="win95-section-desc">Common tasks — click to jump directly to the right page.</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
          <Link to="/inventory" className="win95-quick-action">
            <span className="win95-quick-action-icon">📦</span>
            <span>Inventory</span>
          </Link>
          <Link to="/orders" className="win95-quick-action">
            <span className="win95-quick-action-icon">📋</span>
            <span>Orders</span>
          </Link>
          <Link to="/part-out" className="win95-quick-action">
            <span className="win95-quick-action-icon">🧩</span>
            <span>Part-Out Set</span>
          </Link>
          <button onClick={handleSync} disabled={syncing} className="win95-quick-action">
            <span className="win95-quick-action-icon">{syncing ? '⏳' : '🔄'}</span>
            <span>{syncing ? 'Syncing...' : 'Sync All'}</span>
          </button>
          <Link to="/marketplaces" className="win95-quick-action">
            <span className="win95-quick-action-icon">🏪</span>
            <span>Marketplaces</span>
          </Link>
          <Link to="/pricing" className="win95-quick-action">
            <span className="win95-quick-action-icon">💰</span>
            <span>Pricing</span>
          </Link>
        </div>
      </div>

      <hr className="win95-divider" />

      {/* ── Recent Orders ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div className="win95-section-title">📋 Recent Orders</div>
            <div className="win95-section-desc">Your most recent marketplace orders — click View All to manage them.</div>
          </div>
          <Link to="/orders" className="win95-button win95-button-sm">View All →</Link>
        </div>

        {recentOrders.length > 0 && (
          <div className="win95-panel" style={{ padding: '8px 12px', marginTop: '8px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', marginRight: '8px' }}>Pipeline:</span>
              {pipelineStages.map(s => {
                const count = pipelineCounts[s] || 0
                const width = totalPipeline > 0 ? Math.max(count / totalPipeline * 100, 2) : 0
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{
                      height: '14px', 
                      width: `${Math.max(width * 3, 20)}px`,
                      background: s === 'shipped' || s === 'delivered' ? '#006000' : s === 'cancelled' ? '#CC0000' : '#000080',
                      border: '1px solid #808080',
                      display: 'inline-block',
                      minWidth: '8px'
                    }} />
                    <span style={{ fontSize: '10px' }}>{count}</span>
                  </div>
                )
              })}
              <span style={{ fontSize: '10px', color: '#808080', marginLeft: '4px' }}>{totalPipeline} total</span>
            </div>
          </div>
        )}

        {recentOrders.length === 0 ? (
          <div className="win95-panel" style={{ padding: '16px', textAlign: 'center', color: '#808080' }}>
            <p>No orders yet. Sync your marketplaces to import orders.</p>
          </div>
        ) : (
          <table className="win95-table" style={{ marginTop: '4px' }}>
            <thead>
              <tr>
                <th>Buyer</th><th>MP</th><th>Date</th><th>Total</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.buyer_name || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{order.marketplace?.slice(0, 4)}</td>
                  <td>{order.order_date || '—'}</td>
                  <td>${((order.total_price_cents || 0) / 100).toFixed(2)}</td>
                  <td><span className="win95-badge" style={STATUS_STYLE[order.status] || {}}>{order.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <hr className="win95-divider" />

      {/* ── Recent Syncs ── */}
      <div>
        <div className="win95-section-title">🔄 Recent Syncs</div>
        <div className="win95-section-desc">Sync history from BrickLink and BrickOwl — runs automatically every 15 minutes.</div>

        {recentSyncs.length === 0 ? (
          <div className="win95-panel" style={{ padding: '16px', textAlign: 'center', color: '#808080' }}>
            <p>No syncs performed yet. Click Sync All above.</p>
          </div>
        ) : (
          <table className="win95-table" style={{ marginTop: '4px' }}>
            <thead>
              <tr>
                <th>Marketplace</th><th>Type</th><th>When</th><th>Result</th>
              </tr>
            </thead>
            <tbody>
              {recentSyncs.map(sync => (
                <tr key={sync.id}>
                  <td style={{ textTransform: 'capitalize' }}>{sync.marketplace}</td>
                  <td>{sync.sync_type}</td>
                  <td>{timeAgo(sync.started_at)}</td>
                  <td>
                    <span className="win95-badge" style={sync.status === 'failed' ? { color: '#CC0000', fontWeight: 'bold' } : sync.status === 'success' ? { color: '#006000' } : {}}>
                      {sync.status === 'success' ? '✓' : '✗'} {sync.items_processed || 0} items
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
