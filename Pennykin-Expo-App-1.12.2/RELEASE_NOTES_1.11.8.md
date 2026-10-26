# Pennykin 1.11.8 — Privacy policy, support and contact entry points

App version: 1.11.8. iOS build: 62. Android versionCode: 62.

## Included

- Confirmed public contact: pennykinappsupport@gmail.com. No email has been sent as part of this change.
- Replaced PRIVACY_POLICY.md and SUPPORT.md drafts with complete reviewable content.
- Explained on-device records, voluntary email and in-app summaries, Apple TestFlight diagnostics, Gmail and website hosting, retention/deletion, device backups, young users, fictional coins and current absence of active purchases.
- Added full offline-readable policy and help to onboarding and Insights → Settings, using the same canonical Markdown content.
- Added online privacy/support links, Contact Support and Copy support email. Opening Contact Support launches an email composer; it does not send a message. Selectable email and error instructions remain available if browser, email or clipboard actions fail.
- Renamed Share private beta summary to Share beta summary. The UI now explains that the user chooses the recipient and must check their own written notes for private details. The automatic summary also includes the support address.
- Added expo-clipboard ~57.0.2 for copying only the public support address. It does not read clipboard contents. Install with npm ci and rebuild any existing native client to include the new native module.

## Website status and URLs

Website: https://pennykin.app/
Privacy policy: https://pennykin.app/privacy/
Support: https://pennykin.app/support/

The owner authorized public access on October 18, 2026 (America/New_York). The homepage, privacy policy and support page returned HTTP 200 without authentication. The app now uses the custom domain above. Regional availability has not been verified. Native signing, device installation and App Store Connect submission remain outstanding.

The website source is maintained by its Site project. No Site credentials are included in this app package. Policy/help Markdown remains in this app; run python3 scripts/sync_support_content.py after editing it to regenerate the offline JSON. Coordinate website content changes as well.

## Validation

- TypeScript: PASS.
- Full suite: PASS — 157 tests, zero failures.
- Four added production-component/content tests verify offline text fidelity, accessible entry points, exact URL/email/copy destinations, and failed-action fallbacks.
- Existing financial, timezone and animation regressions: PASS.
- iOS Metro/Hermes export: PASS.
- Static website internal links, page files and confirmed email references: PASS.
- Browser visual QA: NOT RUN; supported browser control is unavailable in the managed environment.
- Native iPhone/iPad installation and email/clipboard behavior: NOT RUN.

Logs: docs/privacy-1.11.8/.
