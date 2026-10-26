# Pennykin 1.11.4 — SDK Compatibility and Clean Verification

A fresh-install verification of the delivered 1.11.3 source exposed Expo SDK patch mismatches. This release aligns Expo to 57.0.27, expo-sqlite to 57.0.4 and React Native to 0.86.3, and updates the lockfile. Native builds must be rebuilt after upgrading.

Clean retains the sixteen painted poses per pet, 320 ms character crossfades, independent bath exit, supported dryer entrance and continuous wind from 1.11.3. No care reward/cost or artwork changes were made.

Fresh npm ci, online Expo compatibility validation, TypeScript, all 106 tests and a clean-cache iOS Metro/Hermes export passed. All 128 exported PNGs were decoded; the sixty Clean PNGs match the art source and exported assets. The generated Hermes bytecode was successfully parsed by hermesc.

Delivery includes the application source ZIP and a separate iOS export resource ZIP. The latter is not a signed IPA. Native device/simulator compilation and visual/memory validation remain pending in a macOS/Xcode or configured EAS environment.

App version 1.11.4; iOS build 52; Android versionCode 52. See docs/VALIDATION-v1.11.4.md and its logs.
