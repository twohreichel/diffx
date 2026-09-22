/**
 * Context width for `git diff -U<n>`, shared by the server route and the UI control.
 *
 * Kept free of node imports so the browser bundle can import the same source of truth.
 */

export type ContextWidth = 0 | 3 | 10 | 'full'

export const CONTEXT_STEPS: readonly ContextWidth[] = [0, 3, 10, 'full']

export const DEFAULT_CONTEXT: ContextWidth = 3

/** Above this estimate, `full` asks before it fetches (spec 001 FR-008). */
export const FULL_CONTEXT_LINE_CAP = 5000

// Wider than any file we are willing to render, so git emits the whole file as
// context instead of hunks. Cheaper than a second code path for `full`.
const FULL_CONTEXT_LINES = 1000000

const CONTEXT_FLAG = /^(-U\d*|--unified(=\d+)?|-u)$/

export function contextArgs(width: ContextWidth): string[] {
  return [`-U${width === 'full' ? FULL_CONTEXT_LINES : width}`]
}

/** Accepts the query-string spelling as well as the JSON value from the settings file. */
export function parseContextWidth(raw: unknown): ContextWidth {
  return CONTEXT_STEPS.find((step) => step === raw || String(step) === raw) ?? DEFAULT_CONTEXT
}

export function stepContext(current: ContextWidth, direction: -1 | 1): ContextWidth {
  const next = CONTEXT_STEPS.indexOf(current) + direction
  return CONTEXT_STEPS[next] ?? current
}

/** True when the user's own `--` arguments already choose a context width. */
export function hasContextFlag(args: string[]): boolean {
  return args.some((arg) => CONTEXT_FLAG.test(arg))
}

interface HunkSpan {
  additionStart: number
  additionCount: number
}

/**
 * Lower bound for the lines `full` context would render.
 *
 * Only the diffed region is known before the fetch, so this reads the furthest
 * line any hunk reaches per file. A file is at least that long, never shorter.
 */
export function estimateTotalLines(files: { hunks: HunkSpan[] }[]): number {
  return files.reduce((total, file) => {
    const furthest = file.hunks.reduce(
      (max, hunk) => Math.max(max, hunk.additionStart + hunk.additionCount - 1),
      0,
    )
    return total + furthest
  }, 0)
}
