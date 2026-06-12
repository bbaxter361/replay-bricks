import { useState, useEffect } from 'react'
import { api } from '../api'
import { Tags, Plus, Trash2, Zap, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Pricing() {
  const [rules, setRules] = useState([])
  const [preview, setPreview] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.getPricingRules(),
      api.getPricingPreview(),
    ]).then(([r, p]) => {
      setRules(r)
      setPreview(p)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const createRule = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const rule = {
      name: form.get('name'),
      rule_type: form.get('rule_type'),
      markup_percent: parseFloat(form.get('markup_percent')) || null,
      markup_fixed_cents: parseInt(form.get('markup_fixed')) || null,
      condition: form.get('condition') || null,
      min_price_cents: parseInt(form.get('min_price')) || null,
      max_price_cents: parseInt(form.get('max_price')) || null,
    }
    try {
      await api.createPricingRule(rule)
      toast.success('Rule created')
      setShowNew(false)
      load()
    } catch (err) { toast.error(err.message) }
  }

  const deleteRule = async (id) => {
    try {
      await api.deletePricingRule(id)
      toast.success('Rule deleted')
      load()
    } catch (err) { toast.error(err.message) }
  }

  const apply = async (changes) => {
    try {
      const r = await api.applyPricing(changes)
      toast.success(`Applied to ${r.applied} items (mode: ${r.push_mode})`)
      load()
    } catch (err) { toast.error(err.message) }
  }

  if (loading) return <div className="text-gray-400 p-8">Loading…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Auto-Pricing</h1>
          <p className="text-gray-400 text-sm mt-1">Set pricing rules and apply to inventory</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1.5 px-3 py-2 bg-lego-red hover:bg-red-700 text-white rounded-lg text-sm">
          <Plus className="w-4 h-4" /> New Rule
        </button>
      </div>

      {showNew && (
        <form onSubmit={createRule} className="bg-dark-card border border-dark-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Rule Name</label>
              <input name="name" required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white" placeholder="e.g. 20% over market" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select name="rule_type" className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white">
                <option value="percentage">Percentage Markup</option>
                <option value="fixed">Fixed Markup</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Markup %</label>
              <input name="markup_percent" type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white" placeholder="25" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Fixed (cents)</label>
              <input name="markup_fixed" type="number" className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white" placeholder="50" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Condition</label>
              <select name="condition" className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white">
                <option value="">All</option>
                <option value="NEW">New</option>
                <option value="USED">Used</option>
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Min Price (¢)</label>
                <input name="min_price" type="number" className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Max Price (¢)</label>
                <input name="max_price" type="number" className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white" />
              </div>
            </div>
          </div>
          <button type="submit" className="w-full bg-lego-red hover:bg-red-700 text-white py-2 rounded-lg text-sm">Create Rule</button>
        </form>
      )}

      {rules.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center">
          <Tags className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400">No pricing rules yet</p>
          <button onClick={() => setShowNew(true)} className="mt-2 text-lego-red hover:underline text-sm">Create your first rule</button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(r => (
            <div key={r.id} className="bg-dark-card border border-dark-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tags className="w-4 h-4 text-lego-red" />
                <div>
                  <div className="text-white font-medium">{r.name}</div>
                  <div className="text-xs text-gray-500">
                    {r.rule_type === 'percentage' ? `${r.markup_percent}% markup` : `+$${((r.markup_fixed_cents || 0)/100).toFixed(2)} fixed`}
                    {r.condition ? ` · ${r.condition}` : ''}
                  </div>
                </div>
              </div>
              <button onClick={() => deleteRule(r.id)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {/* Price Preview */}
      {preview && preview.proposals && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-lego-red" /> Price Preview ({preview.proposals.length} items)
          </h3>
          {preview.proposals.length === 0 ? (
            <p className="text-gray-500 text-sm">All prices are already optimal — no changes needed.</p>
          ) : (
            <>
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-dark-border">
                      <th className="pb-2 pr-3 font-medium">Part #</th>
                      <th className="pb-2 pr-3 font-medium">Name</th>
                      <th className="pb-2 pr-3 font-medium text-right">Current</th>
                      <th className="pb-2 font-medium text-right">Proposed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.proposals.slice(0, 15).map((p, i) => (
                      <tr key={i} className="border-b border-dark-border/30 text-gray-300">
                        <td className="py-1.5 pr-3 font-mono text-lego-blue text-xs">{p.part_no}</td>
                        <td className="py-1.5 pr-3 text-xs truncate max-w-[180px]">{p.part_name || '—'}</td>
                        <td className="py-1.5 pr-3 text-right text-xs">${((p.current_price_cents || 0) / 100).toFixed(2)}</td>
                        <td className="py-1.5 text-right text-lego-gold text-xs">${(p.proposed_price_cents / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => apply(preview.proposals.map(p => ({ inventory_id: p.inventory_id, price_cents: p.proposed_price_cents })))}
                className="flex items-center gap-1.5 px-3 py-2 bg-lego-red hover:bg-red-700 text-white rounded-lg text-sm"
              >
                <Zap className="w-4 h-4" /> Apply All ({preview.proposals.length} changes)
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
