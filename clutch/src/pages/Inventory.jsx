import { useState, useEffect } from 'react'
import { Search, Plus, Grid3X3, List, RefreshCw, Package, ExternalLink, X, ZoomIn, TrendingUp, DollarSign, Trash2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../api'
import { parseInventoryImport } from '../utils/csvImport'

const BLANK_NEW_ITEM = {
  part_no: '',
  color_id: '',
  part_name: '',
  quantity: 1,
  condition: 'USED',
  location: '',
  unit_price_cents: '',
}

// Fallback icon for broken/missing images
function PartThumbnail({ item }) {
  const [errored, setErrored] = useState(false)

  if (errored || !item.image_url) {
    return (
      <span className="w-10 h-10 rounded bg-dark-surface flex items-center justify-center text-lg">
        🧱
      </span>
    )
  }

  return (
    <img
      src={item.image_url?.startsWith('//') ? 'https:' + item.image_url : item.image_url}
      alt={item.part_name || item.part_no}
      className="w-10 h-10 object-contain rounded bg-dark-surface"
      loading="lazy"
      onError={() => setErrored(true)}
    />
  )
}

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [view, setView] = useState('table')
  const [imageModal, setImageModal] = useState(null)
  const [prices, setPrices] = useState({})      // { [itemId]: { avg, min, max, loading } }
  const [refreshingAll, setRefreshingAll] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newItem, setNewItem] = useState(BLANK_NEW_ITEM)
  const [saving, setSaving] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importResult, setImportResult] = useState(null)

  const handleCreate = async (e) => {
    e?.preventDefault?.()
    if (!newItem.part_no.trim()) {
      toast.error('Part # is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        part_no: newItem.part_no.trim(),
        part_name: newItem.part_name.trim() || null,
        color_id: newItem.color_id === '' ? null : parseInt(newItem.color_id),
        quantity: parseInt(newItem.quantity) || 0,
        condition: newItem.condition,
        location: newItem.location.trim() || null,
        unit_price_cents: newItem.unit_price_cents === ''
          ? null
          : Math.round(parseFloat(newItem.unit_price_cents) * 100),
      }
      await api.createInventoryItem(payload)
      toast.success('Part added')
      setNewItem(BLANK_NEW_ITEM)
      setAddOpen(false)
      await loadItems()
    } catch (err) {
      toast.error('Add failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!confirm(`Delete ${item.part_no}${item.color_name ? ' (' + item.color_name + ')' : ''}?`)) return
    try {
      await api.deleteInventoryItem(item.id)
      toast.success('Deleted')
      await loadItems()
    } catch (err) {
      toast.error('Delete failed: ' + err.message)
    }
  }

  const loadItems = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 50 }
      if (search) params.search = search
      const data = await api.getInventory(params)
      setItems(data.items)
      setTotalPages(data.pages)
      setTotal(data.total)
      // Load prices for visible items
      loadPrices(data.items)
    } catch (err) {
      console.error('Failed to load inventory:', err)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const loadPrices = async (itemsList) => {
    if (!itemsList || itemsList.length === 0) return
    const ids = itemsList.map(i => i.id)
    for (const id of ids) {
      setPrices(prev => ({ ...prev, [id]: { ...prev[id], loading: true } }))
      try {
        const data = await api.getItemPrices(id)
        setPrices(prev => ({
          ...prev,
          [id]: {
            loading: false,
            prices: data.prices || [],
            source: data.source,
          }
        }))
      } catch {
        setPrices(prev => ({ ...prev, [id]: { loading: false, prices: [], source: 'error' } }))
      }
    }
  }

  const handleRefreshAll = async () => {
    setRefreshingAll(true)
    try {
      const result = await api.refreshAllPrices()
      toast.success(`Refreshed ${result.success}/${result.total} prices`)
      // Reload prices for current page
      await loadPrices(items)
    } catch (err) {
      toast.error('Price refresh failed: ' + err.message)
    } finally {
      setRefreshingAll(false)
    }
  }

  const handleImportCSV = async () => {
    if (!importFile) return
    setImporting(true)
    setImportResult(null)
    try {
      const text = await importFile.text()
      const items = parseInventoryImport(text, importFile.name)
      
      if (items.length === 0) {
        toast.error('No items found in file')
        setImporting(false)
        return
      }

      let success = 0
      let failed = 0
      const errors = []

      for (const item of items) {
        try {
          await api.createInventoryItem({
            part_no: item.part_no,
            part_name: item.part_name || null,
            color_id: item.color_id || null,
            color_name: item.color_name || null,
            quantity: item.quantity || 1,
            condition: item.condition || 'USED',
            location: item.location || null,
            unit_price_cents: item.unit_price_cents || null,
          })
          success++
        } catch (err) {
          failed++
          errors.push(`${item.part_no}: ${err.message}`)
        }
      }

      setImportResult({ success, failed, total: items.length, errors })
      if (failed === 0) {
        toast.success(`Imported ${success} items`)
        setImportOpen(false)
        setImportFile(null)
        await loadItems()
      } else {
        toast.error(`Imported ${success}/${items.length} (${failed} failed)`, { duration: 6000 })
      }
    } catch (err) {
      toast.error('Failed to parse file: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  useEffect(() => { loadItems() }, [page])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) { setPage(1); loadItems() }
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const catalogLink = (item) => {
    return item.catalog_url || `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${item.part_no}`
  }

  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  // Fix protocol-relative URLs (//img... → https://img...)
  const fixImageUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('//')) return 'https:' + url
    return url
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="win95-section-title">📦 Inventory</div>
          <div className="win95-section-desc" style={{ marginBottom: 0 }}>Track your LEGO parts and sets — {total} unique parts · {totalQty} total pieces in inventory.</div>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button onClick={() => setAddOpen(true)} className="win95-button">➕ Add Part</button>
          <button onClick={() => { setImportFile(null); setImportResult(null); setImportOpen(true) }} className="win95-button">📥 Import CSV</button>
          <button onClick={loadItems} className="win95-button">🔄 Refresh</button>
          <button onClick={handleRefreshAll} disabled={refreshingAll} className="win95-button">
            {refreshingAll ? '⏳' : '💰'} {refreshingAll ? 'Pricing...' : 'Refresh Prices'}
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="win95-panel" style={{ padding: '6px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search by part # or name..." value={search}
          onChange={e => setSearch(e.target.value)} className="win95-input" style={{ flex: 1, minWidth: '180px' }} />
        <div style={{ display: 'flex', border: '1px solid #808080' }}>
          <button onClick={() => setView('table')} className={`win95-button win95-button-sm ${view === 'table' ? 'pressed' : ''}`}>📋</button>
          <button onClick={() => setView('grid')} className={`win95-button win95-button-sm ${view === 'grid' ? 'pressed' : ''}`}>🖼</button>
        </div>
      </div>

      {/* Table View */}
      {view === 'table' ? (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-lego-red border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-border bg-dark-surface">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-14">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Part #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Color</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">BL Avg $</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Condition</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-dark-surface/50 transition-colors">
                      <td className="px-4 py-3">
                        <a href={catalogLink(item)} target="_blank" rel="noopener noreferrer" title="View on BrickLink">
                          <PartThumbnail item={item} />
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-medium">
                        <button
                          onClick={() => setImageModal(item)}
                          className="text-lego-red hover:underline flex items-center gap-1 cursor-pointer"
                          title="Click to see part image"
                        >
                          {item.part_no}
                          <ZoomIn className="w-3 h-3 opacity-50" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-white max-w-[250px] truncate">{item.part_name}</td>
                      <td className="px-4 py-3 text-sm">
                        {item.color_name ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color_code ? `#${item.color_code}` : '#888' }} />
                            <span className="text-gray-300">{item.color_name}</span>
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${item.quantity <= 3 ? 'text-red-400' : 'text-white'}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-green-400 font-medium">${(item.unit_price_cents / 100).toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const p = prices[item.id]
                          if (!p || p.loading) return <span className="text-xs text-gray-600">...</span>
                          const avg = p.prices?.find(pr => pr.source === 'bricklink')?.avg_price_cents
                          if (!avg) return <span className="text-xs text-gray-600">—</span>
                          const diff = item.unit_price_cents - avg
                          const color = diff < -10 ? 'text-green-400' : diff > 10 ? 'text-red-400' : 'text-yellow-400'
                          const icon = diff < -10 ? '↓' : diff > 10 ? '↑' : '→'
                          return (
                            <span className={`text-sm font-mono ${color}`} title={`BL avg: $${(avg / 100).toFixed(2)}`}>
                              {icon} ${(avg / 100).toFixed(2)}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{item.location || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${item.condition === 'NEW' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {item.condition}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{item.marketplace_count || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-gray-500 hover:text-red-400 cursor-pointer"
                          title="Delete part"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FFFFFF', border: '2px solid #808080' }}>
              <div style={{ fontSize: '42px', marginBottom: '12px' }}>📦</div>
              <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>No Inventory Yet</p>
              <p style={{ fontSize: '12px', color: '#404040', maxWidth: '400px', margin: '0 auto 16px', lineHeight: '1.5' }}>
                Your inventory is empty because marketplaces haven't been synced yet. 
                Sync pulls your listings from BrickLink and BrickOwl automatically.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => window.location.href = '/marketplaces'} className="win95-button">
                  🏪 Go to Marketplaces
                </button>
                <button onClick={() => window.location.href = '/settings'} className="win95-button">
                  ⚙️ Configure API Keys
                </button>
              </div>
              <p style={{ fontSize: '10px', color: '#808080', marginTop: '12px' }}>
                Need help? Check the Settings page to add your BrickLink and BrickOwl API credentials.
              </p>
            </div>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-dark-border">
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 text-sm bg-dark-bg border border-dark-border rounded-lg disabled:opacity-30 text-gray-300 hover:text-white"
                >Previous</button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 text-sm bg-dark-bg border border-dark-border rounded-lg disabled:opacity-30 text-gray-300 hover:text-white"
                >Next</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map(item => (
            <a
              key={item.id}
              href={catalogLink(item)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-dark-card border border-dark-border rounded-xl p-3 hover:border-lego-red/40 transition-colors block"
            >
              <div className="aspect-square bg-dark-surface rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                <PartThumbnailGrid item={item} />
              </div>
              <p className="text-xs font-mono text-lego-red font-medium">
                <button onClick={() => setImageModal(item)} className="hover:underline cursor-pointer">{item.part_no}</button>
              </p>
              <p className="text-sm text-white font-medium truncate">{item.part_name}</p>
              <p className="text-xs text-gray-500">{item.color_name || ''}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-dark-border">
                <span className={`text-sm font-bold ${item.quantity <= 3 ? 'text-red-400' : 'text-white'}`}>{item.quantity}</span>
                <span className="text-sm text-green-400">${(item.unit_price_cents / 100).toFixed(2)}</span>
              </div>
              {(() => {
                const p = prices[item.id]
                const avg = p?.prices?.find(pr => pr.source === 'bricklink')?.avg_price_cents
                if (!avg) return null
                const diff = item.unit_price_cents - avg
                const color = diff < -10 ? 'text-green-400' : diff > 10 ? 'text-red-400' : 'text-yellow-400'
                return (
                  <p className={`text-xs ${color} mt-1 font-mono`} title={`BL avg: $${(avg / 100).toFixed(2)}`}>
                    BL: ${(avg / 100).toFixed(2)}
                  </p>
                )
              })()}
            </a>
          ))}
        </div>
      )}
      {/* ── Add Part Modal ── */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => !saving && setAddOpen(false)}
        >
          <form
            className="relative bg-[#0f0f1a] border border-dark-border rounded-2xl max-w-md w-full mx-4 shadow-2xl p-6 space-y-4"
            onClick={e => e.stopPropagation()}
            onSubmit={handleCreate}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add Part</h3>
              <button type="button" onClick={() => !saving && setAddOpen(false)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 text-xs text-gray-400">
                Part # *
                <input
                  required
                  autoFocus
                  value={newItem.part_no}
                  onChange={e => setNewItem({ ...newItem, part_no: e.target.value })}
                  className="mt-1 w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-lego-red"
                  placeholder="3001"
                />
              </label>
              <label className="col-span-2 text-xs text-gray-400">
                Name
                <input
                  value={newItem.part_name}
                  onChange={e => setNewItem({ ...newItem, part_name: e.target.value })}
                  className="mt-1 w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lego-red"
                  placeholder="Brick 2x4"
                />
              </label>
              <label className="text-xs text-gray-400">
                Color ID
                <input
                  type="number"
                  value={newItem.color_id}
                  onChange={e => setNewItem({ ...newItem, color_id: e.target.value })}
                  className="mt-1 w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lego-red"
                  placeholder="11 (Reddish Brown)"
                />
              </label>
              <label className="text-xs text-gray-400">
                Quantity
                <input
                  type="number"
                  min="0"
                  value={newItem.quantity}
                  onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="mt-1 w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lego-red"
                />
              </label>
              <label className="text-xs text-gray-400">
                Condition
                <select
                  value={newItem.condition}
                  onChange={e => setNewItem({ ...newItem, condition: e.target.value })}
                  className="mt-1 w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lego-red"
                >
                  <option value="USED">Used</option>
                  <option value="NEW">New</option>
                </select>
              </label>
              <label className="text-xs text-gray-400">
                Price (USD)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newItem.unit_price_cents}
                  onChange={e => setNewItem({ ...newItem, unit_price_cents: e.target.value })}
                  className="mt-1 w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lego-red"
                  placeholder="0.25"
                />
              </label>
              <label className="col-span-2 text-xs text-gray-400">
                Location
                <input
                  value={newItem.location}
                  onChange={e => setNewItem({ ...newItem, location: e.target.value })}
                  className="mt-1 w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lego-red"
                  placeholder="Bin A3"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-dark-border">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                disabled={saving}
                className="px-3 py-2 text-sm text-gray-300 hover:text-white"
              >Cancel</button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm bg-lego-red hover:bg-lego-red/90 text-white rounded-lg disabled:opacity-50"
              >{saving ? 'Saving...' : 'Add Part'}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Part Image Modal ── */}
      {imageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setImageModal(null)}
        >
          <div
            className="relative bg-[#0f0f1a] border border-dark-border rounded-2xl max-w-lg w-full mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setImageModal(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-dark-card border border-dark-border rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 z-10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Image area */}
            <div className="p-6 pb-4">
              <div className="aspect-square bg-dark-surface rounded-xl flex items-center justify-center overflow-hidden">
                <img
                  src={fixImageUrl(imageModal.image_url || imageModal.part_image_url)}
                  alt={imageModal.part_name || imageModal.part_no}
                  className="max-w-full max-h-full object-contain p-4"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = '<span class=\"text-6xl opacity-30\">🧱</span>';
                  }}
                />
              </div>
            </div>

            {/* Part info */}
            <div className="px-6 pb-6 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white font-mono">{imageModal.part_no}</h3>
                <a
                  href={catalogLink(imageModal)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-lego-red hover:underline flex items-center gap-1"
                >
                  View on BrickLink <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-sm text-gray-300">{imageModal.part_name}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                {imageModal.color_name && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: imageModal.color_code ? `#${imageModal.color_code}` : '#888' }} />
                    <span className="text-gray-400">{imageModal.color_name}</span>
                  </span>
                )}
                <span className="text-gray-400">Qty: <span className="text-white font-medium">{imageModal.quantity}</span></span>
                <span className="text-gray-400">Price: <span className="text-green-400 font-medium">${(imageModal.unit_price_cents / 100).toFixed(2)}</span></span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${imageModal.condition === 'NEW' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {imageModal.condition}
                </span>
                {imageModal.location && <span className="text-gray-500">📍 {imageModal.location}</span>}
              </div>
              {(() => {
                const p = prices[imageModal?.id]
                const avg = p?.prices?.find(pr => pr.source === 'bricklink')?.avg_price_cents
                if (!avg) return null
                const diff = imageModal.unit_price_cents - avg
                const color = diff < -10 ? 'text-green-400' : diff > 10 ? 'text-red-400' : 'text-yellow-400'
                return (
                  <p className={`text-xs ${color} font-mono mt-1`}>
                    BrickLink avg: ${(avg / 100).toFixed(2)} · {diff < -10 ? 'Below market' : diff > 10 ? 'Above market' : 'At market'}
                  </p>
                )
              })()}
            </div>
          </div>
        </div>
      )}
      
      {/* CSV Import Modal */}
      {importOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { if (!importing) { setImportOpen(false); setImportFile(null); setImportResult(null) } }}>
          <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
              <h2 className="text-lg font-bold text-white">Import Inventory CSV</h2>
              <button onClick={() => { if (!importing) { setImportOpen(false); setImportFile(null); setImportResult(null) } }} className="text-gray-500 hover:text-white p-1">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400">
                Upload a CSV or BrickLink XML file. Supported columns: part_no, part_name, color_name, condition (NEW/USED), quantity, unit_price, location.
              </p>
              
              {!importFile ? (
                <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-dark-border rounded-xl cursor-pointer hover:border-lego-red transition-colors">
                  <Upload className="w-8 h-8 text-gray-500" />
                  <span className="text-sm text-gray-400">Click to select file</span>
                  <span className="text-xs text-gray-600">CSV, TXT, or XML</span>
                  <input type="file" accept=".csv,.txt,.xml" className="hidden" onChange={e => setImportFile(e.target.files[0])} />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-dark-surface rounded-lg px-4 py-3">
                    <span className="text-sm text-white truncate">{importFile.name}</span>
                    <button onClick={() => setImportFile(null)} disabled={importing} className="text-gray-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {importResult && (
                    <div className={`rounded-lg px-4 py-3 text-sm ${importResult.failed > 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-green-500/10 border border-green-500/20'}`}>
                      <p className="text-white font-medium">{importResult.success}/{importResult.total} imported</p>
                      {importResult.failed > 0 && (
                        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                          {importResult.errors.slice(0, 10).map((e, i) => (
                            <p key={i} className="text-xs text-red-400">{e}</p>
                          ))}
                          {importResult.errors.length > 10 && (
                            <p className="text-xs text-gray-500">...and {importResult.errors.length - 10} more errors</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleImportCSV}
                    disabled={importing}
                    className="w-full bg-lego-red hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {importing ? 'Importing...' : `Import ${parseInventoryImport ? 'items' : ''}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Larger thumbnail for grid view
function PartThumbnailGrid({ item }) {
  const [errored, setErrored] = useState(false)

  if (errored || !item.image_url) {
    return <span className="text-5xl opacity-40">🧱</span>
  }

  return (
    <img
      src={item.image_url?.startsWith('//') ? 'https:' + item.image_url : item.image_url}
      alt={item.part_name || item.part_no}
      className="w-full h-full object-contain"
      loading="lazy"
      onError={() => setErrored(true)}
    />
  )
}
