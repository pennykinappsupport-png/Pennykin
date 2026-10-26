# Pennykin 1.11.6 — Clean ghosting, pacing and idle return

Clean's displaced bath-exit sprites previously overlapped for 300 ms. Exit transitions now last 180 ms: the outgoing sprite fades completely out in 60 ms before the next sprite fades in over 120 ms. No two displaced body images are visible at the same instant. The final return to ordinary idle uses the same ordered transition. Other pose changes use a shorter 180 ms cross-fade.

All sixteen existing painted poses are retained. Each remains fully opaque for at least 1,200 ms between transitions. The visual sequence is now 22.66 seconds; the request duration is 23.02 seconds. Six dialogue stages follow the expanded story. Each bubble fades in over 200 ms and out over 200 ms, with at least one second of fully visible reading time. Bath retirement, towel, airflow and three water drops follow the new schedule; airflow/drop particle movement continues at its original physical speed.

| Dialogue stage | Start |
| --- | --- |
| Testing the water | 0.00 s |
| Bubble hat / scrub | 4.34 s |
| Rinse / splash | 8.48 s |
| Paws on rim / exit | 12.62 s |
| Towel / breeze | 18.14 s |
| All dry and fluffy | 20.90 s |
| Return to ordinary idle | 22.28 s |

The end-state issue was the room's automatic night pose: after 8pm it changed a calm pet to a sleeping bitmap even though the animation machine was idle, not Rest_Loop. A matching Clean completion now sets an awake idle override before finishing the action. Stale completion IDs are ignored. Explicit Rest remains available, and the existing long-nap/check-in state is retained. This override lasts in the current HomeScreen session; another accepted care action releases it. It does not change financial data or care costs/rewards.

TypeScript, all 110 tests and the iOS Metro/Hermes export passed. New regression tests execute the real HomeScreen completion handler and inspect the real RoomScene PetAvatar props with a night-time clock. The ZIP includes logs and a raster QA video/contact sheet driven by production JSX styles. It is source code, not a signed IPA, and the preview is not a native-device recording.

App version 1.11.6; iOS build 54; Android versionCode 54. See `docs/VALIDATION-v1.11.6.md`.
