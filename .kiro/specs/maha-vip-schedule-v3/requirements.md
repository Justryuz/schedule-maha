# Requirements Document

## Introduction

Upgrade the existing MAHA VIP Schedule Dashboard (Jadual VIP MAHA 2026) from its current desktop-first layout to a v3 responsive design. The application is a static HTML/CSS/JS dashboard that displays VIP event schedules for the MAHA 2026 agricultural exhibition organized by FAMA. The v3 upgrade introduces a mobile-first card layout, horizontal scrollable date tabs, fixed bottom navigation, filter bottom sheet, VIP badge styling, and updated header/executive summary views while preserving all existing functionality.

## Glossary

- **Dashboard**: The MAHA VIP Schedule single-page web application (index.html) served as a static site
- **Schedule_Card**: A mobile-specific card component displaying a single program entry with time, program name, location, and VIP badges
- **Date_Tabs**: A horizontally scrollable row of date buttons on mobile (SEMALAM | HARI INI | ESOK format) replacing the arrow-based date navigation
- **Bottom_Nav**: A fixed-position navigation bar at the bottom of the mobile viewport containing three tab icons
- **Filter_Sheet**: A bottom sheet overlay that slides up from the bottom of the screen on mobile, containing filter controls in a two-column grid layout
- **VIP_Badge**: A colored pill/tag element displaying a VIP name with a background color, used exclusively on mobile card views
- **Desktop_Table**: The existing tabular schedule view used on viewports 768px and wider
- **Header_Section**: The top area of the page containing logos, title, and event subtitle
- **Executive_Tab**: The EKSEKUTIF tab showing statistics and Chart.js charts
- **Auto_Refresh**: The automatic data reload mechanism that fetches CSV data from Google Sheets every 5 seconds
- **CSV_Endpoint**: The Google Sheets gviz endpoint providing schedule data in CSV format
- **Breakpoint_Mobile**: The viewport width threshold of 768px below which mobile layouts activate

## Requirements

### Requirement 1: Mobile Card-Based Layout

**User Story:** As a mobile user, I want to see schedule entries as individual cards instead of a table, so that I can read program details comfortably on a small screen.

#### Acceptance Criteria

1. WHEN the viewport width is below 768px, THE Dashboard SHALL render schedule entries as vertically stacked Schedule_Card components instead of the Desktop_Table.
2. WHILE the viewport width is 768px or wider, THE Dashboard SHALL render schedule entries in the existing Desktop_Table format with plain text columns.
3. THE Schedule_Card SHALL display the program time, program name, cluster/location, and VIP attendees for each entry.
4. WHEN a Schedule_Card is rendered, THE Dashboard SHALL display the time prominently at the top-left of the card.
5. WHEN a Schedule_Card is rendered, THE Dashboard SHALL display VIP names as VIP_Badge pill elements with colored backgrounds.
6. WHILE the viewport width is 768px or wider, THE Dashboard SHALL display VIP names as plain comma-separated text without badge styling.

### Requirement 2: VIP Badge Styling

**User Story:** As a mobile user, I want VIP names displayed as colored badges, so that I can quickly identify important attendees at a glance.

#### Acceptance Criteria

1. WHEN a VIP_Badge is rendered on a Schedule_Card, THE Dashboard SHALL display the VIP name inside a pill-shaped element with rounded corners and a colored background.
2. THE Dashboard SHALL assign distinct background colors to VIP_Badge elements to differentiate between VIP entries.
3. WHEN a VIP field contains multiple VIP names separated by commas, THE Dashboard SHALL render each name as a separate VIP_Badge element.
4. WHILE the viewport width is 768px or wider, THE Dashboard SHALL display VIP names as plain text without VIP_Badge styling.

### Requirement 3: Horizontal Scrollable Date Tabs

**User Story:** As a mobile user, I want to swipe through date tabs horizontally, so that I can quickly navigate between event days without using small arrow buttons.

#### Acceptance Criteria

1. WHEN the viewport width is below 768px, THE Dashboard SHALL display available dates as horizontally scrollable Date_Tabs replacing the arrow-based navigation.
2. THE Date_Tabs SHALL display relative labels where applicable: "SEMALAM" for the previous day, "HARI INI" for the current day, and "ESOK" for the next day.
3. WHEN a user taps a date tab, THE Dashboard SHALL update the displayed schedule to show programs for the selected date.
4. THE Date_Tabs SHALL highlight the currently selected date tab with a distinct visual indicator.
5. WHEN the Date_Tabs contain more dates than fit on screen, THE Dashboard SHALL allow horizontal scrolling to reveal additional date tabs.
6. WHILE the viewport width is 768px or wider, THE Dashboard SHALL retain the existing arrow-based date navigation with the date picker popup.

### Requirement 4: Fixed Bottom Navigation Bar

**User Story:** As a mobile user, I want a fixed navigation bar at the bottom of my screen, so that I can switch between tabs easily with my thumb.

#### Acceptance Criteria

1. WHEN the viewport width is below 768px, THE Dashboard SHALL display a fixed Bottom_Nav bar at the bottom of the viewport.
2. THE Bottom_Nav SHALL contain three navigation items: "Jadual Penuh" (document icon), "Utama" (home icon), and "Eksekutif" (chart icon).
3. WHEN a user taps a Bottom_Nav item, THE Dashboard SHALL switch to the corresponding tab content.
4. THE Bottom_Nav SHALL visually highlight the currently active tab item.
5. WHILE the viewport width is below 768px, THE Dashboard SHALL hide the top horizontal navigation tabs.
6. WHILE the viewport width is 768px or wider, THE Dashboard SHALL hide the Bottom_Nav and display the top horizontal navigation tabs.

### Requirement 5: Mobile Filter Bottom Sheet

**User Story:** As a mobile user, I want filters to appear as a slide-up panel, so that I can apply filters without the filter bar taking up permanent screen space.

#### Acceptance Criteria

1. WHEN the viewport width is below 768px, THE Dashboard SHALL display a filter trigger button instead of the inline filter bar.
2. WHEN a user taps the filter trigger button, THE Dashboard SHALL display the Filter_Sheet sliding up from the bottom of the viewport.
3. THE Filter_Sheet SHALL arrange filter controls (Program, Lokasi, VIP, search) in a two-column grid layout.
4. WHEN a user applies filters in the Filter_Sheet, THE Dashboard SHALL filter the displayed schedule entries accordingly.
5. WHEN a user taps outside the Filter_Sheet or taps a close button, THE Dashboard SHALL dismiss the Filter_Sheet by sliding it down.
6. THE Filter_Sheet SHALL include a semi-transparent backdrop overlay behind the panel.
7. WHILE the viewport width is 768px or wider, THE Dashboard SHALL display the existing inline filter bar without the bottom sheet mechanism.

### Requirement 6: Header Subtitle

**User Story:** As a user, I want to see the event dates and venue displayed in the header, so that I immediately know when and where MAHA 2026 takes place.

#### Acceptance Criteria

1. THE Header_Section SHALL display the subtitle text "28 OGOS – 6 SEPT 2026 | MAEPS SERDANG, SELANGOR" below the main title.
2. THE Header_Section subtitle SHALL be visible on both mobile and desktop viewports.
3. THE Header_Section subtitle SHALL use a font size smaller than the main title to maintain visual hierarchy.

### Requirement 7: Reload Button in Navigation Area

**User Story:** As a user, I want a visible reload button in the navigation area, so that I can manually refresh the schedule data when needed.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "MUAT SEMULA" button in the navigation area on the right side.
2. WHEN a user clicks the "MUAT SEMULA" button, THE Dashboard SHALL fetch the latest data from the CSV_Endpoint and update all displayed content.
3. WHILE data is being fetched after clicking "MUAT SEMULA", THE Dashboard SHALL display a loading indicator.
4. WHEN the viewport width is below 768px, THE Dashboard SHALL display the "MUAT SEMULA" button in an accessible location within the mobile layout.

### Requirement 8: Wider Desktop Search Bar

**User Story:** As a desktop user, I want a wider search bar, so that I can see my full search query and results filter more clearly.

#### Acceptance Criteria

1. WHILE the viewport width is 768px or wider, THE Dashboard SHALL render the search input field with increased width compared to the current implementation.
2. THE search input field SHALL remain functional for filtering schedule entries by keyword across program, location, and VIP fields.

### Requirement 9: Mobile Executive Summary Layout

**User Story:** As a mobile user, I want the executive summary to display cleanly on my phone, so that I can review statistics and charts without awkward horizontal scrolling.

#### Acceptance Criteria

1. WHEN the viewport width is below 768px AND the Executive_Tab is active, THE Dashboard SHALL display statistics cards in a single horizontal row with compact sizing.
2. WHEN the viewport width is below 768px AND the Executive_Tab is active, THE Dashboard SHALL stack charts vertically in a single column layout.
3. THE Executive_Tab SHALL display the tagline "PENCIPTAAN NILAI DEMI KETERJAMINAN MAKANAN" below the charts section on mobile.
4. WHILE the viewport width is 768px or wider, THE Dashboard SHALL retain the existing executive summary grid layout.

### Requirement 10: Preservation of Existing Functionality

**User Story:** As a user, I want all current features to continue working after the upgrade, so that no functionality is lost in the redesign.

#### Acceptance Criteria

1. THE Dashboard SHALL maintain three navigable tabs: UTAMA (today's schedule), JADUAL PENUH (full schedule), and EKSEKUTIF (executive summary).
2. THE Dashboard SHALL continue fetching schedule data from the CSV_Endpoint with Auto_Refresh every 5 seconds.
3. THE Dashboard SHALL continue rendering charts using the Chart.js library in the Executive_Tab.
4. THE Dashboard SHALL continue supporting PDF export functionality using html2canvas and jsPDF libraries.
5. THE Dashboard SHALL continue displaying the date picker popup for date selection on desktop viewports.
6. THE Dashboard SHALL continue displaying mascot images (Che Lah and Che Yam) in their fixed positions.
7. THE Dashboard SHALL continue displaying the green footer with FAMA branding, social media links, and copyright information.
8. THE Dashboard SHALL continue supporting the theme toggle functionality.
9. THE Dashboard SHALL continue displaying real-time date and time in the top bar.
10. IF the CSV_Endpoint fails to respond, THEN THE Dashboard SHALL fall back to sample data and continue operating.

### Requirement 11: Technology Constraints

**User Story:** As a developer, I want the upgrade to use only vanilla web technologies, so that the project remains simple and dependency-free.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using plain HTML, CSS, and JavaScript without build tools or framework dependencies.
2. THE Dashboard SHALL use Chart.js as the sole charting library loaded via CDN.
3. THE Dashboard SHALL use html2canvas and jsPDF loaded via CDN for PDF export functionality.
4. THE Dashboard SHALL use Google Fonts (Inter, Poppins) and Font Awesome loaded via CDN for typography and icons.
5. THE Dashboard SHALL maintain all source files within the existing project structure (index.html, css/, js/ directories).
