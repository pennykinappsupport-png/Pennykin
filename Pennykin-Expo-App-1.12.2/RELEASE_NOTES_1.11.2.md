# Pennykin 1.11.2 — Clean Sprite Animation

Clean now plays twelve illustrated frames for each of the cat, dog and rabbit:
enter the tub, bubble hat and scrub, rinse and shake off water, then towel,
hair dryer and fluffy stars. Three transparent 2048×1536 PNG atlases use fixed
512×512 cells. The tub is aligned identically in every bath frame.

One native animation clock controls the resident frame views and dialogue.
Playback waits for all thirteen image views (idle plus twelve frames) to load,
pauses with the app, resumes from the same position, cancels safely, and
finishes the Home action once after returning to the ordinary pet image.
The old looping bath overlays and body wobble no longer run during Clean.

The sleeping-dog visibility/proportion fixes and static Choose a Pet
selection behavior from previous versions remain included.

Art source delivery: `Pennykin-Clean-Sprites-v1.11.2.zip`, with 36 individual
RGBA PNGs, three PNG atlases, three layered OpenRaster sources, editable SVG
effects, original painted sheets, GIF previews, anchors and export scripts.

Validation:
- TypeScript check passed.
- 102 tests passed, including native Clean clock pause/resume, cancellation,
  completion, decoded image readiness and rendered atlas crop/opacity checks.
- 36 transparent frames, atlas cells and three ORA layer reconstructions verified.
- Expo iOS Metro/Hermes export passed; includes all three Clean atlases.
- Signed native IPA and iPhone/simulator visual testing are not performed:
  this Linux environment has no Xcode or iOS signing setup.

App/package/UI version: 1.11.2. iOS build 50; Android versionCode 50.
