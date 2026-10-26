# Pennykin 1.9.6 — Stable Facial Animation

Blinking and chewing previously recreated a full-body image at each facial frame, causing flashes and small jumps in the pet silhouette.

- Keep the standing body continuously mounted during blinking and eating.
- Clip alternate artwork to the eyes or mouth using SVG; the body, ears and tail do not change with facial frames.
- Keep facial views mounted and toggle their static visibility, avoiding per-frame image remounts.
- Keep rest and play art resident with exclusive static visibility. Preserve action-boundary cleanup to prevent animation overlap.
- Align facial regions for cat, dog and rabbit; mouth-only rendering also excludes remnants outside the original eating artwork.
- Set speech background and tail to 78% opacity, retaining full-opacity text. Use an external triangle tail to avoid darker overlaps between transparent layers.

App 1.9.6, iOS build 35, Android versionCode 35.

Validation: 21 unit tests, TypeScript, static SVG previews for the three pets’ closed-eye and open-mouth frames, iOS Expo export, and ZIP integrity. Native simulator playback is not verified in this environment.
