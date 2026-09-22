# Tasks — Feature 002 Intra-Line Diff

Prerequisite: 000 complete.

- [x] **T001** Superseded: the fork works on `main` by request.
- [x] **T002** Check the dependency tree for an existing token-diff library; record the choice (library vs own Myers) in `plan.md`.
- [x] ~~**T003**~~ Dropped: the renderer already implements it, see the T002 decision in `plan.md`.
  - Original: Create pure module `src/<recon-area>/intraline/tokenize.ts`: word and grapheme tokenizers.
- [x] ~~**T004**~~ Dropped: the renderer already implements it, see the T002 decision in `plan.md`.
  - Original: [P] Unit tests for the tokenizers, including Unicode graphemes and preserved whitespace.
- [x] ~~**T005**~~ Dropped: the renderer already implements it, see the T002 decision in `plan.md`.
  - Original: Create `intraline/pair.ts`: run pairing with the greedy-similarity fallback.
- [x] ~~**T006**~~ Dropped: the renderer already implements it, see the T002 decision in `plan.md`.
  - Original: [P] Unit tests for pairing: equal runs, unequal runs, surplus lines unpaired.
- [x] ~~**T007**~~ Dropped: the renderer already implements it, see the T002 decision in `plan.md`.
  - Original: Create `intraline/diff.ts`: token diff → character ranges, plus the similarity score.
- [x] ~~**T008**~~ Dropped: the renderer already implements it, see the T002 decision in `plan.md`.
  - Original: [P] Unit tests using the four `spec.md` examples as fixtures.
- [ ] **T009** Open: the renderer offers no hook for a per-pair floor, see the T002 decision in `plan.md`.
- [x] ~~**T010**~~ Dropped: the renderer already implements it, see the T002 decision in `plan.md`.
  - Original: Create `intraline/applyRanges.ts` to split Shiki spans at range boundaries.
- [x] ~~**T011**~~ Dropped: the renderer already implements it, see the T002 decision in `plan.md`.
  - Original: [P] Unit test: a range boundary inside a coloured token yields two spans of the same colour, inner one emphasized.
- [x] **T012** Add memoization keyed by both line hashes plus granularity; add the 2000-char bail-out.
- [x] **T013** Wire into the Unified renderer at `<recon:RENDER_UNIFIED>`.
- [x] **T014** Wire into the Split renderer at `<recon:RENDER_SPLIT>`.
- [x] **T015** Add CSS: background tint plus bottom border for added/removed segments, AA contrast in both Shiki GitHub themes.
- [x] **T016** Add the word/char granularity toggle and persist it at `<recon:SETTINGS>`.
- [x] **T017** [P] DOM tests for both renderers.
- [ ] **T018** Manual check against (a) a signature change, (b) an identifier rename, (c) a pure reformat commit. Open: needs a browser.
- [x] **T019** Changeset; commit `feat(ui): word- and character-level intra-line diff`.
