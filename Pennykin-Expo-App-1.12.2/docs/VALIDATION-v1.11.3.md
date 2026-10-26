# Validation — 1.11.3

Date: 2026-10-06. Expo 57 / React Native 0.86.2, Linux host.

| Check | Result |
| --- | --- |
| TypeScript | PASS |
| `npm test` | PASS — 106 tests |
| Resident pose alpha/node identity | PASS — all 16 poses stay mounted; interpolation objects survive rerenders |
| Single native clock | PASS — all prop/body values pause in place, resume and finish once |
| Tub retirement and dryer entrance | PASS — intermediate alpha/position values exist over 1070/630 ms |
| Continuous wind during held pose | PASS — air particles move while the drying pose remains unchanged |
| Foreground exit paws | PASS — same pose, opacity and transform as body; only the lower clipped region appears above rim |
| PNG integrity and fixed source anchors | PASS — 60 complete native PNGs, 48 aligned poses |
| Layered source reconstruction | PASS — 3 ORAs, 16 groups each; visible group reconstruction matches exported PNG |
| Source sprite cells | PASS — 48 keyframe cells match individual scene PNGs |
| Dryer support | PASS — motor and floor base belong to one connected opaque region |
| Smooth preview | PASS — MP4 has 246 frames, 25 fps, 9.84 seconds; same production JSX values |
| iOS Metro/Hermes export | PASS; exported PNGs checked for integrity |
| Native IPA / real iPhone / iOS simulator | NOT RUN — no Xcode/signing environment |

The offline preview traverses production `CleanArt` JSX with a deterministic
React Native animation adapter, exports sources and evaluated native style
paths, and rasterizes those paths including clipping. It does not verify
native image decoding, device GPU behavior, memory pressure or iOS-specific
draw order. Before TestFlight distribution, confirm Clean on a real device
and check background/resume and fast repeated care actions.

Current logs: `typecheck-1.11.3.txt`, `tests-1.11.3.txt`, `ios-export-1.11.3.txt`.
