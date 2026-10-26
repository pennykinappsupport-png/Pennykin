# Pennykin 1.10.3 — Rest lifecycle and gentle wake-up

App version 1.10.3; iOS build 42; Android versionCode 42. Based on 1.10.2.

## Rest behavior

- `Rest_Enter` lasts 1 second: rub eyes, yawn, settle down. Speech: “So sleepy… just a little yawn.”
- `Rest_Loop` breathes and floats an independent Zzz layer for up to 30 seconds of foreground time.
- A single touch is resolved after the inclusive 300ms double-tap window. It gently shakes Zzz and requests a Light haptic; it does not jump, speak over the nap or wake the pet.
- A second touch within 300ms starts `Rest_Exit`, with a quiet synthesized meow. A visible Wake button provides an alternative to double-tapping.
- `Rest_Exit` lasts 1 second: open eyes, sit up, stretch and settle back to the normal pet image. Zzz fades out in 200ms; recovery particles fade away by the end.
- Enter/Exit lock the care buttons and pet hitbox. Sleep allows Feed, Play, Clean, Vet and Special treat; the first accepted action waits until the full wake-up has finished. Repeated inputs during waking cannot replace or duplicate it.
- Repeated Rest is disabled during a nap. Tap responses cannot accumulate in the queue while resting.
- The existing long-absence/check-in sleep remains separate. Double-tap is available only during a user-started Rest_Loop.

## State machine and graphics

The existing `petAnimationReducer` remains the single animation owner; no second Rest state machine or independent action timer was introduced. Its starting/playing/finishing phases expose the named Rest substates. Rest timeouts pause in the background and continue on return; pending tap windows are invalidated on backgrounding. Leaving Home cancels the local animation and pending handoff.

Controller interface in `usePetAnimationMachine`: `isResting`, `setIsResting(bool)`, `triggerYawn()`, `triggerWakeUp()`, plus `restStage` and `restControls`. These are the native React Native Animated implementation of the requested FSM interface. This version does not include a Rive `.riv` file or a Lottie JSON animation.

New cat poses use `assets/animation/cat-rest-atlas.png`. Decoded image layers remain mounted. SVG cell clips, alignment offsets and short controlled blends connect the poses; body compression/extension and breathing provide motion between them. Dog/rabbit use their existing closed-eye/base/rest images with the same timing and transforms. They do not have newly painted rubbing/yawning/stretching poses.

Rest stats are applied once on entering wake-up using the existing Rest reward values. Chained action costs apply only when that action starts. A serialized care-write queue prevents a slow Rest read/modify/write from overwriting the next action's data. Cancelling an uncompleted nap by leaving Home does not award Rest stats. Scoped cancellation prevents a delayed failed write from cancelling a newer action.

## New assets

- `assets/animation/cat-rest-atlas.png`: four generated poses, built-in ImageGen. Creation and correction prompts: `assets/animation/cat-rest-atlas.prompt.txt`.
- `assets/audio/rest-wake.wav`: original synthesized 0.56-second soft meow, mono PCM, 22,050Hz. No external audio recording; generation script is in `scripts/create_rest_wake_sound.py`.
- `expo-haptics` ~57.0.3: Light impact feedback. Audio respects silent mode and does not request recording or background playback. Haptics gracefully tolerate unavailable hardware.

## Update and check on your Mac

From the extracted project folder:

```sh
npm install
npx expo run:ios
```

Rebuild the native app after adding expo-haptics. If maintaining a checked-in native iOS project, update its CocoaPods dependencies as well.

Test on a real device: Rest → lone tap; Rest → two taps within 300ms; taps more than 300ms apart; sleeping → Feed/Play/Clean/Vet; repeated presses during entering/exiting; automatic wake after 30s; background/foreground during every phase; leaving Home mid-nap; switching pet type; muted sound; reduced/no haptic hardware. Confirm no residual Zzz, toy, face overlay, duplicate reward or blank pet frame.

## Verification

67 unit tests pass, including 15 new Rest/gesture/chain/mutation tests. TypeScript check and iOS Expo bundle export pass. The new atlas's transparent gutters and pose alignment were visually inspected. ZIP integrity and versions were verified.

Native Xcode compilation, actual touch timing, haptic feedback, sound quality and animation frame rate have not been verified on a simulator or physical device in this environment. Expo export is a JavaScript/assets check, not a native iOS build.
