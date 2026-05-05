# 🔠 Typography Migration Task List (Fluid & Semantic System)

## 📐 Global Design System Tokens

We have implemented these tokens as CSS Variables in `src/index.css` using Tailwind v4's `@theme` directive so we can use classes like `text-title-lg`, `font-heading`, etc.

### Font Families
| Token Name | Tailwind Class | Value | Use Case |
| :--- | :--- | :--- | :--- |
| **Primary** | `font-primary` | `"Inter", ...` | Standard body text, UI elements, buttons |
| **Heading** | `font-heading` | `"Inter", ...` | Page titles, section headers, prominent text |
| **Mono** | `font-mono` | `ui-monospace, ...` | Tabular data, numbers, theka calculations |

### Fluid Font Sizes
*These sizes automatically scale between mobile and desktop to prevent huge fonts on mobile devices, ensuring readability on screens like the iPhone 16 Pro.*

| Token Name | Tailwind Class | Size Range (Mobile -> Desktop) | Use Case |
| :--- | :--- | :--- | :--- |
| **Display** | `text-display` | `28px -> 40px` | Big hero stats, large summary numbers |
| **Title Large** | `text-title-lg`| `20px -> 28px` | Main page headers (`<h1>`) |
| **Title** | `text-title` | `18px -> 20px` | Section headers, card titles (`<h2>`/`<h3>`) |
| **Body** | `text-body` | `16px` (Fixed) | Standard text & Inputs (Prevents iOS zoom) |
| **Body Small** | `text-body-sm` | `14px` (Fixed) | Secondary text, descriptions, subtitles |
| **Caption** | `text-caption` | `12px` (Fixed) | Tiny badges, dates, minimal metadata |

---

## 🚀 Implementation Steps

- [x] **Step 1: Core Setup**
  - Update `src/index.css` to define fluid typography CSS variables and Tailwind `@theme`.

- [x] **Step 2: Update Layout Components**
  - `src/components/layout/TopNav.tsx`
  - `src/components/layout/BottomNav.tsx`

- [x] **Step 3: Update Global UI Elements**
  - `src/components/ConfirmDialog.tsx`
  - Modals/Sheets (e.g., `PhotosSheet.tsx`)

- [x] **Step 4: Refactor Dashboard & Core Tabs**
  - `src/components/dashboard/DashboardTab.tsx`

- [x] **Step 5: Refactor Construction Sections**
  - `OverviewSection.tsx`, `ThekaSection.tsx`, `MaterialsSection.tsx`, `LabourSection.tsx`, `VendorsSection.tsx`, `ExpensesSection.tsx`

- [x] **Step 6: Refactor Demolition Sections**
  - `DemolitionOverview.tsx`, `MalwaSection.tsx`, `ScrapSection.tsx`, `BrickRecoverySection.tsx`, `DemolitionThekaSection.tsx`

- [x] **Step 7: Refactor Remaining Tabs**
  - `DiaryTab.tsx`, `KirayaTab.tsx`

---

*Note: As we complete these steps, we will check them off by replacing standard Tailwind classes (like `text-xl`, `text-sm`) with our new semantic fluid classes.*
