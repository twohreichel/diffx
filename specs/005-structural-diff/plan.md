# Plan — Feature 005 Structural Diff

## Constitution check

| Principle | Status |
|---|---|
| I Comprehension | PASS — highest accuracy gain of the set |
| II Additive | PASS — fourth mode |
| III Upstream compat | FORK-ONLY — adds an external binary dependency |
| IV Thin server | PASS — difftastic does the work |
| V Degradation | PASS — three fallback paths, FR-003/004/005 |
| VI Performance | RISK — parsing cost; mitigated by FR-010 and caching |
| X Testing | PASS |

## Why shelling out is the right call

difftastic is a mature Rust tool with tree-sitter grammars for many languages and a
documented `--display json` mode. Reimplementing any part of that in TypeScript
would be strictly worse. The fork's contribution is the **rendering**, not the diffing.

## Server side

Tested against **difftastic 0.71.0** (`cargo install difftastic --locked`).

```
DFT_UNSTABLE=yes difft --display json --width 120 [--ignore-comments] OLD_PATH NEW_PATH
```

0.71.0 gates `--display json` behind `DFT_UNSTABLE=yes` and has no
`--missing-as-empty` flag, so an added or deleted side is written as an empty
temp file instead. `--width` is pinned so the result does not follow the
server's terminal size.

Old and new content must exist as files. Write the old blob
(`git show <rev>:<path>`) to a temp file; the new side is the working-tree file, or
another temp file when diffing two revisions. Clean up temp files in a `finally`.

Availability check at startup: run `difft --version`, cache the boolean and the
version string, expose it on an existing status/info route so the client can disable
the mode with a precise reason (FR-003, FR-004).

New route: `GET /api/structural?path=...` returning
`{ available: boolean, reason?: string, result?: DifftFile, fellBack?: boolean }`.

## Contract with difftastic

difftastic's JSON shape is **not a stable public API**. Therefore:

1. Pin a known-good version range and record the exact version tested in `plan.md`.
2. Parse defensively into an internal type; never pass difftastic's structure
   straight to the renderer.
3. Write `specs/005-structural-diff/contracts/difft-json.md` documenting the observed
   shape, captured with a real invocation during T003, plus a checked-in sample.
4. Validate at the boundary; on a shape mismatch, treat it exactly like FR-005
   (notice + line-based fallback) rather than crashing.

```ts
type StructuralChunk = {
  side: 'before' | 'after' | 'both';
  lineNumber: number | null;
  ranges: { start: number; end: number; kind: 'added' | 'removed' }[];
};
type StructuralFile = { path: string; language: string | null; chunks: StructuralChunk[]; unchanged: boolean };
parseDifft(json: unknown): StructuralFile   // throws ShapeError -> fallback
```

## Rendering

Granularity is **row-level, not character-level**. `@pierre/diffs` renders into its
own shadow root and exposes no API for decorating character ranges, and feature 002
produced no `applyRanges` primitive to reuse, so painting Shiki spans is out of
reach without forking the renderer itself.

`structuralCSS` therefore neutralizes the background of every change row and
restores the package's own addition and deletion colours on exactly the lines
difftastic reports. A pure reformat keeps its `+`/`-` rows and shows all of them
unhighlighted, which is the comprehension gain FR-006 asks for.

Layout stays the package's own split grid, so navigation, comments and the file
tree keep working.

## Caching

Key the result by `(path, oldBlobSha, newContentHash, ignoreComments)`. Structural
analysis is expensive and the same file is reopened constantly during review.

## Testing

- Unit: `parseDifft` against the checked-in sample, and against a mangled sample
  (must raise `ShapeError`, not crash).
- Unit: availability detection maps a missing binary to the right reason.
- Unit: temp-file lifecycle cleans up on both success and error paths.
- Integration (skipped when `difft` is absent): reformat-only fixture reports
  `unchanged: true`, wrapped-block fixture marks only the wrapper.
- DOM: unsupported language shows the fallback notice and line-based rows.

## Risks

- **JSON shape drift between difftastic versions.** Mitigated by pinning,
  defensive parsing and the contract document — but expect to revisit on upgrades.
- **Latency on large files.** FR-010 keeps it on-demand; add a visible loading state
  and make the request cancellable when the user switches files.
- **Install friction.** `difft` is one `brew install difftastic` /
  `pacman -S difftastic` away; put the exact commands in the disabled-mode tooltip.
