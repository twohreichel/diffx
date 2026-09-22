import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

/** What the client needs to enable or explain the structural mode. */
export interface DifftAvailability {
  available: boolean
  version?: string
  reason?: string
}

export const INSTALL_HINT =
  'difftastic not installed — brew install difftastic, cargo install difftastic, or your distribution package'

const VERSION_PATTERN = /^Difftastic\s+(\d+\.\d+\.\d+)/i

function difftVersion(): string {
  return execFileSync('difft', ['--version'], { encoding: 'utf-8', stdio: 'pipe' })
}

/** Asks difftastic for its version, which is also the installation check. */
export function detectDifft(run: () => string = difftVersion): DifftAvailability {
  let output: string
  try {
    output = run()
  } catch {
    return { available: false, reason: INSTALL_HINT }
  }
  const match = output.match(VERSION_PATTERN)
  if (!match) return { available: false, reason: INSTALL_HINT }
  return { available: true, version: match[1] }
}

/**
 * Puts both sides of a file on disk, which is the only input difftastic takes.
 *
 * Both keep the original file name, because the extension is how difftastic
 * picks its grammar.
 */
export function withTempPair<T>(path: string, oldContent: string, newContent: string, body: (oldPath: string, newPath: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), 'diffx-structural-'))
  const name = basename(path)
  const oldPath = join(dir, 'old', name)
  const newPath = join(dir, 'new', name)
  try {
    mkdirSync(join(dir, 'old'))
    mkdirSync(join(dir, 'new'))
    writeFileSync(oldPath, oldContent)
    writeFileSync(newPath, newContent)
    return body(oldPath, newPath)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/** The result carries a shape this fork does not recognize. */
export class ShapeError extends Error {
  constructor(what: string) {
    super(`difftastic result: ${what}`)
    this.name = 'ShapeError'
  }
}

export interface StructuralRange {
  start: number
  end: number
}

export interface StructuralSide {
  lineNumber: number
  ranges: StructuralRange[]
}

export interface StructuralChange {
  before: StructuralSide | null
  after: StructuralSide | null
}

export interface StructuralFile {
  path: string
  language: string
  unchanged: boolean
  /** difftastic compared the file as text, having found no grammar for it. */
  fellBack: boolean
  changes: StructuralChange[]
}

/** difftastic's name for the grammar it uses when it recognizes none. */
const NO_GRAMMAR = 'Text'

function record(value: unknown, what: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new ShapeError(`${what} is not an object`)
  return value as Record<string, unknown>
}

/** Adjacent token changes become one range, which is what a reader sees anyway. */
function mergeRanges(changes: unknown): StructuralRange[] {
  if (!Array.isArray(changes)) throw new ShapeError('changes is not a list')
  const ranges: StructuralRange[] = []
  for (const entry of changes) {
    const { start, end } = record(entry, 'change')
    if (typeof start !== 'number' || typeof end !== 'number') throw new ShapeError('change without offsets')
    const last = ranges[ranges.length - 1]
    if (last && start <= last.end) last.end = Math.max(last.end, end)
    else ranges.push({ start, end })
  }
  return ranges
}

function parseSide(value: unknown): StructuralSide | null {
  if (value === undefined || value === null) return null
  const side = record(value, 'chunk side')
  if (typeof side.line_number !== 'number') throw new ShapeError('side without a line number')
  // difftastic counts lines from zero, everything else in this fork from one.
  return { lineNumber: side.line_number + 1, ranges: mergeRanges(side.changes) }
}

function parseChunks(value: unknown): StructuralChange[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new ShapeError('chunks is not a list')
  return value.flat().map((entry) => {
    const chunk = record(entry, 'chunk')
    return { before: parseSide(chunk.lhs), after: parseSide(chunk.rhs) }
  })
}

/** Reads difftastic's own result into the shape this fork renders. */
export function parseDifft(json: unknown): StructuralFile {
  const result = record(json, 'result')
  const { path, language, status } = result
  if (typeof path !== 'string' || typeof language !== 'string' || typeof status !== 'string') {
    throw new ShapeError('missing path, language or status')
  }
  return {
    path,
    language,
    unchanged: status === 'unchanged',
    fellBack: language === NO_GRAMMAR,
    changes: parseChunks(result.chunks),
  }
}

export interface StructuralOptions {
  ignoreComments: boolean
}

/** What the route hands the client: a result, or the reason there is none. */
export interface StructuralResponse {
  available: boolean
  reason?: string
  result?: StructuralFile
}

/** Pins the wrapping calculation, so the result does not follow the server's terminal. */
const WIDTH = '120'
/** difftastic 0.71 refuses JSON output without it. */
const UNSTABLE_ENV = { DFT_UNSTABLE: 'yes' }
/** Files kept in the result cache, which review reopens constantly. */
const CACHE_LIMIT = 200

const UNREADABLE = 'difftastic result could not be read — showing the line-based diff'

type Runner = (args: string[]) => string

const cache = new Map<string, StructuralFile>()

function difftRun(args: string[]): string {
  return execFileSync('difft', args, {
    encoding: 'utf-8',
    stdio: 'pipe',
    env: { ...process.env, ...UNSTABLE_ENV },
    maxBuffer: 50 * 1024 * 1024,
  })
}

function cacheKey(path: string, oldContent: string, newContent: string, options: StructuralOptions): string {
  const hash = createHash('sha1')
  for (const part of [path, String(options.ignoreComments), oldContent, newContent]) {
    hash.update(String(part.length)).update(part)
  }
  return hash.digest('hex')
}

function remember(key: string, file: StructuralFile): StructuralFile {
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
  cache.set(key, file)
  return file
}

/** Compares both states of one file through difftastic, or says why it cannot. */
export function structuralDiff(
  path: string,
  oldContent: string,
  newContent: string,
  options: StructuralOptions,
  run: Runner = difftRun,
): StructuralResponse {
  const key = cacheKey(path, oldContent, newContent, options)
  const cached = cache.get(key)
  if (cached) return { available: true, result: cached }

  let output: string
  try {
    output = withTempPair(path, oldContent, newContent, (oldPath, newPath) =>
      run([
        '--display',
        'json',
        '--width',
        WIDTH,
        ...(options.ignoreComments ? ['--ignore-comments'] : []),
        oldPath,
        newPath,
      ]),
    )
  } catch {
    return { available: false, reason: INSTALL_HINT }
  }

  try {
    return { available: true, result: remember(key, parseDifft(JSON.parse(output))) }
  } catch {
    return { available: true, reason: UNREADABLE }
  }
}
