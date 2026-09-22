# Feature 005 — Structural Diff (difftastic)

**Status:** ready
**Classification:** FORK-ONLY
**Depends on:** 000
**Effort:** L

## Why

Line-based diffs report changes that are not changes: a reformat, a re-wrap, an
added wrapper that re-indents a whole block. difftastic solves this by comparing
syntax trees instead of lines, and it exposes the result as machine-readable JSON
(`difft --display json`), one element per file.

That makes the expensive part free: the fork does not implement tree-sitter
parsing or tree diffing, it renders difftastic's output in a web UI. Neither GitHub
nor diffx has this today, and it is the single largest accuracy gain available.

## User stories

**US-1 — Reformat is not a change.**
As a reviewer, a pure reformat shows as no structural change.
- Given a file where only indentation and line wrapping changed, when Structural
  mode is active, then the file is reported as structurally unchanged with a notice.

**US-2 — See what actually changed.**
As a reviewer, I see which syntax nodes changed, not which lines.
- Given a call whose argument moved to a new line and whose value changed, when
  rendered, then only the value is marked changed.

**US-3 — Wrapped block.**
As a reviewer, wrapping a block in an `if` marks the `if` as added and the block as
unchanged, rather than marking every line as changed.

**US-4 — Graceful fallback.**
As a reviewer, when a file's language is unsupported or `difft` is missing, I get
the normal Unified view plus a clear one-line reason.

**US-5 — Toggle per file.**
As a reviewer, I switch a single file between Structural and the line-based modes
without changing my global default.

## Functional requirements

- **FR-001** New view mode "Structural", selectable alongside the other modes.
- **FR-002** The server invokes `difft --display json` for the file pair and returns
  the parsed result. Invocation includes `--color never` semantics implied by json
  output and must not depend on terminal width.
- **FR-003** `difft` is an **optional** dependency. When absent, the mode is shown
  disabled with the reason "difftastic not installed" and a link to installation.
- **FR-004** Detect availability once per server start (`difft --version`) and cache it.
- **FR-005** Respect difftastic's own limits: when it reports a fallback to a
  line-oriented diff (unsupported language, `--byte-limit`, `--graph-limit`), surface
  that as a notice and render the line-based view.
- **FR-006** Render structural changes with node-level emphasis, preserving
  difftastic's before/after column semantics but using diffx's Shiki highlighting.
- **FR-007** Expose `--ignore-comments` as a user setting.
- **FR-008** A structurally unchanged file is marked in the file tree, so it can be
  skipped without opening.
- **FR-009** Per-file mode override (US-5) does not overwrite the persisted global default.
- **FR-010** Structural analysis runs on demand for the opened file, not eagerly
  for the whole diff.

## Out of scope

Implementing tree-sitter parsing in the browser. Editing difftastic. Structural
diff for languages difftastic does not support.

## Edge cases

- Very large files: difftastic falls back internally; surface it (FR-005).
- New or deleted files: pass the missing side as an empty file
  (`--missing-as-empty`) rather than skipping the mode.
- Merge-conflict files: out of scope, fall back to line-based.
