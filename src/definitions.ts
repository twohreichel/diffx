import { execFileSync } from 'node:child_process'
import { parseDeclaration, type SymbolKind } from './map/attribute.js'
import { getWorktreeFileContent } from './git.js'

/** How many lines of the declaration the preview carries. */
const PREVIEW_LINES = 8

/** Beyond this many declarations the popup stops being a shortcut. */
const MAX_RESULTS = 12

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

/** Where a name is declared, with the first lines of the declaration. */
export interface Definition {
  path: string
  line: number
  kind: SymbolKind
  lines: string[]
}

/** One `git grep -n` line, `path:line:text`. */
function parseHit(hit: string): { path: string; line: number; text: string } | null {
  const match = hit.match(/^([^:]+):(\d+):(.*)$/)
  return match ? { path: match[1], line: Number(match[2]), text: match[3] } : null
}

function grep(name: string): string[] {
  try {
    return execFileSync('git', ['grep', '-n', '-w', '--', name], { encoding: 'utf-8' }).split('\n').filter(Boolean)
  } catch {
    // git grep exits non-zero when the name appears nowhere.
    return []
  }
}

function preview(path: string, line: number): string[] {
  const content = getWorktreeFileContent(path)
  if (content === null) return []
  const lines = content.split('\n').slice(line - 1, line - 1 + PREVIEW_LINES)
  while (lines.at(-1) === '') lines.pop()
  return lines
}

/**
 * Every line in the repository that declares this name.
 *
 * A line that only uses the name is left out, which is what separates this
 * from a plain search.
 */
export function findDefinitions(name: string): Definition[] {
  if (!IDENTIFIER.test(name)) return []
  const definitions: Definition[] = []
  for (const hit of grep(name)) {
    const parsed = parseHit(hit)
    if (!parsed) continue
    const declared = parseDeclaration(parsed.text, parsed.path)
    if (declared?.name !== name) continue
    definitions.push({ path: parsed.path, line: parsed.line, kind: declared.kind, lines: preview(parsed.path, parsed.line) })
    if (definitions.length === MAX_RESULTS) break
  }
  return definitions
}
