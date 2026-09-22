# Feature 001 — Context Slider

**Status:** ready
**Classification:** UPSTREAM-CANDIDATE
**Depends on:** 000
**Effort:** S

## Why

A diff is read in two passes. The first pass asks "what changed at all" and wants
zero context — pure signal. The second pass asks "is this change correct" and wants
plenty of context. diffx ships one fixed context width for both, so one of the two
passes is always working against the display.

Today the user can already approximate pass one with `diffx -- -U0`, but only by
restarting the process with different arguments. This feature makes context a live
control.

## User stories

**US-1 — Scan mode.**
As a reviewer opening a large agent-generated change, I set context to 0 so I see
only changed lines, grouped per file, and can judge the shape of the change in
seconds.
- Given a file with 4 hunks and 3 context lines each, when I set context to 0,
  then only added/removed lines remain and hunk separators collapse to one row.
- Given context 0, when I set context back to 3, then the view returns to the
  previous rendering with no loss of scroll anchor on the focused hunk.

**US-2 — Verify mode.**
As a reviewer checking a subtle change, I raise context to 10 or to "whole file"
so I can see the surrounding logic without leaving diffx.
- Given context "full", when a file has no changes at all, then the file renders
  as plain highlighted source with a "no changes" notice.

**US-3 — Persistence.**
As a returning user, my chosen context width is still set when I reopen diffx.

## Functional requirements

- **FR-001** Provide a context control with the steps: `0`, `3`, `10`, `full`.
- **FR-002** The control is visible in the same toolbar as the existing
  Split/Unified toggle and is labelled "Context".
- **FR-003** Changing context updates the currently open file within the
  performance budget (Constitution VI) and does not reset which file is selected.
- **FR-004** Changing context preserves the scroll position relative to the
  nearest changed line, not the pixel offset.
- **FR-005** The setting persists via the existing settings mechanism
  (`<recon:SETTINGS>`) under a new key; existing keys are untouched.
- **FR-006** Keyboard: `[` decreases, `]` increases one step. Both are no-ops at
  the ends of the range. Shortcuts must not collide with those found in
  `<recon:KEYBIND>` — if they do, pick `Shift+[` / `Shift+]` and record the change.
- **FR-007** Existing inline comments stay anchored to their lines across a
  context change, including comments on context lines that become hidden. A comment
  on a hidden line is surfaced as a marker on the nearest visible boundary row.
- **FR-008** `full` context is capped: files above a threshold (default 5000 lines)
  show a confirm prompt instead of rendering eagerly.

## Non-functional

- No new runtime dependency.
- Works identically in Split and Unified.

## Out of scope

Per-file context override. Remembering context per repository.

## Edge cases

- Binary files and image files: control is disabled, tooltip explains why.
- Added or deleted whole files: context has no visible effect; control stays enabled.
- A hunk whose context ranges overlap at width 10: hunks merge into one, and the
  separator disappears. This is correct and must not double-render lines.
