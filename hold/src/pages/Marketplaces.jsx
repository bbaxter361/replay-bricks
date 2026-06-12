import { useState, useEffect } from 'react'
import { api } from '../api'
import { Link2, RefreshCw, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Marketplaces() {
  const [status, setStatus] = useState(null)
  const [lots, setLots] = useState({ bricklink: [], brickowl: [] })
  const [syncing, setSyncing] = useState(null)

  useEffect(() => {
    api.status().then(s => {
      setStatus(s)
      if (s.bricklink) api.getMarketplaceLots('bricklink').then(l => setLots(prev => ({ ...prev, bricklink: l }))).catch(() => {})
      if (s.brickowl) api.getMarketplaceLots('brickowl').then(l => setLots(prev => ({ ...prev, brickowl: l }))).catch(() => {})
    }).catch(() => {})
  }, [])

  const sync = async (marketplace) => {
    setSyncing(marketplace)
    try {
      await api.sync(marketplace, 'all')
      toast.success(`${marketplace} synced`)
      const fresh = await api.getMarketplaceLots(marketplace)
      setLots(prev => ({ ...prev, [marketplace]: fresh }))
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSyncing(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Marketplaces</h1>
        <p className="text-gray-400 text-sm mt-1">Connected stores and their listing counts</p>
      </div>

      {['bricklink', 'brickowl'].map(mp => {
        const connected = status ? status[mp] : false
        const mpLots = lots[mp] || []
        const totalQty = mpLots.reduce((s, l) => s + (l.quantity || 0), 0)
        const totalValue = mpLots.reduce((s, l) => s + (l.quantity || 0) * (l.unit_price_cents || 0), 0)

        return (
          <div key={mp} className="bg-dark-card border border-dark-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mp === 'bricklink' ? 'bg-blue-900/30' : 'bg-orange-900/30'}`}>
                  <Link2 className={`w-5 h-5 ${mp === 'bricklink' ? 'text-blue-400' : 'text-orange-400'}`} />
                </div>
                <div>
                  <h3 className="text-white font-semibold capitalize">{mp === 'bricklink' ? 'BrickLink' : 'Brick Owl'}</h3>
                  <p className={`text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
                    {connected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => sync(mp)}
                  disabled={!connected || !!syncing}
                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-gray-300 hover:text-white disabled:opacity-40 text-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing === mp ? 'animate-spin' : ''}`} />
                  {syncing === mp ? 'Syncing…' : 'Sync'}
                </button>
              </div>
            </div>

            {connected ? (
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-dark-bg rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{mpLots.length}</div>
                  <div className="text-xs text-gray-500">Lots</div>
                </div>
                <div className="bg-dark-bg rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{totalQty}</div>
                  <div className="text-xs text-gray-500">Pieces</div>
                </div>
                <div className="bg-dark-bg rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-lego-gold">${(totalValue / 100).toFixed(2)}</div>
                  <div className="text-xs text-gray-500">Value</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm py-4">Configure API credentials in Settings to connect.</p>
            )}

            {mpLots.length > 0 && (
              <details className="mt-2">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-white">Show top lots ({Math.min(10, mpLots.length)} of {mpLots.length})</summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-dark-border">
                        <th className="pb-1 pr-3">Part #</th>
                        <th className="pb-1 pr-3">Name</th>
                        <th className="pb-1 pr-3 text-right">Qty</th>
                        <th className="pb-1 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mpLots.slice(0, 10).map((l, i) => (
                        <tr key={i} className="border-b border-dark-border/30 text-gray-300">
                          <td className="py-1 pr-3 font-mono text-lego-blue">{l.part_no}</td>
                          <td className="py-1 pr-3 truncate max-w-[200px]">{l.part_name || '—'}</td>
                          <td className="py-1 pr-3 text-right">{l.quantity}</td>
                          <td className="py-1 text-right">${((l.unit_price_cents || 0) / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        )
      })}
    </div>
  )
}
