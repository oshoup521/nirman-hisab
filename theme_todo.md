# 🎨 Theme Migration Task List (OLED Pitch Black)

## 📐 Global Design System Tokens

We will be implementing these tokens as CSS Variables in `src/index.css` using Tailwind v4's `@theme` directive so we can use classes like `bg-app`, `text-primary`, etc.

### Core UI Colors
| Token Name | Tailwind Class | Light Mode Value | Dark Mode Value (OLED Black) |
| :--- | :--- | :--- | :--- |
| **App Background** | `bg-app` | `slate-50` (`#f8fafc`) | `black` (`#000000`) |
| **Surface (Cards)** | `bg-surface` | `white` (`#ffffff`) | `zinc-900` (`#18181b`) |
| **Surface Subdued** | `bg-surface-subdued` | `slate-50` (`#f8fafc`) | `zinc-800` (`#27272a`) |
| **Border Default** | `border-default` | `slate-200` (`#e2e8f0`) | `zinc-800` (`#27272a`) |
| **Border Subdued** | `border-subdued` | `slate-100` (`#f1f5f9`) | `zinc-800/50` |
| **Text Primary** | `text-primary` | `slate-900` (`#0f172a`) | `zinc-50` (`#fafafa`) |
| **Text Secondary** | `text-secondary` | `slate-500` (`#64748b`) | `zinc-400` (`#a1a1aa`) |

### Brand Colors (Indigo)
| Token Name | Tailwind Class | Light Mode Value | Dark Mode Value |
| :--- | :--- | :--- | :--- |
| **Brand Solid** | `bg-brand` | `indigo-600` | `indigo-500` |
| **Brand Subdued** | `bg-brand-subdued` | `indigo-50` | `indigo-500/10` (10% opacity) |
| **Brand Text** | `text-brand` | `indigo-700` | `indigo-400` |

### Semantic Colors
Instead of creating 15 new variables for success/warning/danger, we will use Tailwind's native dark mode modifier `dark:` combined with opacity for backgrounds to maintain a clean OLED look.
* **Success:** `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`
* **Warning:** `bg-amber-500/10 text-amber-600 dark:text-amber-400`
* **Danger:** `bg-red-500/10 text-red-600 dark:text-red-400`

---

## 🚀 Implementation Steps

- [x] **Step 1: Core Setup**
  - Update `src/index.css` to define the CSS variables and Tailwind `@theme`.
  - Update `src/App.tsx` and `index.html` to support applying the `dark` class dynamically.
  - Create a Theme Context / Hook (`src/context/ThemeContext.tsx`) to manage the user's preference and save to localStorage.

- [x] **Step 2: Theme Toggle UI**
  - Add a beautiful toggle switch in `src/components/settings/SettingsTab.tsx` so the user can switch between Light, Dark, and System modes.

- [x] **Step 3: Update Layout Components**
  - `src/components/layout/TopNav.tsx`
  - `src/components/layout/BottomNav.tsx`
  - `src/components/layout/LoadingScreen.tsx`

- [x] **Step 4: Update Global UI Elements**
  - Inputs, Textareas, and Selects across the app.
  - `src/components/ConfirmDialog.tsx`
  - Common Modals/Sheets (e.g., `PhotosSheet.tsx`)

- [x] **Step 5: Refactor Dashboard & Core Tabs**
  - `src/components/dashboard/DashboardTab.tsx`
  - `src/utils/formatters.ts` (Remove hardcoded color returns and use design system)

- [x] **Step 6: Refactor Construction Sections**
  - `OverviewSection.tsx`, `ThekaSection.tsx`, `MaterialsSection.tsx`, `LabourSection.tsx`, `VendorsSection.tsx`, `ExpensesSection.tsx`

- [x] **Step 7: Refactor Demolition Sections**
  - `DemolitionOverview.tsx`, `MalwaSection.tsx`, `ScrapSection.tsx`, `BrickRecoverySection.tsx`, `DemolitionThekaSection.tsx`

- [x] **Step 8: Refactor Remaining Tabs**
  - `src/components/diary/DiaryTab.tsx`
  - `src/components/kiraya/KirayaTab.tsx`

---

*Note: As we complete these steps, we will check them off.*
