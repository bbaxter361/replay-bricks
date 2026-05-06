import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const DataContext = createContext()

const STORAGE_KEYS = {
  items: 'hold_items',
  orders: 'hold_orders',
  pricingRules: 'hold_pricingRules',
  marketplaces: 'hold_marketplaces',
  settings: 'hold_settings',
  priceHistory: 'hold_priceHistory',
}

export function DataProvider({ children }) {
  const [items, setItemsState] = useState([])
  const [orders, setOrdersState] = useState([])
  const [pricingRules, setPricingRulesState] = useState([])
  const [marketplaces, setMarketplacesState] = useState([])
  const [settings, setSettingsState] = useState(null)
  const [priceHistory, setPriceHistoryState] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = () => {
      const stored = {}
      for (const [key, sk] of Object.entries(STORAGE_KEYS)) {
        const val = localStorage.getItem(sk)
        stored[key] = val ? JSON.parse(val) : null
      }
      if (stored.items) setItemsState(stored.items)
      else setItemsState([])

      if (stored.orders) setOrdersState(stored.orders)
      else setOrdersState([])

      if (stored.pricingRules) setPricingRulesState(stored.pricingRules)
      else setPricingRulesState([])

      if (stored.marketplaces) setMarketplacesState(stored.marketplaces)
      else setMarketplacesState([])

      if (stored.settings) setSettingsState(stored.settings)
      else setSettingsState({
        storeName: 'Replay Bricks',
        currency: 'USD',
        lowStockThreshold: 5,
        taxRate: 0,
        defaultCondition: 'New',
        notifications: { newOrder: true, lowStock: true, shipment: true },
      })

      if (stored.priceHistory) setPriceHistoryState(stored.priceHistory)
      else setPriceHistoryState([])
      setLoaded(true)
    }
    load()
  }, [])

  const save = useCallback((key, data) => {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data))
  }, [])

  // Items
  const setItems = useCallback((val) => {
    setItemsState(val)
    save('items', val)
  }, [save])

  const addItem = useCallback((item) => {
    const newItem = { ...item, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    setItemsState(prev => {
      const next = [...prev, newItem]
      save('items', next)
      return next
    })
    return newItem
  }, [save])

  const updateItem = useCallback((id, updates) => {
    setItemsState(prev => {
      const next = prev.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item)
      save('items', next)
      return next
    })
  }, [save])

  const deleteItem = useCallback((id) => {
    setItemsState(prev => {
      const next = prev.filter(item => item.id !== id)
      save('items', next)
      return next
    })
  }, [save])

  const bulkUpdateItems = useCallback((ids, updates) => {
    setItemsState(prev => {
      const next = prev.map(item => ids.includes(item.id) ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item)
      save('items', next)
      return next
    })
  }, [save])

  // Orders
  const setOrders = useCallback((val) => {
    setOrdersState(val)
    save('orders', val)
  }, [save])

  const addOrder = useCallback((order) => {
    const newOrder = { ...order, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), createdAt: new Date().toISOString() }
    setOrdersState(prev => {
      const next = [...prev, newOrder]
      save('orders', next)
      return next
    })
    return newOrder
  }, [save])

  const updateOrder = useCallback((id, updates) => {
    setOrdersState(prev => {
      const next = prev.map(order => order.id === id ? { ...order, ...updates } : order)
      save('orders', next)
      return next
    })
  }, [save])

  // Pricing Rules
  const setPricingRules = useCallback((val) => {
    setPricingRulesState(val)
    save('pricingRules', val)
  }, [save])

  const addPricingRule = useCallback((rule) => {
    const newRule = { ...rule, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }
    setPricingRulesState(prev => {
      const next = [...prev, newRule]
      save('pricingRules', next)
      return next
    })
    return newRule
  }, [save])

  const deletePricingRule = useCallback((id) => {
    setPricingRulesState(prev => {
      const next = prev.filter(r => r.id !== id)
      save('pricingRules', next)
      return next
    })
  }, [save])

  // Marketplaces
  const setMarketplaces = useCallback((val) => {
    setMarketplacesState(val)
    save('marketplaces', val)
  }, [save])

  const toggleMarketplace = useCallback((id) => {
    setMarketplacesState(prev => {
      const next = prev.map(m => m.id === id ? { ...m, connected: !m.connected } : m)
      save('marketplaces', next)
      return next
    })
  }, [save])

  // Settings
  const setSettings = useCallback((val) => {
    setSettingsState(val)
    save('settings', val)
  }, [save])

  // Price History
  const addPriceHistory = useCallback((entry) => {
    setPriceHistoryState(prev => {
      const next = [...prev, { ...entry, date: new Date().toISOString() }]
      save('priceHistory', next)
      return next
    })
  }, [save])

  // Export
  const exportAllData = useCallback(() => {
    return {
      items,
      orders,
      pricingRules,
      marketplaces,
      settings,
      priceHistory,
      exportedAt: new Date().toISOString(),
    }
  }, [items, orders, pricingRules, marketplaces, settings, priceHistory])

  const importAllData = useCallback((data) => {
    if (data.items) { setItemsState(data.items); save('items', data.items) }
    if (data.orders) { setOrdersState(data.orders); save('orders', data.orders) }
    if (data.pricingRules) { setPricingRulesState(data.pricingRules); save('pricingRules', data.pricingRules) }
    if (data.marketplaces) { setMarketplacesState(data.marketplaces); save('marketplaces', data.marketplaces) }
    if (data.settings) { setSettingsState(data.settings); save('settings', data.settings) }
    if (data.priceHistory) { setPriceHistoryState(data.priceHistory); save('priceHistory', data.priceHistory) }
  }, [save])

  return (
    <DataContext.Provider value={{
      items, setItems, addItem, updateItem, deleteItem, bulkUpdateItems,
      orders, setOrders, addOrder, updateOrder,
      pricingRules, setPricingRules, addPricingRule, deletePricingRule,
      marketplaces, setMarketplaces, toggleMarketplace,
      settings, setSettings,
      priceHistory, addPriceHistory,
      exportAllData, importAllData,
      loaded,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
