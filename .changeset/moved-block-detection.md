---
"diffx-cli": minor
---

Mark blocks that only moved, so the diff stops reading as a rewrite

A block of at least five lines that leaves one place and arrives in another —
inside a file or across two files — now renders on a neutral background with a
violet bar instead of the addition and deletion colours. Both ends carry a badge
naming the counterpart, the pair id and whether the block arrived unchanged, and
the badge jumps to the other end.

Blocks edited on the way still pair as long as they keep the configured share of
their lines, and the lines that read differently keep their addition colour. Two
toolbar settings control it: the smallest block reported as a move, and the
similarity a moved-and-edited block must reach. Detection runs after the first
paint, so the diff never waits for it.
