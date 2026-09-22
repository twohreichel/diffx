import type { FileDiffMetadata } from '@pierre/diffs'
import type { MovePair } from '../moves.js'
import { attributeChanges, isSupported, type Attribution } from './attribute.js'

export type ChangeTag = 'added' | 'removed' | 'modified' | 'moved' | 'structurally-unchanged'

export interface SymbolEntry extends Attribution {
  file: string
  /** Size against the largest entry of the map, between 0 and 1. */
  magnitude: number
  tags: ChangeTag[]
}

export interface FileGroup {
  path: string
  added: number
  removed: number
  magnitude: number
  structurallyUnchanged: boolean
  /** False while the fork has no declaration patterns for this language (FR-008). */
  named: boolean
  entries: SymbolEntry[]
}

/** The other features feed the map, none of them is required (FR-007). */
export interface ChangeMapInputs {
  moves?: MovePair[]
  structurallyUnchanged?: Set<string>
}

function weight(counts: { added: number; removed: number }): number {
  return counts.added + counts.removed
}

function shapeTag(entry: Attribution): ChangeTag {
  if (entry.removed === 0) return 'added'
  if (entry.added === 0) return 'removed'
  return 'modified'
}

/**
 * True while a moved block arrived in these lines.
 *
 * Only the arrival side is matched, because a departure is numbered in the
 * file's previous state while the map counts lines in its current one.
 */
function arrived(moves: MovePair[], path: string, from: number, until: number): boolean {
  return moves.some((move) => move.to.path === path && move.to.startLine >= from && move.to.startLine < until)
}

function groupFile(file: FileDiffMetadata, inputs: ChangeMapInputs): FileGroup {
  const attributions = attributeChanges(file).sort((a, b) => a.firstChangedLine - b.firstChangedLine)
  const unchanged = inputs.structurallyUnchanged?.has(file.name) ?? false
  const entries = attributions.map((entry, index) => {
    // An entry owns the lines up to where the next one starts.
    const until = attributions[index + 1]?.firstChangedLine ?? Number.POSITIVE_INFINITY
    const tags: ChangeTag[] = [shapeTag(entry)]
    if (arrived(inputs.moves ?? [], file.name, entry.firstChangedLine, until)) tags.push('moved')
    if (unchanged) tags.push('structurally-unchanged')
    return { ...entry, file: file.name, magnitude: 0, tags }
  })
  return {
    path: file.name,
    added: entries.reduce((sum, entry) => sum + entry.added, 0),
    removed: entries.reduce((sum, entry) => sum + entry.removed, 0),
    magnitude: 0,
    structurallyUnchanged: unchanged,
    named: isSupported(file.name),
    entries,
  }
}

/** The changed symbols of a diff, grouped by file and sized against each other. */
export function buildChangeMap(files: FileDiffMetadata[], inputs: ChangeMapInputs = {}): FileGroup[] {
  const groups = files.map((file) => groupFile(file, inputs)).filter((group) => group.entries.length > 0)
  const largestFile = Math.max(1, ...groups.map(weight))
  const largestEntry = Math.max(1, ...groups.flatMap((group) => group.entries.map(weight)))
  for (const group of groups) {
    group.magnitude = weight(group) / largestFile
    for (const entry of group.entries) entry.magnitude = weight(entry) / largestEntry
  }
  return groups.sort(
    (a, b) => Number(a.structurallyUnchanged) - Number(b.structurallyUnchanged) || weight(b) - weight(a),
  )
}
