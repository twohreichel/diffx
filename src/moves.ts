import type { ChangeContent, ContextContent, FileDiffMetadata } from '@pierre/diffs'

export interface MoveSettings {
  /** Smallest run reported as a move, in lines. */
  minLines: number
  /** Share of lines a moved-and-edited block must still share with its origin. */
  similarity: number
}

export const DEFAULT_MOVE_SETTINGS: MoveSettings = { minLines: 5, similarity: 0.8 }

export const MIN_LINES_OPTIONS: readonly number[] = [3, 5, 10, 20]
export const SIMILARITY_OPTIONS: readonly number[] = [0.7, 0.8, 0.9, 1]

/** Share of distinct lines a run needs before it counts as recognizable. */
const MIN_DISTINCT_RATIO = 0.5
/** Candidates compared line by line per unpaired run. */
const FUZZY_CANDIDATES = 8
/** Longest run still compared line by line. */
const FUZZY_MAX_LINES = 400
/** Distance penalty that keeps a same-file pairing ahead of a cross-file one. */
const CROSS_FILE_DISTANCE = 1_000_000

export type MoveSide = 'deletions' | 'additions'

/** A run of lines that left one place or arrived in another. */
export interface MoveRun {
  path: string
  side: MoveSide
  /** First line of the run, numbered in the file state the side names. */
  startLine: number
  lineCount: number
}

export interface MovePair {
  id: string
  from: MoveRun
  to: MoveRun
  kind: 'exact' | 'modified'
  /** Lines inside `to` that read differently from their origin. */
  changedLines: number[]
  ambiguous: boolean
}

interface Candidate extends MoveRun {
  /** Position of the change segment in the diff, so a run knows its origin. */
  segment: number
  key: string
  /** The run's content without blank lines or indentation. */
  content: string[]
  /** Line number of each entry in `content`. */
  lineNumbers: number[]
  paired: boolean
}

export function parseMinLines(raw: unknown): number {
  return MIN_LINES_OPTIONS.find((option) => option === raw) ?? DEFAULT_MOVE_SETTINGS.minLines
}

export function parseSimilarity(raw: unknown): number {
  return SIMILARITY_OPTIONS.find((option) => option === raw) ?? DEFAULT_MOVE_SETTINGS.similarity
}

/** True while the run carries enough distinct lines to be recognized again. */
function recognizable(content: string[]): boolean {
  return new Set(content).size / content.length >= MIN_DISTINCT_RATIO
}

function makeCandidate(
  file: FileDiffMetadata,
  side: MoveSide,
  startLine: number,
  lineIndex: number,
  lineCount: number,
  segment: number,
): Candidate | null {
  const source = side === 'additions' ? file.additionLines : file.deletionLines
  const content: string[] = []
  const lineNumbers: number[] = []
  for (let offset = 0; offset < lineCount; offset++) {
    const line = (source[lineIndex + offset] ?? '').trim()
    if (line.length === 0) continue
    content.push(line)
    lineNumbers.push(startLine + offset)
  }
  if (content.length === 0 || !recognizable(content)) return null
  return { path: file.name, side, startLine, lineCount, segment, key: content.join('\n'), content, lineNumbers, paired: false }
}

/** Every changed run of at least `minLines` lines, on both sides, in reading order. */
function collectRuns(files: FileDiffMetadata[], minLines: number): Candidate[] {
  const runs: Candidate[] = []
  let segment = 0
  for (const file of files) {
    for (const hunk of file.hunks) {
      let addition = hunk.additionStart
      let deletion = hunk.deletionStart
      for (const content of hunk.hunkContent as (ContextContent | ChangeContent)[]) {
        if (content.type === 'context') {
          addition += content.lines
          deletion += content.lines
          continue
        }
        if (content.deletions >= minLines) {
          const run = makeCandidate(file, 'deletions', deletion, content.deletionLineIndex, content.deletions, segment)
          if (run) runs.push(run)
        }
        if (content.additions >= minLines) {
          const run = makeCandidate(file, 'additions', addition, content.additionLineIndex, content.additions, segment)
          if (run) runs.push(run)
        }
        addition += content.additions
        deletion += content.deletions
        segment += 1
      }
    }
  }
  return runs
}

function distance(arrival: Candidate, departure: Candidate): number {
  const across = arrival.path === departure.path ? 0 : CROSS_FILE_DISTANCE
  return across + Math.abs(arrival.startLine - departure.startLine)
}

/** The runs that could be the origin of this arrival, nearest first. */
function originsFor(arrival: Candidate, departures: Candidate[], matches: (run: Candidate) => boolean): Candidate[] {
  return departures
    .filter((run) => !run.paired && run.segment !== arrival.segment && matches(run))
    .sort((a, b) => distance(arrival, a) - distance(arrival, b))
}

function lcsTable(a: string[], b: string[]): number[][] {
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      table[i][j] = a[i - 1] === b[j - 1] ? table[i - 1][j - 1] + 1 : Math.max(table[i - 1][j], table[i][j - 1])
    }
  }
  return table
}

/** Which entries of `b` also appear, in order, in `a`. */
function commonMask(a: string[], b: string[]): boolean[] {
  const table = lcsTable(a, b)
  const mask = new Array<boolean>(b.length).fill(false)
  let i = a.length
  let j = b.length
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      mask[j - 1] = true
      i--
      j--
    } else if (table[i - 1][j] >= table[i][j - 1]) {
      i--
    } else {
      j--
    }
  }
  return mask
}

function pairOf(from: Candidate, to: Candidate, kind: MovePair['kind'], changedLines: number[], ambiguous: boolean): MovePair {
  from.paired = true
  to.paired = true
  return {
    id: '',
    from: { path: from.path, side: from.side, startLine: from.startLine, lineCount: from.lineCount },
    to: { path: to.path, side: to.side, startLine: to.startLine, lineCount: to.lineCount },
    kind,
    changedLines,
    ambiguous,
  }
}

/** Arrivals whose content is unchanged from the run they came from. */
function exactPairs(arrivals: Candidate[], departures: Candidate[]): MovePair[] {
  const pairs: MovePair[] = []
  for (const arrival of arrivals) {
    if (arrival.paired) continue
    const origins = originsFor(arrival, departures, (run) => run.key === arrival.key)
    if (origins.length === 0) continue
    pairs.push(pairOf(origins[0], arrival, 'exact', [], origins.length > 1))
  }
  return pairs
}

function bestOrigin(arrival: Candidate, departures: Candidate[], floor: number): { run: Candidate; mask: boolean[] } | null {
  const sized = (run: Candidate) => Math.abs(run.content.length - arrival.content.length)
  const candidates = originsFor(arrival, departures, (run) => run.content.length <= FUZZY_MAX_LINES)
    .sort((a, b) => sized(a) - sized(b))
    .slice(0, FUZZY_CANDIDATES)
  let best: { run: Candidate; mask: boolean[]; score: number } | null = null
  for (const run of candidates) {
    const mask = commonMask(run.content, arrival.content)
    const shared = mask.filter(Boolean).length
    const score = shared / Math.max(run.content.length, arrival.content.length)
    if (score >= floor && (best === null || score > best.score)) best = { run, mask, score }
  }
  return best
}

/** Arrivals that were edited on the way, above the similarity floor. */
function modifiedPairs(arrivals: Candidate[], departures: Candidate[], floor: number): MovePair[] {
  const pairs: MovePair[] = []
  for (const arrival of arrivals) {
    if (arrival.paired || arrival.content.length > FUZZY_MAX_LINES) continue
    const best = bestOrigin(arrival, departures, floor)
    if (!best) continue
    const changed = arrival.lineNumbers.filter((_, index) => !best.mask[index])
    pairs.push(pairOf(best.run, arrival, 'modified', changed, false))
  }
  return pairs
}

/** Blocks that left one place and arrived in another, across all files. */
export function detectMoves(files: FileDiffMetadata[], settings: Partial<MoveSettings> = {}): MovePair[] {
  const { minLines, similarity } = { ...DEFAULT_MOVE_SETTINGS, ...settings }
  const runs = collectRuns(files, minLines)
  const arrivals = runs.filter((run) => run.side === 'additions')
  const departures = runs.filter((run) => run.side === 'deletions')

  const pairs = exactPairs(arrivals, departures)
  if (similarity < 1) pairs.push(...modifiedPairs(arrivals, departures, similarity))
  pairs.sort((a, b) => a.to.path.localeCompare(b.to.path) || a.to.startLine - b.to.startLine)
  return pairs.map((pair, index) => ({ ...pair, id: `M${index + 1}` }))
}
