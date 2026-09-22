# Feature 006 — Change Map

**Status:** ready
**Classification:** UPSTREAM-CANDIDATE
**Depends on:** 000; better with 004 and 005
**Effort:** M

## Why

Every current view starts at the line level. For an agent-generated change touching
15 files, the first question is not "what does line 42 say" but "which parts of the
system moved". There is no view that answers that, so the reader builds the overview
by scrolling — the most expensive possible way to get it.

A change map answers it in one screen: which symbols changed, how much, and in what
way. Overview first, detail second.

## User stories

**US-1 — Symbol-level overview.**
As a reviewer opening a large change, I see a list of changed symbols — functions,
methods, classes, types — rather than a list of files and line counts.
- Given a diff touching 3 functions in one file, when I open the map, then I see
  three entries with their names and change magnitude, not one file entry.

**US-2 — Jump in.**
As a reviewer, I click a symbol and land on its first changed line in the current view mode.

**US-3 — Magnitude at a glance.**
As a reviewer, each entry shows added/removed counts and a proportional bar, so I
can tell a one-line tweak from a rewrite without opening it.

**US-4 — Kind of change.**
As a reviewer, entries are tagged: added, removed, modified, moved (from 004),
structurally unchanged (from 005), so I can skip whole categories.

**US-5 — Filter.**
As a reviewer, I filter the map by kind and by path, and the file tree follows the filter.

## Functional requirements

- **FR-001** A map panel listing changed symbols grouped by file, openable from the
  toolbar and via a keyboard shortcut.
- **FR-002** Symbol extraction per language for at least: Python, Rust, PHP, Java,
  TypeScript, JavaScript, Go.
- **FR-003** Each entry shows: symbol name, kind (function/method/class/type/other),
  file path, added/removed line counts, a proportional magnitude bar, and change tags.
- **FR-004** Clicking an entry navigates to the symbol's first changed line in the
  active view mode.
- **FR-005** Entries outside any symbol (imports, top-level config, module-level
  statements) are grouped under a per-file "top level" entry — never dropped.
- **FR-006** Filters: by change kind and by path substring; filters apply to the
  file tree as well.
- **FR-007** When 004 is present, moved symbols are tagged `moved`. When 005 is
  present, structurally unchanged files are tagged and sorted last.
- **FR-008** Extraction failure for a language degrades to file-level entries with
  a notice; it never blocks the map.
- **FR-009** The map is computed asynchronously and does not delay the diff render.
- **FR-010** Panel open/closed state and active filters persist.

## Out of scope

Call-graph or dependency analysis. Cross-symbol impact estimation. Ranking by risk.

## Edge cases

- Nested functions and closures: attribute changes to the nearest enclosing named symbol.
- Anonymous functions assigned to a variable: use the variable name.
- Files with no recognizable symbols: single "top level" entry.
- Deleted files: all symbols tagged `removed`, collapsed by default.
