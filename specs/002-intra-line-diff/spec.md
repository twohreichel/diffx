# Feature 002 — Intra-Line Diff

**Status:** ready
**Classification:** UPSTREAM-CANDIDATE
**Depends on:** 000
**Effort:** M

## Why

Line-granular diffs mark a whole line as changed even when one token moved. On a
120-character line — a function signature, a long call, a config value — the reader
has to diff the line by eye, character by character, on every occurrence. That is
the single most repeated micro-task in reviewing, and it is fully automatable.

## User stories

**US-1 — Spot the token.**
As a reviewer looking at a modified line pair, I see exactly which characters
differ, highlighted inside the line, so I do not compare them manually.
- Given `- foo(a, b, timeout=30)` / `+ foo(a, b, timeout=60)`, when rendered, then
  only `30` and `60` carry the intra-line emphasis.
- Given a line replaced entirely, when rendered, then no misleading partial matches
  are highlighted; the whole line is emphasized.

**US-2 — Word granularity by default.**
As a reviewer, changes are shown at word granularity, because character-level noise
on identifier renames is harder to read than the words themselves.
- Given `getUserById` → `findUserById`, when word granularity is active, then the
  whole identifier is emphasized, not the shared `UserById` suffix.

**US-3 — Granularity toggle.**
As a reviewer inspecting a whitespace or punctuation change, I switch to character
granularity to see it.

**US-4 — Works with syntax highlighting.**
As a reviewer, intra-line emphasis composes with Shiki highlighting: colours stay,
emphasis is carried by background and an underline, not by replacing the colour.

## Functional requirements

- **FR-001** For each changed line pair, compute an intra-line diff and render
  added/removed segments with distinct emphasis inside the line.
- **FR-002** Default granularity is word; a toggle offers `word` and `char`.
- **FR-003** Emphasis is applied without destroying Shiki token colours
  (`<recon:HIGHLIGHT>`). Emphasis uses background plus a bottom border; colour
  alone never carries the meaning (Constitution IX).
- **FR-004** Pairing rule: only lines paired as a modification get intra-line
  treatment. Pure additions and pure deletions do not.
- **FR-005** Similarity floor: if the two lines share less than a configurable
  ratio (default 0.3), treat as unrelated and skip intra-line emphasis.
- **FR-006** Works in Split (emphasis in both columns) and Unified (emphasis on
  the `-` and `+` rows).
- **FR-007** Granularity setting persists (`<recon:SETTINGS>`).
- **FR-008** Computation is bounded: lines longer than 2000 characters skip
  intra-line diffing and render as today.

## Out of scope

Cross-line token matching. Semantic awareness of identifiers (that is feature 005).

## Edge cases

- Tabs and mixed indentation: respect `.editorconfig` tab width as the rest of the app does.
- Unicode: segment on grapheme clusters, not code units, so emoji and combining
  marks are not split.
- CRLF: line endings are never rendered as a difference.
