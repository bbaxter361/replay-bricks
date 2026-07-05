import { useState, useEffect } from 'react'
import { api } from '../api'
import toast from 'react-hot-toast'

// ── Utility ──
function fmtCents(c) {
  if (c == null) return '—'
  return `$${(c / 100).toFixed(2)}`
}

function getThumbUrl(partNo, colorId) {
  if (!partNo) return null
  return `https://img.bricklink.com/ItemImage/PT/${colorId || 0}/${partNo}.t.png`
}

function colorSwatch(colorCode, colorName) {
  if (!colorCode) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span
        style={{
          width: '12px', height: '12px', borderRadius: '50%', border: '1px solid #808080',
          display: 'inline-block', flexShrink: 0, background: `#${colorCode}`
        }}
        title={colorName}
      />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{colorName || '—'}</span>
    </span>
  )
}

// ── Component ──
export default function PartOut() {
  const [setNo, setSetNo] = useState('')
  const [condition, setCondition] = useState('USED')
  const [completeness, setCompleteness] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [showDefaults, setShowDefaults] = useState(false)
  const [edits, setEdits] = useState({})  // { partKey: { qty, price_cents, skip } }
  const [pricingView, setPricingView] = useState('market') // 'market' | 'your' | 'both'

  // Load saved defaults on mount
  useEffect(() => {
    api.getSettings().then(s => {
      if (s.partout_default_condition) setCondition(s.partout_default_condition)
    }).catch(() => {})
  }, [])

  // ── Search ──
  const search = async (e) => {
    e.preventDefault()
    if (!setNo.trim()) return
    
    // Basic validation client-side
    const cleaned = setNo.trim().replace(/[^a-zA-Z0-9-]/g, '')
    if (!/^\d{4,6}(-?\d+)?$/i.test(cleaned)) {
      toast.error('Invalid set number. Try like "21318" or "10255-1".')
      return
    }

    setLoading(true)
    setResult(null)
    setEdits({})
    try {
      const data = await api.partOut(setNo.trim(), { 
        condition, 
        include_prices: true,
        completeness: completeness || null,
      })
      setResult(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Confirm (send to pending review) ──
  const confirm = async () => {
    if (!result?.regular_parts) return
    setConfirming(true)
    try {
      // Apply edits to parts being confirmed
      const partsToConfirm = result.regular_parts
        .filter(p => !edits[`${p.part_no}|${p.color_id}`]?.skip)
        .map(p => {
          const edit = edits[`${p.part_no}|${p.color_id}`]
          return {
            ...p,
            quantity: edit?.qty ?? p.quantity,
            unit_price_cents: edit?.price_cents ?? null,
            condition: completeness === 'sealed' ? 'NEW' : condition,
            notes: completeness ? `Completeness: ${completeness}` : null,
          }
        })

      if (partsToConfirm.length === 0) {
        toast.error('No parts to confirm — all are skipped.')
        return
      }

      await api.confirmPartOut(setNo.trim(), { 
        parts: partsToConfirm, 
        condition: completeness === 'sealed' ? 'NEW' : condition,
      })
      toast.success(`✅ ${partsToConfirm.length} parts sent to Pending Review`)
      setResult(null)
      setSetNo('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setConfirming(false)
    }
  }

  // ── Edit helpers ──
  const editQty = (partKey, delta) => {
    setEdits(prev => {
      const current = prev[partKey]?.qty ?? result?.parts?.find(p => `${p.part_no}|${p.color_id}` === partKey)?.quantity ?? 1
      const next = Math.max(0, current + delta)
      return { ...prev, [partKey]: { ...prev[partKey], qty: next } }
    })
  }

  const editPrice = (partKey, value) => {
    const cents = value ? Math.round(parseFloat(value) * 100) : null
    if (value && isNaN(parseFloat(value))) return
    setEdits(prev => ({ ...prev, [partKey]: { ...prev[partKey], price_cents: cents } }))
  }

  const toggleSkip = (partKey) => {
    setEdits(prev => ({
      ...prev,
      [partKey]: { ...prev[partKey], skip: !prev[partKey]?.skip }
    }))
  }

  // ── Compute totals ──
  const computeTotals = (parts) => {
    if (!parts?.length) return null
    let totalPieces = 0, totalMarket = 0, pricedCount = 0
    const skippedIds = new Set(
      Object.entries(edits).filter(([,v]) => v.skip).map(([k]) => k)
    )
    for (const p of parts) {
      const key = `${p.part_no}|${p.color_id}`
      if (skippedIds.has(key)) continue
      const qty = edits[key]?.qty ?? p.quantity
      const price = edits[key]?.price_cents ?? p.avg_price_cents
      totalPieces += qty
      if (price) { totalMarket += price * qty; pricedCount++ }
    }
    return { totalPieces, totalMarket, pricedCount, totalParts: parts.length - skippedIds.size }
  }

  const regularTotals = result?.regular_parts ? computeTotals(result.regular_parts) : null
  const extrasTotals = result?.extras ? computeTotals(result.extras) : null

  // ── Render part rows ──
  const renderPartRow = (p, section) => {
    const partKey = `${p.part_no}|${p.color_id}`
    const edit = edits[partKey]
    const qty = edit?.qty ?? p.quantity
    const priceCents = edit?.price_cents ?? p.avg_price_cents
    const isSkipped = edit?.skip

    return (
      <tr key={partKey} style={{ borderBottom: '1px solid #808080', opacity: isSkipped ? '0.3' : '1', textDecoration: isSkipped ? 'line-through' : 'none', fontSize: '12px' }}>
        {/* Skip toggle */}
        <td style={{ padding: '4px 4px 4px 8px' }}>
          <button onClick={() => toggleSkip(partKey)} className="win95-button" style={{ fontSize: '10px', padding: '1px 4px', minWidth: 'auto' }} title={isSkipped ? 'Include' : 'Skip'}>
            {isSkipped ? '🔁' : '✕'}
          </button>
        </td>
        {/* Thumbnail */}
        <td style={{ padding: '4px 4px' }}>
          {p.image_url ? (
            <img src={getThumbUrl(p.part_no, p.color_id)} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain', background: '#FFFFFF', border: '1px solid #808080' }} loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'block' }} />
          ) : null}
          <div style={{ width: '32px', height: '32px', display: p.image_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', border: '1px solid #808080' }}>
            <span style={{ fontSize: '12px', color: '#808080' }}>🚫</span>
          </div>
        </td>
        {/* Part # + name */}
        <td style={{ padding: '4px 8px' }}>
          <div style={{ fontFamily: '"Courier New", monospace', color: '#000080', fontSize: '11px' }}>{p.part_no}</div>
          <div style={{ color: '#404040', fontSize: '11px', lineHeight: '1.2', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.part_name}>{p.part_name || '—'}</div>
        </td>
        {/* Color */}
        <td style={{ padding: '4px 8px', fontSize: '12px' }}>{colorSwatch(p.color_code, p.color_name) || '—'}</td>
        {/* Minifig set badge */}
        <td style={{ padding: '4px 8px' }}>
          {p.minifig_set && <span className="win95-badge" style={{ background: '#FFFFCC', color: '#808000' }}>🧸 {p.minifig_set}</span>}
        </td>
        {/* Extra / Alternate flags */}
        <td style={{ padding: '4px 8px' }}>
          {p.extra && <span className="win95-badge" style={{ background: '#E0F0FF', color: '#000080', marginRight: '4px' }}>Extra</span>}
          {p.alternate && <span className="win95-badge" style={{ background: '#F0E0FF', color: '#800080' }}>Alt</span>}
        </td>
        {/* Qty with edit controls */}
        <td style={{ padding: '4px 8px', textAlign: 'right' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <button onClick={() => editQty(partKey, -1)} className="win95-button" style={{ fontSize: '10px', padding: '1px 4px', minWidth: 'auto' }} disabled={qty <= 0}>−</button>
            <span style={{ minWidth: '24px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{qty}</span>
            <button onClick={() => editQty(partKey, 1)} className="win95-button" style={{ fontSize: '10px', padding: '1px 4px', minWidth: 'auto' }}>+</button>
          </div>
        </td>
        {/* Your price (editable) */}
        {pricingView !== 'market' && (
          <td style={{ padding: '4px 4px', textAlign: 'right' }}>
            <input type="text" className="win95-input" style={{ width: '64px', fontSize: '11px', padding: '1px 4px', textAlign: 'right' }} placeholder="—"
              value={edit?.price_cents != null ? (edit.price_cents / 100).toFixed(2) : ''} onChange={(e) => editPrice(partKey, e.target.value)} disabled={isSkipped} />
          </td>
        )}
        {/* Market price */}
        {pricingView !== 'your' && (
          <td style={{ padding: '4px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: priceCents ? 'bold' : 'normal', color: priceCents ? '#000080' : '#808080' }}>
            {fmtCents(priceCents)}
          </td>
        )}
      </tr>
    )
  }

  // ── Render totals bar ──
  const renderTotalsBar = (totals, label) => {
    if (!totals) return null
    return (
      <div style={{ display: 'flex', gap: '16px', fontSize: '11px', padding: '6px 8px', borderTop: '1px solid #808080', background: '#E0E0E0' }}>
        <span style={{ fontWeight: 'bold', color: '#000' }}>{label}</span>
        <span style={{ color: '#404040' }}>{totals.totalParts} lots</span>
        <span style={{ color: '#404040' }}>{totals.totalPieces} pcs</span>
        {totals.totalMarket > 0 && (
          <span style={{ fontWeight: 'bold', color: '#000080' }}>
            ~{fmtCents(totals.totalMarket)}
            <span style={{ fontWeight: 'normal', color: '#808080', marginLeft: '4px' }}>({totals.pricedCount} priced)</span>
          </span>
        )}
      </div>
    )
  }

  // ── Render section table ──
  const renderPartsSection = (parts, label, totals) => {
    if (!parts?.length) return null
    return (
      <div className="win95-groupbox" style={{ padding: '4px' }}>
        <legend>{label} ({parts.length} lot{parts.length !== 1 ? 's' : ''})</legend>
        {renderTotalsBar(totals, label)}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #808080', textAlign: 'left' }}>
                <th style={{ padding: '4px 4px 4px 8px', width: '28px' }}></th>
                <th style={{ padding: '4px 4px', width: '40px' }}></th>
                <th style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11px' }}>Part</th>
                <th style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11px' }}>Color</th>
                <th style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11px' }}>Set</th>
                <th style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11px' }}>Flags</th>
                <th style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11px', textAlign: 'right' }}>Qty</th>
                {pricingView !== 'market' && <th style={{ padding: '4px 4px', fontWeight: 'bold', fontSize: '11px', textAlign: 'right' }}>Your Price</th>}
                {pricingView !== 'your' && <th style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11px', textAlign: 'right' }}>Market</th>}
              </tr>
            </thead>
            <tbody>{parts.map(p => renderPartRow(p, label.toLowerCase().replace(/\s/g, '_')))}</tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── Render ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div className="win95-section-title">🧱 Part-Out Tool</div>
        <div className="win95-section-desc">Enter a LEGO set number to pull its BrickLink inventory with pricing, adjust quantities and prices, then submit for review.</div>
      </div>
      <hr className="win95-divider" />
      <form onSubmit={search} className="win95-groupbox">
        <legend>🔍 Load Set</legend>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '160px' }}>
            <label style={{ fontSize: '11px', color: '#000', display: 'block', marginBottom: '2px' }}>Set Number:</label>
            <input type="text" value={setNo} onChange={e => setSetNo(e.target.value)} placeholder="e.g. 21318 (Tree House)" className="win95-input" style={{ width: '100%' }} required />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: '#000' }}>Condition:</label>
            <select value={condition} onChange={e => setCondition(e.target.value)} className="win95-select" style={{ fontSize: '12px' }}>
              <option value="USED">♻️ Used</option><option value="NEW">🆕 New</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: '#000' }}>Completeness:</label>
            <select value={completeness} onChange={e => setCompleteness(e.target.value)} className="win95-select" style={{ fontSize: '12px' }}>
              <option value="">Any</option><option value="sealed">📦 Sealed</option><option value="complete">✅ Complete</option><option value="incomplete">⚠️ Incomplete</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="win95-button">{loading ? '⏳ Loading…' : '🔍 Load Set'}</button>
        </div>
        <div style={{ marginTop: '8px' }}>
          <button type="button" onClick={() => setShowDefaults(!showDefaults)} className="win95-button" style={{ fontSize: '11px', padding: '2px 8px' }}>⚙️ Defaults {showDefaults ? '▲' : '▼'}</button>
          {showDefaults && (
            <div className="win95-panel" style={{ padding: '8px', marginTop: '8px' }}>
              <p style={{ fontSize: '11px', color: '#404040', marginBottom: '4px' }}>These defaults are saved for next time:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <label style={{ color: '#000' }}>Condition:</label>
                <select value={condition} onChange={e => { setCondition(e.target.value); api.updateSettings({ partout_default_condition: e.target.value }).catch(() => {}) }} className="win95-select" style={{ fontSize: '12px' }}>
                  <option value="USED">♻️ Used</option><option value="NEW">🆕 New</option>
                </select>
                <label className="win95-checkbox" style={{ fontSize: '12px' }}><input type="checkbox" defaultChecked disabled /> Auto-price (always on)</label>
              </div>
            </div>
          )}
        </div>
      </form>
      {loading && (
        <div className="win95-window" style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>Fetching set inventory from BrickLink…</p>
          <p style={{ fontSize: '11px', color: '#808080' }}>This may take a moment for large sets</p>
        </div>
      )}
      {result && !loading && (
        <>
          <div className="win95-window" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {result.set_image && <img src={result.set_image} alt={result.set_name || result.set_no} style={{ width: '96px', height: '96px', objectFit: 'contain', background: '#FFFFFF', border: '1px solid #808080', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none' }} />}
              <div style={{ minWidth: '0', flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000' }}>{result.set_name || result.set_no}</h3>
                <p style={{ fontFamily: '"Courier New", monospace', color: '#000080', fontSize: '13px' }}>{result.set_no}</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '11px', color: '#404040', flexWrap: 'wrap' }}>
                  {result.set_year && <span>📅 Year: {result.set_year}</span>}
                  {result.total_lots > 0 && <span>{result.total_lots} unique lots</span>}
                  <span>{result.total_pieces} pieces</span>
                  {result.minifig_count > 0 && <span>🧸 {result.minifig_count} minifig{result.minifig_count > 1 ? 's' : ''}</span>}
                </div>
                {result.completeness && <div style={{ marginTop: '4px' }}><span className="win95-badge">{result.completeness.charAt(0).toUpperCase() + result.completeness.slice(1)}</span></div>}
              </div>
              <div style={{ flexShrink: 0 }}>
                <button onClick={confirm} disabled={confirming} className="win95-button">{confirming ? '⏳ Sending…' : '✅ Send to Pending Review'}</button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#000' }}>Price view:</span>
              <div style={{ display: 'flex' }}>
                {[['market', '📊 Market'], ['your', '✏️ Yours'], ['both', '📊/✏️ Both']].map(([v, label]) => (
                  <button key={v} onClick={() => setPricingView(v)} className="win95-button" style={{ fontSize: '11px', padding: '2px 8px', background: pricingView === v ? '#000080' : undefined, color: pricingView === v ? '#FFFFFF' : undefined }}>{label}</button>
                ))}
              </div>
              <span style={{ fontSize: '10px', color: '#808080' }}>Click −/+ qty · ✕ skip · edit price</span>
            </div>
          </div>
          {renderPartsSection(result.regular_parts, 'Regular Parts', regularTotals)}
          {renderPartsSection(result.extras, 'Extras', extrasTotals)}
          {result.alternates?.length > 0 && (
            <div className="win95-groupbox" style={{ padding: '4px' }}>
              <legend>🔄 Alternates ({result.alternates.length} lot{result.alternates.length !== 1 ? 's' : ''})</legend>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #808080', textAlign: 'left' }}>
                      <th style={{ padding: '4px 4px 4px 8px', width: '28px' }}></th>
                      <th style={{ padding: '4px 4px', width: '40px' }}></th>
                      <th style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11px' }}>Part</th>
                      <th style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11px' }}>Color</th>
                      <th style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11px' }}></th>
                      <th style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11px' }}>Flags</th>
                      <th style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11px', textAlign: 'right' }}>Qty</th>
                      {pricingView !== 'market' && <th style={{ padding: '4px 4px', fontWeight: 'bold', fontSize: '11px', textAlign: 'right' }}>Your Price</th>}
                      {pricingView !== 'your' && <th style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11px', textAlign: 'right' }}>Market</th>}
                    </tr>
                  </thead>
                  <tbody>{result.alternates.map(p => renderPartRow(p, 'alternates'))}</tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      {!result && !loading && (
        <div className="win95-window" style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '32px', marginBottom: '8px' }}>🧱</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>No Set Loaded</p>
          <p style={{ fontSize: '12px', color: '#404040', maxWidth: '400px', margin: '0 auto' }}>
            Enter a LEGO set number above to pull its official BrickLink inventory. Adjust quantities, set prices, and submit to Pending Review.
          </p>
        </div>
      )}
    </div>
  )
}
