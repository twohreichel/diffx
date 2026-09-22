# Plan — Feature 004 Moved Block Detection

## Constitution check

| Principle | Status |
|---|---|
| I Comprehension | PASS — removes the largest class of false change |
| II Additive | PASS — decorates existing rows |
| III Upstream compat | PASS — UPSTREAM-CANDIDATE |
| IV Thin server | PARTIAL — see decision |
| VI Performance | PASS — async detection, FR-008 |
| IX Accessibility | PASS — badge glyph and label, not colour alone |
| X Testing | PASS |

## Decision: git or client-side

git's `--color-moved` emits the result as ANSI colour, which is awkward to parse
and would fight diffx's own rendering. `--color-moved=zebra` also changes the patch
colouring wholesale. Therefore: **detect client-side** on the already-parsed model.
This is the one justified deviation from Constitution IV; record it as an exception.

## Algorithm

Two passes over the parsed model, all files at once (so cross-file moves fall out
for free, FR-005).

1. **Index.** For every run of ≥ N consecutive removed lines and every run of
   ≥ N added lines, compute a normalized key: trim leading whitespace per line,
   drop blank lines, join with `\n`, hash. Store `hash -> [occurrences]`.
2. **Exact pairing.** Any hash present in both a removal and an addition bucket is
   an exact move. Pair greedily, nearest first, to handle duplicates deterministically.
3. **Fuzzy pass (FR-004).** For unpaired runs of ≥ N lines, compare candidates by
   token-level similarity (reuse feature 002's diff core if available). Above 0.8,
   mark as moved-and-modified and keep the per-line edit script for rendering.
4. **Entropy guard.** Reject a candidate whose distinct-line ratio is below a floor
   (e.g. 20 identical `}` lines). Prevents boilerplate false positives.

Complexity: hashing is linear; the fuzzy pass is bounded by capping candidates per
run to the K nearest by size (K = 8).

```ts
type MovePair = {
  id: string;
  from: { path: string; startLine: number; lineCount: number };
  to:   { path: string; startLine: number; lineCount: number };
  kind: 'exact' | 'modified';
  innerEdits?: LineEdit[];
  ambiguous: boolean;
};
detectMoves(models: DiffModel[], opts): MovePair[]
```

## Rendering

Moved rows keep their position but change treatment: neutral background with a
left border in a third hue, a badge `⇄ moved` plus a short pair id, and a label
"from src/a.rs:120" / "to src/b.rs:40". The badge is a button (FR-003).

Collapsing (FR-006) replaces an exact-move run with one row:
`⇄ 24 lines moved to src/b.rs:40 — unchanged` with a disclosure control.

## Async delivery (FR-008)

Run detection after the first paint, in an idle callback or a worker if one already
exists. Decorate rows in place when the result arrives. Never gate the initial
render on detection.

## Testing

- Unit: exact detection on a moved function, with and without re-indentation.
- Unit: no detection below the min-line threshold.
- Unit: boilerplate (20 `}` lines) rejected by the entropy guard.
- Unit: duplicate blocks pair deterministically, `ambiguous: true` set.
- Unit: cross-file move produces one pair with two paths.
- Unit: moved-and-modified yields `kind: 'modified'` with a non-empty `innerEdits`.
- DOM: badge click scrolls to the counterpart; collapse replaces the run with one row.

## Risks

- False positives are worse than misses here: a wrongly-collapsed "move" hides a
  real change. Bias thresholds conservative and always keep the block expandable.

## Decisions (implementation)

- **Collapsing a moved run is not available against this renderer** (T015, FR-006).
  `@pierre/diffs` computes the gap padding of one split column from the unhidden
  model, so hiding rows in the deletions column desynchronizes it from the
  additions column and the two stop lining up. The virtualizer also materializes
  only a window of rows, which leaves an index-based selection meaningless while
  scrolling. The marking carries the same message without the layout risk: the
  run keeps its rows, loses the change colours and gains a badge that names its
  counterpart.
- **The inner edits are the lines the marking leaves out** (T014). A moved and
  edited block marks every line it shares with its origin and leaves the rest in
  their addition colour, so the edit shows up as the only coloured thing inside a
  neutral block. A separate emphasis pass would repeat what the diff already says.
- **Marked rows are addressed declaratively** (T012). The renderer writes the line
  number into `data-line` on the code cell and into `data-column-number` on the
  gutter cell, so one generated rule per marked line reaches both halves of the
  row through `unsafeCSS`. Adding `[data-line-index]` as a third attribute lifts
  the rule past the package's own line colouring without `!important`.
- **The entropy floor is half the lines, not a fifth.** A run has to carry distinct
  content in at least half its lines to be recognized again. A fifth still accepted
  a six-line block of closing braces.
- **Import reordering cannot pair** (T018). A departure and an arrival that belong
  to the same change segment never form a pair, so a reordering inside one block
  produces nothing, and the similarity floor rejects what the segment rule misses.
