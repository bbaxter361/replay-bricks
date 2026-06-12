import { useState, useEffect } from 'react'
import { api } from '../api'
import { DollarSign, Package, AlertTriangle, TrendingUp, BarChart3, Printer } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import toast from 'react-hot-toast'

const COLORS = ['#E3000B', '#FFD700', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4']

export default function Reports() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.getDashboard().then(d => {
      Promise.all([
        api.getReports(),
        api.getOrders({ limit: 200 }),
      ]).then(([reports, orders]) => {
        setData({ ...d.stats, ...reports, orders: orders.orders || [] })
      }).catch(() => {})
    }).catch(() => {})
  }, [])

  if (!data) return <div className="text-gray-400 p-8">Loading reports…</div>

  const totalValue = (data.totalValueCents / 100).toFixed(2)
  const totalItems = data.totalItems
  const uniqueParts = data.uniqueParts
  const lowStock = (data.topValue || []).filter(i => i.quantity <= 3).length

  const topItems = (data.topValue || []).slice(0, 10).map((i, idx) => ({
    rank: idx + 1,
    part_no: i.part_no,
    name: i.part_name,
    qty: i.quantity,
    price: (i.unit_price_cents / 100).toFixed(2),
    total: (i.total_cents / 100).toFixed(2),
  }))

  const categoryData = (data.byMarketplace || []).map(m => ({
    name: m.marketplace === 'bricklink' ? 'BrickLink' : m.marketplace === 'brickowl' ? 'BrickOwl' : m.marketplace,
    value: (m.value_cents / 100).toFixed(2),
  }))

  const conditionData = (data.byCondition || []).map(c => ({
    name: c.condition === 'USED' ? 'Used' : c.condition === 'NEW' ? 'New' : c.condition,
    value: c.pieces,
  }))

  const printReport = () => window.print()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory Reports</h1>
          <p className="text-gray-400 text-sm mt-1">Detailed analysis of your inventory</p>
        </div>
        <button onClick={printReport} className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-card border border-dark-border rounded-lg text-gray-300 hover:text-white text-sm">
          <Printer className="w-4 h-4" /> Print Report
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Value', value: `$${totalValue}`, icon: DollarSign },
          { label: 'Total Pieces', value: totalItems, icon: Package },
          { label: 'Unique Parts', value: uniqueParts, icon: TrendingUp },
          { label: 'Low Stock Items', value: lowStock, icon: AlertTriangle },
        ].map((s, i) => (
          <div key={i} className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <s.icon className="w-3.5 h-3.5" /> {s.label}
            </div>
            <div className="text-xl font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Value by Marketplace */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-lego-red" /> Value by Marketplace</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#F9FAFB' }} />
                <Bar dataKey="value" fill="#E3000B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-sm">No marketplace data</p>}
        </div>

        {/* Condition Breakdown */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-lego-blue" /> Condition Breakdown</h3>
          {conditionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={conditionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {conditionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#F9FAFB' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-sm">No condition data</p>}
        </div>
      </div>

      {/* Most Valuable Items */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Most Valuable Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-dark-border">
                <th className="pb-2 pr-4 font-medium">#</th>
                <th className="pb-2 pr-4 font-medium">Part #</th>
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium text-right">Qty</th>
                <th className="pb-2 pr-4 font-medium text-right">Price</th>
                <th className="pb-2 font-medium text-right">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map(item => (
                <tr key={item.rank} className="border-b border-dark-border/50 text-gray-300">
                  <td className="py-2 pr-4">{item.rank}</td>
                  <td className="py-2 pr-4 font-mono text-lego-blue">{item.part_no}</td>
                  <td className="py-2 pr-4">{item.name || '—'}</td>
                  <td className="py-2 pr-4 text-right">{item.qty}</td>
                  <td className="py-2 pr-4 text-right">${item.price}</td>
                  <td className="py-2 text-right text-lego-gold">${item.total}</td>
                </tr>
              ))}
              {topItems.length === 0 && <tr><td colSpan="6" className="py-4 text-center text-gray-500">No items</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
