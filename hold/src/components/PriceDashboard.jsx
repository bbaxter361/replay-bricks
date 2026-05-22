import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, Minus, Database, Clock } from 'lucide-react'
import { api } from '../api'
import './PriceDashboard.css'

export default function PriceDashboard() {
  const [summary, setSummary] = useState([])
  const [freshness, setFreshness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

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

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
    case 'overpriced': return <TrendingUp className="w-4 h-4 text-red-500" />
    case 'underpriced': return <TrendingDown className="w-4 h-4 text-green-500" />
    case 'ok': return <Minus className="w-4 h-4 text-gray-400" />
    default: return <Minus className="w-4 h-4 text-gray-600" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-lego-red border-t-transparent rounded-full" />
          <p className="text-gray-400 text-sm">Loading price data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Price Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Compare your prices against BrickLink market averages
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-lego-red hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Prices'}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Freshness Badge */}
      {freshness && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Database className="w-4 h-4" />
              Total Cached
            </div>
            <p className="text-2xl font-bold text-white">{freshness.totalCachedItems}</p>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-400 text-xs mb-1">
              <Clock className="w-4 h-4" />
              Fresh (&lt;1h)
            </div>
            <p className="text-2xl font-bold text-green-400">{freshness.cachedWithin1Hour}</p>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-yellow-400 text-xs mb-1">
              <Clock className="w-4 h-4" />
              Within 24h
            </div>
            <p className="text-2xl font-bold text-yellow-400">{freshness.cachedWithin24Hours}</p>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-400 text-xs mb-1">
              <Clock className="w-4 h-4" />
              Stale (&gt;24h)
            </div>
            <p className="text-2xl font-bold text-red-400">{freshness.staleItems}</p>
          </div>
        </div>
      )}

      {/* Price Table */}
      {summary.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-xl p-12 text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-500">No price data available</p>
          <p className="text-gray-600 text-sm mt-1">
            Import inventory and run a price refresh to see data here.
          </p>
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm price-dashboard-table">
              <thead>
                <tr className="border-b border-dark-border bg-dark-surface/50">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Part No</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Condition</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Our Price</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Market Avg</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Min</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Max</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Delta %</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Qty Avail</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((item, idx) => {
                  const rowClass = item.status === 'overpriced'
                    ? 'alert-overpriced'
                    : item.status === 'underpriced'
                      ? 'alert-underpriced'
                      : ''

                  const deltaClass = item.delta > 0
                    ? 'delta above'
                    : item.delta < 0
                      ? 'delta below'
                      : 'delta'

                  return (
                    <tr key={`${item.part_no}-${item.color_id || idx}`} className={`${rowClass} border-b border-dark-border/50 hover:brightness-95 transition-all`}>
                      <td className="py-3 px-4 font-mono text-lego-red text-xs">{item.part_no}</td>
                      <td className="py-3 px-4 text-white max-w-[200px] truncate" title={item.part_name}>
                        {item.part_name || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.condition === 'USED'
                            ? 'bg-blue-900/30 text-blue-300'
                            : 'bg-purple-900/30 text-purple-300'
                        }`}>
                          {item.condition || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-white font-medium tabular-nums">
                        {item.ourPrice || '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300 tabular-nums">
                        {item.marketAvg || '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500 tabular-nums">—</td>
                      <td className="py-3 px-4 text-right text-gray-500 tabular-nums">—</td>
                      <td className={`py-3 px-4 text-right tabular-nums ${deltaClass}`}>
                        {item.delta != null ? (
                          <span className="flex items-center justify-end gap-1">
                            {item.delta > 0 ? '+' : ''}{item.delta}%
                            {getStatusIcon(item.status)}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300 tabular-nums">
                        {item.quantity ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      {summary.length > 0 && (
        <div className="flex gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-200" /> Overpriced (&gt;20% above market)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-100 border border-green-200" /> Underpriced (&gt;20% below market)
          </span>
        </div>
      )}
    </div>
  )
}
