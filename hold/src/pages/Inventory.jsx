import { useState, useEffect } from 'react'
import { Search, Plus, Grid3X3, List, RefreshCw, Package, ExternalLink, X, ZoomIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../api'

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
  const [imageModal, setImageModal] = useState(null) // item to show in modal

  const loadItems = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 50 }
      if (search) params.search = search
      const data = await api.getInventory(params)
      setItems(data.items)
      setTotalPages(data.pages)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load inventory:', err)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
          <p className="text-gray-400 text-sm mt-1">{total} unique parts · {totalQty} total pieces</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadItems} className="flex items-center gap-1.5 bg-dark-surface hover:bg-dark-border text-gray-300 px-3 py-2 rounded-lg text-sm border border-dark-border transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-dark-card border border-dark-border rounded-xl p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by part # or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lego-red"
          />
        </div>
        <div className="flex bg-dark-bg border border-dark-border rounded-lg">
          <button onClick={() => setView('table')} className={`p-2 ${view === 'table' ? 'text-lego-red bg-lego-red/10' : 'text-gray-500 hover:text-white'}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'text-lego-red bg-lego-red/10' : 'text-gray-500 hover:text-white'}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-14">Pic</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Part #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Color</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Condition</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Mktpl</th>
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
                      <td className="px-4 py-3 text-sm text-gray-400">{item.location || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${item.condition === 'NEW' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {item.condition}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{item.marketplace_count || 0}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No parts found</p>
              <p className="text-xs mt-1">Sync your marketplaces to see inventory</p>
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
            </a>
          ))}
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
