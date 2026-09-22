# Plan — Feature 002 Intra-Line Diff

## Constitution check

| Principle | Status |
|---|---|
| I Comprehension | PASS |
| II Additive | PASS — pure enhancement of existing rows |
| III Upstream compat | PASS — UPSTREAM-CANDIDATE |
| V Degradation | PASS — long lines and low similarity fall back |
| VI Performance | PASS with memoization |
| IX Accessibility | PASS — background + underline, not colour alone |
| X Testing | PASS |

## Decision (T002): the renderer already does this

`@pierre/diffs` ships intra-line diffing. `DiffHunksRenderer` accepts
`lineDiffType: 'word-alt' | 'word' | 'char' | 'none'` (default `word-alt`) and
`maxLineDiffLength` (default 1000), runs `diffWordsWithSpace` or `diffChars` from
the `diff` package in its highlighting worker, and emits the result as
`additionDecorations` / `deletionDecorations` that compose with the Shiki spans.
The rendered segments carry `data-diff-span`.

That answers the algorithm, the pairing, the Shiki composition and the bail-out
below, so the sections that follow describe work the fork does not have to do. The
fork's part of this feature is the persisted granularity setting, raising the length
cap to the 2000 characters FR-008 asks for, and the accessibility cue.

Four consequences, recorded rather than applied silently:

- **Three modes are exposed, not four.** `word` maps to `word-alt`, `char` to
  `char`, `off` to `none`. `word` and `word-alt` differ only in whether adjacent
  segments are joined, and the joined variant reads better on renamed identifiers,
  which is what US-2 asks for. A fourth entry would offer a choice nobody can act on.
- **The granularity control lives in the settings menu**, next to the tab size and
  soft wrap, not in the toolbar. FR-002 asks for a toggle, not for a toolbar slot,
  and the toolbar already carries the context stepper from feature 001.
- **FR-005, the similarity floor, is not implemented.** The renderer computes the
  intra-line diff inside its worker and offers no hook to suppress it per line pair.
  Serving the floor would mean turning the renderer's emphasis off and rebuilding the
  whole feature in the fork, against the finding above. `word-alt` joins adjacent
  segments, which mitigates the same over-highlighting the floor targets. Reopen this
  if a real reformat commit still reads badly in T018.
- **T017 asserts the options the renderer receives**, in both Split and Unified,
  rather than the rows it draws. Drawing them needs Shiki workers and the virtualizer,
  and the emphasis itself is dependency behaviour, not fork behaviour.

## Accessibility

The renderer marks segments with `background-color` alone. `unsafeCSS` adds a bottom
border on `[data-diff-span]`, so the emphasis survives for a reader who cannot
separate the two background tints (Constitution IX, FR-003).

## Pairing

Lines must be paired before they can be intra-diffed. Within a hunk, walk the run
of consecutive `-` lines and the following run of `+` lines. If both runs have the
same length, pair by index. If not, pair greedily by similarity, leaving the
surplus lines unpaired. Unpaired lines get no emphasis (FR-004).

## Algorithm

Use a standard diff over tokens, not a bespoke one.

1. Tokenize each line. Word mode: split on a regex that keeps identifiers,
   numbers, strings and punctuation as separate tokens and preserves whitespace as
   tokens so positions stay exact. Char mode: split into grapheme clusters via
   `Intl.Segmenter` with `granularity: 'grapheme'`.
2. Run a Myers diff over the token arrays.
3. Convert the token-level edit script into character ranges `[start, end)` per line.
4. Compute similarity as `2 * matched / (lenA + lenB)`; below 0.3 return no ranges (FR-005).

Prefer an existing small library if one is already in the dependency tree; otherwise
a ~120-line Myers implementation in a pure module is acceptable and testable.

## Composing with Shiki

Shiki produces coloured token spans per line. The intra-line result is a set of
character ranges over the *plain text* of that line. Do not re-tokenize: instead
walk the Shiki spans and split any span that straddles a range boundary, copying the
span's colour to both halves and adding the emphasis class to the inner part.

```ts
applyRanges(spans: ShikiSpan[], ranges: Range[]): ShikiSpan[]
```

This function is the pure core of the feature and carries the bulk of the tests.

## Performance

Memoize by `hash(oldLine) + hash(newLine) + granularity`. Typical review sessions
re-render the same lines repeatedly (mode switches, context changes), so the cache
hit rate is high. Cap line length at 2000 characters (FR-008) to keep Myers bounded.

## Testing

- Unit: tokenizer — identifiers, strings, numbers, whitespace preservation, graphemes.
- Unit: pairing — equal runs, unequal runs, surplus handling.
- Unit: range computation — the four `spec.md` examples as fixtures.
- Unit: similarity floor triggers on an unrelated line pair.
- Unit: `applyRanges` splits a straddling Shiki span and preserves its colour.
- DOM: emphasis present in both Split columns and on both Unified rows.

## Risks

- Over-highlighting on reformatted lines makes things worse, not better. Mitigate
  with the similarity floor and by reviewing real reformat commits during T016.
- If Shiki highlighting is per-file rather than per-line (`<recon:HIGHLIGHT>`),
  span splitting needs a line-offset map. Confirm during recon.
