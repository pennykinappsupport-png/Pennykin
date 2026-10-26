# Validation — 1.11.6

Date: 2026-10-06 (America/New_York). Expo 57.0.27 / React Native 0.86.3, Linux host.

| Check | Result |
| --- | --- |
| TypeScript | PASS |
| Complete test suite | PASS — 110 tests |
| Exit ghosting | PASS — actual mounted image-view opacity paths sampled every 10 ms across all transitions; no simultaneous positive alpha for displaced exit sprites or final idle return |
| Pose readability | PASS — all sixteen poses fully opaque for at least 1,200 ms after the 180 ms transition |
| Speech readability | PASS — all six messages have 200 ms fade-in/out and at least 1,000 ms at full opacity |
| Clean completion at night | PASS — actual HomeScreen callback, production animation reducer and RoomScene PetAvatar props yield calm / no Rest_Loop at 20:00, and stay awake on subsequent renders |
| Stale completion | PASS — mismatched completion ID leaves the action and night policy unchanged |
| Pause / resume / cancellation | PASS — one native clock freezes pose/prop/particle paths and completes once after resume; cancelled scenes cannot complete |
| iOS Metro/Hermes export | PASS — clean-cache export |
| Export integrity | PASS — all 60 Clean PNGs match source bytes |
| Raster QA | Inspected exit/idle contact sheet generated from production JSX sources/styles; video includes actual dialogue text and speech alpha |
| Native iPhone / simulator / signed IPA | NOT RUN — no macOS/Xcode environment |

Logs: `tests-1.11.6.txt`, `typecheck-1.11.6.txt`, `ios-export-1.11.6.txt`, `export-integrity-1.11.6.txt`.
Previews: `clean-preview-1.11.6.mp4`, `clean-contact-1.11.6.jpg`.

Raster QA cannot verify native GPU behavior, memory pressure, image decoding or platform-specific rendering. Device/simulator visual validation remains pending before an App Store submission.
