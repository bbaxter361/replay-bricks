import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import './PriceDashboard.css'

export default function PriceDashboard() {
  const [summary, setSummary] = useState([])
  const [freshness, setFreshness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [filterCond, setFilterCond] = useState('all')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [summaryData, freshnessData] = await Promise.all([
        api.getPriceSummary(),
        api.getPriceFreshness()
      ])
      setSummary(summaryData)
      setFreshness(freshnessData)
    } catch (err) {
      setError(err.message || 'Failed to load price data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await api.refreshPrices('USED')
      await fetchData()
    } catch (err) {
      setError(err.message || 'Failed to refresh prices')
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'overpriced': return <span style={{ color: '#CC0000' }}>📈</span>
      case 'underpriced': return <span style={{ color: '#006000' }}>📉</span>
      case 'ok': return <span style={{ color: '#808080' }}>➖</span>
      default: return <span style={{ color: '#808080' }}>➖</span>
    }
  }

  const formatCachedTime = (isoString) => {
    if (!isoString) return '—'
    const d = new Date(isoString + 'Z')
    const now = new Date()
    const diffMs = now - d
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHrs = Math.floor(diffMin / 60)
    if (diffHrs < 24) return `${diffHrs}h ago`
    const diffDays = Math.floor(diffHrs / 24)
    return `${diffDays}d ago`
  }

  const filteredSummary = filterCond === 'all'
    ? summary
    : summary.filter(i => (i.condition || '').toLowerCase() === filterCond)

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <div className="win95-loading" style={{ color: '#808080' }}>⏳ Loading price data...</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div className="win95-section-title">📈 Price Dashboard</div>
        <div className="win95-section-desc">Compare your prices against BrickLink market averages — see at a glance which items need re-pricing.</div>
      </div>

      <hr className="win95-divider" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#000' }}>📊 {summary.length} item{summary.length !== 1 ? 's' : ''} tracked</span>
        <button onClick={handleRefresh} disabled={refreshing} className="win95-button">
          {refreshing ? '⏳ Refreshing...' : '🔄 Refresh Prices'}
        </button>
      </div>

      {error && (
        <div className="win95-window" style={{ padding: '12px', background: '#FFE0E0' }}>
          <span style={{ color: '#CC0000', fontSize: '12px' }}>⚠️ {error}</span>
        </div>
      )}

      {freshness && (
        <div className="win95-groupbox">
          <legend>📦 Cache Freshness</legend>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="win95-stat-card">
              <div className="stat-value">{freshness.totalCachedItems}</div>
              <div className="stat-label">Total Cached</div>
            </div>
            <div className="win95-stat-card">
              <div className="stat-value" style={{ color: '#006000' }}>{freshness.cachedWithin1Hour}</div>
              <div className="stat-label">Fresh (&lt;1h)</div>
            </div>
            <div className="win95-stat-card">
              <div className="stat-value" style={{ color: '#808000' }}>{freshness.cachedWithin24Hours}</div>
              <div className="stat-label">Within 24h</div>
            </div>
            <div className="win95-stat-card">
              <div className="stat-value" style={{ color: '#CC0000' }}>{freshness.staleItems}</div>
              <div className="stat-label">Stale (&gt;24h)</div>
            </div>
          </div>
        </div>
      )}

      {summary.length > 0 && (
        <div className="win95-groupbox">
          <legend>🔍 Filters</legend>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#000' }}>Condition:</span>
            <select value={filterCond} onChange={e => setFilterCond(e.target.value)} className="win95-select" style={{ fontSize: '12px' }}>
              <option value="all">All</option>
              <option value="new">🆕 New</option>
              <option value="used">♻️ Used</option>
            </select>
          </div>
        </div>
      )}

      {filteredSummary.length === 0 ? (
        <div className="win95-window" style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '24px', marginBottom: '8px' }}>📈</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>No Price Data Available</p>
          <p style={{ fontSize: '12px', color: '#404040', maxWidth: '400px', margin: '0 auto' }}>
            Import inventory and run a price refresh to see market comparisons here.
          </p>
        </div>
      ) : (
        <div className="win95-window" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="win95-table price-dashboard-table" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Part No</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Condition</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Our Price</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Market Avg</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Delta %</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummary.map((item, idx) => {
                  const isOverpriced = item.status === 'overpriced'
                  const isUnderpriced = item.status === 'underpriced'
                  const rowBg = isOverpriced ? '#3b1515' : isUnderpriced ? '#0f2b1a' : ''
                  return (
                    <tr key={`${item.part_no}-${item.color_id || idx}`} style={{ background: rowBg }}
                        className={isOverpriced ? 'alert-overpriced' : isUnderpriced ? 'alert-underpriced' : ''}>
                      <td style={{ padding: '6px 8px', fontFamily: '"Courier New", monospace', color: '#000080' }}>{item.part_no}</td>
                      <td style={{ padding: '6px 8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.part_name || '—'}</td>
                      <td style={{ padding: '6px 8px' }}><span className="win95-badge">{item.condition || '—'}</span></td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>{item.ourPrice || '—'}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.marketAvg || '—'}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: item.delta > 0 ? 'bold' : 'normal', color: item.delta > 0 ? '#CC0000' : item.delta < 0 ? '#006000' : '#808080' }}>
                        {item.delta != null ? (
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                            {item.delta > 0 ? '+' : ''}{item.delta}% {getStatusIcon(item.status)}
                          </span>
                        ) : <span style={{ color: '#808080' }}>—</span>}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.quantity ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {summary.length > 0 && (
        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#404040', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', background: '#CC0000', display: 'inline-block', border: '1px solid #000' }} />
            Overpriced (&gt;20% above market)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', background: '#006000', display: 'inline-block', border: '1px solid #000' }} />
            Underpriced (&gt;20% below market)
          </span>
        </div>
      )}
    </div>
  )
}
