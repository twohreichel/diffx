# difftastic JSON — observed shape

**Tested against:** difftastic 0.71.0 (`cargo install difftastic --locked`, macOS aarch64).
**Supported range:** 0.6x–0.7x. The format is explicitly unstable, so the fork parses it
defensively and treats any mismatch as a fallback to the line-based view.

## Invocation

```
DFT_UNSTABLE=yes difft --display json --width 120 [--ignore-comments] OLD_PATH NEW_PATH
```

- **`DFT_UNSTABLE=yes` is mandatory.** Without it 0.71.0 refuses JSON output and exits 2 with
  `JSON output is an unstable feature`.
- **`--width 120`** pins the wrapping calculation, so the result does not depend on the terminal
  the server happens to run in.
- **`--missing-as-empty` does not exist** in this version. The fork writes both sides to temp
  files anyway, so an added file is an empty old file and difftastic reports `status: "created"`.
- Both temp files keep the original file name, because the extension is how difftastic picks
  its grammar.

## Response

One JSON object per file pair (an array only when a directory is compared, which the fork never
does).

| Key | Type | Notes |
|---|---|---|
| `path` | string | The file name as passed on the command line. |
| `language` | string | `"TypeScript"`, `"Text"`, … `"Text"` means difftastic found no grammar. |
| `status` | string | `changed`, `unchanged`, `created`, `deleted`. |
| `aligned_lines` | `[number \| null, number \| null][]` | Row alignment, 0-based. Absent unless `status` is `changed`. |
| `chunks` | `Chunk[][]` | Absent unless `status` is `changed`. |

```
Chunk = { lhs?: Side, rhs?: Side }
Side  = { line_number: number, changes: Change[] }
Change = { start: number, end: number, content: string, highlight: string }
```

- `line_number` is **0-based**, `start`/`end` are byte offsets into that line.
- A chunk carries only the sides that changed, so `lhs` or `rhs` can be absent.
- `highlight` names difftastic's own token class (`string`, `normal`, `keyword`, …). The fork
  ignores it and keeps its own Shiki highlighting.

## Observed behaviour

- A pure reformat (re-indentation, re-wrapping a call across lines) reports
  `status: "unchanged"` and carries no `chunks` key at all.
- Changing a string inside a re-wrapped call reports exactly that string as the only change.
- An unsupported extension reports `language: "Text"` and a line-shaped result, which is
  difftastic's own fallback and the notice the fork surfaces.
- A created or deleted file reports the status and no chunks.

## Samples

- `sample-difft.json` — a changed TypeScript file, captured from a real invocation.
- `sample-difft-unchanged.json` — the reformat-only case.
- `sample-difft-text.json` — the no-grammar fallback.
