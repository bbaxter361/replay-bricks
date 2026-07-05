# Hold — Inventory by Replay Bricks

A private inventory management system for LEGO parts across multiple marketplaces (BrickLink, Brick Owl). Built as a replacement for Bricqer.

## Features

- **🔐 Authentication** — Login/register with localStorage persistence
- **📦 Dashboard** — Live stats from BrickLink + BrickOwl APIs, sync history, quick actions
- **🏪 Inventory Management** — Table/grid views, search, filter, sort, live data from API
- **🛒 Order Management** — All marketplace orders in one view with status workflow
- **💰 Auto-Pricing** — Create pricing rules with markup %, min/max prices
- **🔧 Part-Out Tool** — Enter a LEGO set number, view parts, select quantities/prices, add to inventory
- **📊 Reports** — Total value, category distribution, most valuable items, low stock alerts
- **🏷️ Marketplace Management** — BrickLink + BrickOwl connections, CSV export
- **⚙️ Settings** — Store profile, notifications, data export/import

## Architecture

- **Frontend:** React 19 + Vite 8 (port 5175)
- **Backend:** Node.js/Express + SQLite (port 3002)
- **Integrations:** BrickLink OAuth 1.0, BrickOwl API key auth
- **Sync Engine:** Bidirectional inventory + order sync

## Quick Start

```bash
# Backend
cd hold && node server/src/index.js

# Frontend
cd hold && npm run dev -- --port 5175
```

## Build for Production

```bash
npm run build
```
The build output is in `dist/`.

## Tech Stack

- React 19 + Vite 8
- Tailwind CSS v4
- React Router v7
- Recharts (dashboard charts)
- react-hot-toast (notifications)
- lucide-react (icons)
- Express + SQLite (backend API)
- BrickLink API (OAuth 1.0)
- BrickOwl API

## Project Structure

```
src/
├── components/    # Layout, shared components
├── contexts/      # Auth, Data, Theme contexts
├── pages/         # All route pages
│   ├── Dashboard.jsx
│   ├── Inventory.jsx
│   ├── Orders.jsx
│   ├── Pricing.jsx
│   ├── PartOut.jsx
│   ├── Reports.jsx
│   ├── Marketplaces.jsx
│   ├── Settings.jsx
│   └── LoginPage.jsx
├── api.js         # API service layer
├── App.jsx        # Router setup
├── main.jsx       # Entry point
└── index.css      # Tailwind + custom styles

server/
├── src/
│   ├── index.js   # Express API server
│   ├── db.js      # SQLite schema + LEGO color seed data
│   ├── sync.js    # Sync engine (BL + BO)
│   ├── bricklink.js  # BrickLink OAuth 1.0 client
│   └── brickowl.js   # BrickOwl API client
```
