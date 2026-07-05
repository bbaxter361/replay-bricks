import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { api } from '../api'
import { generatePirateShipCSV, downloadCSV } from '../utils/pirateship'

const STATUS_STYLES = {
  'pending': { background: '#C0C0C0', color: '#000' },
  'paid': { background: '#C0C0C0', color: '#000', borderBottom: '2px solid #000080' },
  'picked': { background: '#C0C0C0', color: '#000' },
  'packed': { background: '#C0C0C0', color: '#000' },
  'shipped': { background: '#000080', color: '#FFFFFF' },
  'delivered': { background: '#008000', color: '#FFFFFF' },
  'cancelled': { background: '#808080', color: '#FFFFFF' },
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
      toast.error('Failed to load orders')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadOrders() }, [page, statusFilter])

  const handleSearch = () => { setPage(1); loadOrders() }

  const viewOrder = async (order) => {
    setSelectedOrder(order)
    try {
      const data = await api.getOrder(order.id)
      setOrderItems(data.items || [])
    } catch { setOrderItems([]) }
  }

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus)
      toast.success(`Order #${orderId} marked as ${newStatus}`)
      loadOrders()
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => ({ ...prev, status: newStatus }))
    } catch (err) {
      toast.error(`Failed to update: ${err.message}`)
    }
  }

  const nextStatus = (current) => {
    const flow = ['pending', 'paid', 'picked', 'packed', 'shipped', 'delivered']
    const idx = flow.indexOf(current)
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null
  }

  const exportToPirateShip = async () => {
    const toastId = toast.loading('Generating Pirate Ship CSV...')
    try {
      const data = await api.getOrders({ limit: 200 })
      const allOrders = data.orders || []
      if (allOrders.length === 0) { toast.dismiss(toastId); toast.error('No orders to export'); return }
      const { csv, total, withAddress, skipped } = generatePirateShipCSV(allOrders)
      downloadCSV(csv, `pirate-ship-orders-${new Date().toISOString().slice(0, 10)}.csv`)
      toast.dismiss(toastId)
      toast.success(skipped > 0 ? `Exported ${total} orders (${withAddress} with addresses, ${skipped} need address)` : `Exported ${total} orders`)
    } catch (err) { toast.dismiss(toastId); toast.error(`Export failed: ${err.message}`) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Section header */}
      <div className="win95-section-title">📋 Orders</div>
      <div className="win95-section-desc">Manage incoming orders from BrickLink & BrickOwl — track status, export to Pirate Ship for shipping labels.</div>
      <hr className="win95-divider" />

      {/* Filters row */}
      <div className="win95-panel" style={{ padding: '6px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search by order ID or buyer..." value={search}
          onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="win95-input" style={{ flex: 1, minWidth: '180px' }} />
        <button onClick={handleSearch} className="win95-button win95-button-sm">🔍 Search</button>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="win95-select">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option><option value="paid">Paid</option>
          <option value="picked">Picked</option><option value="packed">Packed</option>
          <option value="shipped">Shipped</option><option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
          <button onClick={exportToPirateShip} className="win95-button">🚢 Pirate Ship</button>
          <button onClick={loadOrders} className="win95-button">🔄 Refresh</button>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <span className="win95-loading">⏳</span>
          <p style={{ marginTop: '8px' }}>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#FFFFFF', border: '2px solid #808080' }}>
          <p style={{ fontSize: '18px' }}>📋</p>
          <p>No orders found</p>
          <p style={{ fontSize: '10px', color: '#808080' }}>Sync your marketplaces to import orders</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="win95-table">
            <thead>
              <tr>
                <th>Order #</th><th>Buyer</th><th>Marketplace</th>
                <th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{order.order_id}</td>
                  <td>{order.buyer_name || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{order.marketplace}</td>
                  <td>{order.order_date || '—'}</td>
                  <td>{order.total_items || order.items_count || 0}</td>
                  <td>${((order.total_price_cents || 0) / 100).toFixed(2)}</td>
                  <td><span className="win95-badge" style={STATUS_STYLES[order.status] || {}}>{order.status}</span></td>
                  <td><button onClick={() => viewOrder(order)} className="win95-button win95-button-sm">👁 View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
          <span>Page {page} of {totalPages}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="win95-button win95-button-sm">◀ Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="win95-button win95-button-sm">Next ▶</button>
          </div>
        </div>
      )}

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <div className="win95-dialog-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="win95-dialog" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="win95-titlebar win95-titlebar-gradient">
              <span className="win95-titlebar-text">📋 Order #{selectedOrder.order_id}</span>
              <div className="win95-titlebar-controls">
                <button onClick={() => setSelectedOrder(null)} className="win95-titlebar-btn">✕</button>
              </div>
            </div>
            <div style={{ padding: '8px' }}>
              {/* Details grid */}
              <div className="win95-groupbox">
                <legend>Order Details</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                  <div><span style={{ color: '#808080' }}>Buyer:</span> {selectedOrder.buyer_name || '—'}</div>
                  <div><span style={{ color: '#808080' }}>Marketplace:</span> {selectedOrder.marketplace}</div>
                  <div><span style={{ color: '#808080' }}>Total:</span> <strong>${((selectedOrder.total_price_cents || 0) / 100).toFixed(2)}</strong></div>
                  <div><span style={{ color: '#808080' }}>Shipping:</span> ${((selectedOrder.shipping_cents || 0) / 100).toFixed(2)}</div>
                  <div><span style={{ color: '#808080' }}>Date:</span> {selectedOrder.order_date || '—'}</div>
                  <div><span style={{ color: '#808080' }}>Tracking:</span> {selectedOrder.tracking_number || '—'}</div>
                </div>
              </div>

              {/* Status */}
              <div className="win95-groupbox">
                <legend>Status</legend>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="win95-badge" style={STATUS_STYLES[selectedOrder.status] || {}}>{selectedOrder.status}</span>
                  {nextStatus(selectedOrder.status) && (
                    <button onClick={() => updateStatus(selectedOrder.id, nextStatus(selectedOrder.status))} className="win95-button">
                      Mark as {nextStatus(selectedOrder.status)}
                    </button>
                  )}
                </div>
              </div>

              {selectedOrder.buyer_notes && (
                <div className="win95-groupbox">
                  <legend>Buyer Notes</legend>
                  <p>{selectedOrder.buyer_notes}</p>
                </div>
              )}

              {selectedOrder.shipping_address && (
                <div className="win95-groupbox">
                  <legend>Shipping Address</legend>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '11px' }}>{typeof selectedOrder.shipping_address === 'string' ? selectedOrder.shipping_address : JSON.stringify(selectedOrder.shipping_address, null, 2)}</pre>
                </div>
              )}

              {orderItems.length > 0 && (
                <div className="win95-groupbox">
                  <legend>Items ({orderItems.length})</legend>
                  <table className="win95-table">
                    <thead>
                      <tr><th>Part #</th><th>Name</th><th>Qty</th><th>Price</th></tr>
                    </thead>
                    <tbody>
                      {orderItems.map(item => (
                        <tr key={item.id}>
                          <td style={{ fontFamily: 'monospace' }}>{item.item_no || item.part_no}</td>
                          <td>{item.item_name || item.part_name}</td>
                          <td>x{item.quantity}</td>
                          <td>${((item.unit_price_cents || 0) / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
