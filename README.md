# Nirman Hisaab 🏗️

A Hindi/Hinglish construction project tracker PWA built with React + TypeScript + Vite. Manage your entire building project — from demolition to construction to rent — all in one place, with offline-first localStorage storage.

## Features

### Dashboard (Hisaab)
- Master budget progress with category-wise breakdown
- Total kharcha across all categories with visual bars
- Tod-Phod net bachat card
- Miscellaneous expense quick-add with edit/delete
- Low stock and active phase alerts
- Current month rent due alert
- CSV export

### Naya Kaam (Construction)
- **Samaan** — Material stock tracking: purchased, used, low-stock alerts, edit/delete
- **Mazdoor** — Labour attendance with Present / Half Day (custom date), daily wage auto-added to expenses
- **Theka** — Contractor tracking: work type (Civil/Electrical/Plumbing/Painting/Flooring), total amount, payment history with progress bar, edit/delete payments
- **Kharcha** — Manual expense entries with category, date, edit/delete
- **Raftaar** — Project milestone timeline (Foundation → Finishing)

### Tod-Phod (Demolition)
- **Overview** — Cost vs income summary, net bachat, thekedar status cards
- **Eent Bachao** — Brick recovery counter with recovery rate and value
- **Malwa** — Debris disposal tracking (trips × cost per trip)
- **Kabaad** — Scrap income tracking (type, quantity, rate)
- **Theka** — Demolition contractor payments (separate from construction, no double-counting)

### Kiraya (Rent)
- Multiple properties (Basement, 1BHK, 2BHK, Shop, Other)
- Monthly rent payment tracking with month tagging
- Security deposit with 4 statuses: `pending` / `paid` / `refunded` / `forfeited`
- Agreement end date and notes
- Owner name + phone
- Current month paid/baaki status badge
- Edit/delete payments

### Settings
- Project name, location, start/end dates
- Master budget (all-in) + Construction budget (separate)
- Reset all data

## Data Entry
All entries support:
- **Custom date** — enter retroactively, not just today
- **Edit** — pencil icon on every card and payment row
- **Delete** — trash icon everywhere
- **Date-sorted lists** — latest entries always shown first

## Tech Stack
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Recharts
- date-fns
- localStorage (no backend, works offline)

## Run Locally

**Prerequisites:** Node.js

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000` (or next available port).
