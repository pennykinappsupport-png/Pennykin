# Pennykin 1.8.0 — Pet Animation State Machine

This release replaces competing pet-action timers with one deterministic animation controller.

## What changed

- Every pet moment follows `Idle → Starting → Playing → Finishing → Idle`.
- Repeated taps and care actions are blocked while an animation is active.
- Important finance reactions, gifts, and celebrations wait in a FIFO queue instead of replacing the current pose.
- Duplicate important events are ignored.
- Leaving Home clears its animation timer and queue with the screen.
- Moving the app to the background pauses the exact phase and remaining time; returning to the foreground resumes it.
- Pet, saving, confetti, arrival, breathing, blinking, and action loops all respect the paused state.
- Rest, eating, and play artwork report load readiness. Until a pose is ready, the stable base pet remains visible.
- Failed care or gift mutations cancel their active animation cleanly and allow the next queued important moment to begin.

## Verification

- `npm run typecheck`
- `npm run test:animation` — 8 state-machine tests
- iOS Expo export

No financial records, rewards, budgets, or local-first privacy behavior were changed in this release.
