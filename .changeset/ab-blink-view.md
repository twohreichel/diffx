---
"diffx-cli": minor
---

Add an A/B blink view mode. Blink shows one complete state of the file at a
time, `Space` swaps between before and after, `n` and `p` jump between changes,
and an optional auto blink cycles at 400, 800 or 1600 ms. The current state is
named in the toolbar and repeated by a coloured pane edge, image files switch
with the same key, and `prefers-reduced-motion` hides the automatic cycle.
