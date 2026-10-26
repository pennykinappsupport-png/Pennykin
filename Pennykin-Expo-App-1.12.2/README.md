# Pennykin

Current build: **1.11.8 / build 62 — Offline privacy, support and contact links**

Privacy/support rollout: [RELEASE_NOTES_1.11.8.md](RELEASE_NOTES_1.11.8.md).

Financial architecture and verification: [RELEASE_NOTES_1.11.7.md](RELEASE_NOTES_1.11.7.md).

Rest implementation and validation: [REST_README.md](REST_README.md).

Approved dog Rest reference: [REST_DOG_README.md](REST_DOG_README.md).

Clean implementation and validation: [CLEAN_5S_README.md](CLEAN_5S_README.md).

Pennykin is a local-first mobile budget companion for first-time budgeters ages 14–22. It pairs a gentle expense tracker with a virtual pet, while deliberately rewarding honest daily check-ins instead of purchases or spending volume.

> Built by a teen, for first-time budgeters.

## Product boundaries

- Real money, fictional Pet Coins, and care energy are separate.
- One daily check-in reward comes from recording an expense or confirming a no-spend day.
- Three expense entries within the same calendar day earn the same guaranteed 10 Pet Coins plus one mystery gift, regardless of the amounts spent. Progress resets at local midnight and never carries over from yesterday.
- Financial records stay in an on-device SQLite database.
- The beta has no login, bank connection, ads, analytics, or cloud sync.
- Pennykin is educational and does not provide financial advice.

## Included in this beta

- First-time-budgeter onboarding with clear privacy promises.
- Unlimited expense entries, editing, deletion, need/want labels, and a truthful no-spend option.
- One reward per daily money check-in, special chests on streak days 7/14/21/30, and a repeating 30-day reward calendar.
- A 14-day beta tracker plus a privacy-safe native feedback summary.
- A Weekly Budget Planner with category allocations, live actuals, neutral variance labels, and visible unallocated money.
- A Safe to Spend Today amount that subtracts locally saved future expenses and divides the flexible balance across the remaining week.
- A pace-based weekly forecast that waits for enough data and always identifies itself as an estimate.
- A slimmer Home screen centered on the pet room, check-in, gift progress, and one concise Safe to Spend card.
- Finance-first Insights with non-financial beta, upgrade, profile, privacy, and deletion controls behind a secondary Settings page.
- A shorter Insights flow: Weekly Overview combines total spending, Needs/Wants, and an expandable forecast; the Planner now contains its own variance explanation.
- Savings Goal and Achievements are visible again in Insights, while Settings is limited to beta feedback, the future Pro plan, profile/privacy, and local-data deletion.
- Opportunity Cost feedback for Wants, comparing each purchase with the current Safe to Spend amount, weekly room, and savings-goal gap.
- Spending Pace analysis comparing current daily spending with a seven-day baseline and an explicitly labeled forecast.
- A Budget Flexibility indicator based on the money remaining after recorded Needs and reserved future expenses.
- A Forward-looking Reset that keeps past spending recorded while recalculating the choices still available in the remaining week.
- Accessible information buttons for Opportunity Cost, Spending Pace, Budget Flexibility, and Forward-looking Reset, with plain-language definitions, formulas, live user-number substitutions, limitations, and purpose.
- A prominent center-tab Check-in button and amount-first form for faster daily entry.
- Live Need/Want nudges that translate an entered amount into a percentage of today's Safe to Spend before saving, while keeping the wording neutral.
- Optional expense notes: category names provide a useful fallback for true quick entry.
- Full-dataset SQL reports, independent cursor-paginated entry lists, and DST-safe device-local calendar dates.
- Atomic, local SQLite check-ins: the expense, daily reward, Pet Coins, and badges commit together without a network dependency.
- High-contrast light and dark palettes for financial explanation sheets, plus scroll-safe layouts that continue to work with iOS Dynamic Type.
- Manual System, Light, and Dark appearance controls in Settings, plus a persistent Standard/Large text control that continues to respect iOS Dynamic Type.
- A room-first Home HUD with high-contrast translucent streak and coin capsules that remain readable over every wallpaper.
- Pet dialogue now floats inside the room, followed by a compact Fullness/Happiness/Energy strip and direct Feed/Play/Clean controls using the complete animated action scenes.
- The original “Your little home” title and “Built one honest money check-in at a time.” subtitle remain above the room.
- A collapsible More actions row reveals Rest, Vet, and Special Treat without crowding the three primary care actions.
- The separate Pet tab has been merged into Home, leaving a simpler four-tab navigation and returning new check-ins directly to the room celebration.
- More actions now stays at the bottom of the entire care panel, below Rest, Vet, and Special Treat when expanded.
- Tapping the room’s 😊 button opens a Shop-style bottom sheet with Fullness, Happiness, Energy, Cleanliness, Health, level, XP, and care resources.
- Home now uses one 😊 status button in the room’s upper-right corner; the former three-item strip is removed to give the pet room more space.
- The pet status sheet hugs its content and no longer leaves a tall white area below Done.
- Weekly Needs/Wants is now a horizontal bar beneath the remaining-plan total and beside Spending Pace.
- Opportunity Cost and Budget Flexibility now stay side by side in one compact Money insights row.
- A horizontal Safe to Spend/Forward-looking Reset card and a vertical Needs/Wants mix rail positioned beside compact Opportunity Cost and Budget Flexibility cards.
- Gentle pet responses for pace risk, category reallocation, low flexible funds, and staying within the overall plan.
- A room-first home screen with three original illustrated pets, gentle breathing/tap feedback, time-of-day ambience, and behavior-aware dialogue.
- Purpose-built action scenes: pets lie down to rest, visibly open their mouths while eating, and make larger jumps and side-to-side movements while playing.
- Feeding is now a single one-way action: the snack disappears after entering the mouth, followed by four visible chewing cycles without replaying the snack path.
- Rest renders only the lying-down artwork; the standing and blink layers are removed from the render tree for the entire rest state.
- Play now switches into dedicated catch poses where both front paws lift, overlap the toy, and hold it through the landing.
- Saving a new expense now returns to Home immediately and triggers an animated confetti celebration.
- Clean uses the original illustrated character in a resident native Lottie composition: masked head, ears, body and tail, a 5-second / 75-frame timeline, water, foam, two sway cycles, a shake and +Clean feedback. Native layout provides a startup fallback when animationLoaded is missing. See CLEAN_5S_README.md for validation and native-client requirements.
- More than thirty rotating pet-tap responses shaped by time of day, pet personality, check-in state, gifts, budget progress, savings progress, and return visits.
- Redesigned caramel-and-teal dog and misty-blue lop rabbit silhouettes, while the original cream-and-lavender cat remains unchanged.
- Mystery gifts containing coins, treats, common room pieces, rare collectibles, or duplicate conversion coins.
- A visual room builder with walls, floors, windows, furniture, decor, outfits, live previews, and savings-goal changes.
- A collection catalog with rarity, acquisition source/date, equipped status, seasonal items, and an item story.
- Twenty-four complete collection records, including the mystery gift and premium treat, each with explicit name, rarity, acquisition date/method, ownership, equipped state, and story.
- Twenty-four original hand-painted inventory illustrations with fabric stitching, wood grain, glass reflections, lighting, and transparent cutout edges.
- Rich Shop and Collection cards with illustrated previews, category filters, rarity art direction, discovery states, and a larger item-detail showcase.
- A more dimensional room with illustrated furniture, rugs, windows and decor, plus wallpaper motifs, shelves, books, framing, baseboards, floorboards, shadows, and ambient light.
- Artwork is warmed in small batches at launch, retried after transient failures, and replaced by a visible fallback instead of leaving an empty room.
- A single pet-animation state machine now owns every active action through Starting, Playing, Finishing, and Idle phases; quick repeated taps are ignored while important finance, gift, and celebration moments wait in a FIFO queue.
- Pet animation timers are cleared with the Home screen, pause when the app enters the background, and resume from the interrupted phase when the app becomes active again.
- Unloaded action poses preserve the static illustrated pet instead of hiding its base layer, preventing blank or overlapping pet scenes during asset decoding.
- Eight deterministic animation-state tests cover phase timing, interaction locking, important-event ordering, duplicate prevention, pause/resume, background starts, live dialogue updates, and failed-action cancellation.
- Shop and Collection render eight treasure cards at a time to reduce image-decoding spikes on older devices and development builds.
- Pet care, levels, achievements, inventory, and an expanded Pet Coin shop.
- Complete local-data deletion from Settings.
- A new Pennykin brand, bundle identifiers, and icon.

## Run the app

Requirements: Node.js 22.13 or newer and current Expo tooling.

```bash
npm install
npx expo start
```

Open the project in an iOS simulator, Android emulator, or compatible Expo development client. Test on a physical iPhone before distributing through TestFlight.

## Validate the build

```bash
npm run typecheck
npx expo export --platform ios
```

## Project structure

```text
App.tsx                    App shell and bottom navigation
assets/                    App icon source and generated PNG assets
src/AppContext.tsx         Mutations and shared app state
src/database.ts            SQLite schema, migrations, reset, and loading
src/screens/               Mobile screens
APP_STORE_COPY.md          Draft listing copy and screenshot messages
PRIVACY_POLICY.md          Full policy with the confirmed support email
SUPPORT.md                 Help and support with deletion and contact instructions
TESTFLIGHT_PLAN.md         Recruitment, metrics, and beta decision rules
RELEASE_CHECKLIST.md       Remaining TestFlight and App Store tasks
```

## Monetization status

The beta does not contain a paywall or in-app purchase. The proposed Founders Pro offer is a $14.99–$19.99 one-time non-consumable purchase. Implement it only after the 14-day beta validates retention and willingness to pay, because a real purchase requires an App Store Connect product identifier, entitlement logic, Restore Purchases, and physical-device sandbox testing.


## 1.10.0 update: clinic and audio

Vet now opens a temporary mint-and-cream clinic mat in the existing room. A one-second automatic stethoscope check plays two gentle beeps, respecting the device silent setting. Tap **Apply comfort patch · 20 coins**, then **Pet your pet** (or tap the pet in the room) to reassure it. Coins and the existing health/XP change apply once, when treatment is confirmed. Closing before treatment is free. The clinic waits for both interactions and returns home after a happy response.

This release adds `expo-audio` for the local check-up cue. Install dependencies and rebuild the native app when updating from an older native build:

```bash
npm install
npx expo run:ios
```

For an existing generated `ios` directory, reinstall pods if the run command reports the new audio module is missing. Audio is playback-only: no microphone permission, recording or background audio is enabled. Native simulator/device playback must be verified separately from Expo bundle export.

## Play animation in 1.10.2

Play uses one temporary star toy and a compact 2.4-second action timeline, with a 2.6-second state-machine envelope. Six empty-handed cat poses cover crouching, pouncing, landing, hugging, releasing and recovering. The star is a separate prop throughout: it enters along a gravity arc, meets the paws, follows the hug, lowers and rolls out while fading. Native opacity reaches zero before the owner finishes; an explicit completion also removes temporary toy/star/paw layers. The original idle artwork is restored before the action ends. There is no full-pet crossfade or per-action remount.

The speech bubble uses the same pause-preserving clock and appears 200ms after the action starts, with dialogue milestones also delayed by 200ms. Legacy embedded-star grab artwork is excluded from the pet renderer. Care costs and rewards are unchanged; dog/rabbit use the base-body rig and single prop. See RELEASE_NOTES_1.10.2.md for timing, new artwork/prompt paths and device verification limits.

## Clean animation in 1.11.3

`assets/animation/clean-v2/` contains 48 separate character poses and 12 shared transparent effect images. Bath, towel, dryer stand, air, splash and stars are independent layers. Every character PNG has a 768×768 canvas, a canonical (384,598) foot anchor and a transparent 128px gutter around a logical 512px scene. Fixed padding prevents stretched ears and tails being clipped during exit and shake poses. The final pose scale and species offsets match the existing idle art.

`cleanChoreography.ts` provides a 9800 ms single-pass story. Painted poses crossfade for 320 ms; the tub retires over 1070 ms and the floor-supported dryer enters over 630 ms. Gravity-shaped splash particles, three flowing wind ribbons and seven moving air particles share this clock. Four poses show standing at the rim, reaching over, stepping out and a soft landing. A clipped forepaw layer crosses above the front rim using the same body transform and pose opacity.

`CleanArt` keeps image sources mounted and memoizes all native interpolation nodes across messages and parent renders. No React frame timer changes image sources. It waits for 29 unique source decodes (17 body/idle plus 12 effects); errors cancel the manual action safely. Native completion finishes the Home action once after the final idle blend. App backgrounding pauses all bodies, props and particles together. Clean textures are not mounted in the small static Choose a Pet avatars.

Validation: `npm run typecheck`, `npm test` (106 tests) and iOS Metro/Hermes export. The companion source package contains 48 scene snapshots, character frames, sprite sheets, three layered OpenRaster files, editable SVG effects, original painted sheets, prompts and export scripts.

For the smooth preview, run `node scripts/export-clean-scene.cjs /absolute/path/scene.json`, then the source package's `tools/render_preview.py` with that JSON. This exports the actual production JSX sources and interpolated styles, including foreground clipping, at 25 fps. The video is an offline timeline preview, not an iPhone recording; native cache, GPU performance and visual rendering still require a physical device or simulator check. Raw keyframe snapshots are not a replacement for the layered runtime animation.

The iOS export validates Metro assets and the Hermes JavaScript bundle. It does not compile/sign a native IPA. Use a Mac/Xcode (`npx expo run:ios`) or configured EAS Build and Apple signing credentials for a native archive.

## Verification update in 1.11.4

Online Expo SDK compatibility validation identified patch mismatches in Expo, SQLite and React Native. Their versions are now aligned to SDK 57 recommendations and recorded in package-lock.json. Clean artwork and its 16-pose layered animation remain as introduced in 1.11.3. See docs/VALIDATION-v1.11.4.md for the fresh-install verification results. Native binaries must be rebuilt when updating from earlier builds because these dependencies include native modules.
