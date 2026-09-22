# Tasks — Feature 002 Intra-Line Diff

Prerequisite: 000 complete.

- [ ] **T001** Branch `feat/002-intra-line-diff`.
- [ ] **T002** Check the dependency tree for an existing token-diff library; record the choice (library vs own Myers) in `plan.md`.
- [ ] **T003** Create pure module `src/<recon-area>/intraline/tokenize.ts`: word and grapheme tokenizers.
- [ ] **T004** [P] Unit tests for the tokenizers, including Unicode graphemes and preserved whitespace.
- [ ] **T005** Create `intraline/pair.ts`: run pairing with the greedy-similarity fallback.
- [ ] **T006** [P] Unit tests for pairing: equal runs, unequal runs, surplus lines unpaired.
- [ ] **T007** Create `intraline/diff.ts`: token diff → character ranges, plus the similarity score.
- [ ] **T008** [P] Unit tests using the four `spec.md` examples as fixtures.
- [ ] **T009** Implement the similarity floor and verify it suppresses emphasis on unrelated pairs.
- [ ] **T010** Create `intraline/applyRanges.ts` to split Shiki spans at range boundaries.
- [ ] **T011** [P] Unit test: a range boundary inside a coloured token yields two spans of the same colour, inner one emphasized.
- [ ] **T012** Add memoization keyed by both line hashes plus granularity; add the 2000-char bail-out.
- [ ] **T013** Wire into the Unified renderer at `<recon:RENDER_UNIFIED>`.
- [ ] **T014** Wire into the Split renderer at `<recon:RENDER_SPLIT>`.
- [ ] **T015** Add CSS: background tint plus bottom border for added/removed segments, AA contrast in both Shiki GitHub themes.
- [ ] **T016** Add the word/char granularity toggle and persist it at `<recon:SETTINGS>`.
- [ ] **T017** [P] DOM tests for both renderers.
- [ ] **T018** Manual check against (a) a signature change, (b) an identifier rename, (c) a pure reformat commit. The reformat case must not become noisier than before.
- [ ] **T019** Changeset; commit `feat(ui): word- and character-level intra-line diff`.
