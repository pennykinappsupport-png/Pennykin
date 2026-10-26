# Pennykin 1.10.2 — Single Toy & Gentle Play Recovery

App 1.10.2, iOS build 41, Android versionCode 41.

## Reported problem and resulting behavior

The user reported an extra star flashing/remaining near the lower right at the
end of Play, and a hard switch into/out of the static grab pose. The previous
renderer combined a separate flying prop with poses containing a baked-in
star. Its visibility depended on React catch flags and asset readiness, and
the final held pose was explicitly retained at progress=1 until the owner ended.

Play now has one star throughout the story. New poses contain no toy pixels;
the legacy grab image is no longer mounted by PetAvatar or selected by
selectPetFrame. The single prop uses a native-driven bounded opacity path:
visible during flight/hold, fading on release and always zero from 2140ms.
Native completion explicitly clears the terminal pose and removes temporary
toy, particle and foreground-paw elements, even while the state-machine owner
is finishing. New action IDs reset the clock/snapshot before showing the scene;
old listeners/completions cannot update another action's scope.

## Compact action story

| Timeline | Behavior |
| --- | --- |
| 0–300ms | Plush flies in on a gravity arc; slow body squash and anticipation begin before the action pose is shown. |
| 300–700ms | Forward/upward pounce, body stretch, contact with the toy at 540ms and continuous landing. |
| 700–900ms | Soft impact compression, spring overshoot and rebound. |
| 900–1580ms | Hug/rocking, happy mouth expression and staggered sparkling particles. |
| 1580–1880ms | Release pose lowers the toy and begins rolling it out while paws uncurl. |
| 1880–2200ms | Empty-handed recovery pose; toy fades out completely by 2140ms. |
| 2200–2400ms | Original idle artwork settles at the original position; no temporary star remains. |

The owner holds the action for 2600ms, including its state-machine phases.
Compared with 1.10.1, the five-second story is tightened to the requested
two-to-three-second range. The earlier two floor bounces/chase sequence is
replaced by direct flight/pounce to match the user's revised choreography.
Six resident pose frames and continuous body/prop transforms provide the
action and recovery; there is no full-body crossfade, per-action image remount
or independent second Play motion loop. Foreground paw cutouts place the one
star between the paws without displaying a second full pet body.

The bubble shares the same native animation clock. It stays hidden for the
first 200ms, then eases/populates with a small overshoot; dialogue changes also
follow their corresponding action milestone by 200ms. Backgrounding preserves
the clock position, returning resumes, and cancellation/navigation removes its
listeners/animation. Taps during Play can defer a hello but add no extra bounce.

No changes to game costs, financial records, rewards or room decorations. The
new poses target Pip the cat; dog/rabbit retain their original base artwork with
the common body rig, single prop and cleanup behavior. No new native dependency.

## Assets and exact prompt

- Final saved asset: `assets/animation/cat-play-clean-atlas.png`, transparent
  RGBA, 1536×1024, six cells in three columns/two rows.
- Exact prompt: `assets/animation/cat-play-clean-atlas.prompt.txt`.
- Method: built-in image_gen, using the existing cat Play atlas and original
  `assets/pets/cat.png` as pose/identity references. No raster post-editing.
- SVG cell gutters, per-frame offsets and a shared viewport align the foot
  baseline and prevent neighboring cell art from showing. The atlas is warmed
  with room artwork and decoded views remain mounted.

## Validation and remaining limits

TypeScript checking and all 52 unit tests passed. Play regressions cover the
short timeline, continuous toy/contact/retirement paths, bounded end opacity,
missing-art fallback, terminal empty hands, no forced held-pose resurrection,
continuous impact, delayed speech and native path endpoints. Pet frame tests
also reject legacy embedded-star art under stale catch flags and rapid action
transitions. A nine-stage rendered preview using actual artwork and production
trajectory functions was visually inspected, including terminal/after-end
frames. iOS Expo bundle export, version configuration and ZIP integrity passed.

Live native simulator/device playback, perceived pose smoothness and Xcode
compilation are not verified here. Unit tests, the static preview and Expo export
do not replace that testing.
