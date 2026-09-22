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
