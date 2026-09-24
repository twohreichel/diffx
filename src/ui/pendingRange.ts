import type { AnnotationSide } from '@pierre/diffs'

/** The line range a comment form is currently open on. */
export interface PendingComment {
  side: AnnotationSide
  lineNumber: number
  endLine: number
}

interface ClickedLine {
  side: AnnotationSide
  lineNumber: number
}

/**
 * Turns a gutter click into the range the comment form covers.
 *
 * A shift-click grows the open range towards the clicked line. Any other click starts
 * a fresh single-line comment, as does a shift-click on the opposite side of the diff.
 */
export function extendPending(pending: PendingComment | null, line: ClickedLine, extend: boolean): PendingComment {
  if (!extend || !pending || pending.side !== line.side) {
    return { side: line.side, lineNumber: line.lineNumber, endLine: line.lineNumber }
  }
  return {
    side: pending.side,
    lineNumber: Math.min(pending.lineNumber, line.lineNumber),
    endLine: Math.max(pending.endLine, line.lineNumber),
  }
}
