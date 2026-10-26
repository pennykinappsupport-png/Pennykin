# Pennykin 1.9.7 — Responsive Pet Taps

Tapping previously changed the native pet subtree key and reloaded all artwork. The 1.8-second tap response also blocked subsequent touches, so taps could flash or appear unresponsive.

- Keep the pet subtree keyed only by species; artwork remains mounted across tap IDs and visual-state changes.
- Reset action timelines in a layout effect and scope facial flags to the current action, preserving the animation-overlap fix without rebuilding image views.
- Give every foreground pet tap an immediate bounce/wiggle, with a larger touch target.
- Use tap priority: repeated taps replace the current hello rather than being discarded or building a queue.
- During care/reward playback, keep that action intact and retain only the newest deferred hello. Important rewards stay ahead of deferred taps.
- Care and gifts can start immediately during an ordinary tap response.
- Disable entrance motions for tap responses and remove whole-pet entrance opacity fades.
- Preserve head-top translucent speech, stable eye/mouth animation, and cleaned decor assets.

App 1.9.7, iOS build 36, Android versionCode 36.

Validation: TypeScript, 27 unit tests including rapid taps and care/reward priorities, iOS Expo bundle export, and ZIP integrity. Native simulator playback is not verified in this environment.
