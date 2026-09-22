# Tasks — Feature 003 A/B Blink View

Prerequisite: 000 complete. Strongly preferred: 001 merged.

- [x] **T001** ~~Branch `feat/003-ab-blink`~~ — superseded: the work runs on `main`.
- [x] **T002** Decide Option 1 (full-context reuse) vs Option 2 (blob route); record it in `plan.md`.
- [x] **T003** ~~Server route for both file states~~ — not needed, Option 1 was chosen.
- [x] **T004** ~~Pure module `blink/buildSlots.ts`~~ — superseded, see plan Decision (T002). `src/blink.ts` holds the mode, the state and the change regions instead.
- [x] **T005** ~~Unit tests for `buildSlots`~~ — superseded with T004.
- [x] **T006** ~~Unit test on slot order~~ — superseded with T004. The renderer guarantees the alignment through its gap rows.
- [x] **T007** Register "Blink" as a third value of the mode selector at `<recon:VIEW_TOGGLE>`.
- [x] **T008** Exactly one state on screen — `blinkCSS` hides one column of the renderer's split grid.
- [x] **T009** Shiki highlighting in both states — the renderer does it, both columns are its own.
- [x] **T010** Placeholder rows are the renderer's gap rows, unlabelled — see plan Decision (T002).
- [x] **T011** Implement the `Space` toggle with `preventDefault`, scoped to Blink mode and restored on exit.
- [x] **T012** Implement the BEFORE/AFTER indicator: toolbar label plus coloured pane edge.
- [x] **T013** Implement `n`/`p` change navigation with one-third-viewport scroll.
- [x] **T014** [P] Unit test for navigation target selection and wrapping.
- [x] **T015** Implement auto-blink with 400/800/1600 ms intervals, off by default, cancelled by any key.
- [x] **T016** Honour `prefers-reduced-motion`: hide auto-blink, instant toggle (FR-011).
- [x] **T017** Comments follow the column they sit on, nothing is orphaned — see plan Decision (T002).
- [x] **T018** Nothing is disabled per file, the mode is global and shows nothing wrong — see plan Decision (T002).
- [x] **T019** Reuse the image preview for image files with the same toggle key.
- [x] **T020** Large-file threshold — feature 001's `FULL_CONTEXT_LINE_CAP` confirm, asked when switching into Blink.
- [x] **T021** [P] DOM test: toggling swaps only the hidden column, and `n`/`p` read the position from the column on screen.
- [x] **T022** Persist mode and auto-blink settings at `<recon:SETTINGS>`.
- [x] **T023** No help overlay exists — the keys live in the mode control's tooltip and in the README.
- [ ] **T024** Manual check on a refactoring commit and on a 3000-line file — open, needs a browser.
- [x] **T025** Changeset; commit `feat(ui): A/B blink view mode`.
