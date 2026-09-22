import type { LineDiffTypes } from '@pierre/diffs'

export type LineDiffMode = 'word' | 'char' | 'off'

export const LINE_DIFF_MODES: readonly LineDiffMode[] = ['word', 'char', 'off']
export const DEFAULT_LINE_DIFF: LineDiffMode = 'word'

/** Longest line pair the renderer still diffs inside (spec 002 FR-008). */
export const MAX_LINE_DIFF_LENGTH = 2000

const RENDERER_TYPES: Record<LineDiffMode, LineDiffTypes> = {
  // `word-alt` joins adjacent segments, which reads better on renamed identifiers.
  word: 'word-alt',
  char: 'char',
  off: 'none',
}

/** The renderer option behind a granularity the user picked. */
export function lineDiffType(mode: LineDiffMode): LineDiffTypes {
  return RENDERER_TYPES[mode]
}

/** Accepts the JSON value from the settings file, whatever it holds. */
export function parseLineDiffMode(raw: unknown): LineDiffMode {
  return LINE_DIFF_MODES.find((mode) => mode === raw) ?? DEFAULT_LINE_DIFF
}
