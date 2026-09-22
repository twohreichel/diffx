# Feature 000 — Codebase Recon

**Status:** ready
**Type:** enabling (no user-facing change)
**Depends on:** nothing
**Blocks:** 001, 002, 003, 004, 005, 006

## Why

The six view-mode features all touch the same three seams in diffx: how the
server produces a diff, how the client turns that diff into rows, and how the
Split/Unified toggle selects a renderer. Those seams are not documented publicly.
Without a map, every later spec would guess at paths and every later plan would
be wrong in the same way.

This feature produces that map once, as `specs/000-recon/architecture.md`, and
every later feature resolves its `<recon:NAME>` placeholders against it.

## User story

**US-1 — As the implementer, I can see where to make a change.**
Given the fork is checked out and dependencies are installed, when I read
`architecture.md`, then I can name the file and function responsible for each
seam below without re-reading the source.

Acceptance:
- Every `<recon:NAME>` token listed in FR-002 has exactly one resolved path.
- Each resolved path exists in the working tree.
- The document states the diff data structure's shape with a concrete example.

## Functional requirements

- **FR-001** Record the runtime split: which code runs in the CLI/server process,
  which runs in the browser, and how they communicate (HTTP routes, payload shapes,
  any websocket or polling for live updates).
- **FR-002** Resolve these placeholders, each to `path:symbol`:
  - `<recon:GIT_INVOKE>` — where `git diff` is spawned and its arguments assembled
  - `<recon:DIFF_PARSE>` — where raw patch text becomes a structured model
  - `<recon:DIFF_MODEL>` — the type/interface of that structured model
  - `<recon:ROW_BUILD>` — where the model becomes renderable rows/lines
  - `<recon:VIEW_TOGGLE>` — where Split/Unified is chosen
  - `<recon:RENDER_SPLIT>` — the split renderer
  - `<recon:RENDER_UNIFIED>` — the unified renderer
  - `<recon:HIGHLIGHT>` — where Shiki is invoked and how tokens map to lines
  - `<recon:SETTINGS>` — the persisted-settings mechanism (storage key, shape)
  - `<recon:KEYBIND>` — where keyboard shortcuts are registered
  - `<recon:FILETREE>` — the file tree component and its selection state
  - `<recon:COMMENT_ANCHOR>` — how a comment binds to a line (anchoring rules)
- **FR-003** Document how a line identity is expressed today (old line number,
  new line number, hunk index) — this is the contract features 002–006 must not break.
- **FR-004** List the build and test commands actually present in `package.json`.
- **FR-005** Note any existing test setup; if there is none, say so explicitly.

## Out of scope

No behaviour change. No refactoring. No new dependencies.

## Open questions to answer during recon

- Does the client re-fetch from the server when settings change, or is the full
  diff loaded once and transformed client-side? (Decides feature 001's approach.)
- Is there already any intra-line highlighting, even partial?
- Are comments anchored by line number or by content hash? (Decides how risky
  re-rendering is for features 003 and 005.)
