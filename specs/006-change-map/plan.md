# Plan — Feature 006 Change Map

## Constitution check

| Principle | Status |
|---|---|
| I Comprehension | PASS — overview before detail |
| II Additive | PASS — a panel, no change to renderers |
| III Upstream compat | PASS — UPSTREAM-CANDIDATE |
| V Degradation | PASS — file-level fallback, FR-008 |
| VI Performance | PASS — async, FR-009 |
| X Testing | PASS |

## Shipped: A and B together

The parsed model carries the hunk header's function context as `hunk.hunkContext`,
so Option A works — but on its own it is too weak to build a map from. Measured on
real `git diff` output without a configured diff driver, the header for a change
inside a Python function reads `import os`, for a Java method `public class Service {`
and for a Rust method `impl Config {`. Configuring the drivers helps PHP and nothing
else in that sample.

Shipped is therefore A seeded by B: the header opens the hunk, and every line of the
hunk — context and changed alike — is read against a small per-language declaration
pattern set, which is also where the symbol *kind* comes from. Accuracy grows with
the context width, because a wider window contains the enclosing declaration more
often, and at `full` the attribution is exact.

## Decision: how to get symbols

Three options, in ascending cost:

**Option A — git hunk headers (preferred first cut).** `git diff` already prints a
function context in the `@@ ... @@` header, driven by the language's `xfuncname`
pattern. Zero new dependencies, works for every language git knows, and the data is
already in the parsed model. Accuracy is moderate: it gives the *enclosing* symbol,
not a precise range.

**Option B — regex/heuristic extraction per language.** Small per-language patterns
for `def`, `fn`, `function`, `class`, `public .* (`, etc. Better names, still cheap,
but a maintenance surface that grows with every language.

**Option C — tree-sitter in the browser (`web-tree-sitter`).** Accurate symbol
ranges for all target languages. Adds WASM grammars to the bundle and real
complexity.

Plan: ship **A** first, structure the code so **B** can refine specific languages,
and treat **C** as a later, separate feature if accuracy proves insufficient. Record
which option shipped at the top of this file.

```ts
type SymbolEntry = {
  file: string;
  name: string;
  kind: 'function' | 'method' | 'class' | 'type' | 'toplevel' | 'other';
  firstChangedLine: number;
  added: number;
  removed: number;
  tags: ('added'|'removed'|'modified'|'moved'|'structurally-unchanged')[];
};
buildChangeMap(models: DiffModel[], moves?: MovePair[]): SymbolEntry[]
```

## Attribution

Walk each file's hunks in order. For each changed line, attribute it to the current
enclosing symbol from the hunk header; if there is none, attribute to the file's
`toplevel` entry (FR-005). Accumulate added/removed counts per entry. The magnitude
bar is `(added + removed)` normalized against the largest entry in the map.

## Integration with 004 and 005

Both are optional inputs. If `detectMoves` output is available, tag entries whose
changed lines fall inside a move pair. If structural results are cached for a file,
tag and sort accordingly. Neither is a hard dependency (FR-007).

## Panel behaviour

Right-hand panel, toggled by a toolbar button and a shortcut (pick a free key from
`<recon:KEYBIND>`; `m` is a likely candidate). Grouped by file, files sorted by total
magnitude descending. Selecting an entry drives the same navigation path the file
tree already uses (`<recon:FILETREE>`), so behaviour stays consistent.

## Testing

- Unit: attribution assigns each changed line to the right enclosing symbol.
- Unit: lines outside any symbol land in `toplevel`, never dropped.
- Unit: counts and magnitude normalization.
- Unit: tags applied correctly when move data is supplied, and absent when it is not.
- Unit: a language with no hunk-header support yields file-level entries plus a notice.
- DOM: clicking an entry scrolls to `firstChangedLine` in each view mode.

## Risks

- Option A's accuracy varies by language; git needs a configured `diff` driver for
  some. Document `.gitattributes` hints in the fork README for Rust/PHP if needed.
- The map competes with the file tree for screen space; make the panel collapsible
  and remember the state (FR-010).
