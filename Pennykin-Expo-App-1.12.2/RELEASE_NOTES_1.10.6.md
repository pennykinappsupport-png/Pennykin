# Pennykin 1.10.6 — Staggered Feed crossfades and clean crown (build 45)

## Feed for cat, dog and rabbit

- Food begins sliding in at 200ms. The first picture crossfade begins at 350ms. Speech begins appearing at 500ms. Each beat is offset by 150ms.
- Every pose transition uses a 150ms smooth crossfade: base -> reach -> eat -> satisfaction -> lick -> base. All layers remain mounted and use native-driven opacity, with at most two adjacent layers participating in any transition.
- Body springs, food motion, picture weights and speech share the same pause-preserving native clock. The cat now uses that same Feed controller too.
- The bubble gently fades in and overshoots to its final scale. Its Feed controller is separate from the idle/Play bubble controller to avoid stale native opacity after changing actions.
- The independent bowl fades out before the eating image begins appearing, then its View is removed. Native opacity remains zero after retirement, so delayed React updates cannot bring it back.
- The final crossfade returns to the empty-handed base pose by 1900ms, before the care action completes.

## Crown

- `assets/items/gold_crown.png` has been re-cut using the built-in image_gen editing tool. The bottom black bar and detached gold fragment were removed, retaining the five-point gold crown and purple paw jewel.
- The edited subject is aligned back to the existing 256x256 runtime canvas. All pixels below y=200 are fully transparent, so the defect is removed in the shop thumbnail and equipped pet view.
- Original tool output and exact editing prompt are included as `assets/items/gold_crown-clean-source.png` and `assets/items/gold_crown-clean.prompt.txt`.
- `docs/crown-cleanup.jpg` shows the before/after transparency check.

## Validation and preview

- All 80 tests passed, including 150ms beat spacing, continuous crossfade boundaries, opacity conservation, bowl retirement and completion cleanup.
- TypeScript check, iOS Expo export, PNG decoding and ZIP integrity checked before delivery.
- `docs/feed-crossfade-motion.gif` illustrates the shared runtime curve and crossfade samples using all three species. It is not a simulator recording and omits room breathing and facial/glow patches.
- Native iOS build, simulator playback and physical-device smoothness remain unverified in this environment.

No new dependencies.

```bash
npm install
npx expo run:ios
```
