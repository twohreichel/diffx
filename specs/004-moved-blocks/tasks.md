# Tasks — Feature 004 Moved Block Detection

Prerequisite: 000 complete. Reuses 002's token diff if present.

- [x] ~~**T001** Branch `feat/004-moved-blocks`.~~ Superseded — the work runs on `main`.
- [x] **T002** Record the Constitution-IV exception (client-side detection) in `plan.md`.
- [x] **T003** Run extraction and normalized keys, in `src/moves.ts` — one module carries the whole core.
- [x] **T004** [P] Unit tests: identical runs hash equal with and without re-indentation.
- [x] **T005** Exact pairing with nearest-first greedy resolution, cross-file runs last.
- [x] **T006** [P] Unit tests: single move, duplicate blocks (`ambiguous`), below-threshold non-detection.
- [x] **T007** Entropy guard at half the lines, unit-tested with a six-line `}` fixture.
- [x] **T008** Implement the fuzzy pass with K-nearest candidate capping and the 0.8 similarity floor.
- [x] **T009** [P] Unit test: moved-and-modified block returns `kind: 'modified'` with the changed lines.
- [x] **T010** Extend detection across files in one call; unit-test a cross-file move.
- [x] **T011** Detection runs in an idle callback, so the first paint never waits for it.
- [x] **T012** Moved rows render neutral with a violet bar, the badge carries the glyph, the pair id and the counterpart.
- [x] **T013** The badge is a button that scrolls to the counterpart, in this file or another one.
- [x] **T014** Inner edits keep their addition colour — see the decision in `plan.md`.
- [x] ~~**T015** Implement collapse-moved-blocks with a one-row summary and disclosure.~~ Superseded — not available against this renderer, see `plan.md`.
- [x] **T016** Settings for min lines and similarity, persisted with the others.
- [x] **T017** [P] DOM tests: badge wording, badge navigation, the marking rule per file.
- [ ] **T018** Manual check on a commit that moves a function between files and on an import-reordering commit (must produce no moves).
- [x] **T019** Changeset; commit `feat(ui): moved block detection`.
