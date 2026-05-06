import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingCart, AlertTriangle, DollarSign, Plus, Upload, Puzzle, TrendingUp, RefreshCw } from 'lucide-react'
import { api } from '../api'

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
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDashboard() }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await api.syncAll()
      await loadDashboard()
    } catch (err) {
      console.error('Sync failed:', err)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-lego-red border-t-transparent rounded-full" />
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-white font-semibold">Dashboard</h3>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-1.5 bg-lego-red hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
      <p className="text-gray-400 text-sm">Welcome back, Brian! Here's your inventory overview.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Items</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalItems.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.uniqueParts} unique parts</p>
            </div>
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Value</p>
              <p className="text-2xl font-bold text-white mt-1">${(stats.totalValueCents / 100).toFixed(2)}</p>
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Synced from marketplaces
              </p>
            </div>
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending Orders</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.pendingOrders}</p>
              <p className="text-xs text-yellow-400 mt-1">Orders needing action</p>
            </div>
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalOrders}</p>
              <p className="text-xs text-red-400 mt-1">Total all time</p>
            </div>
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Recent Orders</h3>
          <Link to="/orders" className="text-xs text-lego-red hover:text-red-400">View All</Link>
        </div>
        <div className="space-y-3">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No orders yet</p>
          ) : (
            recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{order.buyer_name}</p>
                  <p className="text-xs text-gray-500">{order.marketplace} · {order.order_date || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">${(order.total_price_cents / 100).toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === 'shipped' || order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                    order.status === 'paid' ? 'bg-blue-500/20 text-blue-400' :
                    order.status === 'packed' ? 'bg-yellow-500/20 text-yellow-400' :
                    order.status === 'pending' ? 'bg-purple-500/20 text-purple-400' :
                    order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>{order.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Recent Syncs</h3>
        </div>
        <div className="space-y-3">
          {recentSyncs.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No syncs performed yet. Click "Sync Now" above.</p>
          ) : (
            recentSyncs.map(sync => (
              <div key={sync.id} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-white capitalize">{sync.marketplace} — {sync.sync_type}</p>
                  <p className="text-xs text-gray-500">{sync.started_at}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    sync.status === 'success' ? 'bg-green-500/20 text-green-400' :
                    sync.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {sync.status} · {sync.items_processed} items
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/inventory" className="flex flex-col items-center gap-2 p-4 bg-dark-surface rounded-lg border border-dark-border hover:border-lego-red/50 transition-colors">
            <Plus className="w-6 h-6 text-lego-red" />
            <span className="text-xs text-gray-400">Add Item</span>
          </Link>
          <Link to="/part-out" className="flex flex-col items-center gap-2 p-4 bg-dark-surface rounded-lg border border-dark-border hover:border-lego-red/50 transition-colors">
            <Puzzle className="w-6 h-6 text-lego-gold" />
            <span className="text-xs text-gray-400">New Part-Out</span>
          </Link>
          <Link to="/inventory" className="flex flex-col items-center gap-2 p-4 bg-dark-surface rounded-lg border border-dark-border hover:border-lego-red/50 transition-colors">
            <Upload className="w-6 h-6 text-blue-400" />
            <span className="text-xs text-gray-400">Import CSV</span>
          </Link>
          <Link to="/marketplaces" className="flex flex-col items-center gap-2 p-4 bg-dark-surface rounded-lg border border-dark-border hover:border-lego-red/50 transition-colors">
            <ShoppingCart className="w-6 h-6 text-green-400" />
            <span className="text-xs text-gray-400">View Orders</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
