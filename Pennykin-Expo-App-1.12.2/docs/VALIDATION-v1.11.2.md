# Validation — 1.11.2

Date: 2026-10-06. Runtime: Linux, Expo 57.0.9 / React Native 0.86.2.

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 102 tests, 0 failures |
| Clean timeline / actual native hook | PASS — 12 poses, single clock, pause/resume, cancellation, one completion |
| Clean production JSX | PASS — correct species source/cell offsets, all 13 loads required, mounted frame weights |
| Previous dog sleep regression | PASS — installed RN parser and visible dog pixel bounds |
| PNG / OpenRaster validation | PASS — 36 RGBA frames, 3 atlases, reconstructed layers match PNG, fixed bathtub bytes |
| `CI=1 npx expo export --platform ios --output-dir .validation-ios-1.11.2` | PASS — 878 modules, all 3 Clean atlases and iOS Hermes bundle exported |
| Xcode archive / signed IPA | NOT RUN — Linux host has no Xcode or signing credentials |
| Actual iPhone / iOS simulator visual and memory check | NOT RUN |

The export verifies JavaScript compilation and local asset resolution for iOS.
It does not compile Objective-C/Swift, resolve CocoaPods, sign the application,
or constitute an installable IPA. The change adds no native dependencies.

For a native simulator build, use a Mac with Xcode, install dependencies and
run `npx expo run:ios`. For device/TestFlight distribution, archive with Xcode
or configure EAS Build and Apple signing credentials. Confirm Clean visually
on a device before distributing the build.

Source logs: `typecheck-log.txt`, `test-log.txt`, `ios-export-log.txt` in this
documentation folder. The large intermediate export and node_modules are
excluded from the deliverable ZIP; reproduce with the commands above.
