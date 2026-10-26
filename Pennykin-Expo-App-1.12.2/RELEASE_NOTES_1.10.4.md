# Pennykin 1.10.4 — Dog and Rabbit Feed (build 43)

## Changes

- Dog and rabbit now each use their own full-body receive, eat, satisfied, face-wipe and paw-lick artwork. Their original fur colors, ears, collars and medallions are retained.
- Feed keeps the existing two-second timeline: anticipation and blink, squash preparation, springy reach, four quick chews, a brief satisfied empty-bowl pose, then paw licking with damped rocking.
- Eye highlights are positioned for each species. The rabbit's incoming bowl matches the vegetables in its eating pose.
- The independent bowl is hidden in the same render that selects the eating/satisfied/lick pose, so it cannot duplicate the illustrated bowl.
- The screenshot's face-wipe pose is also connected to the bounded Clean wiping stage, with the existing bubble particles. Feed never borrows the bath sponge pose.
- All five dog/rabbit images remain mounted. The base pet and legacy face patches are hidden only after the new poses are decoded; load failure retains the original artwork. Returning to idle clears the action pose.

## Assets and generation

Created with the built-in image_gen tool using each original pet as an identity reference and the cat care atlas as a pose reference. The exact prompts are in `assets/animation/dog-care.prompt.txt` and `assets/animation/rabbit-care.prompt.txt`.

Original generated sheets: `assets/animation/dog-care-source.png` and `assets/animation/rabbit-care-source.png`.

Runtime sprites: `assets/animation/{dog,rabbit}-care-{receive,eat,satisfied,wipe,lick}.png`. Each is a transparent 600x640 PNG, isolated from the generated sheet and aligned to the existing pet's height and feet baseline. `docs/dog-rabbit-care-poses.jpg` previews the ten poses.

## Validation

- TypeScript check passed.
- All 71 tests passed, including pose cleanup, unloaded-art fallback, Feed/Clean separation, duplicate-bowl prevention, and the existing Rest/Play regressions.
- iOS Expo export and archive integrity checked before delivery.
- Native iOS build, simulator playback and physical-device smoothness remain unverified in this environment.

## Run

```bash
npm install
npx expo run:ios
```

No new dependencies in this version. The package includes the existing audio and haptics dependencies from previous versions.
