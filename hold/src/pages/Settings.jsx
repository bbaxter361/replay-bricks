import { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { Save, Download, Upload, Moon, Sun, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
  const { settings, setSettings, exportAllData, importAllData } = useData()
  const { user } = useAuth()

  const [form, setForm] = useState({ ...settings })
  const [importJson, setImportJson] = useState('')

  if (!settings) return null

  const handleSave = () => {
    setSettings(form)
    toast.success('Settings saved')
  }

  const handleExport = () => {
    const data = exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hold_backup_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported')
  }

  const handleImport = () => {
    try {
      const data = JSON.parse(importJson)
      importAllData(data)
      setImportJson('')
      toast.success('Data imported successfully')
    } catch {
      toast.error('Invalid JSON format')
    }
  }

  const handleFileImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      setImportJson(evt.target.result)
    }
    reader.readAsText(file)
  }

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configure your store and preferences</p>
      </div>

      {/* Store Profile */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-white font-semibold mb-4">Store Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Store Name</label>
            <input
              type="text"
              value={form.storeName}
              onChange={e => setForm({...form, storeName: e.target.value})}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lego-red"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={e => setForm({...form, currency: e.target.value})}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-lego-red"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.taxRate}
                onChange={e => setForm({...form, taxRate: parseFloat(e.target.value) || 0})}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lego-red"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Default Condition</label>
              <select
                value={form.defaultCondition}
                onChange={e => setForm({...form, defaultCondition: e.target.value})}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-lego-red"
              >
                <option value="New">New</option>
                <option value="Used">Used</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Low Stock Threshold</label>
              <input
                type="number"
                min="1"
                value={form.lowStockThreshold}
                onChange={e => setForm({...form, lowStockThreshold: parseInt(e.target.value) || 5})}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lego-red"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-white font-semibold mb-4">Notifications</h3>
        <div className="space-y-3">
          {['newOrder', 'lowStock', 'shipment'].map(key => (
            <label key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-300 capitalize">
                {key === 'newOrder' ? 'New Orders' : key === 'lowStock' ? 'Low Stock Alerts' : 'Shipment Updates'}
              </span>
              <input
                type="checkbox"
                checked={form.notifications?.[key] ?? true}
                onChange={e => setForm({
                  ...form,
                  notifications: { ...form.notifications, [key]: e.target.checked }
                })}
                className="rounded border-dark-border bg-dark-bg text-lego-red focus:ring-lego-red"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-white font-semibold mb-4">Account</h3>
        <div className="text-sm text-gray-400 space-y-2">
          <div className="flex justify-between">
            <span>Email</span>
            <span className="text-white">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span>Name</span>
            <span className="text-white">{user?.name}</span>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-white font-semibold mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleExport} className="flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> Export All Data
            </button>
            <label className="flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer">
              <Upload className="w-4 h-4" /> Import JSON
              <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
            </label>
          </div>
          {importJson && (
            <div>
              <textarea
                value={importJson}
                onChange={e => setImportJson(e.target.value)}
                className="w-full h-32 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-lego-red"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleImport} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Import Data
                </button>
                <button onClick={() => setImportJson('')} className="text-gray-400 hover:text-white px-3 py-2 text-sm">Cancel</button>
              </div>
            </div>
          )}
          <button onClick={handleClearData} className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full">
            <Trash2 className="w-4 h-4" /> Clear All Data
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="bg-lego-red hover:bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>
    </div>
  )
}
