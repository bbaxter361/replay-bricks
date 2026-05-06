import { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { Search, Plus, X, Package, DollarSign, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const SET_CATALOG = {
  '75257': {
    name: 'Millennium Falcon',
    year: 2019,
    pieces: 1351,
    parts: [
      { partNum: '3001', name: 'Brick 2x4', color: 'Dark Grey', qty: 12, price: 0.12 },
      { partNum: '3002', name: 'Brick 2x3', color: 'Dark Grey', qty: 4, price: 0.10 },
      { partNum: '3003', name: 'Brick 2x2', color: 'Dark Grey', qty: 8, price: 0.08 },
      { partNum: '3020', name: 'Plate 2x4', color: 'Dark Grey', qty: 6, price: 0.15 },
      { partNum: '3021', name: 'Plate 2x3', color: 'Dark Grey', qty: 4, price: 0.18 },
      { partNum: '3022', name: 'Plate 2x2', color: 'Dark Grey', qty: 10, price: 0.10 },
      { partNum: '3023', name: 'Plate 1x2', color: 'Dark Grey', qty: 15, price: 0.07 },
      { partNum: '3710', name: 'Plate 1x4', color: 'Dark Grey', qty: 5, price: 0.12 },
      { partNum: '4070', name: 'Brick 1x1 with Headlight', color: 'Trans-Clear', qty: 2, price: 0.25 },
      { partNum: '4477', name: 'Plate 1x10', color: 'Dark Grey', qty: 2, price: 0.35 },
      { partNum: '63864', name: 'Tile 1x6', color: 'Dark Grey', qty: 8, price: 0.32 },
      { partNum: '6636', name: 'Tile 1x6 with Groove', color: 'Dark Grey', qty: 4, price: 0.30 },
      { partNum: '87079', name: 'Tile 2x4', color: 'Dark Grey', qty: 6, price: 0.40 },
      { partNum: '3005', name: 'Brick 1x1', color: 'Black', qty: 20, price: 0.04 },
      { partNum: '3024', name: 'Plate 1x1', color: 'Dark Grey', qty: 25, price: 0.05 },
    ]
  },
  '21318': {
    name: 'Tree House',
    year: 2019,
    pieces: 3036,
    parts: [
      { partNum: '3001', name: 'Brick 2x4', color: 'Green', qty: 15, price: 0.12 },
      { partNum: '3003', name: 'Brick 2x2', color: 'Green', qty: 10, price: 0.08 },
      { partNum: '3020', name: 'Plate 2x4', color: 'Green', qty: 8, price: 0.15 },
      { partNum: '3022', name: 'Plate 2x2', color: 'Green', qty: 12, price: 0.10 },
      { partNum: '3023', name: 'Plate 1x2', color: 'Green', qty: 20, price: 0.07 },
      { partNum: '3710', name: 'Plate 1x4', color: 'Green', qty: 6, price: 0.12 },
      { partNum: '3005', name: 'Brick 1x1', color: 'Green', qty: 30, price: 0.04 },
      { partNum: '3004', name: 'Brick 1x2', color: 'Green', qty: 18, price: 0.06 },
      { partNum: '3024', name: 'Plate 1x1', color: 'Green', qty: 35, price: 0.05 },
      { partNum: '4085', name: 'Plate 1x1 with Clip', color: 'Black', qty: 4, price: 0.20 },
      { partNum: '4286', name: 'Slope 1x3', color: 'Green', qty: 6, price: 0.22 },
      { partNum: '48336', name: 'Plate 1x2 with Side Clip', color: 'Green', qty: 3, price: 0.30 },
    ]
  },
  '10295': {
    name: 'Porsche 911',
    year: 2021,
    pieces: 1458,
    parts: [
      { partNum: '3001', name: 'Brick 2x4', color: 'White', qty: 8, price: 0.12 },
      { partNum: '3002', name: 'Brick 2x3', color: 'White', qty: 4, price: 0.10 },
      { partNum: '3003', name: 'Brick 2x2', color: 'White', qty: 6, price: 0.08 },
      { partNum: '3020', name: 'Plate 2x4', color: 'White', qty: 6, price: 0.15 },
      { partNum: '3021', name: 'Plate 2x3', color: 'White', qty: 4, price: 0.18 },
      { partNum: '3022', name: 'Plate 2x2', color: 'White', qty: 8, price: 0.10 },
      { partNum: '3023', name: 'Plate 1x2', color: 'White', qty: 12, price: 0.07 },
      { partNum: '3005', name: 'Brick 1x1', color: 'Black', qty: 15, price: 0.04 },
      { partNum: '3024', name: 'Plate 1x1', color: 'White', qty: 20, price: 0.05 },
      { partNum: '63864', name: 'Tile 1x6', color: 'Black', qty: 4, price: 0.32 },
      { partNum: '87079', name: 'Tile 2x4', color: 'Black', qty: 3, price: 0.40 },
      { partNum: '3710', name: 'Plate 1x4', color: 'White', qty: 5, price: 0.12 },
    ]
  },
  '75301': {
    name: "Luke Skywalker's X-Wing",
    year: 2021,
    pieces: 474,
    parts: [
      { partNum: '3001', name: 'Brick 2x4', color: 'Red', qty: 6, price: 0.12 },
      { partNum: '3001', name: 'Brick 2x4', color: 'White', qty: 4, price: 0.12 },
      { partNum: '3003', name: 'Brick 2x2', color: 'Red', qty: 4, price: 0.08 },
      { partNum: '3020', name: 'Plate 2x4', color: 'White', qty: 4, price: 0.15 },
      { partNum: '3022', name: 'Plate 2x2', color: 'Red', qty: 6, price: 0.10 },
      { partNum: '3023', name: 'Plate 1x2', color: 'White', qty: 8, price: 0.07 },
      { partNum: '3005', name: 'Brick 1x1', color: 'White', qty: 12, price: 0.04 },
      { partNum: '3024', name: 'Plate 1x1', color: 'Red', qty: 15, price: 0.05 },
      { partNum: '3710', name: 'Plate 1x4', color: 'White', qty: 3, price: 0.12 },
      { partNum: '63864', name: 'Tile 1x6', color: 'Red', qty: 2, price: 0.32 },
      { partNum: '4286', name: 'Slope 1x3', color: 'Red', qty: 4, price: 0.22 },
    ]
  }
}

export default function PartOut() {
  const { addItem } = useData()
  const [setNum, setSetNum] = useState('')
  const [currentSet, setCurrentSet] = useState(null)
  const [selectedParts, setSelectedParts] = useState({})
  const [error, setError] = useState('')

  const lookUp = () => {
    setError('')
    const key = setNum.trim()
    if (SET_CATALOG[key]) {
      setCurrentSet({ ...SET_CATALOG[key], setNum: key })
      const sel = {}
      SET_CATALOG[key].parts.forEach((p, idx) => {
        sel[idx] = { selected: true, qty: p.qty, price: p.price }
      })
      setSelectedParts(sel)
    } else {
      setError(`Set "${key}" not found in catalog. Try: 75257, 21318, 10295, 75301`)
      setCurrentSet(null)
    }
  }

  const addToInventory = () => {
    if (!currentSet) return
    let count = 0
    currentSet.parts.forEach((part, idx) => {
      const sel = selectedParts[idx]
      if (sel && sel.selected) {
        addItem({
          partNum: part.partNum,
          name: part.name,
          color: part.color,
          category: 'Bricks',
          qty: parseInt(sel.qty) || 1,
          price: parseFloat(sel.price) || 0.10,
          location: '',
          condition: 'New',
          notes: `From set ${currentSet.setNum} ${currentSet.name}`,
        })
        count++
      }
    })
    toast.success(`Added ${count} parts from ${currentSet.name} to inventory!`)
  }

  const totalValue = currentSet
    ? currentSet.parts.reduce((sum, part, idx) => {
        const sel = selectedParts[idx]
        return sel && sel.selected
          ? sum + (parseFloat(sel.price) || 0) * (parseInt(sel.qty) || 0)
          : sum
      }, 0)
    : 0

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Part-Out Tool</h1>
        <p className="text-gray-400 text-sm mt-1">Extract parts from a LEGO set and add them to inventory</p>
      </div>

      {/* Search */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">LEGO Set Number</label>
            <input
              type="text"
              value={setNum}
              onChange={e => setSetNum(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookUp()}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lego-red"
              placeholder="e.g. 75257"
            />
          </div>
          <button onClick={lookUp} className="bg-lego-red hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
            <Search className="w-4 h-4" /> Look Up
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Set Info */}
      {currentSet && (
        <>
          <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-lego-red/20 rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-lego-red" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{currentSet.name}</h2>
                <p className="text-sm text-gray-400">Set #{currentSet.setNum} · {currentSet.pieces} pieces · {currentSet.year}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm text-gray-400">Parts to add</p>
                <p className="text-xl font-bold text-white">
                  {Object.values(selectedParts).filter(s => s.selected).length}
                </p>
              </div>
            </div>
          </div>

          {/* Parts List */}
          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const allSelected = Object.values(selectedParts).every(s => s.selected)
                    const newSel = {}
                    Object.keys(selectedParts).forEach(k => { newSel[k] = { ...selectedParts[k], selected: !allSelected } })
                    setSelectedParts(newSel)
                  }}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  {Object.values(selectedParts).every(s => s.selected) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <p className="text-sm text-green-400 font-medium">Total: ${totalValue.toFixed(2)}</p>
            </div>
            <div className="divide-y divide-dark-border max-h-96 overflow-y-auto">
              {currentSet.parts.map((part, idx) => {
                const sel = selectedParts[idx]
                if (!sel) return null
                return (
                  <div key={idx} className={`flex items-center gap-3 px-4 py-2.5 ${sel.selected ? '' : 'opacity-40'}`}>
                    <input
                      type="checkbox"
                      checked={sel.selected}
                      onChange={() => setSelectedParts(prev => ({
                        ...prev,
                        [idx]: { ...prev[idx], selected: !prev[idx].selected }
                      }))}
                      className="rounded border-dark-border bg-dark-bg text-lego-red focus:ring-lego-red"
                    />
                    <span className="w-20 text-xs font-mono text-lego-red">{part.partNum}</span>
                    <span className="flex-1 text-sm text-white">{part.name}</span>
                    <span className="w-16 text-xs text-gray-400">{part.color}</span>
                    <input
                      type="number"
                      value={sel.qty}
                      onChange={e => setSelectedParts(prev => ({
                        ...prev,
                        [idx]: { ...prev[idx], qty: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-16 bg-dark-bg border border-dark-border rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-lego-red"
                      min="0"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={sel.price}
                      onChange={e => setSelectedParts(prev => ({
                        ...prev,
                        [idx]: { ...prev[idx], price: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-20 bg-dark-bg border border-dark-border rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-lego-red"
                      min="0"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Add Button */}
          <div className="flex justify-end">
            <button
              onClick={addToInventory}
              className="bg-lego-red hover:bg-red-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Selected to Inventory
            </button>
          </div>
        </>
      )}
    </div>
  )
}
