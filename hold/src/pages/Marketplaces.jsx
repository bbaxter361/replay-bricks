import { useData } from '../contexts/DataContext'
import { Store, Link2, Link2Off, Download, Settings2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const MARKETPLACE_ICONS = {
  bricklink: 'BL',
  brickowl: 'BO',
}

const MARKETPLACE_COLORS = {
  bricklink: 'text-orange-400 bg-orange-500/20',
  brickowl: 'text-blue-400 bg-blue-500/20',
}

export default function Marketplaces() {
  const { marketplaces, toggleMarketplace, items } = useData()

  const exportForMarketplace = (type) => {
    if (items.length === 0) { toast.error('No items to export'); return }
    
    let csv = ''
    if (type === 'bricklink') {
      csv = 'Part #,Name,Color,Category,Qty,Price,Condition,Notes\n'
      items.forEach(i => {
        csv += `${i.partNum},"${i.name}",${i.color},${i.category},${i.qty},${i.price},${i.condition},"${i.notes}"\n`
      })
    } else if (type === 'brickowl') {
      csv = 'PartID,Name,Color,Quantity,Price,Condition\n'
      items.forEach(i => {
        csv += `${i.partNum},"${i.name}",${i.color},${i.qty},${i.price},${i.condition}\n`
      })
    }

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hold_export_${type}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported for ${type}`)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Marketplaces</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your marketplace connections and export inventory</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {marketplaces.map(mp => (
          <div key={mp.id} className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${MARKETPLACE_COLORS[mp.type]}`}>
                <span className="text-xs font-bold">{MARKETPLACE_ICONS[mp.type]}</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">{mp.name}</h3>
                <p className="text-xs text-gray-500 capitalize">{mp.type}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <span className={`flex items-center gap-1.5 text-xs font-medium ${
                  mp.connected ? 'text-green-400' : 'text-gray-500'
                }`}>
                  {mp.connected ? (
                    <><Link2 className="w-3 h-3" /> Connected</>
                  ) : (
                    <><Link2Off className="w-3 h-3" /> Disconnected</>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Store Name</span>
                <span className="text-white">{mp.storeName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Items Listed</span>
                <span className="text-white">
                  {mp.connected ? items.length : '—'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t border-dark-border">
              <button
                onClick={() => {
                  toggleMarketplace(mp.id)
                  toast.success(mp.connected ? 'Disconnected' : 'Connected')
                }}
                className={`flex-1 text-sm py-2 rounded-lg font-medium transition-colors ${
                  mp.connected
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                }`}
              >
                {mp.connected ? 'Disconnect' : 'Connect'}
              </button>
              <button
                onClick={() => exportForMarketplace(mp.type)}
                className="flex items-center gap-1 bg-dark-surface text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm border border-dark-border transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Export All */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-white font-semibold mb-3">Bulk Export</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={() => exportForMarketplace('bricklink')} className="flex items-center justify-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> BrickLink CSV
          </button>
          <button onClick={() => exportForMarketplace('brickowl')} className="flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> Brick Owl CSV
          </button>
        </div>
      </div>
    </div>
  )
}
