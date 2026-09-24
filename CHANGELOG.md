# Changelog

## 0.18.0

### Minor Changes

- bd13c36: Edit a review comment in place, mark it as resolved or reopen it, and delete it in either state. Resolved comments stay visible in the review but are left out of the copied comment block.
- 983f27c: Comment on a range of lines: shift-click the gutter button to grow the open comment to the clicked line. The range is named in the form, in the bubble and in the copied comment block.
- da34bf5: Look up where a name is declared: ctrl- or cmd-click a token in the diff and a popup lists every declaration of it in the repository, with the first lines of each and a jump to the file.

### Patch Changes

- 547bd77: Smoother scrolling through a large diff: a card that is off screen skips layout and paint, the renderer keeps its options and annotations between renders instead of redrawing the file, and only a structural comparison watches for a file coming into view.

## 0.17.0

### Minor Changes

- c49f478: Add an A/B blink view mode. Blink shows one complete state of the file at a
  time, `Space` swaps between before and after, `n` and `p` jump between changes,
  and an optional auto blink cycles at 400, 800 or 1600 ms. The current state is
  named in the toolbar and repeated by a coloured pane edge, image files switch
  with the same key, and `prefers-reduced-motion` hides the automatic cycle.
- f8877e8: Add a change map panel listing the changed symbols of the whole diff

  A side panel groups every changed line under the symbol it sits in — function,
  method, class or type — and the symbols under their file. Files are ordered by
  how much of the diff they carry, each entry shows its counts and a bar sized
  against the largest change, and clicking one jumps to its first changed line.
  Moved symbols and files that only got reformatted carry a tag when the move and
  structural features supply the data.

  The panel opens from the toolbar or with `m`, filters by change kind and by path
  substring, and the file tree follows the same filters. Languages without a
  symbol pattern fall back to one entry for the whole file and the panel says so.
  The map is built after the diff is on screen, so it never delays the rows.

- a028192: Make intra-line emphasis configurable. A new setting switches between word and
  character granularity or turns the emphasis off, the choice is persisted, lines
  up to 2000 characters are diffed inside, and emphasized segments carry an
  underline so the marking does not rest on colour alone.
- 23df459: Add a live context width control to the toolbar. Context can be switched between
  0, 3, 10 and full lines without restarting diffx, with `[` and `]` as shortcuts.
  The chosen width is persisted, the view keeps the nearest changed line in place
  across a change, and comments on lines a narrower width hides are counted in the
  file header.
- c367761: Mark blocks that only moved, so the diff stops reading as a rewrite

  A block of at least five lines that leaves one place and arrives in another —
  inside a file or across two files — now renders on a neutral background with a
  violet bar instead of the addition and deletion colours. Both ends carry a badge
  naming the counterpart, the pair id and whether the block arrived unchanged, and
  the badge jumps to the other end.

  Blocks edited on the way still pair as long as they keep the configured share of
  their lines, and the lines that read differently keep their addition colour. Two
  toolbar settings control it: the smallest block reported as a move, and the
  similarity a moved-and-edited block must reach. Detection runs after the first
  paint, so the diff never waits for it.

- 8244fe2: Add a structural view mode that compares syntax trees

  A fourth mode hands both states of the open file to difftastic and colours only
  the rows it reports as structurally changed. A pure reformat keeps its `+`/`-`
  rows but shows them all unhighlighted, and the file tree marks such files with a
  `≡`. Each file header carries a switch that overrides the mode for that file
  alone, and a setting lets the comparison skip comments.

  The comparison is asked for per file and only once the file scrolls into view,
  results are cached, and a request is aborted as soon as its file is left. Where
  difftastic is missing, finds no grammar for the file or returns something this
  fork cannot read, the mode falls back to the line-based rows and names the
  reason above them.

## 0.16.0

### Minor Changes

- 9c27f70: Add draggable resizing to the file sidebar, with width and collapsed state persisted across sessions.

## 0.15.0

### Minor Changes

- 34854f2: Stick the current file's header to the top while scrolling through its diff

### Patch Changes

- 34854f2: Fix hunk-context expansion controls never appearing: files upgraded from a partial to a full diff now remount so their expand controls render

## 0.14.0

### Minor Changes

- Add soft wrap toggle for long lines in settings dropdown

## 0.13.0

### Minor Changes

- 582a7d1: Add expand-context controls above and below each change region, revealing the next 20 unchanged lines per click (#26)

### Patch Changes

- 97335db: Fix the web UI failing to load on Windows. The static-file guard compared resolved paths against a hardcoded `/`, which never matches Windows' backslash paths, so every asset was rejected with a 403. Compare against the platform separator (`path.sep`) instead.

## 0.12.1

### Patch Changes

- 7779d85: add browser setting

## 0.12.0

### Minor Changes

- 93b20e5: Add collapsible sidebar with toggle button next to the file filter input

## 0.11.0

### Minor Changes

- 0a4f752: add `--host` flag to bind the server to a custom address (e.g. `0.0.0.0` for LAN access)

## 0.10.0

### Minor Changes

- b76c8b6: Add comment status tracker in sidebar with open/replied/resolved status indicators and click-to-navigate via anchor links
- 6c3d7db: Distinguish untracked files from added files with a separate FileQuestion icon

## 0.9.0

### Minor Changes

- 39340d9: add comment replies support

## 0.8.3

### Patch Changes

- 7e42d1b: Fix button hover state where background color collides with foreground text color

## 0.8.2

### Patch Changes

- 129a23b: All internal `git diff` invocations now pass `--no-ext-diff --no-color`, so the frontend always receives a standard unified diff regardless of the user's global git configuration.

## 0.8.1

### Patch Changes

- 2a97d9b: Harden local server exposure by binding DiffX to loopback only and reduce command execution risk by replacing shell-based Git invocation with `execFileSync`.

## 0.8.0

### Minor Changes

- 5849f1b: Fix path traversal vulnerability and use random port by default

## 0.7.0 (2026-04-04)

- Persist "Viewed" file state in server memory across page refreshes

## 0.6.0 (2026-04-04)

- Support per-file tab size from `.editorconfig`
- Add settings dropdown to toolbar with default tab size option

## 0.5.0 (2026-04-04)

- Add binary file detection and image preview support
- Split review skill into start/finish workflow with comment status tracking
- Add `prepublishOnly` script

## 0.4.3 (2026-04-04)

- Add GitHub links to package.json and fix screenshot URL for npm
- Reduce font size of staged/untracked checkboxes in toolbar

## 0.4.2 (2026-04-04)

- Fix bin path to match tsdown ESM output (.mjs)

## 0.4.1 (2026-04-04)

- Add diffx-review skill for AI-assisted code review workflow

## 0.4.0 (2026-04-04)

- Add `--help` and `--version`/`-v` flags to CLI

## 0.3.0 (2026-04-04)

- Move comments from client-only state to server-side storage with API
- Add screenshot to README

## 0.2.1 (2026-04-04)

- Replace deprecated `external` with `deps.neverBundle` in tsdown config

## 0.2.0 (2026-04-04)

- Use XML format for copied comments with inline code context

## 0.1.0 (2026-04-04)

- Initial release
