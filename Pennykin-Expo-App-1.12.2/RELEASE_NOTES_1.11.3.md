# Pennykin 1.11.3 — Clean In-betweens and Continuous Effects

Clean previously baked the bath and dryer into full-frame images. An alpha
dissolve alone could not show a pet stepping out or a dryer entering, and the
old delivered GIF did not reproduce the runtime fades.

Each pet now has sixteen painted poses, with four consecutive exit poses:
stand at the rim, reach over, step out, and cushion the landing. Independent
bath layers remain visible through the landing, then slide/fade out over
1070 ms. A dryer attached to a visible floor stand slides in over 630 ms,
with continuously moving wind ribbons and seven air particles during drying.

- 320 ms character crossfades; stable native nodes and resident sources.
- One 9800 ms native timeline for character, tub, towel, dryer and particles.
- Exit forepaws cross above the tub rim using a small clipped duplicate of
  the same pose, body transform and alpha; no full extra body is drawn.
- 48 aligned 768px character PNGs; transparent safety padding and idle-matched
  scale/offsets prevent handoff growth and clipped ears/tails.
- Small static Choose a Pet avatars do not mount the larger Clean textures.
- Background pause/resume, cancellation, complete source readiness and one
  manual completion callback remain supported.
- Previous sleeping-dog and pet-selection fixes remain included.

Validation: 106 tests, TypeScript, source PNG/ORA checks and iOS Metro/Hermes
export passed. The accompanying 25 fps preview uses production JSX opacity
and transforms. It is not a native iOS recording. Signed IPA/device visual
and memory verification remain pending in a macOS/Xcode or EAS environment.

Version 1.11.3; iOS build 51, Android versionCode 51.
