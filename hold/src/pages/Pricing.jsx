import { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { Plus, X, Percent, DollarSign, TrendingUp, Play } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Pricing() {
  const { items, pricingRules, addPricingRule, deletePricingRule, updateItem, addPriceHistory } = useData()
  const [showAddRule, setShowAddRule] = useState(false)
  const [newRule, setNewRule] = useState({
    name: '', markup: 25, minPrice: 0.03, maxPrice: 1.00, categories: [],
  })
  const [selectedCat, setSelectedCat] = useState('')

  const allCategories = [...new Set(items.map(i => i.category))]

  const applyRule = (rule) => {
    let count = 0
    items.forEach(item => {
      if (rule.categories.length === 0 || rule.categories.includes(item.category)) {
        const marketPrice = item.price
        const markupFactor = 1 + (rule.markup / 100)
        let newPrice = marketPrice * markupFactor
        if (rule.minPrice) newPrice = Math.max(newPrice, rule.minPrice)
        if (rule.maxPrice) newPrice = Math.min(newPrice, rule.maxPrice)
        newPrice = Math.round(newPrice * 100) / 100
        if (newPrice !== item.price) {
          addPriceHistory({ itemId: item.id, price: newPrice, previousPrice: item.price })
          updateItem(item.id, { price: newPrice })
          count++
        }
      }
    })
    toast.success(`Applied "${rule.name}" to ${count} items`)
  }

  const applyAllRules = () => {
    pricingRules.forEach(rule => applyRule(rule))
    toast.success('All pricing rules applied')
  }

  const addCategory = () => {
    if (selectedCat && !newRule.categories.includes(selectedCat)) {
      setNewRule(prev => ({ ...prev, categories: [...prev.categories, selectedCat] }))
    }
  }

  const removeCategory = (cat) => {
    setNewRule(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }))
  }

  const handleAddRule = (e) => {
    e.preventDefault()
    if (!newRule.name.trim()) { toast.error('Rule name is required'); return }
    addPricingRule(newRule)
    setNewRule({ name: '', markup: 25, minPrice: 0.03, maxPrice: 1.00, categories: [] })
    setShowAddRule(false)
    toast.success('Pricing rule created')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Auto-Pricing</h1>
          <p className="text-gray-400 text-sm mt-1">Set pricing rules and apply them to your inventory</p>
        </div>
        <div className="flex gap-2">
          {pricingRules.length > 0 && (
            <button onClick={applyAllRules} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              <Play className="w-4 h-4" /> Apply All
            </button>
          )}
          <button onClick={() => setShowAddRule(true)} className="flex items-center gap-1.5 bg-lego-red hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Rule
          </button>
        </div>
      </div>

      {/* Pricing Rules List */}
      <div className="space-y-3">
        {pricingRules.length === 0 && (
          <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-500">No pricing rules yet</p>
            <button onClick={() => setShowAddRule(true)} className="text-lego-red text-sm mt-2 hover:text-red-400">Create your first rule</button>
          </div>
        )}
        {pricingRules.map(rule => (
          <div key={rule.id} className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-semibold">{rule.name}</h3>
                <div className="flex gap-4 mt-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><Percent className="w-3 h-3" /> Markup: {rule.markup}%</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Min: ${rule.minPrice.toFixed(2)}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Max: ${rule.maxPrice.toFixed(2)}</span>
                </div>
                {rule.categories.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {rule.categories.map(cat => (
                      <span key={cat} className="text-xs bg-dark-surface text-gray-300 px-2 py-0.5 rounded-full border border-dark-border">{cat}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => applyRule(rule)} className="text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 px-3 py-1.5 rounded-lg transition-colors">Apply</button>
                <button onClick={() => { deletePricingRule(rule.id); toast.success('Rule deleted') }} className="text-xs text-gray-500 hover:text-red-400 px-2 py-1.5">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Price Comparison Preview */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Price Preview
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left py-2 text-gray-400">Part #</th>
                <th className="text-left py-2 text-gray-400">Name</th>
                <th className="text-right py-2 text-gray-400">Current Price</th>
                <th className="text-right py-2 text-gray-400">After 25% Markup</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 10).map(item => (
                <tr key={item.id} className="border-b border-dark-border/50">
                  <td className="py-2 font-mono text-lego-red">{item.partNum}</td>
                  <td className="py-2 text-white">{item.name}</td>
                  <td className="py-2 text-right text-gray-300">${item.price.toFixed(2)}</td>
                  <td className="py-2 text-right text-green-400 font-medium">${(item.price * 1.25).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-dark-border">
              <h3 className="text-white font-semibold">New Pricing Rule</h3>
              <button onClick={() => setShowAddRule(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddRule} className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Rule Name</label>
                <input type="text" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lego-red" placeholder="e.g. Standard Markup" required />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Markup %</label>
                <input type="number" min="0" max="1000" value={newRule.markup} onChange={e => setNewRule({...newRule, markup: parseInt(e.target.value) || 0})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lego-red" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Min Price ($)</label>
                  <input type="number" step="0.01" value={newRule.minPrice} onChange={e => setNewRule({...newRule, minPrice: parseFloat(e.target.value) || 0})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lego-red" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Max Price ($)</label>
                  <input type="number" step="0.01" value={newRule.maxPrice} onChange={e => setNewRule({...newRule, maxPrice: parseFloat(e.target.value) || 0})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lego-red" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Categories (leave empty for all)</label>
                <div className="flex gap-2">
                  <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-lego-red">
                    <option value="">Select category...</option>
                    {allCategories.filter(c => !newRule.categories.includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="button" onClick={addCategory} className="bg-dark-surface border border-dark-border text-gray-300 px-3 py-2 rounded-lg text-sm hover:text-white">Add</button>
                </div>
                {newRule.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newRule.categories.map(cat => (
                      <span key={cat} className="flex items-center gap-1 text-xs bg-dark-surface text-gray-300 px-2 py-0.5 rounded-full border border-dark-border">
                        {cat}
                        <button type="button" onClick={() => removeCategory(cat)} className="text-gray-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddRule(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="bg-lego-red hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">Create Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
