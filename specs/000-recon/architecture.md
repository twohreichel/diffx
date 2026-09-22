# diffx architecture (recon, 1388595)

Written against `upstream/main` at commit `1388595` (`chore: release package (#37)`,
version 0.16.0). Re-run this recon after any large merge from upstream.

## The one finding that reshapes every later feature

**diffx does not own a diff parser, a row builder, a renderer or a highlighter.**
All four live in `@pierre/diffs`, a third-party package that ships the diff view as a
Shadow-DOM web component. diffx is the *shell* around it: a CLI, a Hono server that
shells out to `git`, a file tree, a comment store, and a toolbar.

Consequence for the `<recon:*>` placeholders in features 001–006: several of them do
not resolve to a diffx path at all. They resolve into the dependency, and the code
behind them is not ours to edit. Every feature must therefore either

- configure the dependency through its options object (cheap, upstreamable), or
- render its own view next to the dependency's (FORK-ONLY, more code).

Which of the two applies per feature is recorded in "Impact per feature" below.

## Runtime split

| Process | Code | Entry |
|---|---|---|
| Node (CLI + HTTP server) | `src/cli.ts`, `src/server.ts`, `src/git.ts`, `src/settings.ts`, `src/comments.ts`, `src/path.ts` | `bin.diffx` → `dist/cli.mjs`, bundled by tsdown |
| Browser (SPA) | `src/ui/**` | `index.html` → `src/ui/main.tsx`, bundled by Vite to `dist/client` |

`src/cli.ts` picks a free port, verifies it is inside a git repository, starts the
Hono app and opens a browser. The server also serves the built client from
`dist/client` via a catch-all route, falling back to `index.html` for any unknown path.

Communication is plain HTTP JSON, no websocket and no polling for diff content.
The only polling is `useComments`, which refetches `/api/comments` every 3000 ms
(`@tanstack/react-query` `refetchInterval`).

### HTTP routes

| Route | Purpose |
|---|---|
| `GET /api/diff?staged&untracked` | the whole patch plus metadata — the single diff payload |
| `GET /api/file-content?path&version` | raw bytes of one file side, used for image previews |
| `GET /api/file-versions?path&oldOid&newOid&staged&untracked` | full old/new text of one file, so the client can upgrade a partial diff to a full one |
| `GET`/`PUT /api/settings` | persisted settings |
| `GET`/`PUT /api/viewed` | per-file "viewed" marks, in-memory only |
| `GET`/`POST`/`PUT`/`DELETE /api/comments…` | review comments, in-memory only |

`/api/file-versions` is access-controlled: the requested blob oids must appear on the
`index` line of a freshly recomputed diff for that path, which keeps arbitrary
repository blobs unreachable.

## Data flow

```
git diff --no-ext-diff --no-color [-U3 implicit]
    │  src/git.ts  getGitDiff / getCustomGitDiff        (execFileSync)
    ▼
unified patch text
    │  src/server.ts  GET /api/diff                     (+ binaryFiles, tabSizeMap)
    ▼
JSON { patch, repoName, branch, customMode, binaryFiles, tabSizeMap, untrackedFiles }
    │  src/ui/hooks/useDiff.ts                          (fetch on staged/untracked change)
    ▼
patch string
    │  @pierre/diffs  parsePatchFiles(patch)            in src/ui/App.tsx
    ▼
FileDiffMetadata[]   (isPartial: true — hunk lines only)
    │  src/ui/hooks/useFullDiffs.ts                     fetch /api/file-versions
    │  @pierre/diffs  processFile(chunk, {oldFile, newFile})
    ▼
FileDiffMetadata[]   (isPartial: false — whole file, enables context expansion)
    │  src/ui/components/DiffViewer.tsx → FileDiffCard.tsx
    ▼
<FileDiff> from @pierre/diffs/react — Shadow DOM, Shiki highlighting, split/unified
```

## Resolved placeholders

| Placeholder | Resolves to | Notes |
|---|---|---|
| `<recon:GIT_INVOKE>` | `src/git.ts:getGitDiff` / `src/git.ts:getCustomGitDiff` | `execFileSync('git', ['diff', '--no-ext-diff', '--no-color', ...args])`. Custom args come from CLI positionals after `--` and are passed through verbatim by `src/cli.ts`. No `-U` flag today, so git's default of 3 applies. |
| `<recon:DIFF_PARSE>` | `@pierre/diffs:parsePatchFiles`, called in `src/ui/App.tsx:App` | Client-side. `@pierre/diffs:processFile` re-parses one file chunk with full contents in `src/ui/hooks/useFullDiffs.ts:useFullDiffs`. |
| `<recon:DIFF_MODEL>` | `@pierre/diffs:FileDiffMetadata` | Shape below. Not editable — treat as an external contract. |
| `<recon:ROW_BUILD>` | `@pierre/diffs` internal (`DiffHunksRenderer`) | **No diffx code builds rows.** The web component turns `FileDiffMetadata` into DOM itself. |
| `<recon:VIEW_TOGGLE>` | `src/ui/components/Toolbar.tsx` (buttons) → `settings.diffStyle` → `src/ui/components/FileDiffCard.tsx` `options.diffStyle` | The toggle is diffx's; the branch it drives is the dependency's. |
| `<recon:RENDER_SPLIT>` | `@pierre/diffs/react:FileDiff` with `options.diffStyle: 'split'` | Not a diffx module. |
| `<recon:RENDER_UNIFIED>` | `@pierre/diffs/react:FileDiff` with `options.diffStyle: 'unified'` | Not a diffx module. A third value `'both'` exists and is unused by diffx. |
| `<recon:HIGHLIGHT>` | `@pierre/diffs` internal Shiki integration; configured in `src/ui/components/FileDiffCard.tsx` via `options.theme` / `options.themeType` | Themes `github-dark` / `github-light`, `themeType: 'system'`. Tokenization happens inside the component, per line, in a worker. **Shiki spans are inside a shadow root and are not reachable from diffx code.** |
| `<recon:SETTINGS>` | server: `src/settings.ts:loadSettings` / `saveSettings`; client: `src/ui/hooks/useSettings.ts:useSettings` | File `~/.config/diffx/settings.json`. Shape below. A second, unrelated store is `src/ui/sidebarStorage.ts` on `localStorage` key `diffx-sidebar-preferences`. |
| `<recon:KEYBIND>` | **does not exist** | There is no keyboard shortcut registration anywhere in `src/`. See "Keyboard shortcuts already taken". |
| `<recon:FILETREE>` | `src/ui/components/FileTree.tsx:FileTree`; selection state is `activeFile` in `src/ui/App.tsx:App`, navigation is `App.tsx:handleFileClick` | Navigation is `document.getElementById('file-'+path).scrollIntoView()`. The id is set on the wrapper in `FileDiffCard`. |
| `<recon:COMMENT_ANCHOR>` | `src/types.ts:ReviewComment`; produced in `src/ui/App.tsx:fileAnnotationsMap`, consumed as `lineAnnotations` by `FileDiffCard` | Anchor is `(filePath, side, lineNumber)`. See "Line identity contract". |

Every diffx path above exists in the working tree at commit `1388595`.

## The diff model

`FileDiffMetadata` as observed at runtime (captured in `sample-payload.json`):

```ts
interface FileDiffMetadata {
  name: string                 // new-file path, from the `+++ b/<path>` header
  prevName?: string            // old path, present on renames
  type: 'new' | 'deleted' | 'change' | 'rename-changed' | ...
  mode?: string                // e.g. '100644'
  prevObjectId?: string        // blob oid from the patch `index` line
  newObjectId?: string
  isPartial: boolean           // true  = *Lines arrays hold hunk lines only
                               // false = *Lines arrays hold the whole file
  hunks: Hunk[]
  additionLines: string[]      // new side, each entry keeps its trailing '\n'
  deletionLines: string[]      // old side
  splitLineCount: number
  unifiedLineCount: number
  cacheKey?: string
}

interface Hunk {
  additionStart: number        // 1-based new-file line number where the hunk starts
  additionCount: number        // lines of the new side in this hunk
  additionLineIndex: number    // index into additionLines where the hunk starts
  deletionStart: number
  deletionCount: number
  deletionLineIndex: number
  hunkContent: HunkSegment[]   // the change/context structure, see below
  hunkContext?: string         // the text after `@@ … @@`, git's enclosing symbol
  hunkSpecs: string            // the raw `@@ … @@` header line
  collapsedBefore: number      // unchanged lines skipped before this hunk
  splitLineStart: number; splitLineCount: number
  unifiedLineStart: number; unifiedLineCount: number
  noEOFCRAdditions: boolean; noEOFCRDeletions: boolean
}

type HunkSegment =
  | { type: 'context'; lines: number; additionLineIndex: number; deletionLineIndex: number }
  | { type: 'change'; additions: number; deletions: number; additionLineIndex: number; deletionLineIndex: number }
```

Concrete instance — the patch

```diff
@@ -1,7 +1,8 @@
 const a = 1
-function getUserById(id: string) {
-  return fetch(`/u/${id}`, { timeout: 30 })
+function findUserById(id: string) {
+  return fetch(`/u/${id}`, { timeout: 60 })
 }
 const b = 2
+const c = 3
 const d = 4
```

yields one hunk:

```json
{
  "additionStart": 1, "additionCount": 8, "additionLineIndex": 0,
  "deletionStart": 1, "deletionCount": 7, "deletionLineIndex": 0,
  "hunkSpecs": "@@ -1,7 +1,8 @@\n",
  "hunkContent": [
    { "type": "context", "lines": 1,                  "additionLineIndex": 0, "deletionLineIndex": 0 },
    { "type": "change",  "additions": 2, "deletions": 2, "additionLineIndex": 1, "deletionLineIndex": 1 },
    { "type": "context", "lines": 2,                  "additionLineIndex": 3, "deletionLineIndex": 3 },
    { "type": "change",  "additions": 1, "deletions": 0, "additionLineIndex": 5, "deletionLineIndex": 5 },
    { "type": "context", "lines": 1,                  "additionLineIndex": 6, "deletionLineIndex": 5 }
  ]
}
```

with `additionLines = ["const a = 1\n", "function findUserById(id: string) {\n", …]`.

## Line identity contract

This is what features 002–006 must not break.

- A line is addressed by **side plus 1-based file line number**: `('additions' | 'deletions', lineNumber)`. `AnnotationSide` in `@pierre/diffs` uses exactly these two strings, and `ReviewComment.side` reuses them.
- The **file line number** is derived from a hunk, not stored per line:
  `fileLine = hunk.additionStart + (index - hunk.additionLineIndex)` for the new side, and the mirror with `deletionStart`/`deletionLineIndex` for the old side.
- `hunkContent` carries the change structure. `additionLineIndex` and `deletionLineIndex` on a segment are **indices into the `*Lines` arrays**, never line numbers.
- On a **full** diff (`isPartial: false`) the arrays are the whole file, so index + 1 is the line number and any line is addressable — this is what `FileDiffCard.getLineContent` exploits.
- Lines keep their trailing `\n`. Comparisons must normalize it.

**Comments are anchored by line number, not by content hash.** `ReviewComment.lineContent` is stored, but only for rendering and for the clipboard export in `useComments.formatAllComments` — nothing validates it against the current file. A re-render is therefore safe, but a re-fetch that shifts line numbers silently moves comments.

## Rendering: where the mode branch lives

`src/ui/components/FileDiffCard.tsx` is the single place that instantiates the view.
The complete options object it passes today:

```tsx
options={{
  diffStyle,                                        // 'split' | 'unified'
  stickyHeader: true,
  expansionLineCount: 20,
  enableGutterUtility: true,
  theme: { dark: 'github-dark', light: 'github-light' },
  themeType: 'system',
  overflow: softWrap ? 'wrap' : 'scroll',
  unsafeCSS: `:host { --diffs-tab-size: ${tabSize}; }`,
}}
```

`unsafeCSS` with a `:host` selector confirms the Shadow DOM: this is the only
supported way to reach inside. There is no way to walk or patch the rendered spans
from diffx.

### Options the dependency supports and diffx does not use

Extracted from the package's `CODE_VIEW_DIFF_OPTION_KEYS`:

`theme`, `disableLineNumbers`, `overflow`, `themeType`, `disableFileHeader`,
`disableVirtualizationBuffers`, `preferredHighlighter`, `useCSSClasses`,
`useTokenTransformer`, `tokenizeMaxLineLength`, `tokenizeMaxLength`, `unsafeCSS`,
`diffStyle`, `diffIndicators`, `disableBackground`, **`expandUnchanged`**,
**`collapsedContextThreshold`**, **`lineDiffType`**, **`maxLineDiffLength`**,
`expansionLineCount`, `lineHoverHighlight`, `enableTokenInteractionsOnWhitespace`,
`enableGutterUtility`, `enableLineSelection`, `controlledSelection`,
`disableErrorHandling`.

The four in bold decide two of the six features:

- `lineDiffType: 'word-alt' | 'word' | 'char' | 'none'` together with
  `maxLineDiffLength: number` — **intra-line diffing is already implemented in the
  dependency.** Feature 002 does not need a tokenizer, a Myers implementation or
  Shiki span splitting.
- `expandUnchanged: boolean` renders the complete file instead of hunks.
  `collapsedContextThreshold: number` decides how much unchanged context around a
  hunk is shown before it collapses. Both are client-side and take effect without a
  server round trip. Feature 001's "widen" and "full" steps need no re-fetch.

Further useful exports: `trimPatchContext(patch, contextSize)` narrows a patch
client-side, `getSingularPatch`, `parseLineType`, `getTotalLineCountFromHunks`,
`codeToHtml` (Shiki, usable for a fork-owned renderer), `prefersReducedMotion`.

## Settings persistence

Server, `src/settings.ts`: `~/.config/diffx/settings.json`, whole-object read,
shallow merge on write, defaults filled in on read.

```ts
interface Settings {                   // src/settings.ts (server)
  staged: boolean                      // default true
  untracked: boolean                   // default true
  diffStyle: 'split' | 'unified'       // default 'split'
  defaultTabSize: number               // default 4
  browser?: string
}
```

The client mirror in `src/ui/hooks/useSettings.ts` carries one extra field,
`softWrap: boolean` (default `false`), which the server type does not declare — it
survives only because `saveSettings` merges unknown keys through. **Adding a field
means adding it in both places**, or it is dropped from the server type but kept in
the file.

`updateSettings(patch)` writes optimistically: local state first, `PUT /api/settings`
fire-and-forget, no error handling.

Unrelated second store: `src/ui/sidebarStorage.ts`, `localStorage` key
`diffx-sidebar-preferences`, shape `{ size: number, collapsed: boolean }`.

## Keyboard shortcuts already taken

**No global shortcut exists.** There is exactly one `keydown` handler in `src/`, and it
is local to the comment textarea: `src/ui/components/CommentForm.tsx:handleKeyDown`
binds `Cmd`/`Ctrl+Enter` to submit and `Escape` to cancel, on the element only. The
only other document-level listener is a `mousedown` in `Toolbar.tsx` that closes the
settings menu.

Consequences:

- Features 001, 003 and 006 may take any key they like — there is no collision
  inside diffx. Feature 001's FR-006 fallback to `Shift+[` / `Shift+]` is not needed.
- There is **no keybinding infrastructure to extend**. Whichever feature lands first
  has to create it, and the others reuse it.
- Browser defaults are the only constraint. `Space` (feature 003, FR-004) is page-down
  and does need `preventDefault`.
- Any global handler must ignore events whose target is an `input`, `textarea` or
  `contenteditable`, or it will swallow `[`, `]`, `m`, `n`, `p` and `Space` while a
  reviewer types a comment.
- There is no help overlay either (features 003 T023, 001 FR-006 discoverability).

## Build and test commands

From `package.json` at commit `1388595`:

| Command | Effect |
|---|---|
| `pnpm build` | `vite build && tsdown` — client to `dist/client`, CLI to `dist/cli.mjs` |
| `pnpm dev:client` | Vite dev server, proxies `/api` to `localhost:3433` |
| `pnpm dev:server` | `tsx src/cli.ts --no-open -p 3433` |
| `pnpm release` | build, then `changeset publish` |
| `pnpm changeset` / `pnpm version-packages` | changesets |

**There was no test setup of any kind** — no test runner in the dependency tree, no
test script, no test file, no CI workflow running one (`.github/` holds only a
release workflow). This recon added vitest, `vitest.config.ts`, `test/setup.ts` and
the scripts `pnpm test`, `pnpm test:watch`, `pnpm typecheck`, because Constitution X
makes a tested pure core the definition of done.

Node: the repo declares no `engines`. The build fails on Node 18 and warns on
Node 22.17; Node 24 is what this work uses.

## Impact per feature

| Feature | Verdict after recon |
|---|---|
| 001 Context slider | Plan's Design A holds for narrowing (`-U0`), but "widen" and "full" are better served client-side by `collapsedContextThreshold` / `expandUnchanged`, which cost no round trip. Server `-U<n>` still needed to go **below** git's default of 3. Cache key: none exists, nothing to extend. |
| 002 Intra-line diff | **Already implemented in the dependency.** The feature collapses to exposing `lineDiffType` and `maxLineDiffLength` as a persisted setting plus a toggle. The plan's tokenizer, Myers diff, pairing and `applyRanges` are dead work — writing them would violate the Lazy-Senior Ladder rung 4. `applyRanges` therefore does **not** become available to feature 005, which must render its own view. |
| 003 A/B Blink | Cannot be built inside `<FileDiff>`: the two-layer grid needs DOM diffx does not own. Needs a **fork-owned renderer**, fed by the full file contents `/api/file-versions` already returns and highlighted with the exported `codeToHtml`. Plan's Option 1 is the right source of data. Plan's "render both layers once" idea survives unchanged. |
| 004 Moved blocks | Detection is pure over `FileDiffMetadata` and fully feasible, cross-file included. **Decorating existing rows is not possible** — no access to the shadow DOM. Render the result as a fork-owned panel plus navigation instead, and drop the in-row badge. |
| 005 Structural diff | Server side (difft invocation, parsing, caching, availability) is unaffected and feasible. Rendering must be fork-owned, and cannot reuse feature 002's `applyRanges` because that module will not exist. |
| 006 Change map | `hunk.hunkContext` carries git's enclosing symbol and is populated for real TypeScript files (verified in `sample-payload.json`). Option A is viable as planned. The panel is fork-owned, which is what the plan already assumed. |

## Risks for the view-mode features

- **The dependency is the renderer.** Any feature that needs per-line DOM control
  must bring its own renderer. That is the dominant cost driver in 003, 004 and 005.
- **`@pierre/diffs` is a devDependency**, not a dependency — it is bundled into the
  client at build time. A fork-owned renderer that imports `codeToHtml` inherits that
  arrangement and must not move into the server bundle.
- **No keybinding infrastructure and no help overlay** exist. Both are new surface,
  and both are shared by three features.
- **Comments are anchored by line number.** Any feature that changes which lines are
  fetched (001's `-U0`) leaves comment anchors pointing at lines that are no longer
  rendered. Features must surface, not silently drop, such comments.
- **Settings shape is declared twice** and the two declarations already disagree.
  Every new field has to be added in both files.
