import { useData } from '../contexts/DataContext'
import { DollarSign, AlertTriangle, TrendingUp, Package, BarChart3, Printer } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import toast from 'react-hot-toast'

export default function Reports() {
  const { items, settings } = useData()

  const totalItems = items.reduce((s, i) => s + i.qty, 0)
  const totalValue = items.reduce((s, i) => s + i.qty * i.price, 0)
  const avgPrice = items.length > 0 ? items.reduce((s, i) => s + i.price, 0) / items.length : 0
  const lowStock = items.filter(i => i.qty <= (settings?.lowStockThreshold || 5))
  const uniqueParts = items.length
  const uniqueColors = [...new Set(items.map(i => i.color))].length

  const topItems = [...items].sort((a, b) => (b.qty * b.price) - (a.qty * a.price)).slice(0, 10)

  const categoryData = items.reduce((acc, item) => {
    const existing = acc.find(c => c.name === item.category)
    if (existing) existing.value += item.qty * item.price
    else acc.push({ name: item.category, value: Math.round(item.qty * item.price * 100) / 100 })
    return acc
  }, [])

  const conditionData = [
    { name: 'New', value: items.filter(i => i.condition === 'New').reduce((s, i) => s + i.qty, 0) },
    { name: 'Used', value: items.filter(i => i.condition === 'Used').reduce((s, i) => s + i.qty, 0) },
  ]

  const COLORS = ['#E3000B', '#FFD700', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4']

  const printReport = () => {
    window.print()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory Reports</h1>
          <p className="text-gray-400 text-sm mt-1">Detailed analysis of your inventory</p>
        </div>
        <button onClick={printReport} className="flex items-center gap-1.5 bg-dark-surface hover:bg-dark-border text-gray-300 px-3 py-2 rounded-lg text-sm font-medium border border-dark-border transition-colors">
          <Printer className="w-4 h-4" /> Print Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Total Value</p>
              <p className="text-xl font-bold text-white">${totalValue.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400 opacity-60" />
          </div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Total Pieces</p>
              <p className="text-xl font-bold text-white">{totalItems.toLocaleString()}</p>
            </div>
            <Package className="w-8 h-8 text-blue-400 opacity-60" />
          </div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Unique Parts</p>
              <p className="text-xl font-bold text-white">{uniqueParts}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-400 opacity-60" />
          </div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Low Stock Items</p>
              <p className="text-xl font-bold text-white">{lowStock.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400 opacity-60" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Value */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-white font-semibold mb-4">Value by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={11} width={100} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: '8px', color: '#e0e0e0' }}
                  formatter={(v) => [`$${v.toFixed(2)}`, 'Value']}
                />
                <Bar dataKey="value" fill="#E3000B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Condition Breakdown */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-white font-semibold mb-4">Condition Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conditionData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {conditionData.map((entry, idx) => (
                    <Cell key={entry.name} fill={idx === 0 ? '#10B981' : '#F59E0B'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: '8px', color: '#e0e0e0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Most Valuable Items */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-lego-gold" /> Most Valuable Items
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left py-2 text-gray-400">#</th>
                <th className="text-left py-2 text-gray-400">Part #</th>
                <th className="text-left py-2 text-gray-400">Name</th>
                <th className="text-right py-2 text-gray-400">Qty</th>
                <th className="text-right py-2 text-gray-400">Price</th>
                <th className="text-right py-2 text-gray-400">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item, idx) => (
                <tr key={item.id} className="border-b border-dark-border/50">
                  <td className="py-2 text-gray-500">{idx + 1}</td>
                  <td className="py-2 font-mono text-lego-red">{item.partNum}</td>
                  <td className="py-2 text-white">{item.name}</td>
                  <td className="py-2 text-right text-white">{item.qty}</td>
                  <td className="py-2 text-right text-green-400">${item.price.toFixed(2)}</td>
                  <td className="py-2 text-right text-white font-bold">${(item.qty * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock */}
      {lowStock.length > 0 && (
        <div className="bg-dark-card border border-red-500/20 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Low Stock Alerts ({lowStock.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {lowStock.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm text-white">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.partNum} · {item.color}</p>
                </div>
                <span className="text-sm font-bold text-red-400">{item.qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
