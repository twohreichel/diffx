import type { ChangeContent, ContextContent, FileDiffMetadata } from '@pierre/diffs'

export type SymbolKind = 'function' | 'method' | 'class' | 'type' | 'toplevel' | 'other'

export interface SymbolSite {
  name: string
  kind: SymbolKind
}

/** One symbol and how much of the file's change belongs to it. */
export interface Attribution extends SymbolSite {
  firstChangedLine: number
  added: number
  removed: number
}

/** Where changes outside every symbol go — imports, constants, configuration. */
export const TOP_LEVEL: SymbolSite = { name: 'top level', kind: 'toplevel' }

interface Declaration {
  test: RegExp
  kind: SymbolKind
}

/** Control-flow words a call-shaped pattern would otherwise read as a method. */
const RESERVED = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'do', 'else'])

const PYTHON: Declaration[] = [
  { test: /^\s*(?:async\s+)?def\s+(\w+)/, kind: 'function' },
  { test: /^\s*class\s+(\w+)/, kind: 'class' },
]

const RUST: Declaration[] = [
  { test: /^\s*(?:pub(?:\([^)]*\))?\s+)?(?:default\s+)?(?:const\s+)?(?:async\s+)?(?:unsafe\s+)?(?:extern\s+"[^"]+"\s+)?fn\s+(\w+)/, kind: 'function' },
  { test: /^\s*(?:pub(?:\([^)]*\))?\s+)?(?:struct|enum|union|trait|type)\s+(\w+)/, kind: 'type' },
]

const PHP: Declaration[] = [
  { test: /^\s*(?:(?:final|abstract|public|private|protected|static)\s+)*function\s+&?(\w+)/, kind: 'function' },
  { test: /^\s*(?:(?:final|abstract|readonly)\s+)*(?:class|interface|trait|enum)\s+(\w+)/, kind: 'class' },
]

const JAVA: Declaration[] = [
  { test: /^\s*(?:(?:public|protected|private|static|final|abstract|sealed|non-sealed)\s+)*(?:class|interface|enum|record)\s+(\w+)/, kind: 'class' },
  { test: /^\s*(?:(?:public|protected|private|static|final|abstract|synchronized|native|default|strictfp)\s+)+[\w.<>[\],?\s]+\s+(\w+)\s*\(/, kind: 'function' },
]

const SCRIPT: Declaration[] = [
  { test: /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*(\w+)/, kind: 'function' },
  { test: /^\s*(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/, kind: 'class' },
  { test: /^\s*(?:export\s+)?(?:declare\s+)?(?:interface|type)\s+(\w+)/, kind: 'type' },
  { test: /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*=>/, kind: 'function' },
  { test: /^\s+(?:(?:public|private|protected|static|readonly|abstract|async|get|set)\s+)*(\w+)\s*\([^)]*\)\s*[:{]/, kind: 'method' },
]

const GO: Declaration[] = [
  { test: /^func\s+\([^)]*\)\s*(\w+)/, kind: 'method' },
  { test: /^\s*func\s+(\w+)/, kind: 'function' },
  { test: /^\s*type\s+(\w+)/, kind: 'type' },
]

const BY_EXTENSION: Record<string, Declaration[]> = {
  py: PYTHON,
  rs: RUST,
  php: PHP,
  java: JAVA,
  ts: SCRIPT,
  tsx: SCRIPT,
  mts: SCRIPT,
  cts: SCRIPT,
  js: SCRIPT,
  jsx: SCRIPT,
  mjs: SCRIPT,
  cjs: SCRIPT,
  go: GO,
}

/** True while the fork can name symbols in this file at all (FR-008). */
export function isSupported(path: string): boolean {
  return BY_EXTENSION[path.split('.').pop()?.toLowerCase() ?? ''] !== undefined
}

/** Reads one line as the symbol it declares, or nothing. */
export function parseDeclaration(line: string, path: string): SymbolSite | null {
  const patterns = BY_EXTENSION[path.split('.').pop()?.toLowerCase() ?? '']
  if (!patterns) return null
  for (const { test, kind } of patterns) {
    const match = line.match(test)
    if (!match || RESERVED.has(match[1])) continue
    // A declaration that sits inside another one is a method, whatever the language calls it.
    const nested = /^\s/.test(line) && kind === 'function'
    return { name: match[1], kind: nested ? 'method' : kind }
  }
  return null
}

interface Ledger {
  record: (site: SymbolSite, line: number, side: 'added' | 'removed', lines: number) => void
  all: () => Attribution[]
}

function ledger(): Ledger {
  const entries = new Map<string, Attribution>()
  return {
    record(site, line, side, lines) {
      const key = `${site.kind}:${site.name}`
      const entry = entries.get(key) ?? { ...site, firstChangedLine: line, added: 0, removed: 0 }
      entry[side] += lines
      entries.set(key, entry)
    },
    all: () => [...entries.values()],
  }
}

/** One side of the hunk, walking down it. */
interface SideCursor {
  texts: string[]
  line: number
  index: number
  site: SymbolSite
}

function advance(cursor: SideCursor, lines: number, path: string): void {
  for (let offset = 0; offset < lines; offset++) {
    cursor.site = parseDeclaration(cursor.texts[cursor.index + offset] ?? '', path) ?? cursor.site
  }
  cursor.line += lines
}

/**
 * Counts one side of a change entry against the symbols it belongs to.
 *
 * Blank lines are held back, because the empty lines before a new function
 * belong to that function and not to the one above it.
 */
function record(book: Ledger, cursor: SideCursor, lines: number, path: string, side: 'added' | 'removed'): void {
  let pending = 0
  let pendingLine = 0
  for (let offset = 0; offset < lines; offset++) {
    const text = cursor.texts[cursor.index + offset] ?? ''
    if (text.trim() === '') {
      if (pending === 0) pendingLine = cursor.line + offset
      pending += 1
      continue
    }
    cursor.site = parseDeclaration(text, path) ?? cursor.site
    book.record(cursor.site, pending > 0 ? pendingLine : cursor.line + offset, side, pending + 1)
    pending = 0
  }
  if (pending > 0) book.record(cursor.site, pendingLine, side, pending)
  cursor.line += lines
}

/** Splits one file's changed lines across the symbols they sit in. */
export function attributeChanges(file: FileDiffMetadata): Attribution[] {
  const book = ledger()
  for (const hunk of file.hunks) {
    const seed = parseDeclaration(hunk.hunkContext ?? '', file.name) ?? TOP_LEVEL
    const after: SideCursor = { texts: file.additionLines, line: hunk.additionStart, index: 0, site: seed }
    const before: SideCursor = { texts: file.deletionLines, line: hunk.deletionStart, index: 0, site: seed }
    for (const content of hunk.hunkContent as (ContextContent | ChangeContent)[]) {
      after.index = content.additionLineIndex
      before.index = content.deletionLineIndex
      if (content.type === 'context') {
        advance(after, content.lines, file.name)
        advance(before, content.lines, file.name)
        continue
      }
      record(book, after, content.additions, file.name, 'added')
      record(book, before, content.deletions, file.name, 'removed')
    }
  }
  return book.all()
}
