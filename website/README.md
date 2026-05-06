# Replay Bricks Website

**Same Bricks, New Stories.** — Premium LEGO resale store owned by Brian & Amanda.

Modern, single-page application for [replaybrick.com](https://www.replaybrick.com).

## Tech Stack

- **Vite + React 19** — Fast build tooling and modern React
- **Tailwind CSS v4** — Utility-first CSS
- **Framer Motion** — Smooth animations and scroll reveals
- **react-intersection-observer** — Scroll-triggered animations

## Project Structure

```
website/
├── public/
│   └── favicon.svg          # LEGO brick SVG favicon
├── src/
│   ├── components/
│   │   ├── BrickBackground.jsx   # Animated falling bricks canvas
│   │   ├── Navbar.jsx            # Sticky navigation with smooth scroll
│   │   ├── Hero.jsx              # Full-viewport hero section
│   │   ├── About.jsx             # Brian & Amanda's story
│   │   ├── Products.jsx          # Product categories
│   │   ├── Marketplaces.jsx      # BrickLink, Brick Owl, eBay links
│   │   ├── Newsletter.jsx        # Email signup form
│   │   ├── Social.jsx            # Instagram link
│   │   ├── Contact.jsx           # Contact form + info
│   │   ├── Footer.jsx            # Site footer
│   │   └── SectionWrapper.jsx    # Reusable scroll-reveal + section components
│   ├── App.jsx                   # Main app with scroll tracking
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Tailwind imports + custom styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Development

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
```

Output is in `dist/` — ready to deploy to any static host (Netlify, Vercel, Cloudflare Pages, etc.).

## Features

- ✅ Full-viewport hero with animated LEGO brick background
- ✅ Sticky nav with active section tracking and smooth scroll
- ✅ Scroll-reveal animations on every section
- ✅ Responsive, mobile-first design
- ✅ Dark theme with LEGO red (#E3000B) and gold (#FFD700) accents
- ✅ SVG icons — no icon library dependencies
- ✅ Newsletter signup form (UI only, no backend)
- ✅ Contact form (UI only, no backend)
- ✅ Product category cards
- ✅ Marketplace links to BrickLink, Brick Owl, eBay
- ✅ Social media integration (Instagram)

## Deployment

Build the project:

```bash
npm run build
```

Deploy the contents of the `dist/` folder to your preferred static hosting provider.

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| LEGO Red | `#E3000B` | Primary accent, buttons |
| Dark | `#0f0f1a` | Main background |
| Dark-2 | `#1a1a2e` | Alternating sections |
| Gold | `#FFD700` | Accent, tagline |
| Secondary | `#16213e` | Alternative background |
| Text | `#f5f5f5` | Light text on dark |
