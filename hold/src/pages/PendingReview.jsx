import { useState, useEffect } from 'react'
import { RefreshCw, Check, X, Package, ExternalLink, Search, Trash2, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../api'

export default function PendingReview() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [selected, setSelected] = useState({})
  const [selectAll, setSelectAll] = useState(false)
  const [editing, setEditing] = useState(null)

  const loadPending = async () => {
    setLoading(true)
    try {
      const data = await api.getPendingItems()
      setItems(data.items)
    } catch (err) {
      toast.error('Failed to load pending items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPending() }, [])

  useEffect(() => {
    if (selectAll) {
      const all = {}
      items.forEach(i => { all[i.id] = true })
      setSelected(all)
    } else {
      setSelected({})
    }
  }, [selectAll, items])

  const toggleItem = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleConfirm = async () => {
    const ids = items.filter(i => selected[i.id]).map(i => i.id)
    if (ids.length === 0) {
      toast.error('Select items to confirm')
      return
    }
    setConfirming(true)
    try {
      const result = await api.confirmPendingItems(ids)
      toast.success(`Confirmed ${result.confirmed} items to inventory`)
      await loadPending()
      setSelected({})
      setSelectAll(false)
    } catch (err) {
      toast.error('Confirm failed: ' + err.message)
    } finally {
      setConfirming(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.deletePendingItem(id)
      toast.success('Item rejected')
      await loadPending()
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  const handleEdit = async (item) => {
    try {
      await api.updatePendingItem(item.id, {
        quantity: parseInt(item.quantity) || 1,
        location: item.location,
        part_name: item.part_name,
      })
      toast.success('Updated')
      setEditing(null)
      await loadPending()
    } catch (err) {
      toast.error('Update failed')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-lego-red border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pending Items</h1>
          <p className="text-gray-400 text-sm mt-1">
            {items.length} item{items.length !== 1 ? 's' : ''} waiting for review
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadPending} className="flex items-center gap-1.5 bg-dark-surface hover:bg-dark-border text-gray-300 px-3 py-2 rounded-lg text-sm border border-dark-border transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          {items.length > 0 && (
            <>
              <button
                onClick={() => setSelectAll(!selectAll)}
                className="flex items-center gap-1.5 bg-dark-surface hover:bg-dark-border text-gray-300 px-3 py-2 rounded-lg text-sm border border-dark-border transition-colors"
              >
                <CheckSquare className="w-4 h-4" /> {selectAll ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Check className="w-4 h-4" />
                {confirming ? 'Confirming...' : `Confirm to Inventory`}
              </button>
            </>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-xl p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-20 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-400 mb-1">No pending items</h3>
          <p className="text-sm text-gray-600">Tell me parts you want added and I'll stash them here for review.</p>
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border bg-dark-surface">
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={() => setSelectAll(!selectAll)}
                      className="accent-lego-red"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-14">Pic</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Part #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Color</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Condition</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {items.map(item => (
                  <tr key={item.id} className={`hover:bg-dark-surface/30 transition-colors ${selected[item.id] ? 'bg-green-900/10' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={!!selected[item.id]}
                        onChange={() => toggleItem(item.id)}
                        className="accent-lego-red"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <a href={item.catalog_url} target="_blank" rel="noopener noreferrer">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.part_no}
                            className="w-10 h-10 object-contain rounded bg-dark-surface"
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.style.display = 'none'
                              e.target.parentNode.innerHTML = '<span class="text-lg">🧱</span>'
                            }}
                          />
                        ) : <span className="text-lg">🧱</span>}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-medium">
                      <a href={item.catalog_url} target="_blank" rel="noopener noreferrer" className="text-lego-red hover:underline flex items-center gap-1">
                        {item.part_no}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-white max-w-[200px] truncate">{item.part_name || <span className="text-gray-500 italic">auto-detect</span>}</td>
                    <td className="px-4 py-3 text-sm">
                      {item.color_name || item.bl_color_name ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color_code ? `#${item.color_code}` : '#888' }} />
                          <span className="text-gray-300">{item.color_name || item.bl_color_name}</span>
                        </span>
                      ) : <span className="text-gray-500">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {editing === item.id ? (
                        <input
                          type="number"
                          defaultValue={item.quantity}
                          className="w-16 bg-dark-bg border border-dark-border rounded px-2 py-1 text-sm text-white"
                          autoFocus
                          onBlur={(e) => {
                            item.quantity = parseInt(e.target.value) || 1
                            handleEdit(item)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              item.quantity = parseInt(e.target.value) || 1
                              handleEdit(item)
                            }
                            if (e.key === 'Escape') setEditing(null)
                          }}
                        />
                      ) : (
                        <span
                          className="text-sm font-bold text-white cursor-pointer hover:text-lego-red"
                          onClick={() => setEditing(item.id)}
                          title="Click to edit"
                        >
                          {item.quantity}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.condition === 'NEW' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{item.location || <span className="text-gray-600">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{item.source || 'voice'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleConfirm()}
                          disabled={confirming}
                          className="p-1.5 text-green-400 hover:bg-green-500/10 rounded transition-colors disabled:opacity-30"
                          title="Confirm"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Reject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
