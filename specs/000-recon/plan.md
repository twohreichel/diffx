# Plan — Feature 000 Codebase Recon

## Technical context

Fork of wong2/diffx. Stack per repository metadata: TypeScript (~78%), CSS (~18%),
Vite for the web UI, tsdown for the CLI bundle, pnpm workspace, Shiki for syntax
highlighting, changesets for releases. Source lives in `src/`; `index.html` is the
UI entry point.

## Constitution check

| Principle | Status |
|---|---|
| I Comprehension | N/A — enabling feature |
| II Additive | PASS — read-only |
| III Upstream compat | PASS — `architecture.md` is fork-local documentation |
| X Testing | N/A — no code produced |

## Approach

Read-only exploration, breadth first, then depth on the three seams. Do not open
every file: start from the entry points and follow imports.

1. Entry points first: `package.json` (`bin`, `scripts`, `exports`), `index.html`,
   `vite.config.ts`, `tsdown.config.ts`. These reveal the CLI/UI split.
2. Server side: find the process spawn for `git`. Trace what it does with stdout.
3. Wire: find the HTTP route(s) the UI calls, and the payload type.
4. Client side: find where the payload becomes rows, then where the mode toggle
   picks a renderer. That branch point is the insertion point for features 001–006.
5. Cross-cutting: settings persistence, keybindings, Shiki invocation, comment anchoring.

## Output artifact

`specs/000-recon/architecture.md` with this outline:

```markdown
# diffx architecture (recon, <commit-sha>)

## Runtime split
## Data flow (git → server → wire → client → DOM)
## Resolved placeholders
| placeholder | path:symbol | notes |
## The diff model
<TypeScript interface, verbatim, plus one concrete example instance>
## Line identity contract
## Rendering: where the mode branch lives
## Settings persistence
## Keyboard shortcuts already taken
## Build & test commands
## Risks for the view-mode features
```

## Risks

- **Code may be bundled or minified in `dist/`.** Only read `src/`.
- **The mode branch may be spread across component and CSS.** Record both.
- **Upstream may move fast.** Stamp `architecture.md` with the commit SHA it was
  written against and re-run recon after any large merge from upstream.
