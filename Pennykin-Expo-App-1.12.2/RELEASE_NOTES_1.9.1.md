# Pennykin 1.9.1 — Insight Consistency Fix

## What changed

- Current Day and Week views continue to show `Safe Today`.
- Historical Day/Week views and all Month/Year views now compare spending with the immediately previous matching period.
- Comparison states safely handle lower, higher, unchanged, new, and empty spending periods.
- Category colors no longer change when rankings change:
  - Food — yellow
  - Transport — blue
  - School — green
  - Entertainment — purple
  - Shopping — pink
  - Other and unknown categories — gray
- The donut chart and category ranking use the same fixed color mapping.

## Build

- App version: 1.9.1
- iOS build: 30
- Android versionCode: 30
