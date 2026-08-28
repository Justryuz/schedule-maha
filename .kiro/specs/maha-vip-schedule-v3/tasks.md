# Implementation Plan: MAHA VIP Schedule v3

## Overview

Upgrade the existing MAHA VIP Schedule Dashboard from desktop-first to a responsive, mobile-first card-based interface. The implementation adds mobile components (card layout, bottom navigation, date tabs, filter bottom sheet, VIP badges) while preserving all existing desktop functionality. Uses vanilla HTML, CSS, and JavaScript only — no frameworks or build tools.

## Tasks

- [x] 1. Add mobile HTML structure to index.html
  - [x] 1.1 Add header subtitle, mobile cards container, date tabs, and filter trigger button
    - Wrap header title in `.header-center` container div
    - Add `<p class="header-subtitle">28 OGOS – 6 SEPT 2026 | MAEPS SERDANG, SELANGOR</p>` below title
    - Add `<div class="date-tabs-scroll" id="dateTabsScroll"></div>` inside `#tab-utama` above the table container
    - Add `<div class="mobile-cards-container" id="mobileCardsUtama"></div>` inside `#tab-utama`
    - Add `<div class="mobile-cards-container" id="mobileCardsFull"></div>` inside `#tab-jadual-penuh`
    - Add `<button class="btn-filter-trigger" id="btnFilterTrigger"><i class="fas fa-filter"></i> TAPIS</button>` in the utama section
    - Add "MUAT SEMULA" reload button `<button class="btn-reload" id="btnReload"><i class="fas fa-sync-alt"></i> MUAT SEMULA</button>`
    - _Requirements: 1.1, 1.3, 3.1, 5.1, 6.1, 7.1_

  - [x] 1.2 Add bottom navigation bar and filter bottom sheet HTML
    - Add `<nav class="bottom-nav" id="bottomNav">` with three buttons (Jadual Penuh, Utama, Eksekutif) before `</body>`
    - Add filter sheet backdrop `<div class="filter-sheet-backdrop" id="filterBackdrop"></div>`
    - Add filter sheet panel with header, two-column grid (Program, Lokasi, VIP, Cari), and "TAPIS" apply button
    - Add executive tagline `<div class="exec-tagline">PENCIPTAAN NILAI DEMI KETERJAMINAN MAKANAN</div>` after `.exec-charts`
    - _Requirements: 4.1, 4.2, 5.2, 5.3, 5.6, 9.3_

- [x] 2. Implement mobile CSS styles in css/style.css
  - [x] 2.1 Add CSS custom properties and mobile card component styles
    - Add new CSS custom properties: `--card-radius`, `--card-shadow`, `--bottom-nav-height`, `--filter-sheet-radius`
    - Add `.mobile-cards-container` styles (hidden by default on desktop)
    - Add `.schedule-card` styles with flex layout, card radius, shadow, time/body sections
    - Add `.card-time`, `.card-body`, `.card-program`, `.card-lokasi`, `.card-vips` styles
    - Add `.vip-badge` pill styles with rounded corners, inline-flex, padding, color
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.1_

  - [x] 2.2 Add date tabs, bottom nav, and filter sheet CSS
    - Add `.date-tabs-scroll` styles (hidden on desktop, flex + overflow-x auto on mobile)
    - Add `.date-tab` button styles with scroll-snap, active state (navy background + white text)
    - Add `.bottom-nav` fixed positioning, flexbox, hidden on desktop
    - Add `.bottom-nav-item` styles with icon + label layout, active color state
    - Add `.filter-sheet-backdrop` and `.filter-sheet` styles with slide-up transition
    - Add `.filter-grid` two-column grid, `.filter-select-mobile`, `.btn-apply-filter` styles
    - Add `.btn-filter-trigger` style (hidden on desktop)
    - Add `.btn-reload` style
    - _Requirements: 3.1, 3.4, 4.1, 4.4, 5.1, 5.2, 5.6, 7.1_

  - [x] 2.3 Add media queries for mobile breakpoint (max-width: 767px)
    - Show `.mobile-cards-container`, `.date-tabs-scroll`, `.bottom-nav`, `.btn-filter-trigger` on mobile
    - Hide `.table-container`, `.date-navigation`, `.nav-tabs`, `.filter-bar-centered` on mobile
    - Add `body { padding-bottom: 60px; }` for bottom nav clearance
    - Add wider desktop search bar CSS (`@media (min-width: 768px)` → width: 220px, focus: 280px)
    - Add mobile executive layout: `.exec-stats` horizontal scroll, `.exec-charts` single column
    - Add `.exec-tagline` styling
    - Add `.header-subtitle` responsive font sizes
    - _Requirements: 1.1, 1.2, 1.6, 3.1, 3.6, 4.5, 4.6, 5.7, 8.1, 9.1, 9.2_

- [x] 3. Checkpoint - Verify HTML and CSS structure
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement mobile JavaScript logic in js/app.js
  - [x] 4.1 Add viewport detection and VIP badge rendering functions
    - Add `isMobile()` function (returns `window.innerWidth < 768`)
    - Add resize listener that detects mobile/desktop transitions and re-renders
    - Add `VIP_BADGE_COLORS` array (15 colors)
    - Add `getVipBadgeColor(vipName)` function with hash-based color assignment
    - Add `renderVipBadges(vipString)` function producing badge HTML spans
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.3_

  - [x] 4.2 Add mobile card rendering functions
    - Add `renderUtamaMobileCards(data)` function generating card HTML from schedule data
    - Add `renderFullMobileCards(data)` function for Jadual Penuh tab (cards grouped by date)
    - Modify `renderUtamaTable()` to call `renderUtamaMobileCards()` when `isMobile()` is true
    - Modify `renderFullSchedule()` to call `renderFullMobileCards()` when `isMobile()` is true
    - Add empty state handling for mobile card containers
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 2.3, 2.4_

  - [x] 4.3 Add date tabs rendering and navigation logic
    - Add `renderDateTabs()` function building horizontal date tab buttons
    - Add `getDateTabLabel(dateInfo, dayDiff)` returning relative labels (SEMALAM/HARI INI/ESOK/formatted)
    - Add click event delegation for date tab buttons to select date and re-filter
    - Call `renderDateTabs()` from `initAfterLoad()` and `updateDateDisplay()`
    - Auto-scroll active tab into view
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 4.4 Add bottom navigation and filter sheet logic
    - Modify `switchTab()` to update bottom nav active states in addition to top nav
    - Add click event listeners on `.bottom-nav-item` buttons calling `switchTab()`
    - Add `openFilterSheet()` and `closeFilterSheet()` functions with backdrop toggle
    - Add event listeners for filter trigger button, close button, backdrop click
    - Add `populateFiltersMobile()` to mirror desktop filter options into mobile sheet selects
    - Add "TAPIS" button handler: read mobile filter values, apply to desktop filter inputs, call `applyUtamaFilters()`
    - Add "MUAT SEMULA" button handler calling `loadData()`
    - Call `populateFiltersMobile()` from `populateFilters()`
    - Close filter sheet on tab switch
    - _Requirements: 4.2, 4.3, 4.4, 5.2, 5.3, 5.4, 5.5, 7.2, 7.3_

- [x] 5. Checkpoint - Full functional verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Property-based tests and validation
  - [x] 6.1 Write property test for viewport-conditional rendering
    - **Property 1: Viewport-conditional rendering output**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 6.2 Write property test for card content completeness
    - **Property 2: Card content completeness**
    - **Validates: Requirements 1.3**

  - [x] 6.3 Write property test for VIP badge count
    - **Property 3: VIP badge count matches comma-separated names**
    - **Validates: Requirements 1.5, 2.3**

  - [x] 6.4 Write property test for VIP plain text on desktop
    - **Property 4: VIP plain text on desktop**
    - **Validates: Requirements 1.6, 2.4**

  - [x] 6.5 Write property test for VIP badge color determinism
    - **Property 5: VIP badge color determinism and distribution**
    - **Validates: Requirements 2.2**

  - [x] 6.6 Write property test for relative date label correctness
    - **Property 6: Relative date label correctness**
    - **Validates: Requirements 3.2**

  - [x] 6.7 Write property test for date-based schedule filtering
    - **Property 7: Date-based schedule filtering**
    - **Validates: Requirements 3.3**

  - [x] 6.8 Write property test for tab switching
    - **Property 8: Tab switching activates correct content**
    - **Validates: Requirements 4.3, 10.1**

  - [x] 6.9 Write property test for combined filter logic
    - **Property 9: Combined filter logic correctness**
    - **Validates: Requirements 5.4, 8.2**

- [x] 7. Final checkpoint - End-to-end validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Desktop behavior must remain untouched — mobile components are additive only
- All rendering is gated behind `isMobile()` viewport check
- The z-index hierarchy must be maintained: loading overlay (1000) > filter sheet (960) > backdrop (950) > bottom nav (900)
- Filter sheet mobile selects mirror desktop filter options to maintain data consistency

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4"] },
    { "id": 5, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8", "6.9"] }
  ]
}
```
