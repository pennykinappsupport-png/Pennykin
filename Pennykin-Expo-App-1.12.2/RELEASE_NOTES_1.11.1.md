# Pennykin 1.11.1 — Sleeping Dog Visibility Fix

The 1.11.0 dog sleep correction passed a decimal percentage string as the transform origin. The installed React Native parser tokenizes `50% 66.5625%` as `50% 5625%`, moving the sleeping dog far outside the room.

The pivot now uses numeric pixel coordinates `[size / 2, size * 426 / 640, 0]`. Both ordinary sleep and the Rest lifecycle use this shared correction. The approximately 26% taller dog sleep proportions and cat-aligned floor baseline are preserved.

Validation:
- TypeScript check passed.
- 95 tests passed, including two new tests that execute the installed React Native transform-origin parser and check visible dog pixels stay inside the avatar at sizes 84, 190, and 320.
- iOS asset/Hermes export completed successfully.
- Actual iOS simulator/device visual verification remains pending.

App, package, lockfile, UI version, and README: 1.11.1. iOS build 49; Android versionCode 49.
