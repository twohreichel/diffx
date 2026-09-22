# Tasks — Feature 000 Codebase Recon

- [x] **T001** Verify the fork builds: `pnpm install`, then the build script from `package.json`. Record the exact commands.
- [x] **T002** Record the current commit SHA: `git rev-parse --short HEAD`.
- [x] **T003** [P] Read `package.json`, `vite.config.ts`, `tsdown.config.ts`, `index.html`. Write the "Runtime split" section.
- [x] **T004** Locate the `git diff` invocation. Resolve `<recon:GIT_INVOKE>`. Note how `--` user args are appended.
- [x] **T005** Locate patch parsing. Resolve `<recon:DIFF_PARSE>` and `<recon:DIFF_MODEL>`. Copy the model interface verbatim into `architecture.md`.
- [x] **T006** Capture one real payload: run diffx against a small repo and save the server response to `specs/000-recon/sample-payload.json`.
- [x] **T007** Locate row building. Resolve `<recon:ROW_BUILD>`. Document how old/new line numbers are carried.
- [x] **T008** Locate the Split/Unified branch. Resolve `<recon:VIEW_TOGGLE>`, `<recon:RENDER_SPLIT>`, `<recon:RENDER_UNIFIED>`.
- [x] **T009** [P] Locate Shiki usage. Resolve `<recon:HIGHLIGHT>`. Document whether tokens are per-line or per-file.
- [x] **T010** [P] Locate settings persistence. Resolve `<recon:SETTINGS>`. Record storage key and value shape.
- [x] **T011** [P] Locate keybinding registration. Resolve `<recon:KEYBIND>`. List every shortcut already taken.
- [x] **T012** [P] Locate comment anchoring. Resolve `<recon:COMMENT_ANCHOR>` and `<recon:FILETREE>`. State whether anchors survive a re-render.
- [x] **T013** Answer the three open questions from `spec.md`.
- [x] **T014** Write `specs/000-recon/architecture.md` following the outline in `plan.md`.
- [x] **T015** Self-check: every placeholder in FR-002 resolved, every path exists (`test -f`), no `TODO` left.

## T015 self-check result

- All 12 `<recon:*>` placeholders from FR-002 resolved in `architecture.md`.
  Two resolve to a non-diffx location and say so explicitly:
  `<recon:ROW_BUILD>` and `<recon:KEYBIND>` — the first lives inside `@pierre/diffs`,
  the second does not exist at all.
- Every diffx path cited verified with `test -f` at commit `1388595`.
- No `TODO` and no unfilled section left in `architecture.md`.
