# Pennykin 1.9.5 — Care Animation Overlap Fix

Feed, Play and Clean could leave a previous pet pose visible alongside the next animation, including the playing pose with a sleeping Zzz marker.

- Render one visible whole-pet image at a time; eating, playing, blinking and sleeping replace the pose instead of overlapping full-body images with animated opacity.
- Preload alternate poses in an always-hidden container. Keep the standing pose when alternate art is unavailable.
- Give each animation request and visual state its own native animation subtree so old pose layers and transformations cannot persist into the next action.
- Stop composite eating and blink animations on cleanup, remove frame listeners, and prevent completed blink callbacks from restarting after unmount.
- Disable blinking during eating, playing, bathing and sleeping.
- Keep the existing animation queue, head-top speech bubble and cleaned room art.

Version: app 1.9.5, iOS build 34, Android versionCode 34.

Validation: 20 unit tests (including 5 pose regressions), TypeScript check, iOS Expo bundle export and ZIP integrity check. Native Xcode build and simulator playback are not verified in this environment.
