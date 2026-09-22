# Tasks — Feature 006 Change Map

Prerequisite: 000 complete. Optional inputs: 004, 005.

- [x] ~~**T001** Branch `feat/006-change-map`.~~ Superseded: the work runs on `main`.
- [x] **T002** Verify hunk headers carry function context in the parsed model (`<recon:DIFF_MODEL>`); record Option A/B/C decision in `plan.md`.
- [x] **T003** Create pure module `map/attribute.ts` implementing hunk-header attribution.
- [x] **T004** [P] Unit tests: lines attributed to the enclosing symbol across Python, Rust, PHP, Java fixtures.
- [x] **T005** [P] Unit test: lines outside any symbol land in the file's `toplevel` entry.
- [x] **T006** Create `map/buildChangeMap.ts` producing `SymbolEntry[]` with counts.
- [x] **T007** [P] Unit tests for counts and magnitude normalization.
- [x] **T008** Add optional move tagging from feature 004's `MovePair[]`.
- [x] **T009** [P] Unit test: tags present with move data, absent without it.
- [x] **T010** Add optional structural tagging and last-place sorting from feature 005's cache.
- [ ] **T011** Compute the map asynchronously after first paint (FR-009).
- [ ] **T012** Build the panel: grouped by file, files sorted by magnitude, entries with name, kind, counts, bar, tags.
- [ ] **T013** Wire entry click to the existing navigation path at `<recon:FILETREE>`; verify in every view mode.
- [ ] **T014** Implement kind and path filters; apply them to the file tree as well.
- [ ] **T015** Register the panel shortcut at `<recon:KEYBIND>` using a free key.
- [x] **T016** Implement the file-level fallback for unsupported languages (FR-008). The builder marks the group `named: false`, the panel carries the notice.
- [ ] **T017** Persist panel state and filters at `<recon:SETTINGS>`.
- [ ] **T018** [P] DOM test: clicking an entry scrolls to the first changed line in each mode.
- [ ] **T019** Manual check on a 15-file agent-generated change; judge whether Option A's accuracy suffices or Option B is needed for Rust/PHP.
- [ ] **T020** Document any `.gitattributes` diff-driver hints in the fork README.
- [ ] **T021** Changeset; commit `feat(ui): change map panel`.
