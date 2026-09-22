# Tasks — Feature 001 Context Slider

Prerequisite: `specs/000-recon/architecture.md` exists and placeholders resolve.

- [x] **T001** Superseded: the fork works on `main` by request.
- [x] **T002** Decide Design A vs B from the recon answer; record the decision and reason at the top of `plan.md`.
- [x] **T003** Add `ContextWidth` type and `contextArgs(width)` helper in a new module next to `<recon:GIT_INVOKE>`.
- [x] **T004** [P] Unit tests for `contextArgs`, including `full` and the 5000-line cap flag.
- [x] **T005** Thread the context parameter through the diff route; include it in any cache key.
- [x] **T006** Add the `context` field to the persisted settings shape at `<recon:SETTINGS>` with default `3`.
- [x] **T007** Add the toolbar control next to the Split/Unified toggle at `<recon:VIEW_TOGGLE>`. Four steps, current value visible.
- [x] **T008** Dropped, see the T002 decision in `plan.md`.
- [x] **T009** Dropped with T008.
- [x] **T010** Implement scroll anchoring on the topmost changed line in the viewport.
- [x] **T011** [P] Unit test: anchor selection never returns a context line.
- [x] **T012** Register `[` and `]` at `<recon:KEYBIND>`; verify no collision, adjust to `Shift+[`/`Shift+]` if needed and note it in `spec.md` FR-006.
- [x] **T013** Implement the hidden-comment badge on collapsed separator rows (FR-007).
- [x] **T014** Disable the control for binary/image files with an explanatory tooltip.
- [x] **T015** Implement the large-file confirm for `full` (FR-008).
- [x] **T016** [P] DOM test: context 0 renders no context rows; context 3 does.
- [ ] **T017** Manual check against a real refactoring commit in both Split and Unified. Open: needs a browser.
- [x] **T018** Changeset entry; commit `feat(ui): live context width control`.
- [ ] **T019** Open an upstream issue describing the feature before preparing a PR. Open: awaits the maintainer contact decision.
