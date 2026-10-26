# Dog & Rabbit Play update — v1.10.8

## Changed behavior

Tap Play once to watch one 4.8-second story. The star-pattern ball flies from outside the scene with a gravity arc and slowing horizontal travel. It makes two diminishing floor bounces. The pet takes two running steps, crouches and wiggles, pounces with stretch, catches the ball, lands with compression and damped rebound, hugs it, gently lowers and rolls it away, then cheers toward the viewer with twinkling stars. The rig settles back to idle before the 5.1-second owner request ends.

Both species now have six new empty-handed action poses matching the existing pet artwork. Every pose, including entry and return to idle, uses a 260ms crossfade. The incoming ball is a single runtime SVG prop. Forepaw-only cutouts render in front of it during the hug. Dog and rabbit hand positions are calibrated independently. The original cat Play timeline remains unchanged.

A single native animation clock owns body motion, resident image blending, ball motion, paws, stars, and speech. Normal breathing is suppressed during Play. Pause freezes the story and resume continues its remaining duration. Completion and cancellation clear transient art and props; repeated action requests remain governed by the existing animation machine.

## Files to review

- src/animalPlayChoreography.ts — physics, poses, messages, and native samples
- src/components/AnimalPlayArt.tsx — persistent crossfade layers and foreground paws
- src/components/AnimalPlayEffects.tsx — the single ball and star feedback
- src/components/PetAvatar.tsx — dog/rabbit scene integration
- src/components/usePlayMotion.ts — species clock selection and rig transforms
- src/components/RoomScene.tsx — species-aware speech timing
- src/screens/HomeScreen.tsx and PetScreen.tsx — species-aware Play duration
- src/petImages.ts and assets/animation/play/ — six poses per species
- tests/animalPlayChoreography.test.ts and playRendering.test.cjs — motion/contact/blending/lifecycle regression coverage

## Validation

- npm run typecheck: passed
- npm test: 93 passed, 0 failed (including existing Feed/Rest/cat regression checks)
- CI=1 npx expo export --platform ios --output-dir .validation-ios: exported successfully, including all twelve new sprites
- The archive excludes node_modules, test output, and validation bundles.

PLAY_PREVIEW.gif is a composited choreography preview generated from the production motion samples and sprites, not an iOS simulator recording. It illustrates the sequence; exact phone rendering still needs an Expo/iOS device check.

## Try it

Unzip, open a terminal in Pennykin-Expo-App, run npm install, then npx expo start -c. Select the dog, unlock care with today's check-in, and tap Play. Repeat with the rabbit. Check pause/resume by backgrounding the app, and verify that the ball disappears before the scene returns to idle.
