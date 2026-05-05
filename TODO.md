# Responsive Desktop UI — Plan

Abhi PWA me mobile aur desktop dono pe **same mobile UI** hai (`max-w-md` lock).
Goal: desktop pe screen space use ho, data-heavy screens pe table/split layouts aayein, **mobile UI bilkul na bigde**.

Strategy: Tailwind ke `md:` (≥768px) aur `lg:` (≥1024px) breakpoints use karke progressive enhancement.

---

## Phase 1 — Layout shell desktop-friendly banao ✅ DONE

- [x] **App.tsx** — `max-w-md md:max-w-4xl lg:max-w-6xl mx-auto px-4 md:px-6 pb-28 md:pb-10`
- [x] **BottomNav.tsx** — `md:hidden` add kiya
- [x] **New: TopNav.tsx** — desktop horizontal nav with project name + 6 tabs (`hidden md:block sticky top-0`)
- [x] **PullToRefresh** — already touch-only, desktop pe automatically inactive
- [x] `tsc --noEmit` zero errors

**Tested:** TypeScript compiles. Manual browser test pending (mobile / tablet / desktop visual check).

---

## Phase 2 — Dashboard desktop layout ✅ DONE

- [x] **DashboardTab.tsx** — Quick Stats grid `md:grid-cols-2 lg:grid-cols-4`, conditional cards `lg:col-span-1`
- [x] Desktop-only header row with project info + Share/Export buttons (mobile header `md:hidden`)
- [x] Misc expenses → desktop pe **full table** (Date / Category / Notes / Amount / Actions, scrollable, all entries)
- [x] Mobile pe top-5 cards + "Sab Dekho" sheet untouched
- [x] Misc form modal → desktop pe centered dialog, mobile pe bottom sheet (single render path)
- [x] Hover states added on all interactive cards/buttons
- [x] `tsc --noEmit` zero errors

**Skipped:** Recharts pie chart — bars already informative; can add later if needed.
**Note:** Tod-Phod Net side-by-side layout consider kiya tha but mobile order disturb hota — kept original placement.

---

## Phase 3 — Construction & Demolition desktop layouts ✅ DONE

### Construction
- [x] **ExpensesSection.tsx** — desktop full table (Date / Category / Notes / Photos / Amount / Actions) with footer total. `slice(0, 20)` cap hata diya — sab entries ab dikhte hain.
- [x] **MaterialsSection.tsx** — `lg:grid-cols-2` cards (rich UI preserved)
- [x] **VendorsSection.tsx** — `lg:grid-cols-2` cards, 3 modals (vendor/payment/bill) responsive
- [x] **LabourSection.tsx** — `lg:grid-cols-2` cards, modal responsive
- [x] **ThekaSection.tsx** — `lg:grid-cols-2` cards (payments inline preserved), 2 modals responsive

### Demolition
- [x] **MalwaSection.tsx** — desktop full table (Date / Trolleys / Vendor / Cost-per-trip / Total / Actions)
- [x] **ScrapSection.tsx** — desktop full table (Date / Type / Quantity / Rate / Dealer / Kamai / Actions)
- [x] **BrickRecoverySection.tsx** — `lg:grid-cols-2` cards (recovered/broken sub-cards preserved)
- [x] **DemolitionThekaSection.tsx** — `lg:grid-cols-2` cards (payments inline preserved), 2 modals responsive

### Cross-cutting
- [x] **All modals** uniform pattern: `bottom sheet on mobile (items-end), centered dialog on desktop (md:items-center, md:max-w-lg, md:rounded-3xl)`. Single render path with `e.stopPropagation()` on inner card.
- [x] Hover states added on Cancel/Save buttons across all forms
- [x] `tsc --noEmit` zero errors

**Skipped (intentional):** Category filter chips sidebar (scope creep — current chip wrap works fine on desktop too); Materials/Vendors/Labour/Theka tables (rich card UI is genuinely better than tables for those sections).

---

## Phase 4 — Diary split-view ✅ DONE

- [x] **DiaryTab.tsx** desktop split layout (`lg:grid lg:grid-cols-[360px_1fr]`)
  - Left pane (sticky 360px): calendar OR search (toggled via 2 sub-tabs at top of pane)
  - Right pane (1fr): entry editor — always visible on desktop
- [x] Mobile: original 3-tab view (entry/calendar/search) untouched, full-screen
- [x] Desktop sub-tabs (Calendar / Khojo) hidden on mobile, only shown in left pane
- [x] Calendar/search clicks: `setDate()` always; `setView('entry')` only on mobile (window.matchMedia check) — desktop keeps current pane visible
- [x] Search result hover state + selected-date highlight (ring-2 ring-emerald-400)
- [x] Entry block extracted into `entryBlock` const, rendered twice (mobile in left pane, desktop in right) — single source of truth
- [x] `tsc --noEmit` zero errors

**UX result:** Desktop pe ek hi screen me calendar + entry dikhe, no tab switching needed for daily workflow.

---

## Phase 5 — Polish & QA ✅ DONE

- [x] **ConfirmDialog**: Escape key closes (new `useEscapeKey` hook), confirm button autoFocus, hover states
- [x] **KirayaTab**: cards `lg:grid-cols-2`, both modals (property + payment) responsive (mobile bottom sheet, desktop centered dialog), hover states
- [x] **Hover states** added across all interactive elements in earlier phases (cards, buttons, modal close X, Cancel/Save)
- [x] **`tsc --noEmit` zero errors** — final build verification clean

### Skipped (intentional)
- **PWA install prompt mobile-only**: No install prompt UI exists in app code (only service worker registration in main.tsx). N/A.
- **Full focus trap**: Only Escape-to-close added on ConfirmDialog. Full focus trap (Tab cycling within modal) would need `react-focus-lock` or similar — out of scope.
- **Print stylesheet, Lighthouse, real-device test**: Manual QA tasks — owner ko khud test karna hoga.

---

## Reference (key files changed)

| Phase | Files |
|-------|-------|
| 1     | [App.tsx](src/App.tsx), [BottomNav.tsx](src/components/layout/BottomNav.tsx), **new** [TopNav.tsx](src/components/layout/TopNav.tsx) |
| 2     | [DashboardTab.tsx](src/components/dashboard/DashboardTab.tsx) |
| 3     | [ExpensesSection.tsx](src/components/construction/ExpensesSection.tsx), [MaterialsSection.tsx](src/components/construction/MaterialsSection.tsx), [VendorsSection.tsx](src/components/construction/VendorsSection.tsx), [LabourSection.tsx](src/components/construction/LabourSection.tsx), [ThekaSection.tsx](src/components/construction/ThekaSection.tsx), [MalwaSection.tsx](src/components/demolition/MalwaSection.tsx), [ScrapSection.tsx](src/components/demolition/ScrapSection.tsx), [BrickRecoverySection.tsx](src/components/demolition/BrickRecoverySection.tsx), [DemolitionThekaSection.tsx](src/components/demolition/DemolitionThekaSection.tsx) |
| 4     | [DiaryTab.tsx](src/components/diary/DiaryTab.tsx) |
| 5     | [ConfirmDialog.tsx](src/components/ConfirmDialog.tsx), [KirayaTab.tsx](src/components/kiraya/KirayaTab.tsx), **new** [useEscapeKey.ts](src/hooks/useEscapeKey.ts) |

---

## Implementation patterns (for future reference)

**Responsive modal:**
```tsx
<div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-end md:items-center"
     onClick={close}>
  <div onClick={e => e.stopPropagation()}
       className="bg-white w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl md:m-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
    {/* drag handle visible only on mobile */}
    <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto md:hidden" />
    {/* form content */}
  </div>
</div>
```

**Card → 2-col grid on desktop:**
```tsx
<div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
  {items.map(...)}
</div>
```

**Mobile cards + desktop table:**
```tsx
<div className="md:hidden space-y-3">{cards}</div>
<div className="hidden md:block bg-white rounded-2xl ...">
  <table>...</table>
</div>
```

**Split layout (Diary pattern):**
```tsx
<div className="lg:grid lg:grid-cols-[360px_1fr] lg:gap-4 lg:items-start">
  <aside className="lg:sticky lg:top-20">{leftPane}</aside>
  <main className="hidden lg:block">{rightPane}</main>
</div>
```
