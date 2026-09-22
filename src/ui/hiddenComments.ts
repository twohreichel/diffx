import type { AnnotationSide } from '@pierre/diffs'

interface HunkSpan {
  additionStart: number
  additionCount: number
  deletionStart: number
  deletionCount: number
}

/** The part of a file diff that decides which lines reach the screen. */
export interface DiffFileSpans {
  isPartial: boolean
  hunks: HunkSpan[]
}

interface Anchored {
  side: AnnotationSide
  lineNumber: number
}

/** True while the diff at the current context width contains that line. */
export function isLineRendered(file: DiffFileSpans, side: AnnotationSide, lineNumber: number): boolean {
  if (!file.isPartial) return true
  return file.hunks.some((hunk) => {
    const start = side === 'additions' ? hunk.additionStart : hunk.deletionStart
    const count = side === 'additions' ? hunk.additionCount : hunk.deletionCount
    return lineNumber >= start && lineNumber < start + count
  })
}

/** The annotations whose line the current context width leaves out (FR-007). */
export function hiddenAnnotations<T extends Anchored>(file: DiffFileSpans, annotations: T[]): T[] {
  return annotations.filter((annotation) => !isLineRendered(file, annotation.side, annotation.lineNumber))
}
