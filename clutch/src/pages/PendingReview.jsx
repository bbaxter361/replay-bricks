import { useState, useEffect } from 'react'
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
      toast.success(`✅ Confirmed ${result.confirmed} items to inventory`)
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
      toast.success('🗑️ Item rejected')
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
      toast.success('✅ Updated')
      setEditing(null)
      await loadPending()
    } catch (err) {
      toast.error('Update failed')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <div className="win95-loading" style={{ color: '#808080' }}>⏳ Loading pending items…</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div className="win95-section-title">📋 Pending Review</div>
        <div className="win95-section-desc">Review items waiting to be added to your inventory — accept or reject before they become active listings.</div>
      </div>
      <hr className="win95-divider" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#000' }}>📋 {items.length} item{items.length !== 1 ? 's' : ''} waiting for review</span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={loadPending} className="win95-button">🔄 Refresh</button>
          {items.length > 0 && (
            <>
              <button onClick={() => setSelectAll(!selectAll)} className="win95-button">{selectAll ? '🔁 Deselect All' : '✅ Select All'}</button>
              <button onClick={handleConfirm} disabled={confirming} className="win95-button">{confirming ? '⏳ Confirming...' : '✅ Confirm to Inventory'}</button>
            </>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="win95-window" style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '32px', marginBottom: '8px' }}>📦</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>No Pending Items</p>
          <p style={{ fontSize: '12px', color: '#404040', maxWidth: '400px', margin: '0 auto' }}>
            Use the Part-Out Tool to submit items for review, or tell me parts you want added and I'll stash them here.
          </p>
        </div>
      ) : (
        <div className="win95-window" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="win95-table" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px 8px', width: '32px' }}><input type="checkbox" checked={selectAll} onChange={() => setSelectAll(!selectAll)} /></th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', width: '48px' }}>Pic</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Part #</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Color</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Qty</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Condition</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Location</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Source</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ background: selected[item.id] ? '#E0FFE0' : undefined }}>
                    <td style={{ padding: '6px 8px' }}><input type="checkbox" checked={!!selected[item.id]} onChange={() => toggleItem(item.id)} /></td>
                    <td style={{ padding: '6px 8px' }}>
                      <a href={item.catalog_url} target="_blank" rel="noopener noreferrer">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.part_no} style={{ width: '40px', height: '40px', objectFit: 'contain', background: '#FFFFFF', border: '1px solid #808080' }} loading="lazy"
                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span style=\"font-size:20px\">🧱</span>' }} />
                        ) : <span style={{ fontSize: '20px' }}>🧱</span>}
                      </a>
                    </td>
                    <td style={{ padding: '6px 8px', fontFamily: '"Courier New", monospace' }}>
                      <a href={item.catalog_url} target="_blank" rel="noopener noreferrer" className="win95-link" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        {item.part_no} <span style={{ fontSize: '10px', opacity: 0.5 }}>↗</span>
                      </a>
                    </td>
                    <td style={{ padding: '6px 8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.part_name || <span style={{ color: '#808080', fontStyle: 'italic' }}>auto-detect</span>}
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      {item.color_name || item.bl_color_name ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block', border: '1px solid #808080', background: item.color_code ? `#${item.color_code}` : '#888' }} />
                          <span style={{ color: '#000' }}>{item.color_name || item.bl_color_name}</span>
                        </span>
                      ) : <span style={{ color: '#808080' }}>—</span>}
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      {editing === item.id ? (
                        <input type="number" defaultValue={item.quantity} className="win95-input" style={{ width: '56px', fontSize: '12px' }} autoFocus
                          onBlur={(e) => { item.quantity = parseInt(e.target.value) || 1; handleEdit(item) }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { item.quantity = parseInt(e.target.value) || 1; handleEdit(item) } if (e.key === 'Escape') setEditing(null) }} />
                      ) : (
                        <span style={{ fontWeight: 'bold', cursor: 'pointer', color: '#000' }} onClick={() => setEditing(item.id)} title="Click to edit">{item.quantity}</span>
                      )}
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <span className="win95-badge" style={{ background: item.condition === 'NEW' ? '#E0FFE0' : '#FFFFCC', color: item.condition === 'NEW' ? '#006000' : '#808000' }}>
                        {item.condition || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 8px', color: '#404040' }}>{item.location || <span style={{ color: '#808080' }}>—</span>}</td>
                    <td style={{ padding: '6px 8px' }}><span style={{ color: '#808080', fontSize: '11px' }}>{item.action_type || item.source || 'voice'}</span></td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        {(item.action_type || item.source) && (
                          <span style={{ fontSize: '10px', padding: '1px 4px', background: '#E0E0E0', border: '1px solid #808080', color: '#404040', marginRight: '4px' }}>
                            {item.action_type === 'partout' ? '🧱PO' :
                             item.action_type === 'voice' ? '🎤V' :
                             item.action_type === 'import' ? '📥I' :
                             item.action_type || '?'}
                          </span>
                        )}
                        <button onClick={() => { setSelected({ [item.id]: true }); handleConfirm() }} disabled={confirming} className="win95-button" style={{ fontSize: '10px', padding: '1px 6px', minWidth: 'auto' }} title="Accept">✅</button>
                        <button onClick={() => handleDelete(item.id)} className="win95-button" style={{ fontSize: '10px', padding: '1px 6px', minWidth: 'auto' }} title="Reject">❌</button>
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
