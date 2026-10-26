# Pennykin 1.10.1 — Bouncy Play Story

App 1.10.1, iOS build 40, Android versionCode 40.

## Play behavior

The former 1.25-second body motion and one static grab pose are replaced with
one automatic five-second miniature story, held for 5.4 seconds by the existing
animation state machine:

| Time | Motion |
| --- | --- |
| 0–680ms | Golden star plush enters from the lower left along a gravity parabola. Horizontal speed decreases during flight. |
| 680–1220ms | Two floor bounces with successively lower heights and shorter duration. |
| 1000–1640ms | Cat crouches with attentive large pupils, squashes slowly and wiggles its hindquarters twice. |
| 1640–2000ms | Elastic release into two small chase hops to the right. |
| 2000–2660ms | Paw flick lifts the toy toward the extended paws; the cat jumps on a curved trajectory, stretches, catches at 2340ms, then lands. |
| 2660–3000ms | Impact squash and a damped spring overshoot/rebound. |
| 3000–4200ms | Holds the star plush, rocks happily with an open-mouth meow expression, and flashes four small stars. |
| 4200–5000ms | Slower settle back to the starting location, holding the plush until the owner returns to idle. |

Toy/body trajectories, pose changes and dialogue use the same native-driven
clock. It preserves progress on pause, and cancels listeners/animation when
the action changes or Home unmounts. Background time does not advance the story.
The old Play body loop is removed. Pet taps during Play can defer a hello through
the existing machine, but do not add an immediate second bounce on top of the
story. Duplicate care buttons remain locked and important rewards still queue.

The four cat pose views are resident and exclusively selected, with no full-body
crossfade or per-action remount. The free toy disappears in the same React
snapshot that selects the held-toy pose. Missing new artwork preserves the base
or existing grab image. Dog/rabbit use the new common motion/toy story and retain
their original grab artwork; the four new illustrated poses are cat-specific.

## English dialogue

1. “Wow! Is that new toy for me?”
2. “Caught it! Behold my mighty kitty paws~”
3. “That was so much fun—I'm buzzing with excitement!”
4. “Phew… a little tired, but I still want to play!”

The excitement line avoids promising a full Energy meter: the existing Play
action still costs one care energy, increases Happiness by 15, decreases Energy
by 12 and applies its existing hunger/XP effects. This release changes no costs
or reward calculations. The database success message no longer replaces Play
dialogue before the visible story has progressed. The finale is visual; no new
meow audio is added.

## Artwork and prompts

- Final saved asset: `assets/animation/cat-play-atlas.png`, transparent 1254×1254
  RGBA, four 627px cells. Generated with the built-in image_gen tool, using the
  original `assets/pets/cat.png` and `assets/animation/cat-play-grab.png` as identity
  and toy references. A second built-in edit adds clean gutters between cells.
- Exact initial prompt: `assets/animation/cat-play-atlas.prompt.txt`.
- Exact final layout edit prompt: `assets/animation/cat-play-atlas-padding.prompt.txt`.
- No raster post-editing. The common SVG viewport `75 36 530 552` removes safety
  gutters and aligns the artwork with the resident original pet.

## Validation and limits

51 unit tests passed, including six new Play tests for gravity curves, two
decaying bounces, continuous floor/hand transitions, chase steps, anticipation,
stretch/squash/rebound, asset fallback, phase dialogue and bounded native paths.
TypeScript checking, iOS Expo bundle export and ZIP integrity passed. A six-frame
rendered preview using actual project artwork and production motion functions
was visually inspected; a contaminated first atlas layout was replaced.

Native Xcode compilation, live simulator/device playback and actual frame timing
are not verified here. The static preview and Expo export do not substitute for
those checks. No new native dependency was added in this release.
