# Tasks — Feature 005 Structural Diff

Prerequisite: 000 complete. Strongly preferred: 002 merged (reuses `applyRanges`).

- [x] ~~**T001** Branch `feat/005-structural-diff`.~~ Superseded: the work runs on `main`.
- [x] **T002** Install difftastic locally; record the exact version in `plan.md`.
- [x] **T003** Capture a real `difft --display json` output for a small change; save as `specs/005-structural-diff/contracts/sample-difft.json`.
- [x] **T004** Write `specs/005-structural-diff/contracts/difft-json.md` documenting the observed shape and the pinned version range.
- [x] **T005** Implement availability detection (`difft --version`), cached at server start, exposed on the info route.
- [x] **T006** [P] Unit test: missing binary maps to `available: false` with the installation reason.
- [x] **T007** Implement temp-file handling for the old blob via `git show`, with cleanup in `finally`.
- [x] **T008** [P] Unit test: temp files removed on success and on error.
- [x] **T009** Implement the `difft` invocation with `--display json` and optional `--ignore-comments`. 0.71.0 has no `--missing-as-empty` and needs `DFT_UNSTABLE=yes`.
- [x] **T010** Implement `parseDifft` with defensive validation and a `ShapeError` type.
- [x] **T011** [P] Unit tests: valid sample parses; mangled sample raises `ShapeError`.
- [x] **T012** Add the `GET /api/structural` route returning the `{available, reason, result, fellBack}` envelope.
- [x] **T013** Add result caching keyed by path + blob sha + content hash + ignoreComments.
- [x] **T014** Register "Structural" as a mode at `<recon:VIEW_TOGGLE>`; disable with tooltip when unavailable.
- [x] **T015** Implement on-demand fetch for the opened file only (FR-010), with loading state and cancellation on file switch.
- [x] **T016** Render structural chunks by recolouring rows (`structuralCSS`). `applyRanges` does not exist and the renderer takes no character-range decoration, see `plan.md` § Rendering.
- [x] **T017** Implement the fallback path: `fellBack` or `ShapeError` renders Unified plus a one-line notice.
- [x] **T018** Mark structurally unchanged files in the file tree (FR-008).
- [x] **T019** Add the `--ignore-comments` setting; persist it.
- [x] **T020** Implement per-file mode override without touching the global default (FR-009).
- [x] **T021** [P] Integration tests, skipped when `difft` is absent: reformat-only and wrapped-block fixtures.
- [ ] **T022** Manual check on a reformat commit, a wrapped-block commit, and an unsupported-language file.
- [x] **T023** Document the optional dependency in the fork README with install commands per OS.
- [x] **T024** Changeset; commit `feat(ui): structural diff mode via difftastic`.
