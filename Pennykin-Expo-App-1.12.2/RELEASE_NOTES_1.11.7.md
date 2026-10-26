# Pennykin 1.11.7 — Complete financial reports and device-local calendar dates

Version: 1.11.7. iOS build: 61. Android versionCode: 61.

## Financial reporting

`transactionQueries.ts` now owns financial aggregation. A parameterized SQLite statement reads the full selected date range and returns total spending, Need spending, entry count, category totals and chart buckets using SUM, COUNT and GROUP BY. Its total/category/bucket arms share one filtered CTE and statement snapshot. Empty ranges return integer zeros. Amounts remain integer cents.

Historical day/week/month/year reports no longer use a capped in-memory transaction array. `Snapshot` contains small current-week financial actuals, including today's count/total and yesterday's total. Budget metrics, Home gift progress and pet reactions consume these actuals. Insights uses database COUNT for its entry label. Application code only formats aggregate results, fills missing chart buckets, calculates cumulative chart points, and applies budget formulas.

Today's entry list independently requests 50-row cursor pages, ordered by transaction_date DESC, created_at DESC and id DESC. Load more changes the list only; full financial totals and reward progress never depend on the loaded rows. Period and list queries reject stale async completions and provide visible error/retry controls.

AppContext serializes exposed mutations and refreshes so concurrent requests cannot interleave context-owned writes or publish intermediate financial snapshots. Snapshot reads use a dedicated SQLite read transaction. Want explanations read current committed actuals, rather than a previously rendered balance. Failed expense writes retain the existing atomic rollback of transaction, check-in and reward changes.

## Local dates and DST — policy A

`date.ts` wraps pinned date-fns 4.1.0 calendar operations. Bare date keys are strictly parsed as local civil dates, never as UTC instants. Signed calendar differences serve period navigation; the existing nonnegative elapsed-day contract remains explicit for streak/absence logic. Monday remains the start of the budget week and the remaining-day divisor includes today.

The current date, streak and budget follow the device's local timezone. Existing transaction_date values are never rewritten when the device timezone changes. created_at remains a UTC instant; the existing day chart's four-hour buckets use the device's current local hours. Queries filter transaction_date using inclusive start / exclusive next-period-start boundaries.

App resume and minute checks detect a change in local date, timezone identity or UTC offset, including timezone changes that keep the same date. Failed calendar refreshes remain eligible for retry. Each expense captures one clock value for its civil date and creation timestamp.

## Data compatibility

No transaction backfill, destructive migration or new schema column is needed. Existing records, IDs, integer amounts, dates, budgets and pet progress remain in place. Existing date indexes are reused. A database can be migrated/reopened and queried without changing historical transaction rows.

## Verification

- TypeScript: PASS.
- Full suite: PASS — 153 tests.
- 301, 1,000 and 10,000 transactions: complete SQL totals/counts/category/chart checks; pagination sizes 7, 50 and 200 return all IDs once.
- Actual SQLite insert/edit/delete, empty periods, exclusive boundaries and repeated initialization: PASS.
- Production AppContext writes against SQLite: spring/fall DST streaks, $70 Sunday divisor, concurrent saves/refresh, one daily gift, rollback/retry and current-balance Want explanations: PASS.
- Calendar/SQL hour grouping: America/New_York, America/Los_Angeles, Europe/Berlin, Asia/Shanghai and UTC; DST, leap day, month/year rollover, timezone changes preserving civil dates: PASS.
- Production query hooks: stale period/list results, report failure/retry and duplicate load-more taps: PASS.
- Existing pet animation regressions: PASS.
- iOS Metro/Hermes export: PASS.

Logs: `docs/finance-1.11.7/`.

This is an Expo source package, not a signed IPA. Native iPhone/iPad installation, native SQLite timezone/connection behavior and App Store submission remain unverified in this Linux environment. This change does not complete privacy-policy hosting, Apple account setup or store metadata.

Install dependencies with `npm ci`. Run `npm run test:finance` for the focused checks or `npm test` for the complete suite. Tests use Node's built-in node:sqlite (Node 22.13+; verified here on Node 24).
