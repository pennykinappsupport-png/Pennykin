# Pennykin 1.9.9 — Bouncy Feed Sequence

App 1.9.9, iOS build 38, Android versionCode 38.

Feed previously entered the extended-paw pose immediately and used a uniformly timed bowl translation. It now has an anticipation beat before reaching, actual underdamped native springs, and a distinct grooming finale. Special Treat shares the same sequence.

- **0–380ms: anticipation.** Keep the original standing body. Look toward the bowl with warm eye glints and one scripted eye-only blink (approximately 114–228ms). Squash the body vertically by 9%, with slight horizontal expansion, anchored near the feet; hold briefly before releasing.
- **380–800ms: reach and take.** Switch to the reaching pose and spring out of the crouch. Let the extended paw meet the bowl before pulling it inward from 520ms. The bowl's appearance and travel both overshoot and settle with native Animated.spring, using stiffness/damping/mass tuning rather than uniform visible motion.
- **800–1400ms: eat.** Use the happy, lowered-head bowl pose with four quick eased chew/body pulses. Fade the traveling bowl at the handoff so there is only one bowl while eating.
- **1400–1900ms: satisfied grooming.** Show a new closed-eye paw-lick pose and two gently eased grooming bobs. Retain the pose until the 2-second action finishes.

The linear progress value is only a monotonic stage clock. Visible body recoil and bowl motion use physical springs; chew and grooming strokes use cubic/quadratic easing. Body squash does not deform the separate traveling bowl.

Keep all decoded poses mounted and select only one visible body, without full-body opacity fades or per-action remounts. Stop and reset the new springs at action transitions, failure cancellation, backgrounding and unmount. Missing licking artwork falls back to the existing satisfied pose; missing care art retains the standing pet and bowl. Existing Clean particles, idle ear movement and tap/action-priority behavior are preserved.

The new paw-lick pose and eye glints target Pip the cat. Dog and rabbit retain their existing care art and receive the shared prep/bowl springs and fast chew rhythm.

## New generated artwork

Final asset: `assets/animation/cat-paw-lick.png`.
Exact generation prompt: `assets/animation/cat-paw-lick-prompt.txt`.
Method: built-in image_gen; the existing `assets/pets/cat.png` is the character/style reference; genuine transparent background requested. Generated RGBA bytes are copied unchanged and displayed with contain sizing. No background-removal or raster post-editing was applied.

## Validation

TypeScript type checking, all 35 unit tests, iOS Expo bundle export, and ZIP integrity checked before delivery. Regression coverage includes anticipation/phase boundaries, missing lick-art fallback, underdamped spring tuning, rapid taps and care/reward priorities. Inspected a rendered phase preview for crouch/rebound, eye-only blink/glints, bowl handoff and grooming alignment. The preview's simulated spring positions approximate native physics and are not device captures.

Native simulator/device playback and native Xcode compilation are not verified in this environment. On-device frame timing, overshoot and pose handoff still require playback verification.
