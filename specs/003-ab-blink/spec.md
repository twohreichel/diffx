# Feature 003 — A/B Blink View

**Status:** ready
**Classification:** FORK-ONLY
**Depends on:** 000; benefits from 002
**Effort:** M

## Why

Split and Unified both ask the reader to do alignment work. Split requires visual
search across two columns and holding the pairing in working memory. Unified
interleaves `-` and `+` rows so neither complete state is ever on screen, and the
reader reconstructs both mentally.

A third option removes the alignment work entirely: show **one** state, full file,
and let the reader toggle between before and after at the same screen position.
The difference then registers as motion rather than as a search task — the same
principle as a blink comparator. Nothing else in the code-review space offers this.

## User stories

**US-1 — Blink.**
As a reviewer, I press a key and the visible file switches between its before and
after state without the content moving.
- Given a file open in Blink mode, when I hold or press the toggle key, then the
  rendering swaps between old and new, and any line that exists in both states stays
  at the identical vertical pixel position.
- Given the toggle, when I release/press again, then the previous state returns
  with no scroll jump.

**US-2 — Alignment gutter.**
As a reviewer, lines that exist in only one of the two states leave a visible
placeholder in the other state, so the layout never shifts.
- Given 3 lines added, when viewing the before state, then 3 placeholder rows
  occupy that space, marked as "3 lines added here".

**US-3 — Orientation.**
As a reviewer, I always know which state I am looking at.
- Given either state, then a persistent, unmissable indicator shows BEFORE or AFTER
  (label plus a distinct edge colour on the whole pane).

**US-4 — Change navigation.**
As a reviewer, `n` / `p` jump to the next/previous change region, and the blink
toggle keeps working at that position.

**US-5 — Auto-blink (optional).**
As a reviewer, I can turn on automatic alternation at a configurable interval
(default 800 ms) and stop it with any key.

## Functional requirements

- **FR-001** New view mode "Blink", selectable alongside Split and Unified.
- **FR-002** Renders the **complete file** in one column, in exactly one state at
  a time, with full syntax highlighting.
- **FR-003** Vertical alignment is stable: every line present in both states keeps
  its pixel position across a toggle. Lines present in one state only are matched by
  a placeholder of equal height in the other.
- **FR-004** Toggle key: `Space`, held or pressed. Must not scroll the page —
  suppress the browser default while Blink mode is active.
- **FR-005** State indicator: a text label in the toolbar **and** a coloured left
  edge on the content pane; never colour alone (Constitution IX).
- **FR-006** `n` / `p` navigate change regions; navigation preserves the current state.
- **FR-007** Auto-blink with interval control (400/800/1600 ms), off by default,
  cancelled by any key press or by leaving the file.
- **FR-008** Unchanged files render as plain source; the toggle is disabled with a tooltip.
- **FR-009** Inline comments are visible in both states, anchored per
  `<recon:COMMENT_ANCHOR>`. A comment on a line that exists only in one state is
  shown attached to its placeholder in the other.
- **FR-010** Mode and auto-blink settings persist (`<recon:SETTINGS>`).
- **FR-011** Respects `prefers-reduced-motion`: auto-blink is disabled and the
  manual toggle is instant with no transition.

## Out of scope

Cross-fade or opacity animation between states. Three-way (merge) blink.

## Edge cases

- File added: before state is empty; show "file did not exist" rather than a blank pane.
- File deleted: mirror of the above.
- Renamed file: blink across the rename, with both paths in the header.
- Very large file: fall back to Unified with a notice above the size threshold.
- Binary/image: Blink is a natural fit for images — reuse the existing image
  preview and apply the same toggle. Non-image binaries disable the mode.
