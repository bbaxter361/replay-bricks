import { useState, useEffect } from 'react'
import { Search, Eye, Package, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../api'

const STATUS_COLORS = {
  'pending': 'bg-purple-500/20 text-purple-400',
  'paid': 'bg-blue-500/20 text-blue-400',
  'picked': 'bg-cyan-500/20 text-cyan-400',
  'packed': 'bg-yellow-500/20 text-yellow-400',
  'shipped': 'bg-green-500/20 text-green-400',
  'delivered': 'bg-emerald-500/20 text-emerald-400',
  'cancelled': 'bg-red-500/20 text-red-400',
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 50 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const data = await api.getOrders(params)
      setOrders(data.orders)
      setTotalPages(data.pages)
    } catch (err) {
      console.error('Failed to load orders:', err)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [page, statusFilter])

  const handleSearch = () => { setPage(1); loadOrders() }

  const viewOrder = async (order) => {
    setSelectedOrder(order)
    try {
      const data = await api.getOrder(order.id)
      setOrderItems(data.items || [])
    } catch {
      setOrderItems([])
    }
  }

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus)
      toast.success(`Order #${orderId} marked as ${newStatus}`)
      loadOrders()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }))
      }
    } catch (err) {
      toast.error(`Failed to update: ${err.message}`)
    }
  }

  const nextStatus = (current) => {
    const flow = ['pending', 'paid', 'picked', 'packed', 'shipped', 'delivered']
    const idx = flow.indexOf(current)
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-gray-400 text-sm mt-1">{orders.length} orders loaded</p>
        </div>
        <button onClick={loadOrders} className="flex items-center gap-1.5 bg-dark-surface hover:bg-dark-border text-gray-300 px-3 py-2 rounded-lg text-sm border border-dark-border transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-dark-card border border-dark-border rounded-xl p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by order ID or buyer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lego-red"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-lego-red">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="picked">Picked</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-lego-red border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No orders found</p>
            <p className="text-xs mt-1">Sync your marketplaces to import orders</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-border bg-dark-surface">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Buyer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Marketplace</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-dark-surface/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-lego-red font-medium">{order.order_id}</td>
                      <td className="px-4 py-3 text-sm text-white">{order.buyer_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-dark-surface text-gray-300 capitalize">
                          {order.marketplace}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{order.order_date || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{order.total_items || order.items_count || 0}</td>
                      <td className="px-4 py-3 text-sm text-green-400 font-medium">${(order.total_price_cents / 100).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => viewOrder(order)} className="p-1.5 text-gray-500 hover:text-white hover:bg-dark-bg rounded transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-dark-border">
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="px-3 py-1 text-sm bg-dark-bg border border-dark-border rounded-lg disabled:opacity-30 text-gray-300">Previous</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                    className="px-3 py-1 text-sm bg-dark-bg border border-dark-border rounded-lg disabled:opacity-30 text-gray-300">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-dark-card border-b border-dark-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Order #{selectedOrder.order_id}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-white p-1">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Buyer</p>
                  <p className="text-sm text-white font-medium">{selectedOrder.buyer_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Marketplace</p>
                  <p className="text-sm text-white capitalize">{selectedOrder.marketplace}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Total</p>
                  <p className="text-sm text-green-400 font-bold">${(selectedOrder.total_price_cents / 100).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Shipping</p>
                  <p className="text-sm text-gray-300">${(selectedOrder.shipping_cents / 100).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Date</p>
                  <p className="text-sm text-gray-300">{selectedOrder.order_date || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Tracking</p>
                  <p className="text-sm text-gray-300">{selectedOrder.tracking_number || '—'}</p>
                </div>
              </div>

              {/* Status and actions */}
              <div className="flex items-center justify-between bg-dark-surface rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Status:</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[selectedOrder.status] || 'bg-gray-500/20 text-gray-400'}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                {nextStatus(selectedOrder.status) && (
                  <button
                    onClick={() => updateStatus(selectedOrder.id, nextStatus(selectedOrder.status))}
                    className="bg-lego-red hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Mark as {nextStatus(selectedOrder.status)}
                  </button>
                )}
              </div>

              {selectedOrder.buyer_notes && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Buyer Notes</p>
                  <p className="text-sm text-gray-300 bg-dark-surface rounded-lg p-3">{selectedOrder.buyer_notes}</p>
                </div>
              )}

              {selectedOrder.shipping_address && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Shipping Address</p>
                  <pre className="text-sm text-gray-300 bg-dark-surface rounded-lg p-3 whitespace-pre-wrap">{selectedOrder.shipping_address}</pre>
                </div>
              )}

              {/* Order Items */}
              {orderItems.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Items ({orderItems.length})</p>
                  <div className="space-y-2">
                    {orderItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-dark-surface rounded-lg px-3 py-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-lego-red">{item.part_no}</span>
                          <span className="text-sm text-white truncate">{item.part_name}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm text-gray-400">x{item.quantity}</span>
                          <span className="text-sm text-green-400">${(item.unit_price_cents / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
