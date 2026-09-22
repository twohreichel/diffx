# Tasks — Feature 005 Structural Diff

Prerequisite: 000 complete. Strongly preferred: 002 merged (reuses `applyRanges`).

- [ ] **T001** Branch `feat/005-structural-diff`.
- [ ] **T002** Install difftastic locally; record the exact version in `plan.md`.
- [ ] **T003** Capture a real `difft --display json` output for a small change; save as `specs/005-structural-diff/contracts/sample-difft.json`.
- [ ] **T004** Write `specs/005-structural-diff/contracts/difft-json.md` documenting the observed shape and the pinned version range.
- [ ] **T005** Implement availability detection (`difft --version`), cached at server start, exposed on the info route.
- [ ] **T006** [P] Unit test: missing binary maps to `available: false` with the installation reason.
- [ ] **T007** Implement temp-file handling for the old blob via `git show`, with cleanup in `finally`.
- [ ] **T008** [P] Unit test: temp files removed on success and on error.
- [ ] **T009** Implement the `difft` invocation with `--display json --missing-as-empty` and optional `--ignore-comments`.
- [ ] **T010** Implement `parseDifft` with defensive validation and a `ShapeError` type.
- [ ] **T011** [P] Unit tests: valid sample parses; mangled sample raises `ShapeError`.
- [ ] **T012** Add the `GET /api/structural` route returning the `{available, reason, result, fellBack}` envelope.
- [ ] **T013** Add result caching keyed by path + blob sha + content hash + ignoreComments.
- [ ] **T014** Register "Structural" as a mode at `<recon:VIEW_TOGGLE>`; disable with tooltip when unavailable.
- [ ] **T015** Implement on-demand fetch for the opened file only (FR-010), with loading state and cancellation on file switch.
- [ ] **T016** Render structural chunks using feature 002's `applyRanges` over Shiki spans.
- [ ] **T017** Implement the fallback path: `fellBack` or `ShapeError` renders Unified plus a one-line notice.
- [ ] **T018** Mark structurally unchanged files in the file tree (FR-008).
- [ ] **T019** Add the `--ignore-comments` setting; persist it.
- [ ] **T020** Implement per-file mode override without touching the global default (FR-009).
- [ ] **T021** [P] Integration tests, skipped when `difft` is absent: reformat-only and wrapped-block fixtures.
- [ ] **T022** Manual check on a reformat commit, a wrapped-block commit, and an unsupported-language file.
- [ ] **T023** Document the optional dependency in the fork README with install commands per OS.
- [ ] **T024** Changeset; commit `feat(ui): structural diff mode via difftastic`.
