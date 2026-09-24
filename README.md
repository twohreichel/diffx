# diffx

A local code review tool designed for the coding agent workflow. Review AI-generated changes in a GitHub PR-like web UI, leave inline comments, then hand them back to your coding agent to fix.

![screenshot](https://raw.githubusercontent.com/wong2/diffx/main/screenshot.png)

## Install

```bash
npm install -g diffx-cli
```

### Install this fork

The fork keeps the package name `diffx-cli` and the `diffx` command, so a global
install of a local build replaces the diffx that is already on your PATH.

```bash
git clone https://github.com/twohreichel/diffx.git
cd diffx
corepack enable        # provides the pnpm version the repo pins
pnpm install
pnpm build             # writes dist/, the only directory the package ships
npm install -g .
```

A directory install does not run the build itself, so `pnpm build` is required
before `npm install -g .`.

Check afterwards which binary answers:

```bash
which -a diffx
diffx --version
```

The fork stays ahead of the published package, so the version tells the two
apart: `0.18.0` is this fork, `0.16.x` the version from npm.

A global install lands in the node environment that is active at that moment.
Where an earlier diffx was installed under a different node version or through
Homebrew's node, that binary stays on the PATH and can still win — remove it
there with `npm uninstall -g diffx-cli`, or make sure the new one comes first.

To go back to the published version: `npm install -g diffx-cli`.

### Optional: difftastic

The **Structural** view mode compares syntax trees instead of lines, so a pure
reformat shows no change. It shells out to [difftastic](https://difftastic.wilfred.me.uk/)
and is disabled with a tooltip while that binary is missing — every other mode
works without it.

```bash
brew install difftastic          # macOS, Homebrew
cargo install difftastic         # any platform with a Rust toolchain
sudo apt install difftastic      # Debian, Ubuntu
sudo pacman -S difftastic        # Arch
```

Tested against difftastic 0.71.0.

### Optional: `.gitattributes` diff drivers

The change map starts from git's hunk header — the text after `@@ … @@` — and
corrects it with its own declaration patterns for Python, Rust, PHP, Java,
TypeScript, JavaScript and Go. For files outside that list the header is all
there is, and git only writes a useful one for languages it knows. A diff driver
per language improves it:

```gitattributes
*.php diff=php
*.py  diff=python
*.rs  diff=rust
```

PHP was the only language of the measured sample where this changed the result.
For everything else, a wider context setting helps the attribution far more,
because the patterns then see the declaration itself.

## Usage

Run in any git repository:

```bash
diffx
```

This starts a local server and opens your browser with a diff review UI.

### Options

```
diffx [options] [-- <git-diff-args>]

Options:
  -p, --port <port>   Server port (default: 3433)
  --no-open           Don't auto-open browser

Examples:
  diffx                          # Review working tree changes
  diffx -p 8080                  # Use custom port
  diffx -- HEAD~3                # Diff against 3 commits ago
  diffx -- main..HEAD            # Diff between branches
  diffx -- --cached -- src/      # Staged changes in src/
```

## Features

- **Split / Unified view** — Toggle between side-by-side and inline diff
- **Context slider** — 0, 3, 10 lines or the full file, with a warning before very large renders
- **Intra-line diff** — Word or character level highlighting inside a changed line
- **A/B blink** — Show the before and after state of a file in the same place, manually or on a timer
- **Moved block detection** — Mark a block that only changed place and jump to its counterpart
- **Structural view** — Compare syntax trees through difftastic, so a pure reformat shows no change
- **Change map** — A panel of the changed symbols grouped by file, sized, tagged and filterable
- **Definition lookup** — Ctrl- or cmd-click a name in the diff to see where it is declared, anywhere in the repository
- **Syntax highlighting** — Powered by Shiki with GitHub themes
- **File tree** — Hierarchical file browser with search filter and file change-type icons
- **Inline comments** — Click the `+` button on any line to add a review comment, shift-click a second line to cover a range
- **Comment editing** — Edit a comment in its own bubble, mark it as resolved and reopen it later
- **Comment replies** — AI agents can reply to comments via API, displayed with bot avatar in the UI
- **Comment status tracker** — Sidebar widget showing open, replied, and resolved comment counts, with resolve and delete on every entry
- **Copy comments** — One-click copy all comments as structured XML for AI coding agents
- **Image preview** — Side-by-side comparison for added, modified, and deleted images
- **Viewed tracking** — Mark files as reviewed to track progress
- **Staged / Untracked toggles** — Choose which changes to include
- **Custom diff commands** — Pass any `git diff` arguments after `--`
- **EditorConfig support** — Respects `.editorconfig` for per-file tab size
- **Persistent settings** — Your preferences are saved across sessions

## Comment Output Format

When you click "Copy comments", the output is structured XML optimized for AI agents:

```xml
<code-review-comments>
<file path="src/utils/parser.ts">
<comment line="42">
<code>+ const parsedToken = tokenize(input)</code>
Rename `x` to `parsedToken` for clarity.
</comment>
<comment line="15">
<code>- if (input != null) {</code>
This null check removal may cause a bug when `input` is undefined.
</comment>
</file>
</code-review-comments>
```

Each comment includes the commented code line with a `+`/`-` prefix indicating whether it's an added or removed line. A comment that covers several lines carries the range, as in `<comment line="42-48">`. Resolved comments are left out, so the block always describes what is still open.

## Agent Skills

Install the diffx skills to use diffx directly from your AI coding agent:

```bash
npx skills add wong2/diffx
```

The review workflow uses two commands:

1. **`/diffx-start-review`** — Launches the diffx server and opens the browser. Review your changes and leave inline comments.
2. **`/diffx-finish-review`** — The agent fetches all comments from the running diffx server via API, applies the requested changes, and marks each comment as resolved. The browser UI updates in real time as comments are resolved.

## License

MIT
