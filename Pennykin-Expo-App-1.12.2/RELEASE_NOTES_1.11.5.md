# Pennykin 1.11.5 — Clean final polish

- Every Clean pose change, including entering from and returning to idle, now uses a 300 ms alpha cross-fade. The outgoing and incoming image views stay mounted and their opacity values run on the shared native animation clock. Android's image-load `fadeDuration=0` does not control these pose transitions.
- Airflow begins at 6.9 seconds and fades in over 300 ms. Soft blue ribbons remain attached to the dryer outlet during its entrance/exit; translucent air particles move from the nozzle toward the pet. Tint improves visibility against the cream room background.
- Three translucent water drops start with the rinse/“splash splash” phase at 3 seconds. They are larger than the previous eight tiny drops, launch with a short stagger and follow curved trajectories before fading out.

The sixteen existing poses, bath exit, care costs/rewards and shared pause/resume/cancellation lifecycle are retained. The same polish applies to dog, cat and rabbit Clean scenes. No dependencies or painted assets were changed.

Validation: TypeScript, all 108 tests, and a clean-cache iOS Metro/Hermes resource export passed. Tests evaluate the opacity values bound to the actual JSX image views at each transition, including quarter, midpoint and endpoint samples. Airflow attachment/direction, three-drop timing/transparency and pause behavior are also checked. A raster QA video/contact sheet uses production JSX styles and image sources; it is not an iOS simulator recording.

App version: 1.11.5. iOS build: 53. Android versionCode: 53. The ZIP is application source, not a signed IPA. Final native device/simulator visual verification remains pending in an Xcode environment.

See `docs/VALIDATION-v1.11.5.md`, `docs/clean-preview-1.11.5.mp4` and `docs/clean-contact-1.11.5.jpg`.
