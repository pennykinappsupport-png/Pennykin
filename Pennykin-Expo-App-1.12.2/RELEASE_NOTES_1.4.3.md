# Pennykin 1.4.3 — One-shot Pet Actions

This maintenance update makes the Feed, Rest, and Play actions read as complete physical actions.

- **Feed:** the snack travels into the mouth once and stays gone. The pet then opens and closes its mouth four times to chew; the full feeding path no longer loops or appears to reverse.
- **Rest:** only the purpose-built lying-down sprite is mounted while resting. The standing pet, blink sprite, eating sprite, and play sprite are not rendered in that state.
- **Play:** each pet now has a new illustrated catch frame. The loose star follows one throw arc, disappears at contact, and is replaced by a pose with both front paws visibly wrapped around the toy. The pet lands while still holding it.
- **Artwork loading:** all three new catch frames are included in room preloading to prevent a blank frame during the catch transition.

Marketing version: **1.4.3**  
iOS build: **17**  
Android version code: **17**
