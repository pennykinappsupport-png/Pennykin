# Pennykin 1.10.7 — 250ms Idle/Feed fades and 5% pickup spring (build 46)

- Idle -> Feed now blends from 350 to 600ms: a complete 250ms crossfade. Feed -> Idle blends from 1650 to 1900ms, also a complete 250ms crossfade. The action completes after the return blend has finished.
- Other Feed pose transitions retain their shorter 150ms timing. Transition durations are stored individually so extending the Idle blends cannot overlap an eating/satisfaction transition or cut it short.
- Native-driven opacity is applied directly to the base/dog/rabbit/lick Animated.Image views. Cat atlas frames remain inside explicit, non-collapsible Animated.View containers. The resident images keep stable keys throughout the sequence.
- Entering Feed adds a small uniform scale pulse: 1.0 -> 1.05 over 70ms, followed by a gently underdamped spring return to 1.0. This is layered over the existing body motion and uses the same pause-preserving clock, so it cannot replay on foreground resume or retain its scale after completion.
- Bowl ownership and cleanup, delayed speech, previous crown correction and other pet actions remain included.

## Validation

- TypeScript check and all 82 tests passed. New regressions verify 250ms entry/exit, both images at 50% opacity halfway through, nonoverlapping transitions, bounded 1.05 scale and return to neutral scale.
- iOS Expo export, complete PNG decoding and ZIP integrity checked before delivery.
- `docs/feed-250ms-frames.jpg` shows start/midpoint/end weights for entry and return using the existing dog sprites. It is an illustrative opacity preview, not a simulator screenshot. GIFs from preceding releases are retained as historical previews.
- Native iOS build and simulator/physical-device playback remain unverified in this environment.

No new image assets or dependencies were required.

```bash
npm install
npx expo run:ios
```
