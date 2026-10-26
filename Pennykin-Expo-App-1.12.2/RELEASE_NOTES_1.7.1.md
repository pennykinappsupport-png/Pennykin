# Pennykin 1.7.1 — Daily Gifts & Appearance

## What changed

- Added Settings controls for System, Light, and Dark appearance modes.
- Added a persistent Standard/Large text setting. Large mode increases interface text and input text by 18% while retaining iOS Dynamic Type support.
- Expanded the adaptive dark palette across navigation, cards, prompts, Shop, Collection, Insights, and pet-care screens.
- Changed the mystery-gift trail to one daily goal: three expense entries on the same local calendar day earn 10 Pet Coins and one gift.
- Gift progress now starts at 0/3 after local midnight. An unfinished 1/3 or 2/3 from yesterday never carries into the new day.
- The app refreshes at local midnight, once per minute as a fallback, and whenever it returns to the foreground.
- Daily reward insertion is unique per date, preventing deletion and re-entry from granting the same day’s gift twice.

## Suggested checks

1. Open **Insights → Settings → Appearance** and switch among System, Light, and Dark.
2. Select Large, close and reopen the app, and confirm the setting remains active.
3. Record two expenses and confirm the trail shows 2/3 with no mystery gift.
4. Record the third expense and confirm 10 Pet Coins plus one pending gift.
5. Record a fourth expense and confirm no second daily gift is granted.
6. Test across midnight or temporarily change the simulator date: the new day should show 0/3 even when yesterday ended at 2/3.
