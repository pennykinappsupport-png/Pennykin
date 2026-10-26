# Pennykin 1.9.8 — Lively Idle & Care Animations

App 1.9.8, iOS build 37, Android versionCode 37.

## Behavior

- Idle pets retain the existing occasional blinks and gain a small ear twitch roughly every 4.5–8.5 seconds. Ear motion stops during actions, sleep, backgrounding and unmount.
- Cat Feed runs for 2 seconds: reach for a moving bowl (0–0.61s), lower the head to eat (0.61–1.44s), then smile with the empty bowl (1.44–2s). Special Treat uses the same sequence. The bowl travels into the hands instead of appearing instantly.
- Cat Clean alternates rinsing with a closed-eye, paw-and-sponge face-wash pose and gentle rocking. Eight staggered particles rise, drift, expand and burst into short rays; water droplets and rinse streams accompany them.
- The four new cat poses share one preloaded transparent atlas. Every pose remains mounted and only one body is visible at a time. Failed or unready art retains the existing body and moving bowl.
- Dog and rabbit retain their existing care poses; both receive idle ear motion, the moving Feed bowl and the new bath particles.
- Preserve responsive tap behavior, action priorities, stable facial overlays and the existing translucent head-top speech bubble.

## Assets and image generation

Final project asset: `assets/animation/cat-care-atlas.png`.
Method: built-in image_gen image generation with the existing Pip cat artwork as the character/style reference, transparent_background=true. The generated RGBA output is copied unchanged; frames are selected by SVG clipping in code.
Layout: 1254×1254 transparent atlas; four equal 627×627 cells, ordered top-left receive, top-right eat, bottom-left satisfied, bottom-right wipe.

Prompt specification (condensed):
> Create a clean transparent 2×2 animation atlas for the same cream-and-lavender Pip kitten, matching the reference illustration, purple collar and gold medallion. Keep the character's scale, proportions, lighting and floor baseline consistent in four equal cells. Top-left: kitten extends a front paw to receive a bowl, with no bowl yet. Top-right: kitten holds a lavender food bowl with both paws and lowers its head to eat. Bottom-left: kitten holds the empty lavender bowl and gives a contented closed-eye smile. Bottom-right: kitten closes its eyes and raises a paw holding a small gold sponge against its cheek. Full character in each cell, no crop or overlap across cells, transparent background, no text, labels, borders or watermark.

## Validation

- TypeScript type checking passed.
- All 33 unit tests passed, including ordered Feed stages, bounded wipe stages, asset fallback, idle/care exclusion and the existing rapid-tap/action-priority regressions.
- Rendered SVG previews inspected for the three pets' idle ear limits and all four cat care poses. Isolated arm transforms were removed after previewing shoulder/collar seams; complete poses now move gently without cutout holes.
- iOS Expo bundle export and ZIP integrity validated before delivery.

Native simulator/device playback is not available in this environment. These checks do not establish on-device frame timing or replace a native Xcode build. Check Feed timing, bath particle layering, rapid taps, action transitions and background/foreground playback in the simulator or on a device.
