# Pennykin 1.4.0 — Living Room Reactions

## Visible changes

- The Home screen now leads with the pet room, followed by the pet’s message and the main logging action.
- Collection details use one reversible button: **Place in my room** becomes **Remove from room** after placement.
- First records make the pet peek into the room; ordinary records trigger a celebration.
- No-spend check-ins animate a Pet Coin into a savings jar.
- Savings milestones add a dream box at 25%, a savings jar at 50%, and a room party at 100%.
- After three inactive days, the pet enters a persistent, harmless sleep. Two new honest check-ins are required to wake it.
- Pet motion now includes breathing, blinking, tap wiggles, eating, playing, sleeping, gift opening, celebration, morning/evening behavior, and changing room positions.

## Stability and build identity

- Sleep and wake progress are stored in SQLite and migrate safely on existing installs.
- Existing pet image retry and fallback behavior remains in place.
- Marketing version is **1.4.0**; iOS build number and Android version code are both **14**.
