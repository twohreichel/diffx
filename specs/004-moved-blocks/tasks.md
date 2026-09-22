# Tasks — Feature 004 Moved Block Detection

Prerequisite: 000 complete. Reuses 002's token diff if present.

- [ ] **T001** Branch `feat/004-moved-blocks`.
- [ ] **T002** Record the Constitution-IV exception (client-side detection) in `plan.md`.
- [ ] **T003** Create pure module `moves/normalize.ts`: run extraction and normalized hashing.
- [ ] **T004** [P] Unit tests: identical runs hash equal with and without re-indentation.
- [ ] **T005** Create `moves/detect.ts` implementing exact pairing with nearest-first greedy resolution.
- [ ] **T006** [P] Unit tests: single move, duplicate blocks (`ambiguous`), below-threshold non-detection.
- [ ] **T007** Implement the entropy guard; unit-test with a 20-line `}` fixture.
- [ ] **T008** Implement the fuzzy pass with K-nearest candidate capping and the 0.8 similarity floor.
- [ ] **T009** [P] Unit test: moved-and-modified block returns `kind: 'modified'` with `innerEdits`.
- [ ] **T010** Extend detection across files in one call; unit-test a cross-file move.
- [ ] **T011** Run detection after first paint (idle callback/worker); ensure no render gating.
- [ ] **T012** Render moved rows: neutral background, third-hue left border, `⇄ moved` badge with pair id and source/target label.
- [ ] **T013** Make the badge a button that scrolls to the counterpart, switching files via `<recon:FILETREE>` when needed.
- [ ] **T014** Render inner edits for `modified` moves, reusing feature 002's emphasis if merged.
- [ ] **T015** Implement collapse-moved-blocks with a one-row summary and disclosure.
- [ ] **T016** Add settings for min lines and similarity; persist at `<recon:SETTINGS>`.
- [ ] **T017** [P] DOM tests: badge navigation and collapse behaviour.
- [ ] **T018** Manual check on a commit that moves a function between files and on an import-reordering commit (must produce no moves).
- [ ] **T019** Changeset; commit `feat(ui): moved block detection`.
