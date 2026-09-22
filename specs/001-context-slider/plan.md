# Plan — Feature 001 Context Slider

## Constitution check

| Principle | Status |
|---|---|
| I Comprehension | PASS — directly targets the scan/verify split |
| II Additive | PASS — new control, existing modes untouched |
| III Upstream compat | PASS — UPSTREAM-CANDIDATE, localized change |
| IV Thin server | PASS — git computes context via `-U<n>` |
| VI Performance | RISK — see decision below |
| VII Persistence | PASS |
| VIII Keyboard | PASS |
| X Testing | PASS |

## Decision (T002): Design A, uniformly

The recon answered the open question: `src/ui/hooks/useDiff.ts` already re-fetches
`/api/diff` whenever a setting changes, so a context parameter rides along for free.
**Design A is implemented for all four steps**, `full` included, via `-U1000000`.

Two deviations from the recommendation below, both recorded here rather than silently:

- **No client-side narrowing fast path.** `git diff` on a local repository answers in
  tens of milliseconds, an order of magnitude inside the 1 s budget of Constitution VI.
  A second rendering path that hides rows would have to reimplement hunk merging for
  the 10 → 0 case and would diverge from the server's output. The saving is not
  measurable, the cost is a permanent second source of truth.
- **`full` is not served by the renderer's `expandUnchanged` option**, although the
  recon found it. That option needs `isPartial: false`, which `useFullDiffs` supplies
  per file and asynchronously, so `full` would fade in file by file. `-U1000000` keeps
  one code path and one consistent render.

Custom mode (`diffx -- <args>`) keeps its own context: when the user's arguments
already carry `-U`, `--unified` or `-u`, the server does not append one. Overriding an
explicit start flag with the persisted default would break existing behaviour, which
Constitution II forbids.

## Key decision: re-fetch vs client-side

Two viable designs. Pick based on the answer recorded in
`specs/000-recon/architecture.md` ("Does the client re-fetch when settings change?").

**Design A — server re-fetch (preferred).** Client sends the desired context; the
server re-runs `git diff -U<n>` at `<recon:GIT_INVOKE>` and returns a fresh model.
Correct by construction, because git does the hunk merging. Costs a round trip.

**Design B — client-side widening.** Server always fetches with large context
(e.g. `-U20`) once; the client hides context rows down to the requested width.
Zero latency on change, but the client must reimplement hunk merging and cannot
serve `full` without the file contents.

Recommendation: **A**, with a client-side fast path for narrowing only (going from
3 to 0 hides rows, which is safe and needs no re-fetch). Widening and `full`
re-fetch. `full` uses `-U1000000` rather than a separate code path.

## Interfaces

Extend the diff request with an optional context parameter:

```ts
type ContextWidth = 0 | 3 | 10 | 'full';
// request:  GET <existing diff route>?context=0|3|10|full
// server:   args.push(context === 'full' ? '-U1000000' : `-U${context}`)
```

The response model (`<recon:DIFF_MODEL>`) is unchanged — only its content differs.
This is what keeps the change small and upstreamable.

## Scroll anchoring

Before re-render, record the `(path, newLineNumber)` of the topmost *changed* line
in the viewport. After re-render, scroll that line back to the same viewport offset.
Do not anchor on context lines: they may not exist after the change.

## Comment handling (FR-007)

Comments are anchored per `<recon:COMMENT_ANCHOR>`. If anchoring is by line number,
a hidden line keeps its anchor and the comment is rendered on the collapsed
separator row with a count badge ("2 comments hidden"). Clicking the badge raises
context to the next step and scrolls to the comment.

## Testing

- Unit: `contextArgs(width) -> string[]` mapping, including the `full` cap.
- Unit: narrowing transform (rows in, rows out) with a fixture from
  `specs/000-recon/sample-payload.json`.
- Unit: scroll-anchor selection picks a changed line, never a context line.
- DOM: at context 0 no context rows are present; at 3 they are.

## Risks

- Re-fetch latency on very large diffs — mitigate with a loading state on the
  affected file only, not the whole UI.
- If the server currently caches the diff, the cache key must include context.
