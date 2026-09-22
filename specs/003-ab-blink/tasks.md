# Tasks — Feature 003 A/B Blink View

Prerequisite: 000 complete. Strongly preferred: 001 merged.

- [ ] **T001** Branch `feat/003-ab-blink`.
- [ ] **T002** Decide Option 1 (full-context reuse) vs Option 2 (blob route); record it in `plan.md`.
- [ ] **T003** If Option 2: add the server route returning both file states; unit-test the git invocation.
- [ ] **T004** Create pure module `blink/buildSlots.ts` with the `Slot` type.
- [ ] **T005** [P] Unit tests for `buildSlots`: same, added, removed, modified, mixed runs, file-added, file-deleted.
- [ ] **T006** [P] Unit test: slot order matches after-state order with removals reinserted at position.
- [ ] **T007** Register "Blink" as a third value of the mode selector at `<recon:VIEW_TOGGLE>`.
- [ ] **T008** Render both layers into one grid; exactly one carries `data-state="visible"`.
- [ ] **T009** Apply Shiki highlighting to both states (`<recon:HIGHLIGHT>`).
- [ ] **T010** Implement placeholder rows with hatch pattern and run labels ("3 lines added here").
- [ ] **T011** Implement the `Space` toggle with `preventDefault`, scoped to Blink mode and restored on exit.
- [ ] **T012** Implement the BEFORE/AFTER indicator: toolbar label plus coloured pane edge.
- [ ] **T013** Implement `n`/`p` change navigation with one-third-viewport scroll.
- [ ] **T014** [P] Unit test for navigation target selection and wrapping.
- [ ] **T015** Implement auto-blink with 400/800/1600 ms intervals, off by default, cancelled by any key.
- [ ] **T016** Honour `prefers-reduced-motion`: hide auto-blink, instant toggle (FR-011).
- [ ] **T017** Render comments in both layers; attach orphaned comments to placeholders (FR-009).
- [ ] **T018** Disable the mode for unchanged files and non-image binaries with tooltips (FR-008).
- [ ] **T019** Reuse the image preview for image files with the same toggle key.
- [ ] **T020** Implement the large-file threshold with fallback to Unified plus notice.
- [ ] **T021** [P] DOM test: toggling mutates only `data-state`; row offsets identical across states.
- [ ] **T022** Persist mode and auto-blink settings at `<recon:SETTINGS>`.
- [ ] **T023** Add the mode and its keys to the help overlay.
- [ ] **T024** Manual check on a refactoring commit and on a 3000-line file; tune the threshold.
- [ ] **T025** Changeset; commit `feat(ui): A/B blink view mode`.
