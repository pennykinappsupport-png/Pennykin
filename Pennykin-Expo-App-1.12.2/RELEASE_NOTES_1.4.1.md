# Pennykin 1.4.1 — Natural Pet Motion

This patch replaces the simplified 1.4.0 pet motion system.

- Removed generic black-line blink overlays.
- Added a separate, correctly aligned closed-eye frame for the cat, dog, and rabbit.
- Idle pets no longer sway or remain in a permanent celebration loop. Idle movement is limited to subtle breathing and occasional natural blinks.
- Tap movement now begins only after the pet is pressed, with a short lift and head response that returns fully to rest.
- Eating is a staged loop: the treat travels toward the pet, shrinks as it is eaten, disappears, and leaves crumbs while the pet leans toward it.
- Playing is a staged loop: the toy rolls and arcs across the floor while the pet hops toward it.
- Sleeping now keeps the eyes closed, uses slow asymmetric breathing and a gentle nod, and animates the Zzz indicator upward.
- Gift and celebration motion remain event-driven and temporary.

Marketing version: **1.4.1**  
iOS build number / Android version code: **15**
