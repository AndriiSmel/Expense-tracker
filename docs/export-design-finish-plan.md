# Finish the Expense Tracker redesign

- [x] **Android large text.** On the existing QA build at 320 dp and 160% text in dark mode, selected Groceries and saved €3 with the keypad open. The dashboard total increased from €49 to €52. Evidence: `tmp/export-design-qa/dark-large-selected.png`. Repeat this check after the font change.
- [x] **Typography and icons.** Bundled Nunito Sans and reused the export's Solar icons for the primary controls and budget graphics. Reviewed Android captures.
- [x] **Android artifact.** Installed the signed APK over the test build and confirmed the €55 sample total survived. Independent review verified APK signature, the current Hermes bundle, all four font files, and the affected captures.
- [ ] **Native iOS.** Check the same layout and entry flow on an available iOS device or simulator. Track bundle verification separately from native testing.
- [x] **Category limits decision.** Andrii selected editable category limits and warnings.
- [x] **Category limits and local data checks.** Verified set, overage, relaunch, and removal on Android. Isolated SQLite checks covered migration, backup restore, and mixed-version sync merge permutations. Live Google Drive remains unverified.

Combined QA evidence: a €50 Groceries limit displayed a €2 overage, including after force-stop and relaunch. Removing the limit restored the spending-only row. With Nunito Sans at 320 dp and 160% text, scrolling to Groceries and saving above the keypad raised the total to €55. TypeScript and the final iOS JavaScript export passed. Native iOS and live Google Drive remain open.
