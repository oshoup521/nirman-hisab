# Nirman Hisaab 🏗️

A mobile-first Progressive Web App for tracking construction project expenses in India. Built with Hinglish labels (Hindi + English) to feel natural on-site. Data syncs to the cloud in real-time via Supabase and works offline through localStorage fallback.

---

## Features

| Module | What it tracks |
|---|---|
| **Dashboard** (Hisaab) | Master budget burn-rate, category-wise kharcha breakdown, WhatsApp share, CSV export |
| **Naya Kaam** (Construction) | Materials stock, labour attendance & wages, subcontractor (theka) payments, expense log, project timeline with phase photos |
| **Tod-Phod** (Demolition) | Demolition theka payments, malwa (debris) disposal costs, scrap/kabaad income, brick recovery counter |
| **Kiraya** (Rent) | Rental property tracking, security deposit status, monthly rent payments with deposit-adjustment support |
| **Settings** (Taiyari) | Project config, plot dimensions, budgets, cloud sync status, account management |

**Other highlights:**
- Offline-first — all data saved to `localStorage` instantly, synced to Supabase in the background with retry
- Pull-to-refresh on any screen to force a cloud sync
- Phase gallery — upload and caption photos per construction phase (Supabase Storage, image-compressed before upload)
- WhatsApp share button with a formatted project summary
- CSV export with Excel-compatible UTF-8 BOM

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | React 19 + TypeScript 5.8 |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 + tailwind-merge + clsx |
| Backend / Auth / Storage | Supabase (PostgreSQL + Auth + Storage) |
| Icons | Lucide React |
| Date utils | date-fns |
| Charts | Recharts (available, minimal use currently) |
| Animations | Motion (Framer Motion v12) |
| PWA | vite-plugin-pwa + Workbox |

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine)

---

## Supabase Setup

### 1. Create the `app_state` table

Run this in Supabase SQL Editor:

```sql
create table public.app_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

create policy "Users manage own state"
  on public.app_state for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### 2. Create the `phase-photos` storage bucket

Dashboard → Storage → New bucket:
- **Name:** `phase-photos`
- **Public:** off (the app uses signed URLs)

Then add an RLS policy on bucket objects:

```sql
create policy "Users manage own photos"
  on storage.objects for all
  using  (auth.uid()::text = (storage.foldername(name))[1])
  with check (auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Enable Email Auth

Dashboard → Authentication → Providers → Email → Enable.

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
cp .env.example .env   # or create .env manually
```

Add your Supabase credentials to `.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional — only needed for Gemini AI features
GEMINI_API_KEY=your-gemini-key
```

```bash
# 3. Start dev server
npm run dev
# → http://localhost:3000
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | TypeScript type-check (no emit) |
| `npm run clean` | Delete `dist/` |

---

## Project Structure

```
src/
├── App.tsx                          # Root — mounts context provider, routes between tabs
├── main.tsx                         # Entry point wrapped in AuthWrapper
├── index.css                        # Tailwind import + .no-scrollbar utility
├── types.ts                         # All TypeScript interfaces (AppState, Project, etc.)
│
├── context/
│   └── AppContext.tsx               # React context, AppProvider, useAppContext hook
│
├── constants/
│   └── initialState.ts             # Default AppState on first launch
│
├── lib/
│   └── cn.ts                        # tailwind-merge + clsx helper
│
├── hooks/
│   ├── useCloudSync.ts             # Supabase sync with localStorage fallback + debounce + retry
│   ├── useAppCalculations.ts       # All derived financial values (useMemo)
│   ├── usePhotoManager.ts          # Photo upload, delete, signed URL cache
│   ├── usePullToRefresh.ts         # Touch gesture pull-to-refresh
│   ├── useDragScroll.ts            # Horizontal drag-scroll for sub-tab bars
│   └── useLocalStorage.ts          # Basic localStorage hook
│
├── utils/
│   ├── supabaseClient.ts           # Supabase client singleton
│   ├── formatters.ts               # formatCurrency(), formatNumber()
│   ├── csv.ts                       # downloadCSV() — builds and triggers file download
│   └── helpers.ts                   # genId() — random ID generator
│
└── components/
    ├── auth/
    │   └── AuthWrapper.tsx          # Login screen + session gate
    ├── common/
    │   ├── ConfirmDialog.tsx        # Reusable confirmation modal
    │   ├── PhotoThumb.tsx           # Lazy photo thumbnail with signed URL resolution
    │   └── Lightbox.tsx             # Full-screen photo viewer overlay
    ├── layout/
    │   ├── BottomNav.tsx            # 5-tab bottom navigation bar
    │   ├── LoadingScreen.tsx        # Initial spinner during cloud fetch
    │   └── PullToRefreshIndicator.tsx
    ├── dashboard/DashboardTab.tsx
    ├── construction/
    │   ├── ConstructionTab.tsx      # Sub-tab router + drag-scroll nav
    │   ├── OverviewSection.tsx      # Project info, timeline progress, quick stats
    │   ├── MaterialsSection.tsx     # Stock tracking with low-stock warnings
    │   ├── VendorsSection.tsx       # Vendor ledger (udhaar / khata)
    │   ├── LabourSection.tsx        # Daily attendance + wage tracking
    │   ├── ThekaSection.tsx         # Subcontractor payment management
    │   ├── ExpensesSection.tsx      # Itemised expense log
    │   ├── TimelineSection.tsx      # 8-phase milestone tracker with photo upload
    │   └── GallerySection.tsx       # All phase photos in one view
    ├── demolition/
    │   ├── DemolitionTab.tsx        # Sub-tab router
    │   ├── DemolitionOverview.tsx   # Cost vs income summary + thekedar cards
    │   ├── BrickRecoverySection.tsx
    │   ├── MalwaSection.tsx
    │   ├── ScrapSection.tsx
    │   └── DemolitionThekaSection.tsx
    ├── kiraya/KirayaTab.tsx
    └── settings/SettingsTab.tsx
```

---

## Data Architecture

All app data is a single JSON blob stored in `app_state` (one row per user in Supabase). The same blob is mirrored in `localStorage` for instant offline reads.

**Sync flow:**
1. App load → fetch from Supabase, merge with localStorage
2. Any state change → debounced 1.5s push to Supabase (up to 3 retries, exponential backoff)
3. Pull-to-refresh → immediate manual sync

**State shape:**

```
project           — name, location, type, budgets, plot dimensions, start/end dates
materials[]       — stock items with purchased/used counts and low-stock threshold
labours[]         — workers with daily wage and attendance map
thekas[]          — construction subcontractors with payment history
expenses[]        — itemised construction expense log
milestones[]      — 8 phases (Demolition → Finishing) with status + photos
demolitionThekas[]— demolition subcontractors
brickRecovery[]   — brick salvage entries (estimated / recovered / broken)
malwa[]           — debris disposal trips with cost
scrap[]           — scrap material sales
rentals[]         — rental properties with deposit status and monthly payments
miscExpenses[]    — miscellaneous one-off expenses
vendors[]         — vendor ledger (bill amount, payments, outstanding balance)
```

---

## State Management

All components consume a single React context via `useAppContext()`. The context provides:
- `state` + `setState` — the full app state
- `calcs` — all derived financial values (pre-memoised)
- Navigation (`activeTab`, `subTab`)
- Confirm dialog helper (`askConfirm`)
- Cloud sync metadata
- Photo manager
- CSV export and WhatsApp share actions

No prop drilling; no third-party state library needed.

---

## PWA / Offline

The app installs as a PWA on Android/iOS ("Add to Home Screen"). Supabase API calls use a `NetworkFirst` Workbox strategy (10s timeout, 24h cache), so the app remains usable on slow or intermittent connections.

---

## Contributing

1. Run `npm run lint` before opening a PR
2. Keep each component under ~250 lines; extract custom hooks for logic-heavy code
3. All components should use `useAppContext()` — no prop drilling
4. `genId()` from `utils/helpers.ts` for all new IDs
