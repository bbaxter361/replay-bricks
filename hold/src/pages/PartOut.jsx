import { useState } from 'react'
import { api } from '../api'
import { Box, Search, Loader, CheckCircle, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PartOut() {
  const [setNo, setSetNo] = useState('')
  const [condition, setCondition] = useState('USED')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [confirming, setConfirming] = useState(false)

  const search = async (e) => {
    e.preventDefault()
    if (!setNo.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const data = await api.partOut(setNo.trim(), { condition, include_prices: true })
      setResult(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const confirm = async () => {
    if (!result?.parts) return
    setConfirming(true)
    try {
      await api.confirmPartOut(setNo.trim(), { parts: result.parts, condition })
      toast.success(`${result.parts.length} parts sent to Pending Review`)
      setResult(null)
      setSetNo('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Part-Out Tool</h1>
        <p className="text-gray-400 text-sm mt-1">Enter a set number to pull its full inventory from BrickLink</p>
      </div>

      <form onSubmit={search} className="bg-dark-card border border-dark-border rounded-xl p-4">
        <div className="flex gap-3">
          <div className="flex-1">
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
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-lego-red hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm whitespace-nowrap"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {result && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">{result.set_no}</h3>
              <p className="text-sm text-gray-400">
                {result.total_lots} unique lots · {result.total_pieces} total pieces
              </p>
            </div>
            <button
              onClick={confirm}
              disabled={confirming}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-sm"
            >
              {confirming ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Send to Pending Review
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-dark-border">
                  <th className="pb-2 pr-3 font-medium">Part #</th>
                  <th className="pb-2 pr-3 font-medium">Color</th>
                  <th className="pb-2 pr-3 font-medium text-right">Qty</th>
                  <th className="pb-2 pr-3 font-medium text-right">Market Price</th>
                </tr>
              </thead>
              <tbody>
                {result.parts.slice(0, 50).map((p, i) => (
                  <tr key={i} className="border-b border-dark-border/30 text-gray-300">
                    <td className="py-1.5 pr-3 font-mono text-lego-blue text-xs">{p.part_no}</td>
                    <td className="py-1.5 pr-3 text-xs">{p.color_name || p.color_id || '—'}</td>
                    <td className="py-1.5 pr-3 text-right">{p.quantity}</td>
                    <td className="py-1.5 text-right text-lego-gold text-xs">
                      {p.cached_avg_price_cents ? `$${(p.cached_avg_price_cents / 100).toFixed(2)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.parts.length > 50 && (
            <p className="text-xs text-gray-500 mt-2">Showing 50 of {result.parts.length} parts</p>
          )}
        </div>
      )}

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
