---
"diffx-cli": minor
---

Add a live context width control to the toolbar. Context can be switched between
0, 3, 10 and full lines without restarting diffx, with `[` and `]` as shortcuts.
The chosen width is persisted, the view keeps the nearest changed line in place
across a change, and comments on lines a narrower width hides are counted in the
file header.
