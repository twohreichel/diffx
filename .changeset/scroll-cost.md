---
"diffx-cli": patch
---

Smoother scrolling through a large diff: a card that is off screen skips layout and paint, the renderer keeps its options and annotations between renders instead of redrawing the file, and only a structural comparison watches for a file coming into view.
