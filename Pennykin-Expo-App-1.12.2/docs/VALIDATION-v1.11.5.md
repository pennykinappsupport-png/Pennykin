# Validation — 1.11.5

Date: 2026-10-06 (America/New_York). Expo 57.0.27 / React Native 0.86.3, Linux host.

| Check | Result |
| --- | --- |
| Dependency installation | PASS — npm ci --ignore-scripts --prefer-offline |
| TypeScript | PASS — npm run typecheck |
| Test suite | PASS — all 108 tests |
| Image-view cross-fades | PASS — each of the 17 transitions is checked at 0/75/150/225/300 ms, including both idle handoffs |
| Native animation lifecycle | PASS — single native clock; body, airflow and splash pause together; resume and cancellation/completion tests pass |
| Airflow | PASS — starts at 6900 ms; fades in over 300 ms; ribbon outlet shares dryer translation; particles move toward the pet |
| Water drops | PASS — exactly three mounted drops; start at 3000 ms; transient alpha remains below 0.66; invisible at both terminal states |
| iOS Metro/Hermes resource export | PASS — clean-cache export |
| Exported assets | PASS — all 60 Clean PNGs match source bytes; 128 exported images decode |
| Raster QA | Inspected dog contact sheet; 246 video frames at 25 fps use actual production JSX image sources and evaluated style paths, including tint, alpha, transform and clipping |
| Native device / simulator / signed IPA | NOT RUN — no macOS/Xcode environment |

The raster preview is a code-driven QA artifact, not a device recording. It cannot verify native GPU/image decoding behavior, memory usage or platform-specific rendering. Native device/simulator visual confirmation remains required before submission to the App Store.

Logs: `tests-1.11.5.txt`, `typecheck-1.11.5.txt`, `ios-export-1.11.5.txt`, `export-integrity-1.11.5.txt`. Preview: `clean-preview-1.11.5.mp4`, `clean-contact-1.11.5.jpg`.
