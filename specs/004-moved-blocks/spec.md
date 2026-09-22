# Feature 004 — Moved Block Detection

**Status:** ready
**Classification:** UPSTREAM-CANDIDATE
**Depends on:** 000
**Effort:** M

## Why

Moving a function shows up as a full deletion plus a full addition. On a
refactoring commit — exactly the kind an agent produces — this can be most of the
diff, and none of it is a real change. The reader has to prove to themselves that
the two blocks are identical, by eye, before they can ignore them.

git already solves this with `--color-moved`. diffx parses the patch itself, so the
information is available; it just is not surfaced.

## User stories

**US-1 — Recognize a move.**
As a reviewer, a block that was moved unchanged is marked as moved, not as
delete+add, so I can skip it.
- Given a 20-line function moved from the top to the bottom of a file, when
  rendered, then both occurrences are marked "moved" with a matching pair badge,
  and neither is coloured as a normal addition or deletion.

**US-2 — Jump to the counterpart.**
As a reviewer, I click the badge on a moved block and jump to its counterpart.

**US-3 — Moved and modified.**
As a reviewer, a block that was moved **and** edited is marked as moved, with the
edits highlighted inside it, so I review only the edits.
- Given a moved function with one changed line, when rendered, then the block is
  marked "moved, 1 line changed" and only that line carries change emphasis.

**US-4 — Cross-file moves.**
As a reviewer, code moved between files is detected and linked across the file tree.

**US-5 — Fold moves away.**
As a reviewer, I collapse all unchanged moved blocks to one summary row each, so
the remaining diff is only real change.

## Functional requirements

- **FR-001** Detect blocks of ≥ N lines (default 5, configurable) that appear as
  both a deletion and an addition with identical content, ignoring leading whitespace.
- **FR-002** Mark both occurrences with a paired badge carrying a stable pair id and
  a distinct visual treatment separate from add/remove.
- **FR-003** Clicking a badge scrolls to the counterpart, across files if needed.
- **FR-004** Detect moved-and-modified blocks above a similarity threshold
  (default 0.8) and show the internal changes within them.
- **FR-005** Detect cross-file moves within the same diff.
- **FR-006** Provide "collapse moved blocks": each unchanged moved block becomes a
  single summary row, expandable.
- **FR-007** All thresholds (min lines, similarity) are settings and persist.
- **FR-008** Detection runs client-side on the parsed model and must not block the
  first paint; results may arrive shortly after the diff renders.

## Out of scope

Copy detection (a block that exists twice after the change but once before).
Detection across commits.

## Edge cases

- Repeated boilerplate (imports, closing braces) must not be reported as moves —
  the min-line threshold and a content-entropy check guard against this.
- A block moved and re-indented: whitespace-insensitive comparison must catch it.
- Multiple identical blocks: pair greedily by proximity and mark ambiguity in the badge.
