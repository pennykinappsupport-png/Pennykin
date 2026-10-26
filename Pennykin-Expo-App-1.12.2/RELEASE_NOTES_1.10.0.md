# Pennykin 1.10.0 — Gentle Vet Visit & Feed Rhythm

App 1.10.0, iOS build 39, Android versionCode 39.

## Vet

Vet previously only reused the worried visual state for 3.4 seconds. It now uses its own interactive clinic visit in the existing room:

1. A cream-and-mint exam cushion, small cabinet and medical kit slide/fade into the room. Cat-specific resident poses show drooping ears, worried eyes and a tucked posture, with a small sweat drop and gentle subpixel shivers.
2. The stethoscope moves toward the chest for a one-second automatic check. A short, softly synthesized two-note cue plays once when the check finishes. It respects silent mode, mixes with other audio and stops on backgrounding or exit.
3. Tap **Apply comfort patch · 20 pet coins**. A heart-pattern patch moves onto the front leg. The original Vet game action (20 coins, +35 health, +5 XP and its other existing effects) is applied once at this step. No game cost applies just for checking or exiting before treatment. Duplicate presses are locked synchronously before the database operation. Failure returns to the treatment step for retry.
4. After patch placement, tap the pet or **Pet [name]**. A relaxed smile, soft bounce and heart respond to reassurance. The temporary clinic then fades away and the normal room returns.

The animation machine supports manually completed playing phases. It holds the visit while waiting for treatment/soothing; queued important rewards continue after finishing or cancellation. Visit IDs reject stale completions. Stage timers preserve remaining delays across background/foreground transitions and are removed on navigation/unmount. Treatment buttons cannot bypass checking, and soothing cannot precede a successful treatment.

The two new emotion poses target the cat. Dog and rabbit retain their existing body artwork while sharing the clinic, tools, patch, gentle shiver and comfort feedback. No drag interaction is added; examination is automatic and treatment/comfort use taps.

## Feed

Within the existing two-second action:

- 0–480ms: slower anticipation and crouch, with 340ms cubic easing into the squash and a short hold.
- 480–820ms: spring release; the bowl meets the extended paw before a brisk pull inward from 600ms.
- 820–1320ms: four quick chew pulses (40ms down, 10ms hold, 55ms up, 15ms rest each), safely ending before grooming.
- From 1320ms: a deliberate licking bob followed by a shorter return stroke and an underdamped spring tail. The final movement loses energy gradually instead of repeating at a uniform speed.

Keep original anti-flash behavior: resident poses, one visible body, scoped facial flags, no whole-pet fades, and cleanup at action transitions.

## Assets and sound

- `assets/animation/cat-vet-atlas.png`: original transparent two-cell RGBA output from the built-in image_gen tool, with `assets/pets/cat.png` as the character reference. No raster post-editing. SVG offsets align the foot baseline and position.
- `assets/animation/cat-vet-prompt.txt`: exact generation prompt.
- `assets/audio/vet-check.wav`: original synthesized 0.45-second mono PCM cue, two 660Hz notes with soft envelopes; no external copyrighted sound recording.
- Clinic furniture and tools use project-native SVG components.

`expo-audio` is newly added for playback. Its config disables microphone permission, Android recording, and background playback. Updating an older native app requires installing dependencies and rebuilding; hot reload alone does not install new native modules. See README for commands.

## Validation and limits

45 unit tests, TypeScript checking, native config introspection, iOS Expo bundle export and ZIP integrity validated before delivery. The tests cover manual animation completion, paused completion, queued rewards, stage ordering, repeated treatment presses, failure/retry, stale visit IDs, missing artwork, facial-state isolation and Feed rhythm timing. Inspected a rendered clinic layout preview using the actual SVG furniture/tools and both emotion poses; adjusted the stethoscope to keep the eyes unobstructed.

Native Xcode compilation, simulator/device interaction, animation frame timing and audible playback are not verified in this environment. Expo bundle export and the rendered illustration preview are not substitutes for that testing.
