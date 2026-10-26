# Pennykin Release Checklist

## Required before TestFlight

- [x] Replace the support-contact placeholder with pennykinappsupport@gmail.com in `PRIVACY_POLICY.md` and `SUPPORT.md`.
- [x] Prepare both public HTTPS pages and offline in-app policy/help.
- [x] Authorize public Site access and verify https://pennykin.app/privacy/ and https://pennykin.app/support/ without login.
- [ ] Review the policy commitments and complete App Privacy using `APP_PRIVACY_REVIEW.md`.
- [ ] Test onboarding, expense entry, no-spend entry, the third-entry gift, streak chests, duplicate conversion, room previews/equipping, pet actions, shop purchase, savings-goal room changes, feedback sharing, and reset on a physical iPhone.
- [ ] Verify pet art, room layers, modals, and time-of-day ambience on small and large iPhones.
- [ ] Verify the app icon and splash presentation on small and large iPhones.
- [ ] Confirm the final bundle identifier and Apple developer-account owner.
- [ ] Create an App Store Connect app record and answer App Privacy using the shipped SDK list.
- [ ] Re-check the Pennykin name in App Store, domain/social handles, and trademark databases.

## Before public release

- [ ] Run the 14-day beta and record aggregate success metrics.
- [ ] Fix beta blockers before adding monetization.
- [ ] If validated, create a non-consumable `Founders Pro` product in App Store Connect and implement purchase/restore with a production-ready IAP library.
- [ ] Test purchase, cancellation, refund, family-sharing choice, offline entitlement, and Restore Purchases.
- [ ] Capture 6–8 screenshots from the final production build.
- [ ] Add store description, subtitle, keywords, support URL, privacy URL, age rating, and review notes.
- [ ] Add automated tests and a backup/migration test before schema changes.
