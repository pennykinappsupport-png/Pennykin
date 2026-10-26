# Validation — 1.11.4

Date: 2026-10-06 (America/New_York). Linux host. App 1.11.4 / iOS build 52 / Android versionCode 52.

The previous 1.11.3 application and art ZIPs were extracted into a separate directory. Both archive CRCs, all packaged PNGs, safe extraction paths, application versions and root lockfile dependency declarations passed. No dependency symlink from the original workspace was reused.

The first fresh installation and online Expo compatibility check exposed three patch mismatches. Expo is now 57.0.27, expo-sqlite is 57.0.4 and React Native is 0.86.3. Version 1.11.4 contains these compatibility fixes; its Clean artwork and choreography are unchanged from 1.11.3.

| Check | Result |
| --- | --- |
| Fresh npm ci using updated package-lock.json | PASS — 488 packages installed |
| Online Expo SDK dependency validation | PASS — Dependencies are up to date |
| TypeScript | PASS |
| npm test | PASS — 106 tests, zero failures/skips |
| Local static require paths | PASS — 130 referenced resources exist |
| Clean app/source asset agreement | PASS — all 60 runtime PNGs match source package byte for byte |
| Source art integrity | PASS — 48 anchors, 3 layered ORAs, all frame reconstructions and atlas cells |
| Clean behavior regressions | PASS — native clock, alpha fades, tub exit, continuous wind, pause/resume and cancellation |
| Earlier sleep and Play regressions | PASS, included in the 106 tests |
| Clean preview video | PASS — H.264, 25 fps, 246 frames, 9.84 seconds |
| Clean-cache iOS Metro/Hermes export | PASS — command exit 0 |
| Export asset integrity | PASS — all 128 PNGs decode, 130 referenced files present |
| Clean images included in export | PASS — all 60 byte-identical images present |
| Hermes executable bytecode parsing | PASS — hermesc -b -dump-bytecode exit 0 |
| Native IPA / Xcode archive / simulator / real iPhone | NOT RUN — no Xcode or Apple signing environment |

The MP4 remains an offline rendering of the production animation timeline. Native image decoding, GPU clipping/draw order, device memory and platform lifecycle behavior still require a native device check. Expo export is not a signed or directly installable IPA. A native rebuild is required because the dependency fixes include native modules.

Validation logs are included in this directory. npm emits a host proxy configuration warning and an upstream uuid deprecation warning; neither failed installation. The final online SDK check has no package compatibility warnings. Original 1.11.3 logs are retained as historical records.
