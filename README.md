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
- **Flexible Monthly Budgets**: Set a recurring default and override individual months, with animated progress tracking and 80%/100% threshold indicators.
- **Currency Preference**: Choose the currency shown in the app. Saved amounts keep their numeric values.
- **Recurring Expenses**: Set an amount, category, start date, and repeat interval in days, weeks, months, or years. Due entries are recorded when you open or return to the app.
- **Category Management**: Create, rename, customize, or archive categories. Delete unused categories from Settings.
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
  is_deleted  INTEGER NOT NULL DEFAULT 0,
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

- [Node.js](https://nodejs.org/) (version 22.13 or newer)
- npm or yarn
- Expo Go built for SDK 58 on your device or emulator, or an SDK 58 development build

### 1. Install dependencies

```bash
npm ci
```

### 2. Start the development server

```bash
npx expo start
```

### 3. Open on your device

- **Android**: Install the [SDK 58 build of Expo Go](https://expo.dev/go?sdkVersion=58&platform=android&device=true). Connect the phone and computer to the same Wi-Fi network and scan the terminal QR code from Expo Go. For an Android emulator, start the emulator and press `a` in the terminal.
- **iOS**: Use an SDK 58 build of Expo Go. If the App Store build on your device reports a different SDK, use the [Expo Go installer](https://sign.expo.dev/) or an SDK 58 development build. On macOS, you can also press `i` to open the iOS Simulator.

---

## Building a Standalone App (For Personal Installation)

To install this as a standalone native app on your phone without relying on Expo Go:

### Option A: Local Build (via Expo Prebuild)

On Windows, generate the Android project and build a standalone APK in PowerShell:

```powershell
npx.cmd expo prebuild --platform android --no-install
cd android
.\gradlew.bat :app:assembleRelease
```

The APK is at `android/app/build/outputs/apk/release/app-release.apk`. On Windows, prebuild moves the app's CMake staging directory to the repository root and sets a 250-character object path limit. Rerun prebuild on Windows if an older generated project fails with Ninja's `Filename longer than 260 characters` error.

On macOS, generate the iOS project and build with Xcode installed:

```bash
npx expo prebuild --platform ios
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

For a recurring expense, turn on **Repeat expense**, enter the interval, choose the unit, and tap **Save Recurring Expense**. The date on the form is the first occurrence. To stop future entries, go to **Settings → Recurring Expenses**.

### 2. Editing or Deleting an Expense
1. Tap any transaction in the **Recent Expenses** list.
2. The sheet reopens with all existing values pre-filled.
3. Edit the amount, category, date, or note and tap **Save Changes**, or tap **Delete Expense** (with confirmation) to remove it.

### 3. Setting Your Budget and Currency
1. In **Settings → Budget & Currency**, tap **Default monthly budget** and save the amount you want to use each month.
2. To make an exception, tap the pencil on the dashboard budget card and save a budget for the selected month. Tap **Use default budget** in the same dialog to clear the exception.
3. Tap **Currency** in Settings to choose the currency shown in expense inputs, budgets, and totals.

### 4. Categorized Filtering
1. Tap any colored segment on the **Donut Chart** or tap a category row in the **Category Legend**.
2. The donut segment highlights and the **Recent Expenses** list instantly filters to show only transactions for that category.
3. Tap the segment again or tap **Show all** to reset the filter.

### 5. Managing Categories
1. Tap the gear icon in the top right to open **Settings**.
2. Tap **New** to create a custom category: enter a name, pick a color swatch, and choose a Material icon.
3. Tap the pencil icon on any existing category to rename it or modify its styling.
4. Tap the archive icon to hide a category from the active entry grid without affecting historical expense logs.
5. Tap the trash icon on an active or archived category and confirm. Categories linked to any expense or recurring schedule can be archived.

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

## Optional Google Drive sync

Expense entry stays local and works offline. Drive sync is opt-in. With automatic two-way sync enabled, changes to expenses, categories, monthly budgets, and recurring schedules trigger a send and receive after they are saved locally. Restoring a backup also triggers sync. Use **Sync now** to pull changes from another device at any time or retry after an offline edit.

### Enable it in a native build

1. Run `npm ci` from the repo root to install the app's dependencies, including the Google Drive binding.
2. In one [Google Cloud project](https://console.cloud.google.com/), enable the **Google Drive API** and configure Google Auth Platform. Allow the `https://www.googleapis.com/auth/drive.appdata` scope and add your Google account as a test user if the app is in testing.
3. For **Android**, create an Android OAuth client for `com.personal.expensetracker` and the SHA-1 fingerprint of the signing certificate used by your native build. Repeat for any different signing certificate you use.
4. For **iOS**, create an iOS OAuth client for `com.personal.expensetracker`. Put its public client ID in `.env.local` as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-client-id.apps.googleusercontent.com`. The Expo config registers the matching URL scheme. Use the same Cloud project for both platforms.
5. Build and install a [standalone APK](#building-a-standalone-app-for-personal-installation), or run `npx expo run:android` for an Android development build. On a Mac, use `npx expo run:ios` for iOS. Then open **Settings → Google Drive Sync → Connect Google Drive**.

Connect the same account on each device. Generate a sync key once, save it somewhere private, and enter it on the other device. The app encrypts changes on the device before uploading to Drive's app-data folder. Drive keeps the encrypted change files so a new device can catch up. Keep a separate backup for recovery. Losing the sync key makes the Drive files unreadable.

Sync covers expenses, categories, monthly budgets, and recurring schedules. App preferences stay device-local. Changes to different records are combined. If both devices change the same record offline, one version is picked deterministically. Restoring a JSON backup changes your local records, and subsequent sync can propagate those changes.
