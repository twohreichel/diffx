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
