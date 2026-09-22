import type { ChangeContent, ContextContent } from '@pierre/diffs'

export type ViewMode = 'split' | 'unified' | 'blink'

export const VIEW_MODES: readonly ViewMode[] = ['split', 'unified', 'blink']
export const DEFAULT_VIEW_MODE: ViewMode = 'split'

export type BlinkState = 'before' | 'after'

export type AutoBlink = 'off' | 400 | 800 | 1600

export const AUTO_BLINK_OPTIONS: readonly AutoBlink[] = ['off', 400, 800, 1600]
export const DEFAULT_AUTO_BLINK: AutoBlink = 'off'

/** Blink is the split rendering with one of its two columns hidden. */
export function rendererDiffStyle(mode: ViewMode): 'split' | 'unified' {
  return mode === 'unified' ? 'unified' : 'split'
}

export function parseViewMode(raw: unknown): ViewMode {
  return VIEW_MODES.find((mode) => mode === raw) ?? DEFAULT_VIEW_MODE
}

export function parseAutoBlink(raw: unknown): AutoBlink {
  return AUTO_BLINK_OPTIONS.find((option) => option === raw) ?? DEFAULT_AUTO_BLINK
}

export function toggleBlink(state: BlinkState): BlinkState {
  return state === 'before' ? 'after' : 'before'
}

/**
 * Shadow-root CSS that leaves one state of the split grid on screen.
 *
 * The two-attribute selector matches the specificity of the package rule it
 * overrides, and comes after it, so the single column wins.
 */
export function blinkCSS(state: BlinkState): string {
  const hidden = state === 'before' ? 'additions' : 'deletions'
  return (
    `[data-diff-type="split"][data-overflow="scroll"]{grid-template-columns:1fr}` +
    `[data-diff-type="split"] [data-${hidden}]{display:none}`
  )
}

/** A run of changed lines, addressed by its line number in either state. */
export interface ChangeRegion {
  file: string
  additionLine: number
  deletionLine: number
}

interface RegionFile {
  name: string
  hunks: {
    additionStart: number
    deletionStart: number
    hunkContent: (ContextContent | ChangeContent)[]
  }[]
}

/** The line a run sits at, or the line above it when that state has none. */
function anchorLine(cursor: number, count: number): number {
  return count > 0 ? cursor : Math.max(1, cursor - 1)
}

/** Every changed run in the diff, in reading order (spec 003 FR-006). */
export function changeRegions(files: RegionFile[]): ChangeRegion[] {
  const regions: ChangeRegion[] = []
  for (const file of files) {
    for (const hunk of file.hunks) {
      let addition = hunk.additionStart
      let deletion = hunk.deletionStart
      for (const segment of hunk.hunkContent) {
        if (segment.type === 'context') {
          addition += segment.lines
          deletion += segment.lines
          continue
        }
        regions.push({
          file: file.name,
          additionLine: anchorLine(addition, segment.additions),
          deletionLine: anchorLine(deletion, segment.deletions),
        })
        addition += segment.additions
        deletion += segment.deletions
      }
    }
  }
  return regions
}

export function regionLine(region: ChangeRegion, state: BlinkState): number {
  return state === 'after' ? region.additionLine : region.deletionLine
}

/** The region `n` or `p` moves to, wrapping at both ends. */
export function stepRegion(count: number, current: number, direction: -1 | 1): number {
  if (count === 0) return -1
  if (current < 0) return direction === 1 ? 0 : count - 1
  return (current + direction + count) % count
}
