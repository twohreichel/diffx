# Plan — Feature 003 A/B Blink View

## Constitution check

| Principle | Status |
|---|---|
| I Comprehension | PASS — the core bet of this fork |
| II Additive | PASS — third mode, first two untouched |
| III Upstream compat | FORK-ONLY — declared |
| IV Thin server | PASS — needs both blobs, which git already provides |
| V Degradation | PASS — large files fall back to Unified |
| VI Performance | PASS — both states rendered once, toggle is a class swap |
| VIII Keyboard | PASS |
| IX Accessibility | PASS — label plus edge colour; reduced-motion honoured |
| X Testing | PASS |

## Core idea

Do **not** re-render on toggle. Render both states once into the same grid, stacked,
and switch visibility. A toggle then costs one class change and stays far inside the
100 ms budget. This also guarantees pixel-stable alignment for free, because both
states occupy the same row slots.

```
row slot 0   [ before: line 12 ][ after: line 12 ]   ← identical, both visible-capable
row slot 1   [ before: line 13 ][ after: —      ]   ← removed line: placeholder in after
row slot 2   [ before: —       ][ after: line 13 ]   ← added line: placeholder in before
```

Exactly one of the two layers has `data-state="visible"` at any time.

## Getting both states

The diff model (`<recon:DIFF_MODEL>`) contains changed lines and, depending on
context width, some unchanged lines — but Blink needs the **whole file** in both
states. Two options:

**Option 1 (preferred):** request the diff for this file at full context
(reuse feature 001's `-U1000000` path). The model then already contains every line
in both states, and no new server route is needed. This is why 001 should land first.

**Option 2:** add a server route returning both blobs (`git show HEAD:path` and the
working-tree file). More code, but independent of 001 and cheaper for huge files.

Decide at T002 based on whether 001 is merged.

## Decision (T002): full context, and the renderer's split grid is the slot grid

Option 1. Feature 001 has landed, so `context: 'full'` already produces `-U1000000`
and `useFullDiffs` already upgrades every changed file to its complete contents.
Blink forces that width while it is active and needs no new server route
(Constitution IV).

The second decision is larger and supersedes T004-T006 and T008-T010. The row
slots this plan sketches already exist. `@pierre/diffs` renders split as
`[data-diff-type=split]`, a two-column grid whose children are `<code
data-deletions>` and `<code data-additions>`. Each column is a self-contained
grid, and the renderer pads it with gap rows (`GapSpan = { type: 'gap', rows }`)
so both columns carry the same rows at the same heights. That is the `Slot[]`
above, already built, already highlighted by Shiki, already virtualized, already
holding the line annotations.

So Blink is the split rendering with one column hidden and the other widened to
the full pane, plus a state the `Space` key flips. The toggle costs one
`unsafeCSS` swap, nothing re-renders, and pixel stability is the renderer's own
column alignment rather than something the fork has to guarantee.

Consequences, recorded rather than applied silently:

- **`buildSlots` is not written** (T004-T006). Building it would mean rebuilding
  highlighting, virtualization and annotation placement in the fork against a
  renderer that already does all three. The "memory on large files" risk below
  goes with it, because nothing is rendered twice.
- **Blink forces `overflow: 'scroll'` and ignores soft wrap.** Under
  `[data-overflow=wrap]` the two split columns are `display: contents` inside one
  four-column grid, so a column cannot be hidden without collapsing the layout.
- **Placeholder runs are the renderer's gap rows, unlabelled** (T010). They hold
  the position, which is what FR-003 needs, but the fork cannot write "3 lines
  added here" into them: the rows live in a shadow root, carry no run-length
  attribute, and exist only while the virtualizer keeps them on screen. The
  mode's self-explanation moves to the BEFORE/AFTER indicator and the control's
  tooltip.
- **`n`/`p` walk change regions computed from the diff model** (T013), not
  rendered slots. The rendered rows are virtualized, so they are not a list that
  can be walked.
- **Comments follow the column they sit on** (T017). The renderer places an
  annotation in the deletions or the additions column by its side, so a comment
  on a deleted line is on screen in BEFORE and off screen in AFTER, which is the
  state it belongs to. Nothing is orphaned: the gap rows carry no line number and
  cannot hold an annotation.
- **Nothing is disabled per file** (T018). The mode is one global control, and
  neither an unchanged file nor a non-image binary shows anything wrong under it.
  The unchanged file renders its single column, the binary keeps its message.
- **The large-file threshold is feature 001's** (T020): `FULL_CONTEXT_LINE_CAP`
  and its confirm dialog, reached because Blink asks for full context.
- **There is no help overlay to extend** (T023). The keys go into the mode
  control's tooltip and into the README.

## Row-slot construction

Pure function, the heart of the feature:

```ts
type Slot = {
  before: Line | null;
  after: Line | null;
  kind: 'same' | 'added' | 'removed' | 'modified';
};
buildSlots(model: DiffModel): Slot[]
```

Rules: `same` lines produce one slot with both sides filled. A modification run
produces paired slots (`modified`). Surplus removals produce `removed` slots with
`after: null`, surplus additions the mirror. Slot order follows the after-state
order, with removed slots inserted at their original position.

## Placeholder rendering

A `null` side renders a row of the same height with a subtle hatch pattern and,
on the first row of a run, a label: "3 lines added here" / "2 lines removed here".
The label makes the mode self-explanatory on first use.

## Scroll and navigation

Scroll position lives on the container, not on either layer, so it is unaffected by
the toggle. `n`/`p` jump to the next slot whose `kind !== 'same'`, scrolling it to
one third of the viewport height.

## Space key handling

`Space` is the browser's page-down. While Blink mode is active and the content pane
has focus, call `preventDefault()` on `keydown`. Restore default behaviour when the
mode is left. Document this in the help overlay, since it surprises users otherwise.

## Testing

- Unit: `buildSlots` for same / added / removed / modified / mixed runs, and for
  an empty before state (file added).
- Unit: slot order equals after-state order with removals reinserted.
- Unit: navigation picks the next non-`same` slot and wraps correctly.
- DOM: toggling changes only the `data-state` attribute; the DOM of both layers
  is unchanged and row offsets are identical.
- DOM: with `prefers-reduced-motion: reduce`, auto-blink controls are absent.

## Risks

- **Memory on large files.** Two rendered layers double the DOM. Mitigate with
  virtualization if the existing renderer already virtualizes; otherwise enforce the
  size threshold from FR-008 and tune it with a real large file.
- **First-use confusion.** Without the placeholder labels the mode reads as "the
  file flickers". The labels are not optional polish; treat them as core (T010).
