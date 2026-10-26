# Pennykin 1.2.1 — Stable Artwork

This patch targets the intermittent blank-pet and blank-furniture state seen in the iOS development build.

## Changes

- Warms the three pet portraits and critical room artwork before the main interface appears.
- Loads the remaining collection art in small background batches instead of requesting every PNG at once.
- Retries a failed pet image twice and an item image once.
- Shows a visible pet or item fallback while an image is pending, so the room never looks accidentally empty.
- Remembers successful image loads while the app is running, reducing flashes when changing tabs.
- Re-warms critical room art when the app returns from the background.
- Limits Shop and Collection to eight cards initially, with a **Show more treasures** button.
- Displays `Pennykin 1.2.1 · Stable artwork build` in **Insights → Settings & privacy**.

## Verification

- `npm run typecheck`
- `npx expo export --platform ios`
- Confirmed that all 27 PNG assets are included in the iOS export.

Physical-device and long-session testing are still required before TestFlight distribution.
