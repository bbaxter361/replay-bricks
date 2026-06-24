# Hold — Bricqer Replacement Spec

## CURRENT STATE
- React/Vite frontend only at replaybrick.com/hold/
- No database, no API, no backend
- No inventory data loaded
- No order processing, no PirateShip, no notifications
- Netlify deployment with no functions
- User had to process LEGO orders manually today

## REQUIRED ARCHITECTURE

### Database
- Use Netlify Blob Store or SQLite (via better-sqlite3 in Netlify Functions)
- Store: inventory items, orders, customers, shipping labels
- Must survive deployments (persistent storage)

### Backend (Netlify Functions)
- `/api/inventory` — CRUD for products
- `/api/orders` — order management  
- `/api/sync` — sync inventory from Bricqer/BrickLink
- `/api/shipping` — PirateShip integration
- `/api/notifications` — email/Discord alerts

### Scheduled Tasks
- Netlify Scheduled Functions (cron jobs)
- Hourly inventory sync
- Order polling from BrickLink API
- Price monitoring

### Frontend (Keep existing UI, extend)
- Inventory list with search/filter
- Order dashboard with status tracking
- Shipping label generation
- Settings page for API keys

## HARD REQUIREMENTS
1. Must run 24/7 with no manual intervention
2. Must persist data across deployments
3. Must handle real orders (NOT dry-run mode)
4. PirateShip integration for label printing
5. Email/Discord notifications for new orders
6. Full CRUD for inventory with CSV import

## CONSTRAINTS
- Deploy on Netlify free tier
- No server — everything must be serverless
- Keep existing React/Vite frontend look and feel
- Use Netlify Functions + Blob for backend
