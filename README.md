# Nirman Hisaab

A mobile-first Progressive Web App for tracking construction project expenses in India. Built with Hinglish labels (Hindi + English) to feel natural on-site. Data syncs to the cloud in real-time via Supabase and works offline through localStorage fallback.

---

## Features

| Module | What it tracks |
|---|---|
| **Dashboard** (Hisaab) | Budget burn-rate, category-wise kharcha breakdown, WhatsApp share, CSV export |
| **Naya Kaam** (Construction) | Materials stock, labour attendance & wages, subcontractor (theka) payments, vendor ledger, expense log, architect/engineer management, project timeline with phase photos, full gallery |
| **Tod-Phod** (Demolition) | Demolition theka payments, malwa (debris) disposal costs, scrap/kabaad income, brick recovery counter |
| **Kiraya** (Rent) | Rental property tracking, security deposit status, monthly rent payments, electricity reading log |
| **Roznamcha** (Diary) | Daily site diary — weather, notes, photos, calendar view, full-text search |
| **Settings** (Taiyari) | Project config, plot dimensions, budgets, site plan (naksha) upload, cloud sync status, viewer sharing, account management |

**Other highlights:**
- Offline-first — all data saved to `localStorage` instantly, synced to Supabase in the background with retry
- Pull-to-refresh on any screen to force a cloud sync
- Viewer role — share a read-only link with clients or site owners
- Phase gallery — upload and caption photos per construction phase (image-compressed before upload)
- Site plan (naksha) upload — supports images and PDFs, stored in Supabase Storage with signed URLs
- WhatsApp share with a formatted project summary
- CSV export with Excel-compatible UTF-8 BOM
- Bulk labour entry for adding multiple workers at once

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
| Charts | Recharts |
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
├── App.tsx                          # Root — mounts context providers, routes between tabs
├── main.tsx                         # Entry point wrapped in AuthWrapper
├── index.css                        # Tailwind import + .no-scrollbar utility
├── types.ts                         # All TypeScript interfaces (AppState, Project, etc.)
│
├── context/
│   ├── AppContext.tsx               # React context, AppProvider, useAppContext hook
│   └── ThemeContext.tsx             # Theme (light/dark) context
│
├── constants/
│   └── initialState.ts             # Default AppState on first launch
│
├── lib/
│   └── cn.ts                        # tailwind-merge + clsx helper
│
├── services/
│   └── db.ts                        # Supabase DB read/write helpers
│
├── hooks/
│   ├── useCloudSync.ts             # Supabase sync with localStorage fallback + debounce + retry
│   ├── useNormalizedSync.ts        # Normalized schema sync (architects, diary, etc.)
│   ├── useAppCalculations.ts       # All derived financial values (useMemo)
│   ├── usePhotoManager.ts          # Photo upload, delete, signed URL cache
│   ├── usePullToRefresh.ts         # Touch gesture pull-to-refresh
│   ├── useDragScroll.ts            # Horizontal drag-scroll for sub-tab bars
│   ├── useEscapeKey.ts             # Global Escape key handler
│   └── useLocalStorage.ts          # Basic localStorage hook
│
├── utils/
│   ├── supabaseClient.ts           # Supabase client singleton
│   ├── formatters.ts               # formatCurrency(), formatNumber()
│   ├── csv.ts                       # downloadCSV() — builds and triggers file download
│   └── helpers.ts                   # genId() — random ID generator
│
└── components/
    ├── AuthWrapper.tsx              # Login screen + session gate
    ├── ConfirmDialog.tsx            # Reusable confirmation modal
    ├── common/
    │   ├── Lightbox.tsx             # Full-screen photo viewer overlay
    │   ├── PhotosSheet.tsx          # Bottom sheet for managing photos
    │   ├── PhotoStrip.tsx           # Horizontal scrollable photo strip
    │   └── PhotoThumb.tsx           # Lazy photo thumbnail with signed URL resolution
    ├── layout/
    │   ├── BottomNav.tsx            # 5-tab bottom navigation bar
    │   ├── TopNav.tsx               # Top bar with project switcher and sync status
    │   ├── LoadingScreen.tsx        # Initial spinner during cloud fetch
    │   └── PullToRefreshIndicator.tsx
    ├── dashboard/DashboardTab.tsx
    ├── construction/
    │   ├── ConstructionTab.tsx      # Sub-tab router + drag-scroll nav
    │   ├── OverviewSection.tsx      # Project info, timeline progress, quick stats
    │   ├── MaterialsSection.tsx     # Stock tracking with low-stock warnings
    │   ├── VendorsSection.tsx       # Vendor ledger (udhaar / khata)
    │   ├── LabourSection.tsx        # Daily attendance + wage tracking (bulk add)
    │   ├── ArchitectSection.tsx     # Architect/engineer fee, visits, payments, deliverables
    │   ├── ThekaSection.tsx         # Subcontractor payment management
    │   ├── ExpensesSection.tsx      # Itemised expense log
    │   ├── TimelineSection.tsx      # 8-phase milestone tracker with photo upload
    │   └── GallerySection.tsx       # All phase photos in one view
    ├── demolition/
    │   ├── DemolitionTab.tsx        # Sub-tab router
    │   ├── BrickRecoverySection.tsx
    │   ├── MalwaSection.tsx
    │   ├── ScrapSection.tsx
    │   └── DemolitionThekaSection.tsx
    ├── kiraya/KirayaTab.tsx         # Rent + electricity tracking
    ├── diary/DiaryTab.tsx           # Daily site diary with calendar + search
    └── settings/SettingsTab.tsx     # Project config, site plans, viewer sharing
```

---

## Data Architecture

All app data lives in two places in Supabase:

1. **`app_state`** — a single JSONB blob per user for fast reads and offline fallback
2. **Normalized tables** — separate rows per architect, diary entry, etc. for structured querying and RLS

Both are kept in sync. Offline reads fall back to `localStorage`.

**Sync flow:**
1. App load → fetch from Supabase, merge with localStorage
2. Any state change → debounced 1.5s push to Supabase (up to 3 retries, exponential backoff)
3. Pull-to-refresh → immediate manual sync

**State shape:**

```
project             — name, location, type, budgets, plot dimensions, start/end dates, site plans
materials[]         — stock items with purchased/used counts and low-stock threshold
labours[]           — workers with daily wage
labourDayEntries[]  — per-day attendance records (normalized)
thekas[]            — construction subcontractors with payment history
expenses[]          — itemised construction expense log
milestones[]        — 8 phases (Demolition → Finishing) with status + photos
demolition          — demolition project totals
demolitionThekas[]  — demolition subcontractors
brickRecovery[]     — brick salvage entries (estimated / recovered / broken)
malwa[]             — debris disposal trips with cost
scrap[]             — scrap material sales
rentals[]           — rental properties with deposit status, monthly payments, electricity readings
miscExpenses[]      — miscellaneous one-off expenses
vendors[]           — vendor ledger (bill amount, payments, outstanding balance)
diary[]             — daily site diary entries with weather, notes, photos
architects[]        — architects/engineers with fee structure, visits, payments, deliverables
```

---

## State Management

All components consume a single React context via `useAppContext()`. The context provides:
- `state` + `setState` — the full app state
- `calcs` — all derived financial values (pre-memoised)
- Navigation (`activeTab`, `subTab`)
- Confirm dialog helper (`askConfirm`)
- Cloud sync metadata
- Photo manager (`photos`)
- `isViewer` — read-only mode flag
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
