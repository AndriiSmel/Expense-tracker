# Build V1 of My Private Mobile Expense Tracker

## Project overview

Build a beautiful, minimalistic mobile expense tracker application for my own personal use.

The application is not intended for public release or commercial use. Its purpose is to help me track daily expenses, manage my monthly budget, and visualize where my money goes.

My priorities are:

1. Complete privacy and local data storage.
2. Extremely fast and easy expense entry.
3. A clean, modern, intuitive mobile interface.
4. A simple but useful overview of my spending.

This is the first version of the mobile application. A desktop version will be developed later, so structure the code and data model in a way that makes future expansion possible.

## 1. Technology stack

Build the application using:

- React Native with Expo
- TypeScript
- Expo SQLite for persistent local database storage
- React Native SVG for the donut chart
- Expo Router for navigation, if necessary

Use a simple, maintainable architecture. Separate database operations, business logic, and UI components so that the underlying expense tracking logic can potentially be reused in a future desktop application.

The application must support both iOS and Android.

Do not build a web application wrapped inside a mobile browser.

## 2. Privacy requirements

Privacy is a non-negotiable requirement.

- All financial data must be stored locally on my phone.
- Do not use cloud databases, remote servers, or third-party backend services.
- Do not require registration, login, or a user account.
- Do not integrate with banks or financial institutions.
- Do not include analytics, tracking, telemetry, advertisements, or external API calls.
- Bundle all fonts, icons, and other assets locally.
- Disable automatic remote updates and unnecessary network-dependent features in the production build.
- The installed application must function completely offline, including when the phone is in airplane mode.
- Do not send my financial data to any external service.
- Configure the application to exclude its financial database from automatic cloud backups where the operating system allows it.

Use SQLite for local persistence. Store monetary values as integer cents to avoid floating-point calculation errors.

## 3. Main dashboard

The main screen should be a clean, vertically scrollable mobile dashboard.

### Header

- Display the application name.
- Include a small settings icon.
- Display the currently selected month and year.
- Add left and right arrows to navigate between months.
- Open the current month by default.

### Monthly budget card

Create a prominent card displaying:

- Monthly budget in euros (€).
- Total amount spent during the selected month.
- Remaining budget.
- A horizontal progress bar indicating how much of the budget has been used.
- A small edit button to manually adjust the budget.

When I tap the edit button, open a small modal allowing me to enter a new budget amount.

Allow a different budget for each month.

Changing the budget must not modify or delete any expenses.

Use a warning color when 80% of the budget has been used, and clearly indicate when the budget has been exceeded.

### Expense breakdown

Display a large, modern donut chart showing how my expenses are distributed across categories.

The chart should include:

- Total monthly spending in the center.
- Different colored segments for each expense category.
- A legend below the chart containing the category name, color, total amount, and percentage of spending.

Use consistent category colors throughout the app.

When a user taps a chart segment or category in the legend, highlight the selected category and optionally filter the expense list.

The chart must update immediately when an expense is added, edited, or deleted.

When there are no expenses, display a friendly empty state.

### Recent expenses

Below the chart, display recent transactions.

Each expense entry should contain:

- Category icon.
- Category name.
- Optional description.
- Date.
- Amount spent.

Sort expenses from newest to oldest.

Allow me to tap an expense to edit it or delete it.

## 4. Add expense — the most important interaction

Place a prominent circular "+" floating action button in the bottom-right corner of the main screen, above the phone's safe area.

When I tap the "+" button, open a mobile bottom sheet.

The bottom sheet should contain:

### Amount

- Large, prominent amount input.
- Euro (€) currency.
- Automatically focus the input and open the numeric keyboard.
- Accept decimal values with up to two decimal places.
- Support decimal commas and decimal points.
- Only accept positive amounts.

### Category

Display categories as a compact grid of selectable icons with labels.

Default categories:

- Groceries
- Eating Out & Coffee
- Transport
- Rent & Utilities
- Shopping
- Entertainment
- Health
- Subscriptions
- Travel
- Other

Each category should have a recognizable icon and its own color.

Only one category can be selected per expense.

### Optional information

- Date, defaulting to today's date.
- A short optional note describing the purchase.

Keep these optional fields visually secondary so they do not slow down the main expense entry process.

### Save button

Add a large, full-width "Save expense" button.

When I tap Save:

1. Validate the amount and category.
2. Save the expense to the local SQLite database.
3. Close the bottom sheet.
4. Update the budget, chart, and expense history immediately.
5. Provide subtle haptic feedback or a brief confirmation.

The primary expense entry flow should take only a few seconds:

Open app → Tap "+" → Enter amount → Select category → Save.

Do not introduce unnecessary confirmation screens or extra steps.

## 5. Expense management

Allow me to:

- View all expenses for the selected month.
- Edit an existing expense.
- Delete an expense with confirmation.
- Filter expenses by category.

When editing an expense, reuse the add-expense bottom sheet with the existing information already filled in.

All changes must immediately update the dashboard and persist in the database.

## 6. Category management

In Settings, allow me to:

- Create custom categories.
- Rename categories.
- Change their color and icon.
- Archive categories that I no longer use.

Archiving a category must not delete its historical expenses.

Provide useful default categories so that I can start using the application immediately.

## 7. Backup and restore

Since the app stores data locally, provide a simple manual backup mechanism.

In Settings, include:

- Export all expenses, budgets, and categories as a JSON backup file.
- Import a previously exported JSON backup file.
- Export expenses as a CSV file.

Use the phone's local file picker and file storage mechanisms.

Never automatically upload backups to external services.

Validate backup files before importing them and warn before replacing existing data.

Explain that deleting the application or losing the phone may result in data loss unless a backup exists.

## 8. Mobile design guidelines

Design a premium, minimalist personal finance app.

Visual direction:

- Modern, clean typography.
- Neutral backgrounds.
- One primary accent color, preferably indigo or a muted blue.
- Distinct but harmonious expense category colors.
- Rounded cards.
- Generous whitespace.
- Large and readable financial figures.
- Minimal visual clutter.
- Light mode and dark mode.
- Subtle animations and haptic feedback.

Mobile-specific requirements:

- Respect iOS and Android safe areas.
- Optimize for one-handed use.
- Use appropriately sized touch targets.
- Ensure the keyboard does not cover the expense form or save button.
- Support small and large phone screens.
- Use native-feeling bottom sheets and dialogs.
- Ensure accessible text contrast and support for larger text sizes.

The main screen should contain:

1. App title and settings.
2. Month selector.
3. Monthly budget card.
4. Donut chart.
5. Category breakdown legend.
6. Recent expenses.
7. Floating "+" button.

Avoid unnecessary tabs and complicated navigation. For V1, the main dashboard and settings should be sufficient.

## 9. Data model

Use a local SQLite database with the following entities:

Expense:
- Unique ID
- Amount in cents
- Category ID
- Date
- Optional note
- Created timestamp
- Updated timestamp

Category:
- Unique ID
- Name
- Color
- Icon
- Archived status

Monthly Budget:
- Month and year
- Budget amount in cents

Include appropriate database migrations so that future application updates do not erase existing data.

Keep the data model independent of mobile-specific UI code so a future desktop application can use the same logical structure.

## 10. Future desktop version

Do not build the desktop version in V1.

However, prepare the architecture for future expansion by:

- Separating financial calculations from the UI.
- Keeping TypeScript data models reusable.
- Using a portable database schema.
- Providing versioned JSON import and export.
- Avoiding tightly coupling business logic to mobile-specific libraries.

A future desktop version should be able to import mobile backups without losing financial data.

Do not implement automatic synchronization between devices yet.

## 11. Out of scope for V1

Do not implement:

- Bank integrations
- Cloud synchronization
- Online accounts
- AI financial advice
- Income tracking
- Investment tracking
- Automatic recurring expenses
- Multiple currencies
- Shared budgets
- Complex financial reports

Focus on making the core expense tracking experience reliable, polished, and effortless.

## 12. Implementation instructions

Before coding, briefly outline:

- The technical architecture.
- The project folder structure.
- The database schema.
- The main screens and reusable components.

Then implement the complete working mobile application.

Do not stop at creating a visual prototype.

Make sure the following workflows work correctly:

- Setting and editing a monthly budget.
- Adding an expense.
- Editing and deleting an expense.
- Navigating between months.
- Automatically updating the donut chart and remaining budget.
- Closing and reopening the application without losing data.
- Using the application entirely offline.
- Exporting and restoring a backup.
- Handling empty states and invalid inputs.

Include a README explaining how to install the dependencies, run the application on my phone, test it, and create a standalone mobile build for personal use.

If any minor implementation decisions are unspecified, choose the simplest solution that prioritizes privacy, usability, and maintainability.

The final result should be a fully functional, visually polished V1 mobile expense tracker that I can install on my phone and use every day.
