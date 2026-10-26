# 1.10.8 · Native Feed crossfade

Feed images now use separate, resident `Animated.View` layers whose opacity is directly animated with `Animated.timing`, `useNativeDriver: true` and a 300ms duration. They no longer depend on sampled opacity interpolation or a boolean container visibility switch. Both outgoing and incoming images remain mounted throughout each fade, including Idle → Receive and Lick → Idle.

- Food arrival begins at 200ms; the first posture fade begins at 350ms; the bubble starts at 450ms, exactly 100ms later.
- Pickup feedback rises to scale 1.05 over 70ms and returns with `Animated.spring`.
- The timeline waits for load events from the actual Feed image views. The Home animation state is completed by the native animation callback, rather than a fixed timer that can cut off the last fade.
- All five image changes receive 300ms, so visual playback now lasts 2.2 seconds. The existing 220ms Finishing phase follows the completed visual playback.
- Background pause retains the current image opacities and resumes their remaining durations. Cancellation fades the resident Feed container out over 300ms.
- The independent bowl still retires at 800ms and cannot reappear after eating.

## Validation

`npm run typecheck` passed; all 86 tests passed; the iOS Expo export passed. New rendering regressions execute the production `FeedArt` JSX and `useFeedMotion` hook with a deterministic native-animation adapter. They verify the rendered opacity bindings, 50/50 overlap at 150ms, complete 300ms fades, the 100ms bubble offset, native spring configuration, completion ordering, interruption, and pause/resume.

These checks do not replace playback on a physical iPhone or iOS simulator. Neither was available in the editing environment.

Version: 1.10.8 · iOS build 47 · Android versionCode 47.


## Dog / Rabbit Play choreography update

Added six empty-handed poses per species, a two-bounce star ball, two-step chase, anticipation wiggle, stretched pounce, damped landing, hug, front-facing cheer and star feedback. Pose transitions use 260ms crossfades and share the native Play clock. See PLAY_UPDATE.md and PLAY_PREVIEW.gif.


## Pet selection tap update

In onboarding and Settings > Choose a pet, taps select the animal card without triggering the inner PetAvatar tap-lift or tilt animation. The selection card owns touch and accessibility. Normal idle motion is retained. TypeScript validation passed.
