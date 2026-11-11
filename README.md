# Mobile Expense Tracker (V1)

A private, minimalist personal expense tracker mobile application built with **React Native**, **Expo**, **Expo SQLite**, and **TypeScript**. Designed for single-user personal finance tracking with 100% offline local storage, zero telemetry, and instant transaction entry.

---

## Key Highlights

- **Complete Privacy & Local Storage**: All financial records, budgets, and categories remain strictly on your device inside a local SQLite database.
- **Zero Cloud / Telemetry**: No user accounts, no login, no remote backend, no external analytics, no ads, and no network requests.
- **Offline First**: Fully functional without network connectivity, including in Airplane Mode.
- **Automatic Cloud Backup Disabled**: Operating system auto-cloud backups are explicitly disabled (`allowBackup: false`) to avoid leaking unencrypted financial records to cloud drives.
- **Sub-Second Expense Logging**: Floating action button (`+`) launches an optimized bottom sheet with immediate numeric keypad focus and category selection.
- **Precise Integer Cents Math**: Monetary values are stored as 64-bit integer cents (e.g., `€15.99` → `1599`) eliminating floating-point calculation errors.
- **Interactive Expense Breakdown**: Native SVG donut chart with category distribution, center monthly total, legend breakdown, and one-tap category filtering.
- **Flexible Monthly Budgets**: Set distinct budgets for each month with animated progress tracking and 80%/100% threshold indicators.
- **Full Category Customization**: Create custom categories, choose colors and icons, rename, or archive unused categories without deleting historical records.
- **Manual Backup & Restore**: Export full JSON backups, export CSV spreadsheets for Excel/Numbers, and restore data with integrity validation.
- **Light & Dark Mode**: Seamlessly adapts to your system theme or manual toggle (Light, Dark, System Default).

---

## Architecture Overview

The codebase is split into three decoupled layers to allow future code sharing with a desktop application:

```
expense-tracker/
├── app/                          # Expo Router mobile screens
│   ├── _layout.tsx               # Root layout, theme & database providers
│   ├── index.tsx                 # Main dashboard (scrollable overview)
│   └── settings.tsx              # Categories, backups & theme settings
├── src/
│   ├── core/                     # Portable core logic (zero UI dependencies)
│   │   ├── types.ts              # TypeScript interfaces & data models
│   │   ├── constants.ts          # Default categories, icons, colors
│   │   ├── database.ts           # SQLite schema, migrations & CRUD operations
│   │   └── calculations.ts       # Budget math & category distribution
│   ├── hooks/                    # React hooks for state and queries
│   │   ├── useDatabase.ts        # SQLite initialization context
│   │   ├── useExpenses.ts        # Monthly expenses CRUD & filtering
│   │   ├── useBudget.ts          # Monthly budget persistence
│   │   ├── useCategories.ts      # Category management & archiving
│   │   ├── useMonthSummary.ts    # Computed totals & breakdown
│   │   └── useAppTheme.ts        # Light/dark mode resolution
│   ├── components/               # Modular UI components
│   │   ├── Header.tsx            # Header with settings shortcut
│   │   ├── MonthSelector.tsx     # Month navigation with spring feedback
│   │   ├── BudgetCard.tsx        # Budget progress card with warning states
│   │   ├── BudgetEditModal.tsx   # Budget adjustment dialog
│   │   ├── DonutChart.tsx        # Custom SVG donut chart
│   │   ├── CategoryLegend.tsx    # Category list with percentage & amount
│   │   ├── ExpenseList.tsx       # Sorted recent transactions list
│   │   ├── ExpenseItem.tsx       # Individual transaction row
│   │   ├── FAB.tsx               # Circular "+" floating button
│   │   ├── ExpenseBottomSheet.tsx# Primary rapid expense entry sheet
│   │   ├── AmountInput.tsx       # Large decimal input with € currency
│   │   ├── CategoryGrid.tsx      # Selectable category icons grid
│   │   ├── CategoryEditModal.tsx # Custom category creator/editor
│   │   ├── ConfirmModal.tsx      # Destructive action confirmation dialog
│   │   └── EmptyState.tsx        # Friendly illustrations when list is empty
│   ├── theme/
│   │   └── theme.ts              # Spacing, colors, radius, typography
│   └── utils/
│       ├── formatters.ts         # Currency, date, percentage formatting
│       └── backup.ts             # JSON & CSV backup export/import
├── app.json                      # Expo application manifest
├── package.json
└── tsconfig.json
```

---

## Database Schema

```sql
-- Schema version tracking for automatic migrations
CREATE TABLE schema_version (
  version INTEGER NOT NULL
);

-- Categories
CREATE TABLE categories (
  id          TEXT PRIMARY KEY NOT NULL,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL,
  icon        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- Expenses (Amounts stored in integer cents)
CREATE TABLE expenses (
  id           TEXT PRIMARY KEY NOT NULL,
  amount_cents INTEGER NOT NULL,
  category_id  TEXT NOT NULL,
  date         TEXT NOT NULL, -- Format: YYYY-MM-DD
  note         TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX idx_expenses_date ON expenses(date);

-- Per-Month Budgets
CREATE TABLE monthly_budgets (
  month_key    TEXT PRIMARY KEY NOT NULL, -- Format: YYYY-MM
  budget_cents INTEGER NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
```

---

## Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or newer)
- npm or yarn
- Expo Go on your physical iOS/Android device, or an iOS Simulator / Android Emulator

### 1. Install dependencies

```bash
cd "Expense tracker"
npm install
```

### 2. Start the development server

```bash
npx expo start
```

### 3. Open on your device

- **iOS**: Open the Camera app on your iPhone and scan the QR code displayed in your terminal (using Expo Go), or press `i` to launch in the iOS Simulator.
- **Android**: Open the Expo Go app on your Android device and scan the QR code, or press `a` to run on an attached Android emulator.

---

## Building a Standalone App (For Personal Installation)

To install this as a standalone native app on your phone without relying on Expo Go:

### Option A: Local Build (via Expo Prebuild)

Generate native iOS and Android projects locally:

```bash
# Generate the native ios/ and android/ directories
npx expo prebuild

# For Android (outputs a debug or release APK):
cd android
./gradlew assembleRelease
# APK will be in android/app/build/outputs/apk/release/app-release.apk

# For iOS (requires Xcode on macOS):
cd ..
npx expo run:ios --configuration Release
```

### Option B: Cloud Build with EAS Build

If you use Expo Application Services (EAS):

```bash
# Install EAS CLI
npm install -g eas-cli

# Log into EAS
eas login

# Configure project
eas build:configure

# Build Android APK directly installable on phone
eas build -p android --profile preview

# Build iOS Ad-Hoc / Internal build
eas build -p ios --profile preview
```

---

## Key Workflows

### 1. Adding an Expense (< 3 seconds)
1. Tap the **`+`** button in the bottom right corner.
2. The numeric keypad appears automatically with the cursor in the amount field.
3. Enter the amount (e.g. `12.50` or `12,50`).
4. Select a category from the grid.
5. (Optional) Adjust the date or add a short note.
6. Tap **Save Expense**. The bottom sheet closes, subtle haptic confirmation plays, and the monthly budget card, donut chart, and transaction list update immediately.

### 2. Editing or Deleting an Expense
1. Tap any transaction in the **Recent Expenses** list.
2. The sheet reopens with all existing values pre-filled.
3. Edit the amount, category, date, or note and tap **Save Changes**, or tap **Delete Expense** (with confirmation) to remove it.

### 3. Adjusting Monthly Budget
1. On the dashboard budget card, tap the pencil edit icon next to "Monthly Budget".
2. Enter your desired budget for the active month (e.g. `2500`).
3. Tap **Save**. The progress bar and remaining amount update in real-time.

### 4. Categorized Filtering
1. Tap any colored segment on the **Donut Chart** or tap a category row in the **Category Legend**.
2. The donut segment highlights and the **Recent Expenses** list instantly filters to show only transactions for that category.
3. Tap the segment again or tap **Show all** to reset the filter.

### 5. Managing Categories
1. Tap the gear icon in the top right to open **Settings**.
2. Tap **New** to create a custom category: enter a name, pick a color swatch, and choose a Material icon.
3. Tap the pencil icon on any existing category to rename it or modify its styling.
4. Tap the archive icon to hide a category from the active entry grid without affecting historical expense logs.

### 6. Backup & Restore
1. In **Settings**, scroll to **Data & Backups**.
2. **Export JSON Backup**: Generates an encrypted/plain JSON file containing your complete database and prompts the native sharing sheet to save it to your device's Files app, AirDrop, or local drive.
3. **Export CSV Spreadsheet**: Exports your transactions as a standard `.csv` spreadsheet ready to open in Excel, Numbers, or Google Sheets.
4. **Restore from JSON**: Select a previously saved backup file. The app validates the file structure and schema before replacing local records.

---

## Future Desktop Compatibility

The project's `src/core/` and `src/utils/` directories are completely decoupled from React Native:
- `src/core/types.ts`: Universal TypeScript models.
- `src/core/calculations.ts`: Pure mathematical functions for budget calculations.
- `src/core/constants.ts`: Shared defaults and configurations.
- `src/utils/formatters.ts`: Universal currency and date parsers.
- `src/utils/backup.ts`: Versioned JSON import/export schema (`BACKUP_VERSION = 1`).

A future Electron, Tauri, or Web desktop application can directly import these core modules and load backups exported from the mobile app without any data transformation.

---

## License

Personal and private use only. All financial data remains exclusively on your physical hardware.
