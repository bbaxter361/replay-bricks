import { useState, useEffect } from 'react'
import { api } from '../api'
import { 
  Box, Search, Loader, CheckCircle, ChevronDown, ChevronUp, 
  Settings, X, Minus, Plus, DollarSign, ImageOff, Info 
} from 'lucide-react'
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
    <span className="inline-flex items-center gap-1.5">
      <span 
        className="w-3 h-3 rounded-full border border-white/20 inline-block flex-shrink-0" 
        style={{ backgroundColor: `#${colorCode}` }}
        title={colorName}
      />
      <span className="truncate">{colorName || '—'}</span>
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
      toast.success(`${partsToConfirm.length} parts sent to Pending Review`)
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
      <tr 
        key={partKey} 
        className={`border-b border-dark-border/30 text-sm transition-colors ${isSkipped ? 'opacity-30 line-through' : 'text-gray-300 hover:bg-dark-hover/30'}`}
      >
        {/* Skip toggle */}
        <td className="py-1.5 pr-1">
          <button
            onClick={() => toggleSkip(partKey)}
            className={`p-1 rounded-lg text-xs transition-colors ${
              isSkipped ? 'bg-red-900/40 text-red-400' : 'text-gray-600 hover:text-gray-400'
            }`}
            title={isSkipped ? 'Include' : 'Skip'}
          >
            <X size={14} />
          </button>
        </td>

        {/* Thumbnail */}
        <td className="py-1.5 pr-2">
          {p.image_url ? (
            <img 
              src={getThumbUrl(p.part_no, p.color_id)} 
              alt="" 
              className="w-8 h-8 object-contain bg-dark-bg rounded border border-dark-border"
              loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }}
            />
          ) : null}
          <div className="w-8 h-8 items-center justify-center bg-dark-bg rounded border border-dark-border" style={{ display: p.image_url ? 'none' : 'flex' }}>
            <ImageOff size={12} className="text-gray-700" />
          </div>
        </td>

        {/* Part # + name */}
        <td className="py-1.5 pr-3">
          <div className="font-mono text-lego-blue text-xs">{p.part_no}</div>
          <div className="text-gray-500 text-xs leading-tight truncate max-w-[160px]" title={p.part_name}>
            {p.part_name || '—'}
          </div>
        </td>

        {/* Color */}
        <td className="py-1.5 pr-3 text-xs">
          {colorSwatch(p.color_code, p.color_name) || '—'}
        </td>

        {/* Minifig set badge */}
        <td className="py-1.5 pr-3">
          {p.minifig_set && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-900/30 text-yellow-400">
              {p.minifig_set}
            </span>
          )}
        </td>

        {/* Extra / Alternate flags */}
        <td className="py-1.5 pr-3">
          {p.extra && (
            <span className="inline-block text-xs px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-400 mr-1" title="BrickLink lists this as extra/leftover">
              Extra
            </span>
          )}
          {p.alternate && (
            <span className="inline-block text-xs px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-400" title="BrickLink lists this as an alternate variant">
              Alt
            </span>
          )}
        </td>

        {/* Qty with edit controls */}
        <td className="py-1.5 pr-3 text-right">
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => editQty(partKey, -1)}
              className="p-0.5 rounded text-gray-500 hover:text-white hover:bg-dark-hover transition-colors"
              disabled={qty <= 0}
            >
              <Minus size={12} />
            </button>
            <span className="min-w-[1.5rem] text-center tabular-nums">{qty}</span>
            <button
              onClick={() => editQty(partKey, 1)}
              className="p-0.5 rounded text-gray-500 hover:text-white hover:bg-dark-hover transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
        </td>

        {/* Your price (editable) */}
        {pricingView !== 'market' && (
          <td className="py-1.5 pr-2 text-right">
            <input
              type="text"
              className="w-18 bg-dark-bg border border-dark-border rounded px-1.5 py-0.5 text-xs text-white text-right focus:border-lego-red"
              placeholder="—"
              value={edit?.price_cents != null ? (edit.price_cents / 100).toFixed(2) : ''}
              onChange={(e) => editPrice(partKey, e.target.value)}
              disabled={isSkipped}
            />
          </td>
        )}

        {/* Market price */}
        {pricingView !== 'your' && (
          <td className={`py-1.5 text-right tabular-nums ${priceCents ? 'text-lego-gold' : 'text-gray-600'} text-xs`}>
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
      <div className="flex items-center gap-4 text-xs py-1.5 px-3 border-t border-dark-border bg-dark-hover/20">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className="text-gray-300">{totals.totalParts} lots</span>
        <span className="text-gray-300">{totals.totalPieces} pcs</span>
        {totals.totalMarket > 0 && (
          <span className="text-lego-gold font-semibold">
            ~{fmtCents(totals.totalMarket)}
            <span className="text-gray-500 font-normal ml-1">({totals.pricedCount} priced)</span>
          </span>
        )}
      </div>
    )
  }

  // ── Render ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Part-Out Tool</h1>
          <p className="text-gray-400 text-sm mt-1">Enter a LEGO set number to pull its BrickLink inventory with pricing</p>
        </div>
      </div>

      {/* Search form */}
      <form onSubmit={search} className="bg-dark-card border border-dark-border rounded-xl p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[120px]">
            <input
              type="text"
              value={setNo}
              onChange={e => setSetNo(e.target.value)}
              placeholder="e.g. 21318 (Tree House)"
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-lego-red"
              required
            />
          </div>
          <select
            value={condition}
            onChange={e => setCondition(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white"
          >
            <option value="USED">Used</option>
            <option value="NEW">New</option>
          </select>
          <select
            value={completeness}
            onChange={e => setCompleteness(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white"
          >
            <option value="">Completeness (optional)</option>
            <option value="sealed">Sealed</option>
            <option value="complete">Complete</option>
            <option value="incomplete">Incomplete</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-lego-red hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm whitespace-nowrap"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Loading…' : 'Search'}
          </button>
        </div>

        {/* Defaults toggle */}
        <button
          type="button"
          onClick={() => setShowDefaults(!showDefaults)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Settings size={12} />
          Defaults
          {showDefaults ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {showDefaults && (
          <div className="bg-dark-bg border border-dark-border rounded-lg p-3 space-y-2 text-xs">
            <p className="text-gray-400 mb-1">These defaults are saved for next time:</p>
            <label className="flex items-center gap-2 text-gray-300">
              <span className="w-24 flex-shrink-0">Condition:</span>
              <select
                value={condition}
                onChange={e => {
                  setCondition(e.target.value)
                  api.updateSettings({ partout_default_condition: e.target.value }).catch(() => {})
                }}
                className="bg-dark-card border border-dark-border rounded px-2 py-1 text-white"
              >
                <option value="USED">Used</option>
                <option value="NEW">New</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-gray-300">
              <span className="w-24 flex-shrink-0">Auto-price:</span>
              <input type="checkbox" defaultChecked className="accent-lego-red" />
              <span className="text-gray-500">(always on)</span>
            </label>
          </div>
        )}
      </form>

      {/* Loading */}
      {loading && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center">
          <Loader className="w-8 h-8 text-lego-red mx-auto animate-spin mb-3" />
          <p className="text-gray-400">Fetching set inventory from BrickLink…</p>
          <p className="text-xs text-gray-600 mt-1">This may take a moment for large sets</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
          {/* Set header */}
          <div className="flex flex-col sm:flex-row gap-4">
            {result.set_image && (
              <img 
                src={result.set_image} 
                alt={result.set_name || result.set_no}
                className="w-24 h-24 object-contain bg-dark-bg rounded-lg border border-dark-border flex-shrink-0"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            )}
            <div className="min-w-0">
              <h3 className="text-white font-bold text-lg">{result.set_name || result.set_no}</h3>
              <p className="text-sm text-lego-blue font-mono">{result.set_no}</p>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                {result.set_year && <span>Year: {result.set_year}</span>}
                {result.total_lots > 0 && <span>{result.total_lots} unique lots</span>}
                <span>{result.total_pieces} total pieces</span>
                {result.minifig_count > 0 && <span>{result.minifig_count} minifig{result.minifig_count > 1 ? 's' : ''}</span>}
              </div>
              {result.completeness && (
                <div className="mt-1.5">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                    result.completeness === 'sealed' ? 'bg-green-900/30 text-green-400' :
                    result.completeness === 'complete' ? 'bg-blue-900/30 text-blue-400' :
                    'bg-yellow-900/30 text-yellow-400'
                  }`}>
                    {result.completeness.charAt(0).toUpperCase() + result.completeness.slice(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm button */}
            <div className="sm:ml-auto flex-shrink-0">
              <button
                onClick={confirm}
                disabled={confirming}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-sm whitespace-nowrap"
              >
                {confirming ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {confirming ? 'Sending…' : 'Send to Pending Review'}
              </button>
            </div>
          </div>

          {/* Pricing view toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Price view:</span>
            <div className="flex bg-dark-bg border border-dark-border rounded-lg overflow-hidden text-xs">
              {[
                ['market', 'Market'],
                ['your', 'Yours'],
                ['both', 'Both'],
              ].map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setPricingView(v)}
                  className={`px-3 py-1 transition-colors ${pricingView === v ? 'bg-lego-red text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-600">
              Click <Minus size={10} className="inline" /> <Plus size={10} className="inline" /> to adjust qty · 
              <X size={10} className="inline ml-1" /> to skip · click column to edit price
            </span>
          </div>

          {/* Regular parts table */}
          {result.regular_parts?.length > 0 && (
            <>
              {renderTotalsBar(regularTotals, 'Regular Parts')}
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-dark-border">
                      <th className="pb-2 pr-1 w-8"></th>
                      <th className="pb-2 pr-2 w-10"></th>
                      <th className="pb-2 pr-3 font-medium">Part</th>
                      <th className="pb-2 pr-3 font-medium">Color</th>
                      <th className="pb-2 pr-3 font-medium">Set</th>
                      <th className="pb-2 pr-3 font-medium">Flags</th>
                      <th className="pb-2 pr-3 font-medium text-right">Qty</th>
                      {pricingView !== 'market' && <th className="pb-2 pr-2 font-medium text-right">Your Price</th>}
                      {pricingView !== 'your' && <th className="pb-2 font-medium text-right">Market</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {result.regular_parts.map(p => renderPartRow(p, 'regular'))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Extras section */}
          {result.extras?.length > 0 && (
            <>
              <div className="text-sm font-semibold text-gray-400 mt-4 border-t border-dark-border pt-3">
                Extras ({result.extras.length} lots)
              </div>
              {renderTotalsBar(extrasTotals, 'Extras')}
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-dark-border">
                      <th className="pb-2 pr-1 w-8"></th>
                      <th className="pb-2 pr-2 w-10"></th>
                      <th className="pb-2 pr-3 font-medium">Part</th>
                      <th className="pb-2 pr-3 font-medium">Color</th>
                      <th className="pb-2 pr-3 font-medium"></th>
                      <th className="pb-2 pr-3 font-medium">Flags</th>
                      <th className="pb-2 pr-3 font-medium text-right">Qty</th>
                      {pricingView !== 'market' && <th className="pb-2 pr-2 font-medium text-right">Your Price</th>}
                      {pricingView !== 'your' && <th className="pb-2 font-medium text-right">Market</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {result.extras.map(p => renderPartRow(p, 'extras'))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Alternates section */}
          {result.alternates?.length > 0 && (
            <>
              <div className="text-sm font-semibold text-gray-400 mt-4 border-t border-dark-border pt-3">
                Alternates ({result.alternates.length} lots)
              </div>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-dark-border">
                      <th className="pb-2 pr-1 w-8"></th>
                      <th className="pb-2 pr-2 w-10"></th>
                      <th className="pb-2 pr-3 font-medium">Part</th>
                      <th className="pb-2 pr-3 font-medium">Color</th>
                      <th className="pb-2 pr-3 font-medium"></th>
                      <th className="pb-2 pr-3 font-medium">Flags</th>
                      <th className="pb-2 pr-3 font-medium text-right">Qty</th>
                      {pricingView !== 'market' && <th className="pb-2 pr-2 font-medium text-right">Your Price</th>}
                      {pricingView !== 'your' && <th className="pb-2 font-medium text-right">Market</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {result.alternates.map(p => renderPartRow(p, 'alternates'))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center">
          <Box className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Enter a LEGO set number above to start a part-out</p>
          <p className="text-xs text-gray-600 mt-1">Uses your BrickLink API connection to pull the official set inventory</p>
        </div>
      )}
    </div>
  )
}
