import { useState, useEffect } from 'react'
import { api } from '../api'
import toast from 'react-hot-toast'

const CHART_COLORS = ['#000080', '#FFD700', '#CC0000', '#006000', '#800080', '#FF8C00', '#FF69B4', '#008080']

export default function Reports() {
  const [data, setData] = useState(null)
  const [activeReport, setActiveReport] = useState('overview')

  useEffect(() => {
    api.getDashboard().then(d => {
      Promise.all([
        api.getReports(),
        api.getOrders({ limit: 200 }),
      ]).then(([reports, orders]) => {
        setData({ ...d.stats, ...reports, orders: orders.orders || [] })
      }).catch(() => {})
    }).catch(() => {})
  }, [])

  if (!data) return <div className="win95-loading" style={{ padding: '32px', color: '#808080' }}>⏳ Loading reports…</div>

  const totalValue = (data.totalValueCents / 100).toFixed(2)
  const totalItems = data.totalItems
  const uniqueParts = data.uniqueParts
  const lowStock = (data.topValue || []).filter(i => i.quantity <= 3).length

  const topItems = (data.topValue || []).slice(0, 10).map((i, idx) => ({
    rank: idx + 1,
    part_no: i.part_no,
    name: i.part_name,
    qty: i.quantity,
    price: (i.unit_price_cents / 100).toFixed(2),
    total: (i.total_cents / 100).toFixed(2),
  }))

  const categoryData = (data.byMarketplace || []).map(m => ({
    name: m.marketplace === 'bricklink' ? 'BrickLink' : m.marketplace === 'brickowl' ? 'BrickOwl' : m.marketplace,
    value: (m.value_cents / 100).toFixed(2),
  }))

  const conditionData = (data.byCondition || []).map(c => ({
    name: c.condition === 'USED' ? 'Used' : c.condition === 'NEW' ? 'New' : c.condition,
    value: c.pieces,
  }))

  const printReport = () => window.print()

  const renderBarChart = (items, labelKey, valueKey, maxBars = 8) => {
    if (!items || items.length === 0) return null
    const maxVal = Math.max(...items.map(i => parseFloat(i[valueKey])))
    return (
      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '120px', paddingTop: '8px' }}>
        {items.slice(0, maxBars).map((item, i) => {
          const val = parseFloat(item[valueKey])
          const pct = maxVal > 0 ? (val / maxVal) * 100 : 0
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '10px', color: '#000080', fontWeight: 'bold' }}>${val.toFixed(0)}</span>
              <div style={{ width: '100%', maxWidth: '48px', height: `${Math.max(pct, 4)}%`, background: CHART_COLORS[i % CHART_COLORS.length], border: '1px solid #000', margin: '2px 0' }} />
              <span style={{ fontSize: '10px', color: '#404040', textAlign: 'center', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item[labelKey]}</span>
            </div>
          )
        })}
      </div>
    )
  }

  const renderPieChart = (items, valueKey) => {
    if (!items || items.length === 0) return null
    const total = items.reduce((s, i) => s + parseFloat(i[valueKey]), 0)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 0' }}>
        <div style={{ display: 'flex', height: '20px', border: '1px solid #000' }}>
          {items.map((item, i) => {
            const pct = total > 0 ? (parseFloat(item[valueKey]) / total) * 100 : 0
            if (pct < 1) return null
            return (
              <div key={i} style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length], borderRight: i < items.length - 1 ? '1px solid #000' : 'none' }} title={`${item.name}: ${pct.toFixed(1)}%`} />
            )
          })}
        </div>
        {items.map((item, i) => {
          const pct = total > 0 ? (parseFloat(item[valueKey]) / total) * 100 : 0
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <span style={{ width: '10px', height: '10px', background: CHART_COLORS[i % CHART_COLORS.length], border: '1px solid #000', flexShrink: 0 }} />
              <span style={{ color: '#000' }}>{item.name}</span>
              <span style={{ color: '#404040' }}>{pct.toFixed(1)}% ({item[valueKey]})</span>
            </div>
          )
        })}
      </div>
    )
  }

  const reportTabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'value', label: '💰 Value' },
    { id: 'conditions', label: '🏷️ Conditions' },
    { id: 'items', label: '📋 Top Items' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div className="win95-section-title">📊 Inventory Reports</div>
        <div className="win95-section-desc">Detailed analysis of your inventory — value breakdown, condition distribution, and top-value items.</div>
      </div>
      <hr className="win95-divider" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#000' }}>🗂️ {data.totalItems || 0} items tracked</span>
        <button onClick={printReport} className="win95-button">🖨️ Print Report</button>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div className="win95-stat-card"><div className="stat-value">${totalValue}</div><div className="stat-label">Total Value</div></div>
        <div className="win95-stat-card"><div className="stat-value">{totalItems}</div><div className="stat-label">Total Pieces</div></div>
        <div className="win95-stat-card"><div className="stat-value">{uniqueParts}</div><div className="stat-label">Unique Parts</div></div>
        <div className="win95-stat-card"><div className="stat-value" style={{ color: lowStock > 0 ? '#CC0000' : '#000080' }}>{lowStock}</div><div className="stat-label">Low Stock (&le;3)</div></div>
      </div>

      <div className="win95-tabs">
        {reportTabs.map(tab => (
          <div key={tab.id} className={`win95-tab ${activeReport === tab.id ? 'active' : ''}`} onClick={() => setActiveReport(tab.id)}>{tab.label}</div>
        ))}
      </div>

      {activeReport === 'overview' && (
        <div className="win95-groupbox">
          <legend>📊 Inventory Overview</legend>
          <p style={{ fontSize: '12px', color: '#404040', marginBottom: '8px' }}>
            Your inventory currently contains <strong>{uniqueParts}</strong> unique parts across <strong>{totalItems}</strong> total pieces, valued at approximately <strong>${totalValue}</strong>.
            {lowStock > 0 && ` ${lowStock} item${lowStock > 1 ? 's are' : ' is'} low on stock.`}
          </p>
          {topItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              <span style={{ fontWeight: 'bold', color: '#000' }}>Top 3 Most Valuable Items:</span>
              {topItems.slice(0, 3).map(item => (
                <div key={item.rank} style={{ display: 'flex', gap: '8px', color: '#404040' }}>
                  <span style={{ color: '#000080' }}>#{item.rank}</span>
                  <span style={{ fontFamily: '"Courier New", monospace', color: '#000080' }}>{item.part_no}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  <span style={{ fontWeight: 'bold', color: '#000080' }}>${item.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeReport === 'value' && (
        <div className="win95-groupbox">
          <legend>💰 Value by Marketplace</legend>
          {categoryData.length > 0 ? renderBarChart(categoryData, 'name', 'value') : (
            <p style={{ fontSize: '12px', color: '#808080', textAlign: 'center', padding: '16px' }}>No marketplace data available yet. Sync your listings to see value breakdown.</p>
          )}
        </div>
      )}

      {activeReport === 'conditions' && (
        <div className="win95-groupbox">
          <legend>🏷️ Condition Breakdown</legend>
          {conditionData.length > 0 ? renderPieChart(conditionData, 'value') : (
            <p style={{ fontSize: '12px', color: '#808080', textAlign: 'center', padding: '16px' }}>No condition data available yet.</p>
          )}
        </div>
      )}

      {activeReport === 'items' && (
        <div className="win95-groupbox">
          <legend>📋 Most Valuable Items</legend>
          {topItems.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="win95-table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Part #</th>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Name</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px' }}>Price</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px' }}>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.map(item => (
                    <tr key={item.rank}>
                      <td style={{ padding: '4px 8px' }}>{item.rank}</td>
                      <td style={{ padding: '4px 8px', fontFamily: '"Courier New", monospace', color: '#000080' }}>{item.part_no}</td>
                      <td style={{ padding: '4px 8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name || '—'}</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.qty}</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right' }}>${item.price}</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', color: '#000080' }}>${item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: '#808080', textAlign: 'center', padding: '16px' }}>No items to display. Import inventory to see your most valuable parts.</p>
          )}
        </div>
      )}
    </div>
  )
}
