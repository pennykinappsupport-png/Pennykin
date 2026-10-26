# Pennykin 1.10.5 — Springy Feed and bowl cleanup (build 44)

## Dog and rabbit Feed

- An expectation beat with eye highlights and a blink precedes reaching. The body slowly compresses downward by about 14%, holds briefly, then releases with an underdamped spring and visible overshoot.
- The bowl bounces into place; the pet springs toward it, then performs four fast eating dips.
- The empty-bowl satisfaction pose appears briefly, followed by paw licking with progressively smaller recoil. The pet returns to its empty-handed base pose before the two-second care action ends.
- One pause-preserving Feed clock controls body motion, selected pose and prop visibility. Native motion samples use analytic underdamped spring curves; the clock is linear, but visible movement uses varying speeds, overshoot and damping.

## Duplicate bowl fix

- The independent bowl fades out between 720 and 800ms, before the illustrated eating pose at 820ms. Its opacity remains zero for the rest of the animation, even if a JS pose update arrives late or art is unavailable.
- After retirement the independent dog/rabbit bowl View is removed from the rendered tree.
- Static visibility is applied to a separate plain View. The native-driven Animated.View opacity is never replaced by a fixed opacity value on the same View.
- Completing the timeline explicitly clears the Feed pose and bowl. A delayed parent action cleanup cannot leave either visible. New action IDs reset the clock and pose together; resuming from the background continues at the saved point instead of spawning the bowl again.
- The cat's existing Feed timing remains, with the same separation of static prop visibility and native opacity.

## Files

- `src/feedChoreography.ts`: shared snapshots and native spring-motion samples.
- `src/components/useFeedMotion.ts`: scoped, pause-preserving clock with completion cleanup.
- `src/components/PetAvatar.tsx`: species-specific Feed integration and prop ownership.
- `tests/feedChoreography.test.ts`: phase ordering, squash/overshoot, four chews, damping, bowl retirement and cleanup regressions.
- `docs/dog-rabbit-feed-motion.gif`: an illustrative motion preview rendered from the same runtime curve samples and existing sprites. It is not a simulator recording; it omits facial patches, glow and ambient room breathing.

No new image generation or dependencies in this release. The existing dog/rabbit sprite assets and their generation prompts remain included.

## Validation

- All 77 tests and TypeScript check passed.
- iOS Expo export, complete PNG decoding and ZIP integrity checked before delivery.
- Native iOS build, simulator playback and physical-device smoothness remain unverified in this environment.

## Run

```bash
npm install
npx expo run:ios
```
