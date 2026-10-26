# Pennykin 14-Day TestFlight Plan

## Who to recruit

Recruit 20–30 students ages 14–22 who are managing an allowance, boarding-school spending, a college budget, or part-time income for the first time. Include several users who dislike traditional finance apps.

## Test instructions

1. Install and finish onboarding without coaching.
2. Use a realistic weekly budget.
3. Complete one honest check-in each day; a no-spend day counts.
4. Use the pet and savings goal naturally.
5. On days 2, 7, and 14, open **Insights → Beta feedback** and share the summary with the developer.
6. Report bugs separately with device model, iOS/Android version, and steps to reproduce. Never send screenshots containing private transaction details.

## Success thresholds

| Metric | Target | How to measure |
| --- | ---: | --- |
| Onboarding completion | 70%+ | Ask every invitee whether onboarding completed |
| Day-2 return | 35%+ | Day-2 beta summaries / installs |
| Day-7 return | 15–20%+ | Day-7 beta summaries / installs |
| Five check-ins in week one | 30%+ | Beta summaries showing 5+ check-ins |
| Clear willingness to pay | 3+ testers | “Yes” to the one-time $14.99–$19.99 question |

The app intentionally has no analytics SDK. Track only aggregate results in a separate tester sheet, using a random tester ID rather than financial data.

## Decision rule

- If onboarding or return rates miss the target, improve clarity and daily value before adding Pro.
- If usage passes but willingness to pay is weak, test the feature bundle and price.
- Only implement the $19.99 Founders Pro purchase after the TestFlight evidence supports it.
