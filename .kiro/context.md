# GRAFICA SLP — Project Context

## Overview
Order management platform for a print shop in San Luis Potosí, Mexico. Customers submit print orders with file uploads; admin team manages production workflow.

## Architecture
Monorepo with pnpm workspaces.

| Layer | Tech | Path |
|-------|------|------|
| Frontend | React 18 + Vite + TypeScript | `apps/web/` |
| API | NestJS + Mongoose | `apps/api/` |
| Database | MongoDB Atlas (free tier) | — |
| File Storage | Cloudflare R2 (S3-compatible) | — |
| Frontend Hosting | Vercel | — |
| API Hosting | Render (free tier, self-ping keep-alive) | — |

## URLs
- **Production Frontend:** https://graficaslp.com
- **Production API:** https://api.graficaslp.com
- **Dev Frontend:** http://localhost:5173
- **Dev API:** http://localhost:3001
- **API Prefix:** `/api/v1`

## Frontend Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/` | Landing | Marketing landing page (full-page scroll, product collage) |
| `/impresion` | NewOrder | Order wizard (file upload → details → submit) |
| `/rastrear` | Track | Order tracking by folio/phone |
| `/pedido/nuevo` | → redirect | Legacy redirect to /impresion |
| `/admin/login` | Login | Admin authentication |
| `/admin` | Dashboard | Order management |
| `/admin/pedidos/:id` | OrderDetail | Single order view |

## Landing Page (WIP — refining)
- **Scroll behavior:** Custom JS full-page snap (1200ms, easeOutExpo). Fast response, smooth deceleration.
- **4 sections:** Hero (product collage) → Areas + Cards → Services + Why Us → Color Make + Process + CTA + Footer
- **Hero:** Transparent product images floating (printer, cap, mug, tshirt, roll) with CSS float animation, decorative shapes (+, ✦, dots)
- **Images in:** `apps/web/src/assets/images/` (printer-colormake.webp, roll-colormake.png, tshirt-lion.png, cap-graficap.png, products-vinyl-caps.png, mug-grafica.png, hero-heatpress.png)
- **Dependencies:** simple-parallax-js (React component), framer-motion
- **Page indicators:** Fixed right side dots showing current section
- **Navbar:** Fixed, white/blur, logo + nav links + WhatsApp CTA
- **Status:** Needs further refinement per team feedback

## Commands
```bash
pnpm install          # Install all deps
pnpm dev              # Run both apps (concurrently)
pnpm build            # Build API then Web
pnpm --filter api dev # API only
pnpm --filter web dev # Frontend only
cd apps/api && pnpm seed  # Seed DB (admin user + print types)
```

## Project Structure
```
grafica-slp/
├── apps/
│   ├── api/src/
│   │   ├── main.ts                    # Bootstrap, CORS, global prefix, keep-alive ping
│   │   ├── app.module.ts              # Root module
│   │   ├── auth/                      # JWT auth (login, strategy, user schema)
│   │   ├── admin/                     # Admin CRUD (orders list, status updates, WA, invoicing)
│   │   ├── orders/                    # Order creation, tracking, schema
│   │   ├── files/                     # R2 upload URLs, download proxy, orphan cleanup
│   │   ├── print-types/               # Print type catalog
│   │   └── seed.ts                    # DB seeder
│   └── web/src/
│       ├── App.tsx                    # Router, providers (Auth, Toast, Loading)
│       ├── lib/
│       │   ├── api.ts                 # API client (fetch wrapper, loadingHooks, 401 handler)
│       │   └── auth.tsx               # Auth context (token in localStorage)
│       ├── components/
│       │   ├── ui/LoadingBar.tsx       # Global top progress bar
│       │   ├── ui/Toast.tsx            # Toast notifications
│       │   ├── ui/OrderLayout.tsx      # Order flow layout wrapper
│       │   ├── brand/Decorations.tsx   # SVG decorative elements
│       │   └── animations/variants.ts  # Framer Motion stagger presets
│       ├── pages/
│           ├── Landing.tsx            # Marketing landing page (parallax, scroll-driven)
│           ├── Home.tsx               # (Legacy) App launcher — unused
│           ├── Track.tsx              # Order tracking (by folio or phone)
│           ├── order/
│           │   ├── NewOrder.tsx        # Multi-step order wizard
│           │   └── steps/Step1-5.tsx   # Upload → Customer → Details → Review → Success
│           └── admin/
│               ├── Login.tsx           # Admin login
│               ├── Dashboard.tsx       # Order management (timeline cards, filters, pagination)
│               └── OrderDetail.tsx     # Single order view (status changer, WA, download)
├── scripts/
│   ├── keep-alive.sh                  # (deprecated) Local keep-alive script
│   └── keep-alive.bat                 # (deprecated) Windows version
├── vercel.json                        # Vercel config (rewrites to API)
├── render.yaml                        # Render deployment config
└── pnpm-workspace.yaml
```

## Order Statuses (in flow order)
| Key | Label | Color | Optional |
|-----|-------|-------|----------|
| `received` | Recibido | Blue | — |
| `in_production` | En Producción | Purple | — |
| `finished` | Terminado | Green | — |
| `pending_payment` | Pago Pendiente | Amber | Yes (can skip) |
| `delivered` | Entregado | Slate | — |
| `cancelled` | Cancelado | Red | — |

Statuses are NOT enforced sequentially — admin can jump to any status.

## Key Data Models

### Order (MongoDB)
- `orderNumber`: unique, format `GSLP-XXXXXX` (auto-incremented from highest)
- `customerName`, `customerPhone`, `customerEmail`
- `wantsInvoice`, `invoiceName`, `invoiceCFDI`, `invoicedAt`
- `printType`: embedded snapshot (slug, name, widthCm, minLengthCm, pricePerMeter)
- `lengthCm`, `repetitions`, `estimatedPrice`
- `status`: enum (see above)
- `file`: { storageKey, originalName, fileSizeBytes, mimeType }
- `statusHistory[]`: { from, to, changedBy, note, changedAt, whatsappSentAt? }
- `acknowledgedFileReady`, `acknowledgedNoEdits`, `acknowledgedQuality`

## Styling & Design System
- **CSS:** Tailwind CSS 3.4
- **Animations:** Framer Motion 11
- **Icons:** `@phosphor-icons/react` (primary, public-facing), `lucide-react` (admin/dashboard)
- **Fonts:** Plus Jakarta Sans (body), Fraunces (display/headlines)
- **Brand Colors:**
  - Blue: `#01AEF0` (primary brand)
  - Yellow: `#F5C518` (accent)
  - Ink: `#0D1B2A` (text)
  - Slate: `#48708C` (secondary text)
- **Gradient class:** `.gradient-brand` (blue gradient)
- **Shadow classes:** `.shadow-blue-glow`, `.shadow-soft-xl`
- **Custom component classes:** `.bezel`, `.bezel-inner`, `.eyebrow`

## Design Skills (Knowledge Base)
Available at: `/Users/emanuel.rico/Documents/Vs_Projects/.agents/skills/`
- `design-taste-frontend/SKILL.md` — Full frontend design system rules
- `emil-design-eng/SKILL.md` — Animation patterns (easing, springs, gestures)

Key rules from skills:
- Prefer `@phosphor-icons/react` for public UI
- Use Framer Motion `transform` strings for hardware acceleration
- Custom easing: `cubic-bezier(0.32, 0.72, 0, 1)` (drawer curve)
- Stagger children: 30-80ms between items
- Exit animations faster than enter
- Never use `h-screen`, use `min-h-[100dvh]`
- Grid over flex percentage math

## Authentication
- JWT-based, 24h expiry
- Stored in localStorage (`token`, `user`)
- Auto-redirect to `/admin/login` on 401
- Global `redirecting` flag prevents multiple 401 redirects

## Important Behaviors
- **Keep-alive:** API self-pings every 10min (9am-7pm CST) to prevent Render cold starts
- **File cleanup:** Orphaned R2 files (>24h, not linked to order) auto-deleted on startup + every 12h
- **WhatsApp tracking:** `whatsappSentAt` on statusHistory entries (server-side, shared across sessions)
- **Invoice tracking:** `invoicedAt` on order (admin marks as invoiced)
- **Download proxy:** Files download via `GET /api/v1/files/download/:key` (avoids CORS)
- **Global loading bar:** Top progress bar on all API calls + file uploads/downloads
- **Dashboard defaults:** Shows all orders (10/page), auto-refreshes every 2min + on tab focus
- **Dashboard cards:** Status cards (received, in_production, finished, pending_payment, delivered, active) + Print type cards (dtf_uv, dtf_textile, sublimation) — clicking filters the list
- **Active filter:** received + in_production + finished (excludes pending_payment)

## Environment Variables

### API (`apps/api/.env`)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=graficaslp-files
R2_PUBLIC_URL=https://pub-xxx.r2.dev
FRONTEND_URL=https://graficaslp.com
```

### Web (`apps/web/.env`)
```
VITE_API_URL=https://api.graficaslp.com/api/v1
VITE_R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

## Known Considerations
- Render free tier cold starts if keep-alive fails — retry logic in Dashboard handles this
- R2 public bucket has no CORS — all downloads go through API proxy
- Order numbers are generated from max existing (not count) to avoid duplicates after bulk deletes
- `bulkDeleteDelivered` removes DELIVERED orders + their R2 files
- `bulkDeleteCancelled` removes CANCELLED orders + their R2 files
- Both via `DELETE /api/v1/admin/orders/bulk/delivered?status=delivered|cancelled`
- Delete buttons live inside the storage widget as compact icon pills
