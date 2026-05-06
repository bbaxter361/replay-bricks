export const seedData = {
  items: [],
  orders: [],
  pricingRules: [],
  marketplaces: [
    { id: 'mp1', name: 'BrickLink Store', type: 'bricklink', connected: true, apiKey: '', storeName: 'Replay Bricks' },
    { id: 'mp2', name: 'Brick Owl Shop', type: 'brickowl', connected: true, apiKey: '', storeName: 'Replay Bricks' },
  ],
  settings: {
    storeName: 'Replay Bricks',
    currency: 'USD',
    lowStockThreshold: 5,
    taxRate: 0,
    defaultCondition: 'New',
    notifications: { newOrder: true, lowStock: true, shipment: true },
  },
  priceHistory: [],
}
