# App Store privacy handoff — Pennykin 1.11.8

Confirmed contact: pennykinappsupport@gmail.com.

## Public URL fields

- Privacy Policy URL: https://pennykin.app/privacy/
- Support URL: https://pennykin.app/support/
- Public access was authorized and both pages were verified without authentication on October 18, 2026 (America/New_York). Regional availability has not been verified.
- Review PRIVACY_POLICY.md and SUPPORT.md as the operational commitments the developer will actually follow. In particular, support/feedback retention is purpose-limited rather than an invented fixed number of days.

## Review the shipped build before answering App Privacy

- Financial and pet records: processed locally; the current app does not upload the transaction database to the developer. Do not treat a local SQLite record as collected off-device merely because it exists.
- Optional beta summary sent to the developer: may contain usage/check-in counts, experience rating, price-interest answer and user-written feedback. An email submission may also identify its sender. Evaluate Usage Data / Product Interaction, User Content / Customer Support or Other User Content, and Email Address based on the actual submission flow and uses. Support uses and product-improvement uses must be described accurately.
- Optional disclosure is not automatic: Apple's exemption has multiple conditions. Do not assume any optional form is exempt, or declare Data Not Collected solely because there is no analytics SDK.
- Apple TestFlight: the privacy policy separately explains automatic platform testing information and submitted screenshots/feedback. Do not mechanically copy all TestFlight fields into the public release's label; answers must describe the actual App Store build and applicable practices.
- Gmail and the help site's hosting: included in the policy. Review the final native SDK privacy manifests and any networked service introduced before submission.
- No tracking/advertising is implemented in the current app. No bank integration or active real-money purchase is implemented.

## Owner actions still needed

1. Review the policy and support content; ensure the stated retention/deletion practices will be followed.
2. Recheck the public privacy/support URLs when submitting the final build; public access is already enabled.
3. Test incoming/outgoing support email personally; the implementation did not send mail or verify delivery.
4. Fill App Store Connect Privacy Policy URL, Support URL and App Privacy answers based on the final build. None have been submitted automatically.
5. Test the new native clipboard/email behavior on a device, including no mail account and offline cases.

References:
- https://developer.apple.com/app-store/review/
- https://developer.apple.com/app-store/app-privacy-details/
- https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/
- https://www.apple.com/legal/privacy/data/en/test-flight/
