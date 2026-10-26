# Pennykin 1.7.0 — Quick Check-in & Accessible Insights

## Quick Check-in

- Moved Check-in to the center of the tab bar and redesigned it as an elevated primary action button.
- Reordered the form around the fastest path: amount, Need/Want, category, optional note, save.
- Added an automatically focused amount field and made the description optional, using the selected category as a clear fallback.
- Moved the Mystery Gift trail below the form so it no longer delays the core task.

## Behavioral nudge

- Added a live, non-blocking explanation directly below the Need/Want selector.
- Want entries show the typed amount as a percentage of today's Safe to Spend before the expense is saved.
- Need entries show the same daily-plan context and, when available, the amount remaining in the selected category plan.
- When Safe to Spend is $0.00, the app encourages honest recording and explains that the remaining week will be recalculated without penalty.
- The nudge is context only: it never blocks saving, labels spending as bad, or changes the Pet Coin reward.

## Accessibility

- Added separate light- and dark-mode palettes to financial explanation sheets.
- Formula tags use high-contrast foreground/background pairs in both appearances.
- Removed fixed text line heights from explanation content so iOS Dynamic Type can expand naturally inside a scrollable sheet.
- Preserved 44-point controls, accessibility labels, modal semantics, and polite screen-reader announcements for changing nudges.

## Offline reliability

- Expense saving remains entirely on-device and does not call a remote service.
- Expense, check-in reward, coins, gifts, and badges now save as one atomic SQLite transaction.
- If any part of that local write fails, the whole operation rolls back instead of leaving partial rewards or records.
- Artwork warming and other non-core preparation remain best-effort and do not participate in the financial write.

## Build

- Public version: 1.7.0
- iOS build number: 22
- Android version code: 22
